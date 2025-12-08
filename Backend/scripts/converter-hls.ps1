# Script PowerShell para converter vídeos para HLS
# Uso: .\converter-hls.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Conversor de Video para HLS - Zionflix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se FFmpeg está instalado
$ffmpegCheck = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpegCheck) {
    Write-Host "ERRO: FFmpeg não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o FFmpeg e adicione ao PATH do sistema." -ForegroundColor Yellow
    Write-Host "Download: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "FFmpeg encontrado: $($ffmpegCheck.Source)" -ForegroundColor Green
Write-Host ""

# Solicitar entrada do usuário
$inputVideo = Read-Host "Digite o caminho completo do video de entrada"
if (-not (Test-Path $inputVideo)) {
    Write-Host "ERRO: Arquivo não encontrado: $inputVideo" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

$outputName = Read-Host "Digite o nome da pasta de saida (ex: meu-filme)"
if ([string]::IsNullOrWhiteSpace($outputName)) {
    Write-Host "ERRO: Nome inválido!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "Selecione a qualidade:" -ForegroundColor Yellow
Write-Host "1 - 360p (Recomendado para testes)" -ForegroundColor White
Write-Host "2 - 720p (Padrão)" -ForegroundColor White
Write-Host "3 - 1080p (Alta qualidade)" -ForegroundColor White
Write-Host "4 - Multi-qualidade (360p + 720p + 1080p)" -ForegroundColor White
$quality = Read-Host "Opcao"

# Definir caminhos
$basePath = Join-Path $PSScriptRoot ".." "src" "media"
$moviesPath = Join-Path $basePath "movies"
$outputPath = Join-Path $moviesPath $outputName
$segmentsPath = Join-Path $outputPath "segments"

# Criar estrutura de pastas
Write-Host ""
Write-Host "Criando estrutura de pastas..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
New-Item -ItemType Directory -Force -Path $segmentsPath | Out-Null

# Função para converter vídeo
function Convert-Video {
    param(
        [string]$InputFile,
        [string]$OutputDir,
        [string]$SegmentsDir,
        [string]$Quality,
        [string]$Resolution,
        [string]$Bitrate,
        [string]$AudioBitrate,
        [string]$PlaylistName
    )
    
    Write-Host "Convertendo para $Quality..." -ForegroundColor Yellow
    
    $segmentPattern = Join-Path $SegmentsDir "video_${Quality}_%03d.ts"
    $playlistPath = Join-Path $OutputDir $PlaylistName
    
    $ffmpegArgs = @(
        "-i", "`"$InputFile`"",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:v", $Bitrate,
        "-b:a", $AudioBitrate,
        "-hls_time", "10",
        "-hls_list_size", "0",
        "-hls_segment_filename", "`"$segmentPattern`"",
        "-s", $Resolution,
        "`"$playlistPath`""
    )
    
    $process = Start-Process -FilePath "ffmpeg" -ArgumentList $ffmpegArgs -Wait -NoNewWindow -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✓ Conversão $Quality concluída!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Erro na conversão $Quality" -ForegroundColor Red
        return $false
    }
}

# Função para criar master.m3u8
function Create-MasterPlaylist {
    param(
        [string]$OutputDir,
        [bool]$Has360p,
        [bool]$Has720p,
        [bool]$Has1080p
    )
    
    $masterPath = Join-Path $OutputDir "master.m3u8"
    
    $content = @"
#EXTM3U
#EXT-X-VERSION:3
"@
    
    if ($Has360p) {
        $content += @"

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
video_360p.m3u8
"@
    }
    
    if ($Has720p) {
        $content += @"

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
video_720p.m3u8
"@
    }
    
    if ($Has1080p) {
        $content += @"

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
video_1080p.m3u8
"@
    }
    
    $content | Out-File -FilePath $masterPath -Encoding UTF8 -NoNewline
    Write-Host "✓ master.m3u8 criado!" -ForegroundColor Green
}

# Executar conversão baseado na opção escolhida
$success = $false

switch ($quality) {
    "1" {
        $success = Convert-Video -InputFile $inputVideo -OutputDir $outputPath -SegmentsDir $segmentsPath `
            -Quality "360p" -Resolution "640x360" -Bitrate "800k" -AudioBitrate "96k" -PlaylistName "video_360p.m3u8"
        if ($success) {
            Create-MasterPlaylist -OutputDir $outputPath -Has360p $true -Has720p $false -Has1080p $false
        }
    }
    "2" {
        $success = Convert-Video -InputFile $inputVideo -OutputDir $outputPath -SegmentsDir $segmentsPath `
            -Quality "720p" -Resolution "1280x720" -Bitrate "2500k" -AudioBitrate "128k" -PlaylistName "video_720p.m3u8"
        if ($success) {
            Create-MasterPlaylist -OutputDir $outputPath -Has360p $false -Has720p $true -Has1080p $false
        }
    }
    "3" {
        $success = Convert-Video -InputFile $inputVideo -OutputDir $outputPath -SegmentsDir $segmentsPath `
            -Quality "1080p" -Resolution "1920x1080" -Bitrate "5000k" -AudioBitrate "192k" -PlaylistName "video_1080p.m3u8"
        if ($success) {
            Create-MasterPlaylist -OutputDir $outputPath -Has360p $false -Has720p $false -Has1080p $true
        }
    }
    "4" {
        Write-Host ""
        Write-Host "Convertendo para múltiplas qualidades..." -ForegroundColor Cyan
        Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
        Write-Host ""
        
        $success360 = Convert-Video -InputFile $inputVideo -OutputDir $outputPath -SegmentsDir $segmentsPath `
            -Quality "360p" -Resolution "640x360" -Bitrate "800k" -AudioBitrate "96k" -PlaylistName "video_360p.m3u8"
        
        $success720 = Convert-Video -InputFile $inputVideo -OutputDir $outputPath -SegmentsDir $segmentsPath `
            -Quality "720p" -Resolution "1280x720" -Bitrate "2500k" -AudioBitrate "128k" -PlaylistName "video_720p.m3u8"
        
        $success1080 = Convert-Video -InputFile $inputVideo -OutputDir $outputPath -SegmentsDir $segmentsPath `
            -Quality "1080p" -Resolution "1920x1080" -Bitrate "5000k" -AudioBitrate "192k" -PlaylistName "video_1080p.m3u8"
        
        if ($success360 -and $success720 -and $success1080) {
            Create-MasterPlaylist -OutputDir $outputPath -Has360p $true -Has720p $true -Has1080p $true
            $success = $true
        } else {
            $success = $false
        }
    }
    default {
        Write-Host "ERRO: Opção inválida!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

# Resultado final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($success) {
    Write-Host "✓ Conversão concluída com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informações do conteúdo:" -ForegroundColor Yellow
    Write-Host "  Nome: $outputName" -ForegroundColor White
    Write-Host "  Caminho HLS: /media/movies/$outputName/master.m3u8" -ForegroundColor White
    Write-Host "  Caminho completo: $outputPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Adicione uma imagem de capa em:" -ForegroundColor White
    Write-Host "     Backend\src\media\capas\movies\$outputName.jpg" -ForegroundColor Gray
    Write-Host "  2. Acesse o painel admin (/admin) e adicione o título" -ForegroundColor White
    Write-Host "  3. Use o caminho HLS acima no formulário" -ForegroundColor White
} else {
    Write-Host "✗ Erro na conversão. Verifique os logs acima." -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Pressione Enter para sair"

