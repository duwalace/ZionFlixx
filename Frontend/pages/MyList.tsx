import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import { favoritesAPI, titleToMovie } from '../services/api';
import { Movie } from '../types';
import { useAuth } from '../contexts/AuthContext';

const MyList: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [myList, setMyList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Você precisa estar logado para ver sua lista.');
      setLoading(false);
      return;
    }

    const fetchMyList = async () => {
      try {
        setLoading(true);
        const titles = await favoritesAPI.getAll();
        const convertedMovies = titles.map(titleToMovie);
        setMyList(convertedMovies);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar lista:', err);
        setError(err.message || 'Erro ao carregar lista. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyList();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando lista...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 pt-24">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
            <Bookmark className="h-8 w-8 text-brand" />
            <h1 className="text-3xl font-bold">Minha Lista</h1>
        </div>
        
        {myList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {myList.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
            <Bookmark className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-xl">{!isAuthenticated ? 'Faça login para ver sua lista' : 'Sua lista está vazia'}</p>
            <p className="text-sm mt-2">
              {!isAuthenticated 
                ? 'Entre com sua conta para adicionar filmes e séries à sua lista.'
                : 'Adicione filmes e séries para assistir mais tarde.'}
            </p>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/auth')}
                className="mt-4 bg-brand hover:bg-brand-light text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Fazer Login
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;