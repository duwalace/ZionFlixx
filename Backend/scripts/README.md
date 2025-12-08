# Scripts de Conversão HLS

Este diretório contém scripts para facilitar a conversão de vídeos para o formato HLS usado pelo Zionflix.

## 📋 Pré-requisitos

- **FFmpeg instalado** e disponível no PATH do sistema
  - Windows: Baixe de https://ffmpeg.org/download.html
  - Linux: `sudo apt-get install ffmpeg` (Ubuntu/Debian) ou `sudo yum install ffmpeg` (CentOS/RHEL)
  - macOS: `brew install ffmpeg`

## 🚀 Como Usar

### Windows (PowerShell)

```powershell
cd Backend/scripts
.\converter-hls.ps1
```

**Nota:** Se você receber um erro de política de execução, execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Linux/Mac (Bash)

```bash
cd Backend/scripts
chmod +x converter-hls.sh
./converter-hls.sh
```

## 📝 Processo

1. Execute o script
2. Informe o caminho completo do vídeo de entrada
3. Informe o nome da pasta de saída (ex: `meu-filme`)
4. Escolha a qualidade:
   - **360p**: Ideal para testes rápidos
   - **720p**: Padrão recomendado
   - **1080p**: Alta qualidade
   - **Multi-qualidade**: Cria todas as três qualidades (recomendado para produção)

5. Aguarde a conversão (pode levar alguns minutos dependendo do tamanho do vídeo)

## 📁 Estrutura Criada

Após a conversão, a seguinte estrutura será criada:

```
Backend/src/media/movies/nome-do-filme/
├── master.m3u8              (Playlist principal)
├── video_360p.m3u8          (Playlist 360p - se gerado)
├── video_720p.m3u8          (Playlist 720p - se gerado)
├── video_1080p.m3u8         (Playlist 1080p - se gerado)
└── segments/                (Segmentos de vídeo)
    ├── video_360p_000.ts
    ├── video_360p_001.ts
    ├── video_720p_000.ts
    └── ...
```

## 🎬 Próximos Passos

Após converter o vídeo:

1. **Adicione a imagem de capa**
   - Coloque em: `Backend/src/media/capas/movies/nome-do-filme.jpg`
   - Recomendado: proporção 16:9, tamanho otimizado

2. **Adicione ao banco de dados**
   - Acesse o painel admin (`/admin`)
   - Preencha o formulário:
     - **Nome**: Nome do filme
     - **Descrição**: Sinopse
     - **URL da Capa**: `/media/capas/movies/nome-do-filme.jpg`
     - **Caminho HLS**: `/media/movies/nome-do-filme/master.m3u8`
     - **Duração**: Em segundos (ex: 5400 = 90 minutos)

## ⚙️ Configurações Avançadas

Se precisar ajustar as configurações de conversão, edite o script e modifique:

- **Bitrate de vídeo**: `-b:v` (ex: `2500k` para 720p)
- **Bitrate de áudio**: `-b:a` (ex: `128k`)
- **Duração dos segmentos**: `-hls_time` (padrão: 10 segundos)
- **Resolução**: `-s` (ex: `1280x720` para 720p)

## 🔍 Troubleshooting

### Erro: FFmpeg não encontrado
- Verifique se o FFmpeg está instalado
- Verifique se está no PATH do sistema
- No Windows, reinicie o terminal após instalar

### Conversão muito lenta
- Use uma qualidade única primeiro (720p)
- Reduza o bitrate
- Considere usar hardware acceleration se disponível

### Arquivos muito grandes
- Reduza o bitrate
- Use resolução menor
- Reduza a duração dos segmentos

## 📚 Mais Informações

Para mais detalhes sobre HLS e o funcionamento completo do sistema, consulte o arquivo `GUIA_HLS_E_CONTEUDO.md` na raiz do projeto.

