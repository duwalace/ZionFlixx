import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import ContinueWatching from '../components/ContinueWatching';
import { titlesAPI, titleToMovie } from '../services/api';
import { Movie } from '../types';

interface MovieRowProps {
  title: string;
  movies: Movie[];
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies }) => {
  return (
    <div className="mb-12 pl-4 md:pl-12 relative z-10">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 hover:text-brand transition-colors cursor-pointer inline-block">
        {title}
      </h2>
      <div className="flex space-x-4 overflow-x-scroll no-scrollbar pb-8 snap-x">
        {movies.map((movie) => (
          <div key={movie.id} className="flex-none w-[160px] md:w-[220px] snap-start">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        setLoading(true);
        const titles = await titlesAPI.getAll();
        const convertedMovies = titles.map(titleToMovie);
        setMovies(convertedMovies);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar títulos:', err);
        setError('Erro ao carregar conteúdo. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    fetchTitles();
  }, []);

  // Selecting a random movie for the Hero section
  const featuredMovie = movies[0];

  // Helper to shuffle array
  const shuffle = (array: Movie[]) => [...array].sort(() => 0.5 - Math.random());

  // Filtrar apenas séries principais (sem seriesId) - não incluir episódios
  const series = movies.filter(m => m.type === 'series' && !m.seriesId);
  const movieList = movies.filter(m => m.type === 'movie');

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-gray-400 text-sm">Certifique-se de que o backend está rodando em http://localhost:3001</p>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Nenhum conteúdo disponível no momento.</p>
          <p className="text-gray-500 text-sm">Use a rota POST /api/dev/seed para adicionar conteúdo de exemplo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      {/* Hero Section */}
      {featuredMovie && (
      <div className="relative h-[85vh] w-full mb-8">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={featuredMovie.coverUrl} 
            alt={featuredMovie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-[20%] left-0 w-full pl-4 md:pl-12 pt-20">
          <h1 className="text-4xl md:text-7xl font-bold mb-4 drop-shadow-xl max-w-2xl">
            {featuredMovie.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl line-clamp-3 drop-shadow-md">
            {featuredMovie.description}
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/watch/${featuredMovie.id}`)}
              className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded font-bold hover:bg-brand hover:text-white transition-all duration-300"
            >
              <Play className="h-5 w-5 fill-current" />
              Assistir
            </button>
            <button 
              onClick={() => navigate(`/details/${featuredMovie.id}`)}
              className="flex items-center gap-2 bg-gray-500/50 backdrop-blur-sm text-white px-6 md:px-8 py-2 md:py-3 rounded font-bold hover:bg-gray-500/70 transition-colors border border-white/20"
            >
              <Info className="h-5 w-5" />
              Mais Informações
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Movie Rows */}
      <div className={`relative ${featuredMovie ? '-mt-32' : 'mt-20'} z-20 pb-10`}>
        <ContinueWatching />
        {series.length > 0 && <MovieRow title="Novos Episódios" movies={shuffle(series)} />}
        {series.length > 0 && <MovieRow title="Novas Séries" movies={series} />}
        {movieList.length > 0 && <MovieRow title="Filmes Adicionados Recentemente" movies={movieList} />}
        {series.length > 0 && <MovieRow title="Top 10 Séries" movies={series.slice(0, 10)} />}
        {movieList.length > 0 && <MovieRow title="Top 10 Filmes" movies={movieList.slice(0, 10)} />}
      </div>

      <Footer />
    </div>
  );
};

export default Home;