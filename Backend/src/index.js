import express from "express";

import cors from "cors";

import path from "path";

import { fileURLToPath } from "url";

import { PrismaClient } from "@prisma/client";

import dotenv from "dotenv";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import multer from "multer";

import fs from "fs";



dotenv.config();



const prisma = new PrismaClient();

const app = express();

app.use(cors()); // Libera o acesso para o seu Frontend

app.use(express.json());



const PORT = 3001; // O servidor vai rodar na porta 3001

const JWT_SECRET = process.env.JWT_SECRET || "seu-secret-super-seguro-aqui-mude-em-producao";



// Configuração para servir os vídeos (HLS) e imagens

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Note: aqui ele assume que existe uma pasta 'media' voltando um nível (../media)

app.use("/media", express.static(path.join(__dirname, "../media")));

// Configuração do Multer para upload de arquivos

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    const mediaPath = path.join(__dirname, "../media");

    let uploadPath;

    

    if (file.fieldname === 'cover') {

      // Upload de capa

      uploadPath = path.join(mediaPath, "capas", "movies");

    } else if (file.fieldname === 'video') {

      // Upload de vídeo (será convertido para HLS depois)

      uploadPath = path.join(mediaPath, "uploads");

    } else {

      uploadPath = path.join(mediaPath, "uploads");

    }

    

    // Criar diretório se não existir

    if (!fs.existsSync(uploadPath)) {

      fs.mkdirSync(uploadPath, { recursive: true });

    }

    

    cb(null, uploadPath);

  },

  filename: (req, file, cb) => {

    // Gerar nome único para o arquivo

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    const ext = path.extname(file.originalname);

    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();

    cb(null, name + '-' + uniqueSuffix + ext);

  }

});

const upload = multer({

  storage: storage,

  limits: {

    fileSize: 5 * 1024 * 1024 * 1024 // 5GB limite

  },

  fileFilter: (req, file, cb) => {

    if (file.fieldname === 'cover') {

      // Aceitar apenas imagens

      const allowedTypes = /jpeg|jpg|png|gif|webp/;

      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

      const mimetype = allowedTypes.test(file.mimetype);

      

      if (mimetype && extname) {

        return cb(null, true);

      } else {

        cb(new Error('Apenas arquivos de imagem são permitidos para capa!'));

      }

    } else if (file.fieldname === 'video') {

      // Aceitar vídeos (incluindo MKV que pode não ter MIME type reconhecido)

      const allowedTypes = /mp4|avi|mov|mkv|webm|m3u8/;

      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

      const mimetype = /video/.test(file.mimetype) || file.originalname.endsWith('.m3u8');

      // Aceitar se a extensão for permitida, mesmo sem MIME type válido (caso do MKV em alguns navegadores)

      if (mimetype || extname) {

        return cb(null, true);

      } else {

        cb(new Error(`Apenas arquivos de vídeo são permitidos! Formatos aceitos: MP4, AVI, MOV, MKV, WebM, M3U8. Arquivo recebido: ${file.originalname}`));

      }

    } else {

      cb(null, true);

    }

  }

});



// --- MIDDLEWARE DE AUTENTICAÇÃO ---

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  

  if (!token) {

    return res.status(401).json({ error: 'Token não fornecido' });

  }

  

  jwt.verify(token, JWT_SECRET, (err, user) => {

    if (err) {

      return res.status(403).json({ error: 'Token inválido' });

    }

    req.user = user;

    next();

  });

};



// Middleware para verificar se é admin

const requireAdmin = async (req, res, next) => {

  try {

    const user = await prisma.user.findUnique({

      where: { id: req.user.userId },

      select: { role: true }

    });

    

    if (!user || user.role !== 'admin') {

      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });

    }

    

    next();

  } catch (error) {

    console.error("Erro ao verificar permissões:", error);

    res.status(500).json({ error: "Erro ao verificar permissões" });

  }

};



// --- ROTAS DE AUTENTICAÇÃO ---

// Registro

app.post("/api/auth/register", async (req, res) => {

  try {

    const { email, password, birthDate } = req.body;

    

    if (!email || !password) {

      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    }

    

    // Verificar se usuário já existe

    const existingUser = await prisma.user.findUnique({

      where: { email }

    });

    

    if (existingUser) {

      return res.status(400).json({ error: "Email já cadastrado" });

    }

    

    // Hash da senha

    const passwordHash = await bcrypt.hash(password, 10);

    

    // Criar usuário (sempre como 'client' por padrão)

    const user = await prisma.user.create({

      data: {

        email,

        passwordHash,

        role: 'client', // Novos usuários são sempre clientes

        birthDate: birthDate || null

      },

      select: {

        id: true,

        email: true,

        role: true,

        birthDate: true

      }

    });

    

    // Gerar token JWT

    const token = jwt.sign(

      { userId: user.id, email: user.email, role: user.role },

      JWT_SECRET,

      { expiresIn: '7d' }

    );

    

    res.json({ user, token });

  } catch (error) {

    console.error("Erro no registro:", error);

    res.status(500).json({ error: "Erro ao criar usuário" });

  }

});



// Login

app.post("/api/auth/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    

    if (!email || !password) {

      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    }

    

    // Buscar usuário

    const user = await prisma.user.findUnique({

      where: { email }

    });

    

    if (!user) {

      return res.status(401).json({ error: "Email ou senha inválidos" });

    }

    

    // Verificar senha

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    

    if (!validPassword) {

      return res.status(401).json({ error: "Email ou senha inválidos" });

    }

    

    // Gerar token JWT

    const token = jwt.sign(

      { userId: user.id, email: user.email, role: user.role },

      JWT_SECRET,

      { expiresIn: '7d' }

    );

    

    res.json({

      user: {

        id: user.id,

        email: user.email,

        role: user.role,

        birthDate: user.birthDate || null

      },

      token

    });

  } catch (error) {

    console.error("Erro no login:", error);

    res.status(500).json({ error: "Erro ao fazer login" });

  }

});



// Verificar token (usado pelo frontend para validar sessão)

app.get("/api/auth/me", authenticateToken, async (req, res) => {

  try {

    const user = await prisma.user.findUnique({

      where: { id: req.user.userId },

      select: {

        id: true,

        email: true,

        role: true,

        birthDate: true

      }

    });

    

    if (!user) {

      return res.status(404).json({ error: "Usuário não encontrado" });

    }

    

    res.json({ user });

  } catch (error) {

    console.error("Erro ao buscar usuário:", error);

    res.status(500).json({ error: "Erro ao buscar usuário" });

  }

});

// Atualizar perfil do usuário

app.put("/api/auth/profile", authenticateToken, async (req, res) => {

  try {

    const { birthDate } = req.body;

    const userId = req.user.userId;

    

    const user = await prisma.user.update({

      where: { id: userId },

      data: {

        ...(birthDate && { birthDate: String(birthDate) })

      },

      select: {

        id: true,

        email: true,

        role: true,

        birthDate: true

      }

    });

    

    res.json({ user });

  } catch (error) {

    console.error("Erro ao atualizar perfil:", error);

    res.status(500).json({ error: "Erro ao atualizar perfil" });

  }

});



// --- FUNÇÕES HELPER ---

// Calcular idade a partir da data de nascimento
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Verificar se usuário pode assistir conteúdo baseado na idade
const canWatchContent = (userAge, contentRating) => {
  if (!userAge) return true; // Se não tem idade cadastrada, permite (comportamento padrão)
  
  const ratingAgeMap = {
    "L": 0,   // Livre
    "10": 10,
    "12": 12,
    "14": 14,
    "16": 16,
    "18": 18
  };
  
  const requiredAge = ratingAgeMap[contentRating] || 0;
  return userAge >= requiredAge;
};

// --- ROTAS (As regras do jogo) ---

// 1. Listar títulos (com filtro de idade se autenticado)

app.get("/api/titles", async (req, res) => {

  try {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let userAge = null;
    
    // Se usuário estiver autenticado, verificar idade
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { birthDate: true }
        });
        
        if (user && user.birthDate) {
          userAge = calculateAge(user.birthDate);
        }
      } catch (err) {
        // Token inválido, continuar sem filtro
      }
    }
    
    // Se seriesOnly=true, retornar apenas séries principais (sem episódios)
    let whereClause = {};
    if (req.query.seriesOnly === 'true') {
      whereClause = {
        type: 'series',
        seriesId: null // Apenas séries principais, não episódios
      };
    }

    const titles = await prisma.title.findMany({ 
      where: whereClause,
      orderBy: { id: "desc" }
    });
    
    // Filtrar títulos baseado na idade do usuário
    const filteredTitles = titles.filter(title => {
      if (!userAge) return true; // Se não tem idade, mostra tudo
      return canWatchContent(userAge, title.ageRating || "L");
    });
    
    res.json(filteredTitles);

  } catch (error) {
    console.error("Erro ao buscar títulos:", error);
    res.status(500).json({ error: "Erro ao buscar títulos" });
  }

});



// 2. Detalhes do filme

app.get("/api/titles/:id", async (req, res) => {

  try {

    const id = Number(req.params.id);

    if (isNaN(id)) {

      return res.status(400).json({ error: "ID inválido" });

    }

    const t = await prisma.title.findUnique({ where: { id } });

    if (!t) {

      return res.status(404).json({ error: "Título não encontrado" });

    }

    // Garantir que o campo genre existe (para registros antigos)
    const titleWithGenre = {
      ...t,
      genre: t.genre || 'Drama'
    };

    res.json(titleWithGenre);

  } catch (error) {

    console.error("Erro ao buscar título:", error);
    console.error("Stack trace:", error.stack);

    res.status(500).json({ 
      error: "Erro ao buscar título",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

  }

});



// 3. Rota de Teste (Seed) - Para criar um filme fake rápido

app.post("/api/dev/seed", async (req, res) => {

  const item = await prisma.title.create({

    data: {

      name: "Filme Exemplo",

      description: "Conteúdo local em HLS gerado com FFmpeg.",

      coverUrl: "/media/capas/exemplo.jpg",

      hlsPath: "/media/movies/exemplo/master.m3u8",

      duration: 5400

    }

  });

  res.json(item);

});



// Rota de desenvolvimento para criar usuário admin

app.post("/api/dev/create-admin", async (req, res) => {

  try {

    const { email, password } = req.body;

    

    if (!email || !password) {

      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    }

    

    // Verificar se usuário já existe

    const existingUser = await prisma.user.findUnique({

      where: { email }

    });

    

    if (existingUser) {

      return res.status(400).json({ error: "Email já cadastrado" });

    }

    

    // Hash da senha

    const passwordHash = await bcrypt.hash(password, 10);

    

    // Criar usuário admin

    const user = await prisma.user.create({

      data: {

        email,

        passwordHash,

        role: 'admin'

      },

      select: {

        id: true,

        email: true,

        role: true

      }

    });

    

    res.json({ 

      message: "Usuário admin criado com sucesso", 
      user 
    });

  } catch (error) {

    console.error("Erro ao criar admin:", error);

    res.status(500).json({ error: "Erro ao criar usuário admin" });

  }

});



// --- ROTAS DE UPLOAD DE ARQUIVOS ---

// Upload de capa (imagem)

app.post("/api/upload/cover", authenticateToken, requireAdmin, upload.single('cover'), async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({ error: "Nenhum arquivo enviado" });

    }

    

    // Retornar o caminho relativo do arquivo

    const relativePath = `/media/capas/movies/${req.file.filename}`;

    

    res.json({

      success: true,

      path: relativePath,

      filename: req.file.filename

    });

  } catch (error) {

    console.error("Erro ao fazer upload da capa:", error);

    res.status(500).json({ error: "Erro ao fazer upload da capa" });

  }

});

// Upload de vídeo (arquivo de vídeo ou pasta HLS)

app.post("/api/upload/video", authenticateToken, requireAdmin, upload.single('video'), async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({ error: "Nenhum arquivo enviado" });

    }

    

    // Se for arquivo .m3u8, mover para pasta apropriada

    if (req.file.originalname.endsWith('.m3u8')) {

      // Para arquivos HLS, assumir que o usuário vai organizar manualmente

      // ou criar uma estrutura de pastas baseada no nome do título

      const relativePath = `/media/movies/${req.file.filename}`;

      

      res.json({

        success: true,

        path: relativePath,

        filename: req.file.filename,

        message: "Arquivo HLS enviado. Certifique-se de que os segmentos .ts estão na mesma pasta."

      });

    } else {

      // Para vídeos normais, informar que precisa converter para HLS

      const relativePath = `/media/uploads/${req.file.filename}`;

      

      res.json({

        success: true,

        path: relativePath,

        filename: req.file.filename,

        message: "Vídeo enviado. Use o script converter-hls.ps1 para converter para HLS antes de adicionar o título."

      });

    }

  } catch (error) {

    console.error("Erro ao fazer upload do vídeo:", error);

    res.status(500).json({ error: "Erro ao fazer upload do vídeo" });

  }

});

// --- ROTAS DE ADMINISTRAÇÃO (CRUD de Títulos) ---

// Criar novo título (apenas admin)

app.post("/api/titles", authenticateToken, requireAdmin, async (req, res) => {

  try {

    const { name, description, coverUrl, hlsPath, duration, ageRating, type, genre, seriesId, season, episode } = req.body;

    console.log("Dados recebidos para criar título:", { name, description, coverUrl, hlsPath, duration, ageRating, type, genre, seriesId, season, episode });

    // Validação dos campos obrigatórios
    // Se for episódio de série, coverUrl pode vir da série
    if (!name || !description) {
      return res.status(400).json({ error: "Campos obrigatórios: nome e descrição" });
    }
    
    // Validação de capa será feita depois de verificar se é episódio

    // Validar duração
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      return res.status(400).json({ error: "Duração deve ser um número positivo (em minutos)" });
    }

    // Se não tiver hlsPath, usar um placeholder temporário
    const finalHlsPath = hlsPath && hlsPath.trim() !== '' ? String(hlsPath) : "/media/uploads/placeholder.m3u8";

    // Converter minutos para segundos (o frontend envia em minutos)
    const durationInSeconds = Number(duration) * 60;

    // Validar valores antes de criar
    if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
      return res.status(400).json({ error: "Duração inválida" });
    }

    // Validar classificação etária
    const validAgeRating = ageRating && ["L", "10", "12", "14", "16", "18"].includes(String(ageRating)) 
      ? String(ageRating) 
      : "L";

    // Validar se é episódio de série
    let finalSeriesId = null;
    let finalSeason = null;
    let finalEpisode = null;
    let finalCoverUrl = coverUrl;
    let finalGenre = genre || "Drama";
    let validType = (type === "series" || type === "movie") ? String(type) : "movie";

    // Se seriesId estiver presente, é um episódio de uma série existente
    if (seriesId && Number(seriesId) > 0) {
      // Verificar se a série existe e é realmente uma série
      const series = await prisma.title.findUnique({
        where: { id: Number(seriesId) },
        select: { id: true, type: true, coverUrl: true, genre: true }
      });

      if (!series) {
        return res.status(400).json({ error: "Série não encontrada" });
      }

      if (series.type !== "series") {
        return res.status(400).json({ error: "O título selecionado não é uma série" });
      }

      // Se seriesId está presente, é um episódio (não uma nova série)
      // O tipo continua sendo "series" mas será um episódio porque seriesId está preenchido
      finalSeriesId = Number(seriesId);
      
      // Usar capa e gênero da série se não foram fornecidos
      if (!coverUrl || coverUrl.trim() === '') {
        finalCoverUrl = series.coverUrl;
      }
      if (!genre || genre.trim() === '') {
        finalGenre = series.genre || "Drama";
      }
      
      // Validar temporada e episódio
      if (season && Number(season) > 0) {
        finalSeason = Number(season);
      }
      if (episode && Number(episode) > 0) {
        finalEpisode = Number(episode);
      }
      
      // Garantir que o tipo seja "series" para episódios
      validType = "series";
    }

    // Se não for episódio, capa é obrigatória
    if (!finalSeriesId && (!finalCoverUrl || finalCoverUrl.trim() === '')) {
      return res.status(400).json({ error: "Campos obrigatórios: nome, descrição e capa" });
    }

    console.log("Dados validados:", { 
      name: String(name), 
      description: String(description), 
      coverUrl: finalCoverUrl, 
      hlsPath: finalHlsPath, 
      duration: durationInSeconds, 
      ageRating: validAgeRating, 
      type: validType, 
      genre: finalGenre,
      seriesId: finalSeriesId,
      season: finalSeason,
      episode: finalEpisode
    });

    const title = await prisma.title.create({

      data: {

        name: String(name),

        description: String(description),

        coverUrl: finalCoverUrl,

        hlsPath: finalHlsPath,

        duration: durationInSeconds,

        ageRating: validAgeRating,

        type: validType,

        genre: finalGenre,

        seriesId: finalSeriesId,

        season: finalSeason,

        episode: finalEpisode

      }

    });

    console.log("Título criado com sucesso:", title);

    res.json(title);

  } catch (error) {

    console.error("Erro ao criar título:", error);
    console.error("Stack trace:", error.stack);
    console.error("Dados recebidos:", req.body);

    res.status(500).json({ 
      error: "Erro ao criar título",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

  }

});



// Atualizar título (apenas admin)

app.put("/api/titles/:id", authenticateToken, requireAdmin, async (req, res) => {

  try {

    const id = Number(req.params.id);

    const { name, description, coverUrl, hlsPath, duration, ageRating, type, genre } = req.body;

    

    // Verificar se título existe

    const existingTitle = await prisma.title.findUnique({

      where: { id }

    });

    

    if (!existingTitle) {

      return res.status(404).json({ error: "Título não encontrado" });

    }

    // Converter minutos para segundos se duration for fornecido
    const updateData = {};

    if (name) updateData.name = String(name);
    if (description) updateData.description = String(description);
    if (coverUrl) updateData.coverUrl = String(coverUrl);
    if (hlsPath) updateData.hlsPath = String(hlsPath);
    if (duration !== undefined) updateData.duration = Number(duration) * 60; // Converter minutos para segundos
    if (ageRating) updateData.ageRating = String(ageRating);
    if (type && (type === "series" || type === "movie")) updateData.type = String(type);
    if (genre) updateData.genre = String(genre);

    const title = await prisma.title.update({

      where: { id },

      data: updateData

    });

    

    res.json(title);

  } catch (error) {

    console.error("Erro ao atualizar título:", error);

    res.status(500).json({ error: "Erro ao atualizar título" });

  }

});



// Deletar título (apenas admin)

app.delete("/api/titles/:id", authenticateToken, requireAdmin, async (req, res) => {

  try {

    const id = Number(req.params.id);

    

    // Verificar se título existe

    const existingTitle = await prisma.title.findUnique({

      where: { id }

    });

    

    if (!existingTitle) {

      return res.status(404).json({ error: "Título não encontrado" });

    }

    

    // Deletar favoritos e progressos relacionados primeiro

    await prisma.favorite.deleteMany({

      where: { titleId: id }

    });

    

    await prisma.progress.deleteMany({

      where: { titleId: id }

    });

    

    // Deletar título

    await prisma.title.delete({

      where: { id }

    });

    

    res.json({ success: true, message: "Título deletado com sucesso" });

  } catch (error) {

    console.error("Erro ao deletar título:", error);

    res.status(500).json({ error: "Erro ao deletar título" });

  }

});



// --- ROTAS DE PROGRESSO ---

// Listar todos os progressos do usuário (para "Continuar Assistindo")

app.get("/api/progress", authenticateToken, async (req, res) => {

  try {

    const userId = req.user.userId;

    

    const progresses = await prisma.progress.findMany({

      where: { userId },

      include: {

        title: true

      },

      orderBy: {

        id: 'desc'

      }

    });

    

    // Filtrar apenas progressos não finalizados e mapear com informações do título

    const continueWatching = progresses

      .filter(p => p.title && p.position > 0 && p.position < p.title.duration)

      .map(p => ({

        id: p.id,

        titleId: p.titleId,

        position: p.position,

        title: p.title

      }));

    

    res.json(continueWatching);

  } catch (error) {

    console.error("Erro ao buscar progressos:", error);

    res.status(500).json({ error: "Erro ao buscar progressos" });

  }

});

// Obter progresso de um título

app.get("/api/progress/:titleId", authenticateToken, async (req, res) => {

  try {

    const titleId = Number(req.params.titleId);

    const userId = req.user.userId;

    

    const progress = await prisma.progress.findUnique({

      where: {

        userId_titleId: {

          userId,

          titleId

        }

      }

    });

    

    res.json(progress || { position: 0 });

  } catch (error) {

    console.error("Erro ao buscar progresso:", error);

    res.status(500).json({ error: "Erro ao buscar progresso" });

  }

});



// Salvar progresso

app.post("/api/progress", authenticateToken, async (req, res) => {

  try {

    const { titleId, position } = req.body;

    const userId = req.user.userId;

    

    if (!titleId || position === undefined) {

      return res.status(400).json({ error: "titleId e position são obrigatórios" });

    }

    

    const progress = await prisma.progress.upsert({

      where: {

        userId_titleId: {

          userId,

          titleId: Number(titleId)

        }

      },

      update: {

        position: Number(position)

      },

      create: {

        userId,

        titleId: Number(titleId),

        position: Number(position)

      }

    });

    

    res.json(progress);

  } catch (error) {

    console.error("Erro ao salvar progresso:", error);

    res.status(500).json({ error: "Erro ao salvar progresso" });

  }

});



// --- ROTAS DE FAVORITOS (MINHA LISTA) ---

// Listar favoritos do usuário

app.get("/api/favorites", authenticateToken, async (req, res) => {

  try {

    const userId = req.user.userId;

    

    const favorites = await prisma.favorite.findMany({

      where: { userId },

      include: {

        title: true

      }

    });

    

    // Filtrar favoritos que têm título válido e mapear
    const validFavorites = favorites
      .filter(f => f.title !== null && f.title !== undefined)
      .map(f => f.title);

    res.json(validFavorites);

  } catch (error) {

    console.error("Erro ao buscar favoritos:", error);
    console.error("Detalhes do erro:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({ 
      error: "Erro ao buscar favoritos",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  }

});



// Adicionar aos favoritos

app.post("/api/favorites", authenticateToken, async (req, res) => {

  try {

    const { titleId } = req.body;

    const userId = req.user.userId;

    

    if (!titleId) {

      return res.status(400).json({ error: "titleId é obrigatório" });

    }

    

    // Verificar se título existe

    const title = await prisma.title.findUnique({

      where: { id: Number(titleId) }

    });

    

    if (!title) {

      return res.status(404).json({ error: "Título não encontrado" });

    }

    

    // Adicionar aos favoritos (ou ignorar se já existir)

    const favorite = await prisma.favorite.upsert({

      where: {

        userId_titleId: {

          userId,

          titleId: Number(titleId)

        }

      },

      update: {},

      create: {

        userId,

        titleId: Number(titleId)

      }

    });

    

    res.json({ success: true, favorite });

  } catch (error) {

    console.error("Erro ao adicionar favorito:", error);

    res.status(500).json({ error: "Erro ao adicionar favorito" });

  }

});



// Remover dos favoritos

app.delete("/api/favorites/:titleId", authenticateToken, async (req, res) => {

  try {

    const titleId = Number(req.params.titleId);

    const userId = req.user.userId;

    

    await prisma.favorite.deleteMany({

      where: {

        userId,

        titleId

      }

    });

    

    res.json({ success: true });

  } catch (error) {

    console.error("Erro ao remover favorito:", error);

    res.status(500).json({ error: "Erro ao remover favorito" });

  }

});



// Verificar se título está nos favoritos

app.get("/api/favorites/:titleId", authenticateToken, async (req, res) => {

  try {

    const titleId = Number(req.params.titleId);

    const userId = req.user.userId;

    

    const favorite = await prisma.favorite.findUnique({

      where: {

        userId_titleId: {

          userId,

          titleId

        }

      }

    });

    

    res.json({ isFavorite: !!favorite });

  } catch (error) {

    console.error("Erro ao verificar favorito:", error);

    res.status(500).json({ error: "Erro ao verificar favorito" });

  }

});



// --- ROTAS DE DASHBOARD ADMIN ---

// Estatísticas gerais do dashboard

app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {

  try {

    // Contar usuários

    const totalUsers = await prisma.user.count();

    const totalClients = await prisma.user.count({ where: { role: 'client' } });

    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });

    

    // Contar títulos

    const totalTitles = await prisma.title.count();

    const totalMovies = await prisma.title.count({

      where: { hlsPath: { contains: 'movies' } }

    });

    const totalSeries = await prisma.title.count({

      where: { hlsPath: { contains: 'series' } }

    });

    

    // Contar progressos (visualizações)

    const totalProgresses = await prisma.progress.count();

    let uniqueViewers = [];
    try {
      uniqueViewers = await prisma.progress.groupBy({
        by: ['userId'],
        _count: true
      });
    } catch (err) {
      // Fallback se groupBy não funcionar
      const allProgresses = await prisma.progress.findMany({
        select: { userId: true }
      });
      uniqueViewers = Array.from(new Set(allProgresses.map(p => p.userId))).map(userId => ({ userId, _count: 1 }));
    }

    

    // Contar favoritos

    const totalFavorites = await prisma.favorite.count();

    

    // Estatísticas de classificação etária (com fallback se campo não existir)

    let ageRatings = [];
    try {
      ageRatings = await prisma.title.groupBy({
        by: ['ageRating'],
        _count: true
      });
    } catch (err) {
      // Se o campo ageRating não existir, retornar array vazio
      console.log("Campo ageRating não encontrado, usando valores padrão");
      ageRatings = [];
    }

    

    res.json({

      users: {

        total: totalUsers,

        clients: totalClients,

        admins: totalAdmins

      },

      content: {

        total: totalTitles,

        movies: totalMovies,

        series: totalSeries

      },

      engagement: {

        totalViews: totalProgresses,

        uniqueViewers: uniqueViewers.length,

        totalFavorites: totalFavorites

      },

      ageRatings: ageRatings.map(r => ({

        rating: r.ageRating || 'L',

        count: r._count

      }))

    });

  } catch (error) {

    console.error("Erro ao buscar estatísticas:", error);
    console.error("Stack:", error.stack);

    res.status(500).json({ 
      error: "Erro ao buscar estatísticas",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  }

});

// Listar usuários (para gestão)

app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {

  try {

    // Buscar usuários sem birthDate primeiro (caso campo não exista)
    let users;
    try {
      users = await prisma.user.findMany({

        select: {

          id: true,

          email: true,

          role: true,

          birthDate: true,

          _count: {

            select: {

              favorites: true,

              progress: true

            }

          }

        },

        orderBy: { id: 'desc' }

      });
    } catch (err) {
      // Fallback se birthDate não existir
      users = await prisma.user.findMany({

        select: {

          id: true,

          email: true,

          role: true,

          _count: {

            select: {

              favorites: true,

              progress: true

            }

          }

        },

        orderBy: { id: 'desc' }

      });
      
      // Adicionar birthDate como null para todos
      users = users.map(user => ({ ...user, birthDate: null }));
    }

    

    res.json(users);

  } catch (error) {

    console.error("Erro ao buscar usuários:", error);

    res.status(500).json({ error: "Erro ao buscar usuários", details: error.message });

  }

});

// Ligar o servidor

app.listen(PORT, () => {

  console.log(`API rodando em http://localhost:${PORT}`);

  console.log(`Sirvo HLS estático em http://localhost:${PORT}/media`);

});