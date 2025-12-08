import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { progressAPI, ProgressWithTitle, titleToMovie } from '../services/api';
import { Movie } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ContinueWatchingCardProps {
  progress: ProgressWithTitle;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ progress }) => {
  const navigate = useNavigate();
  const movie = titleToMovie(progress.title);
  const progressPercent = (progress.position / progress.title.duration) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div 
      className="flex-none w-[160px] md:w-[220px] snap-start cursor-pointer group"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={movie.coverUrl} 
          alt={movie.title}
          className="w-full h-[240px] md:h-[320px] object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = 'https://via.placeholder.com/220x320/1a1a1a/ffffff?text=Sem+Imagem';
          }}
        />
        
        {/* Overlay com botão play - sempre visível mas mais destacado no hover */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
          <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-black fill-current" />
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Informações do vídeo */}
      <div className="mt-2">
        <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1 group-hover:text-brand transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          {progress.position > 0 && (
            <>
              <span>{formatTime(progress.position)}</span>
              <span>•</span>
            </>
          )}
          <span>{movie.duration}</span>
        </div>
      </div>
    </div>
  );
};

interface ContinueWatchingProps {
  maxItems?: number;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ maxItems = 10 }) => {
  const { isAuthenticated } = useAuth();
  const [progresses, setProgresses] = React.useState<ProgressWithTitle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProgresses = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await progressAPI.getAll();
        setProgresses(data.slice(0, maxItems));
      } catch (err) {
        console.error('Erro ao buscar progressos:', err);
        setProgresses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProgresses();
  }, [isAuthenticated, maxItems]);

  // Não mostrar se não estiver autenticado ou não houver progressos
  if (!isAuthenticated || loading || progresses.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 pl-4 md:pl-12 relative z-10">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 hover:text-brand transition-colors cursor-pointer inline-block">
        Continuar Assistindo
      </h2>
      <div className="flex space-x-4 overflow-x-scroll no-scrollbar pb-8 snap-x">
        {progresses.map((progress) => (
          <ContinueWatchingCard key={progress.id} progress={progress} />
        ))}
      </div>
    </div>
  );
};

export default ContinueWatching;

