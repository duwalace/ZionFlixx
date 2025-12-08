# Script para verificar se FFmpeg está instalado

Write-Host "Verificando instalação do FFmpeg..." -ForegroundColor Cyan
Write-Host ""

$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue

if ($ffmpegPath) {
    Write-Host "✓ FFmpeg encontrado!" -ForegroundColor Green
    Write-Host "  Localização: $($ffmpegPath.Source)" -ForegroundColor White
    Write-Host ""
    Write-Host "Versão:" -ForegroundColor Yellow
    & ffmpeg -version | Select-Object -First 1
    Write-Host ""
    Write-Host "✓ Você pode usar o script de conversão HLS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para converter um vídeo, execute:" -ForegroundColor Yellow
    Write-Host "  npm run convert-hls" -ForegroundColor White
    Write-Host "  ou" -ForegroundColor Gray
    Write-Host "  .\converter-hls.ps1" -ForegroundColor White
} else {
    Write-Host "✗ FFmpeg NÃO encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Você precisa instalar o FFmpeg primeiro." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opções de instalação:" -ForegroundColor Cyan
    Write-Host "  1. Manual: Veja INSTALAR_FFMPEG.md" -ForegroundColor White
    Write-Host "  2. Chocolatey (como Admin): choco install ffmpeg -y" -ForegroundColor White
    Write-Host "  3. Winget: winget install ffmpeg" -ForegroundColor White
    Write-Host ""
    Write-Host "Após instalar, feche e abra um novo terminal." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione Enter para sair"

