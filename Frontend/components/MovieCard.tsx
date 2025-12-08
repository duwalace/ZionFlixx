import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, className = '' }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/details/${movie.id}`)}
      className={`relative rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:z-20 cursor-pointer shadow-lg group bg-zinc-900 aspect-[2/3] ${className}`}
    >
      <img 
        src={movie.thumbnailUrl} 
        alt={movie.title}
        className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
      />
      
      {/* Hover Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/40 to-transparent">
        <h3 className="text-sm font-bold text-white mb-1 truncate">{movie.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>{movie.year}</span>
          <span className="border border-gray-500 px-1 rounded text-[10px]">
            {movie.rating === 'L' ? 'Livre' : `${movie.rating} anos`}
          </span>
        </div>
        <div className="mt-2 flex gap-2">
           <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-brand transition-colors shadow-lg">
             <Play className="h-4 w-4 text-black fill-current" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;