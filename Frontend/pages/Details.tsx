import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ThumbsUp, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { titlesAPI, titleToMovie, favoritesAPI } from '../services/api';
import { Movie } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [episodes, setEpisodes] = useState<Movie[]>([]);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, Movie[]>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchMovie = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const title = await titlesAPI.getById(Number(id));
        const convertedMovie = titleToMovie(title);
        setMovie(convertedMovie);
        
        // Buscar títulos relacionados e episódios
        const allTitles = await titlesAPI.getAll();
        
        // Se for uma série principal (type === 'series' && !seriesId), buscar episódios
        if (title.type === 'series' && !title.seriesId) {
          const seriesEpisodes = allTitles
            .filter(t => t.seriesId === title.id)
            .map(titleToMovie)
            .sort((a, b) => {
              // Ordenar por temporada e depois por episódio
              const seasonA = a.season || 0;
              const seasonB = b.season || 0;
              if (seasonA !== seasonB) return seasonA - seasonB;
              return (a.episode || 0) - (b.episode || 0);
            });
          
          setEpisodes(seriesEpisodes);
          
          // Organizar episódios por temporada
          const bySeason: Record<number, Movie[]> = {};
          seriesEpisodes.forEach(ep => {
            const season = ep.season || 1;
            if (!bySeason[season]) {
              bySeason[season] = [];
            }
            bySeason[season].push(ep);
          });
          setEpisodesBySeason(bySeason);
        } else {
          setEpisodes([]);
          setEpisodesBySeason({});
        }
        
        // Filtrar títulos relacionados (excluir episódios e o próprio título)
        const related = allTitles
          .filter(t => {
            // Excluir o próprio título
            if (t.id === title.id) return false;
            // Excluir episódios (títulos com seriesId)
            if (t.seriesId !== null && t.seriesId !== undefined) return false;
            // Se for uma série, excluir episódios dessa série também
            if (title.type === 'series' && !title.seriesId && t.seriesId === title.id) return false;
            return true;
          })
          .slice(0, 6)
          .map(titleToMovie);
        setRelatedMovies(related);
        
        // Verificar se está nos favoritos
        if (isAuthenticated) {
          try {
            const isFav = await favoritesAPI.isFavorite(Number(id));
            setIsFavorite(isFav);
          } catch (err) {
            console.error('Erro ao verificar favorito:', err);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar filme:', err);
        setError('Filme não encontrado.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        await favoritesAPI.remove(Number(id));
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(Number(id));
        setIsFavorite(true);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar favorito:', err);
      setError(err.message || 'Erro ao atualizar lista');
    } finally {
      setLoadingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
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
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      {/* Hero Backdrop */}
      <div className="relative h-[70vh] w-full">
        <img 
          src={movie.coverUrl} 
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-20 left-4 md:left-12 p-2 bg-black/50 rounded-full hover:bg-brand transition-colors z-20"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster - visible on desktop */}
          <div className="hidden md:block w-64 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border border-gray-800">
            <img src={movie.thumbnailUrl || movie.coverUrl} alt={movie.title} className="w-full h-auto" />
          </div>

          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{movie.title}</h1>
            
            <div className="flex items-center flex-wrap gap-4 text-sm text-gray-300 mb-6">
              <span className="text-brand font-bold">{movie.rating} % Relevância</span>
              <span>{movie.year}</span>
              <span className="border border-gray-600 px-2 py-0.5 rounded text-xs">{movie.rating}</span>
              <span>{movie.duration}</span>
              <span>{movie.genre}</span>
            </div>

            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => navigate(`/watch/${movie.id}`)}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-brand hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                <Play className="h-5 w-5 fill-current" />
                Assistir
              </button>
              <button 
                onClick={handleToggleFavorite}
                disabled={loadingFavorite}
                className={`p-3 border rounded-full transition-colors ${
                  isFavorite 
                    ? 'border-brand bg-brand/20 hover:bg-brand/30' 
                    : 'border-gray-500 hover:border-white hover:bg-white/10'
                } disabled:opacity-50`}
                title={isFavorite ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
              >
                {isFavorite ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
              <button className="p-3 border border-gray-500 rounded-full hover:border-white hover:bg-white/10 transition-colors">
                <ThumbsUp className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-2 text-brand">Sinopse</h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {movie.description}
                </p>
              </div>
              
              <div className="text-sm">
                {movie.cast && movie.cast.length > 0 && (
                  <div className="mb-4">
                    <span className="text-gray-500 block mb-1">Elenco:</span>
                    <p className="text-gray-200">{movie.cast.join(', ')}</p>
                  </div>
                )}
                <div className="mb-4">
                  <span className="text-gray-500 block mb-1">Gêneros:</span>
                  <p className="text-gray-200">{movie.genre || 'Não especificado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Episódios da Série */}
        {movie.type === 'series' && !movie.seriesId && episodes.length > 0 && (
          <div className="mt-20 border-t border-gray-800 pt-10">
            <h3 className="text-2xl font-bold mb-6">Episódios</h3>
            {Object.keys(episodesBySeason)
              .sort((a, b) => Number(a) - Number(b))
              .map(seasonNum => {
                const season = Number(seasonNum);
                const seasonEpisodes = episodesBySeason[season];
                return (
                  <div key={season} className="mb-8">
                    <h4 className="text-xl font-semibold mb-4 text-gray-300">
                      Temporada {season}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {seasonEpisodes.map((ep) => (
                        <div 
                          key={ep.id} 
                          onClick={() => navigate(`/watch/${ep.id}`)}
                          className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 group"
                        >
                          <div className="relative">
                            <img 
                              src={ep.thumbnailUrl || ep.coverUrl} 
                              alt={ep.title} 
                              className="w-full aspect-video object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="h-12 w-12 text-white fill-white" />
                            </div>
                            {ep.episode && (
                              <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold">
                                Ep. {ep.episode}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-semibold truncate mb-1">{ep.title}</h4>
                            <p className="text-xs text-gray-400 truncate">{ep.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        
        {/* Related */}
        {relatedMovies.length > 0 && (
        <div className="mt-20 border-t border-gray-800 pt-10">
           <h3 className="text-2xl font-bold mb-6">Títulos Semelhantes</h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMovies.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => navigate(`/details/${m.id}`)}
                  className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                >
                   <img src={m.thumbnailUrl || m.coverUrl} alt={m.title} className="w-full aspect-[2/3] object-cover" />
                   <div className="p-3">
                     <h4 className="text-sm font-semibold truncate">{m.title}</h4>
                   </div>
                </div>
              ))}
           </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Details;