<div align="center">
  <h1>🎬 ZionFlix</h1>
  <p>Uma plataforma de streaming completa desenvolvida com React, Node.js e Prisma</p>
</div>

---

## 📋 Sobre o Projeto

ZionFlix é uma plataforma de streaming de vídeos inspirada no Netflix, desenvolvida com tecnologias modernas. O projeto oferece uma experiência completa de visualização de filmes e séries, com sistema de autenticação, perfis de usuário, favoritos, progresso de reprodução e painel administrativo.

## ✨ Funcionalidades

### 🎥 Para Usuários
- **Catálogo Completo**: Navegação por filmes e séries
- **Reprodução de Vídeo**: Player com suporte HLS para streaming adaptativo
- **Sistema de Favoritos**: Adicione títulos à sua lista pessoal
- **Continuar Assistindo**: Retome de onde parou
- **Busca Avançada**: Encontre títulos por nome, gênero ou tipo
- **Perfis Personalizados**: Múltiplos perfis por conta
- **Classificação Etária**: Sistema de controle de conteúdo por idade
- **Tendências**: Descubra o que está em alta

### 👨‍💼 Para Administradores
- **Painel Administrativo**: Gerenciamento completo de conteúdo
- **Upload de Vídeos**: Envio de arquivos de mídia
- **Conversão HLS**: Processamento automático para streaming
- **Gerenciamento de Títulos**: Criação e edição de filmes e séries
- **Gestão de Usuários**: Controle de contas e permissões

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset tipado do JavaScript
- **React Router DOM** - Roteamento de páginas
- **Vite** - Build tool e dev server
- **HLS.js** - Player de vídeo HLS
- **Lucide React** - Ícones modernos

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados
- **JWT** - Autenticação por tokens
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **FFmpeg** - Conversão de vídeos para HLS

## 📁 Estrutura do Projeto

```
ZionFlix/
├── Backend/
│   ├── src/
│   │   └── index.js          # Servidor Express
│   ├── prisma/
│   │   ├── schema.prisma     # Schema do banco de dados
│   │   └── migrations/       # Migrações do Prisma
│   ├── scripts/
│   │   ├── converter-hls.ps1 # Script de conversão HLS (Windows)
│   │   ├── converter-hls.sh  # Script de conversão HLS (Linux)
│   │   └── create-admin.js   # Script para criar usuário admin
│   ├── media/                # Arquivos de mídia (vídeos e capas)
│   └── package.json
├── Frontend/
│   ├── components/           # Componentes React reutilizáveis
│   ├── pages/                # Páginas da aplicação
│   ├── contexts/             # Context API (AuthContext)
│   ├── services/             # Serviços de API
│   └── package.json
└── README.md
```

## 🚀 Como Instalar e Executar

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **FFmpeg** (para conversão de vídeos)
- **Git**

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/duwalace/ZionFlixx.git
cd ZionFlix
```

2. **Instale as dependências do Backend**
```bash
cd Backend
npm install
```

3. **Instale as dependências do Frontend**
```bash
cd ../Frontend
npm install
```

### Configuração

1. **Configure o Backend**

Crie um arquivo `.env` na pasta `Backend/`:
```env
JWT_SECRET=seu-secret-super-seguro-aqui-mude-em-producao
PORT=3001
```

2. **Configure o banco de dados**

```bash
cd Backend
npx prisma migrate dev
npx prisma generate
```

3. **Crie um usuário administrador (opcional)**

```bash
node scripts/create-admin.js
```

### Executando o Projeto

1. **Inicie o Backend**
```bash
cd Backend
npm run dev
```
O servidor estará rodando em `http://localhost:3001`

2. **Inicie o Frontend** (em outro terminal)
```bash
cd Frontend
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`

## 📝 Scripts Disponíveis

### Backend
- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run prisma:migrate` - Executa migrações do banco de dados
- `npm run convert-hls` - Converte vídeos para formato HLS (Windows)
- `npm run convert-hls:linux` - Converte vídeos para formato HLS (Linux)
- `npm run check-ffmpeg` - Verifica se o FFmpeg está instalado

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

## 🎯 Funcionalidades Principais

### Autenticação
- Registro de novos usuários
- Login com JWT
- Proteção de rotas
- Diferenciação de roles (admin/client)

### Streaming
- Upload de vídeos
- Conversão automática para HLS
- Player de vídeo responsivo
- Controle de progresso de reprodução

### Gerenciamento
- CRUD completo de títulos
- Suporte a filmes e séries
- Episódios e temporadas
- Upload de capas

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Validação de classificação etária
- Proteção de rotas administrativas
- CORS configurado

## 📦 Banco de Dados

O projeto utiliza **SQLite** com **Prisma ORM**. O schema inclui:

- **User**: Usuários do sistema
- **Title**: Filmes e séries
- **Favorite**: Lista de favoritos
- **Progress**: Progresso de reprodução

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**duwalace**

- GitHub: [@duwalace](https://github.com/duwalace)
- Repositório: [ZionFlixx](https://github.com/duwalace/ZionFlixx)

## 🙏 Agradecimentos

- Comunidade React
- Comunidade Node.js
- Todos os mantenedores das bibliotecas utilizadas

---

<div align="center">
  <p>Feito com ❤️ para a comunidade</p>
</div>
