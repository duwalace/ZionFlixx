#!/bin/bash

# Script Bash para converter vídeos para HLS
# Uso: ./converter-hls.sh

echo "========================================"
echo "Conversor de Video para HLS - Zionflix"
echo "========================================"
echo ""

# Verificar se FFmpeg está instalado
if ! command -v ffmpeg &> /dev/null; then
    echo "ERRO: FFmpeg não encontrado!"
    echo "Por favor, instale o FFmpeg:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    exit 1
fi

echo "FFmpeg encontrado: $(which ffmpeg)"
echo ""

# Solicitar entrada do usuário
read -p "Digite o caminho completo do video de entrada: " input_video
if [ ! -f "$input_video" ]; then
    echo "ERRO: Arquivo não encontrado: $input_video"
    exit 1
fi

read -p "Digite o nome da pasta de saida (ex: meu-filme): " output_name
if [ -z "$output_name" ]; then
    echo "ERRO: Nome inválido!"
    exit 1
fi

echo ""
echo "Selecione a qualidade:"
echo "1 - 360p (Recomendado para testes)"
echo "2 - 720p (Padrão)"
echo "3 - 1080p (Alta qualidade)"
echo "4 - Multi-qualidade (360p + 720p + 1080p)"
read -p "Opcao: " quality

# Definir caminhos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_PATH="$SCRIPT_DIR/../src/media"
MOVIES_PATH="$BASE_PATH/movies"
OUTPUT_PATH="$MOVIES_PATH/$output_name"
SEGMENTS_PATH="$OUTPUT_PATH/segments"

# Criar estrutura de pastas
echo ""
echo "Criando estrutura de pastas..."
mkdir -p "$OUTPUT_PATH"
mkdir -p "$SEGMENTS_PATH"

# Função para converter vídeo
convert_video() {
    local quality=$1
    local resolution=$2
    local bitrate=$3
    local audio_bitrate=$4
    local playlist_name=$5
    
    echo "Convertendo para $quality..."
    
    local segment_pattern="$SEGMENTS_PATH/video_${quality}_%03d.ts"
    local playlist_path="$OUTPUT_PATH/$playlist_name"
    
    if ffmpeg -i "$input_video" \
        -c:v libx264 \
        -c:a aac \
        -b:v "$bitrate" \
        -b:a "$audio_bitrate" \
        -hls_time 10 \
        -hls_list_size 0 \
        -hls_segment_filename "$segment_pattern" \
        -s "$resolution" \
        "$playlist_path" 2>&1 | grep -q "error\|Error\|ERROR"; then
        echo "✗ Erro na conversão $quality"
        return 1
    else
        echo "✓ Conversão $quality concluída!"
        return 0
    fi
}

# Função para criar master.m3u8
create_master_playlist() {
    local has_360p=$1
    local has_720p=$2
    local has_1080p=$3
    
    local master_path="$OUTPUT_PATH/master.m3u8"
    
    echo "#EXTM3U" > "$master_path"
    echo "#EXT-X-VERSION:3" >> "$master_path"
    
    if [ "$has_360p" = true ]; then
        echo "" >> "$master_path"
        echo "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360" >> "$master_path"
        echo "video_360p.m3u8" >> "$master_path"
    fi
    
    if [ "$has_720p" = true ]; then
        echo "" >> "$master_path"
        echo "#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720" >> "$master_path"
        echo "video_720p.m3u8" >> "$master_path"
    fi
    
    if [ "$has_1080p" = true ]; then
        echo "" >> "$master_path"
        echo "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080" >> "$master_path"
        echo "video_1080p.m3u8" >> "$master_path"
    fi
    
    echo "✓ master.m3u8 criado!"
}

# Executar conversão baseado na opção escolhida
success=false

case $quality in
    1)
        if convert_video "360p" "640x360" "800k" "96k" "video_360p.m3u8"; then
            create_master_playlist true false false
            success=true
        fi
        ;;
    2)
        if convert_video "720p" "1280x720" "2500k" "128k" "video_720p.m3u8"; then
            create_master_playlist false true false
            success=true
        fi
        ;;
    3)
        if convert_video "1080p" "1920x1080" "5000k" "192k" "video_1080p.m3u8"; then
            create_master_playlist false false true
            success=true
        fi
        ;;
    4)
        echo ""
        echo "Convertendo para múltiplas qualidades..."
        echo "Isso pode levar alguns minutos..."
        echo ""
        
        success360=false
        success720=false
        success1080=false
        
        if convert_video "360p" "640x360" "800k" "96k" "video_360p.m3u8"; then
            success360=true
        fi
        
        if convert_video "720p" "1280x720" "2500k" "128k" "video_720p.m3u8"; then
            success720=true
        fi
        
        if convert_video "1080p" "1920x1080" "5000k" "192k" "video_1080p.m3u8"; then
            success1080=true
        fi
        
        if [ "$success360" = true ] && [ "$success720" = true ] && [ "$success1080" = true ]; then
            create_master_playlist true true true
            success=true
        fi
        ;;
    *)
        echo "ERRO: Opção inválida!"
        exit 1
        ;;
esac

# Resultado final
echo ""
echo "========================================"
if [ "$success" = true ]; then
    echo "✓ Conversão concluída com sucesso!"
    echo ""
    echo "Informações do conteúdo:"
    echo "  Nome: $output_name"
    echo "  Caminho HLS: /media/movies/$output_name/master.m3u8"
    echo "  Caminho completo: $OUTPUT_PATH"
    echo ""
    echo "Próximos passos:"
    echo "  1. Adicione uma imagem de capa em:"
    echo "     Backend/src/media/capas/movies/$output_name.jpg"
    echo "  2. Acesse o painel admin (/admin) e adicione o título"
    echo "  3. Use o caminho HLS acima no formulário"
else
    echo "✗ Erro na conversão. Verifique os logs acima."
fi
echo "========================================"
echo ""

