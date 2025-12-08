import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Hls from 'hls.js';
import { titlesAPI, titleToMovie, progressAPI } from '../services/api';
import { Movie } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const title = await titlesAPI.getById(Number(id));
        const convertedMovie = titleToMovie(title);
        setMovie(convertedMovie);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar filme:', err);
        setError('Filme não encontrado.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Carregar progresso salvo
  useEffect(() => {
    const loadProgress = async () => {
      if (!movie || !isAuthenticated || !videoRef.current) return;

      try {
        const progress = await progressAPI.get(Number(id));
        if (progress.position > 0 && videoRef.current) {
          videoRef.current.currentTime = progress.position;
        }
      } catch (err) {
        console.error('Erro ao carregar progresso:', err);
      }
    };

    if (movie) {
      loadProgress();
    }
  }, [movie, id, isAuthenticated]);

  // Configurar HLS e salvar progresso
  useEffect(() => {
    if (!movie || !videoRef.current) return;

    const video = videoRef.current;
    const videoUrl = movie.videoUrl;

    // Limpar HLS anterior
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (videoUrl.endsWith('.m3u8')) {
      // Usar HLS.js para suporte universal
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            console.error('Erro ao reproduzir vídeo:', err);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Erro de rede HLS, tentando recuperar...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Erro de mídia HLS, tentando recuperar...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Erro fatal HLS, destruindo...');
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Suporte nativo do Safari
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => {
            console.error('Erro ao reproduzir vídeo:', err);
          });
        });
      } else {
        setError('Seu navegador não suporta reprodução HLS.');
      }
    } else {
      // Vídeo MP4 ou outro formato
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.error('Erro ao reproduzir vídeo:', err);
        });
      });
    }

    // Salvar progresso periodicamente
    const handleTimeUpdate = () => {
      if (!isAuthenticated || !video) return;

      // Limpar timeout anterior
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }

      // Salvar após 5 segundos sem atualização
      saveProgressTimeoutRef.current = setTimeout(async () => {
        try {
          await progressAPI.save(Number(id), Math.floor(video.currentTime));
        } catch (err) {
          console.error('Erro ao salvar progresso:', err);
        }
      }, 5000);
    };

    // Salvar progresso ao pausar
    const handlePause = async () => {
      if (!isAuthenticated || !video) return;
      
      try {
        await progressAPI.save(Number(id), Math.floor(video.currentTime));
      } catch (err) {
        console.error('Erro ao salvar progresso:', err);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
    };
  }, [movie, id, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Filme não encontrado.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="text-brand hover:underline"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col justify-center items-center overflow-hidden relative">
      {/* Back Overlay (fades out) */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-white gap-2 hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-8 w-8" />
          <span className="text-xl font-bold">Voltar para Home</span>
        </button>
      </div>

      {/* Video Player */}
      <div className="w-full h-full max-w-[100vw] max-h-[100vh]">
        <video 
          ref={videoRef}
          controls 
          autoPlay 
          className="w-full h-full object-contain focus:outline-none"
          poster={movie.coverUrl}
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      </div>
    </div>
  );
};

export default Watch;