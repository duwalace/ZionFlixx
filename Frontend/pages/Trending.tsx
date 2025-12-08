import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import { titlesAPI, titleToMovie } from '../services/api';
import { Movie } from '../types';

const Trending: React.FC = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const titles = await titlesAPI.getAll();
        const convertedMovies = titles.map(titleToMovie);
        // Simulating trending by shuffling
        const shuffled = [...convertedMovies].sort(() => 0.5 - Math.random());
        setTrending(shuffled);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar títulos em alta:', err);
        setError('Erro ao carregar conteúdo. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
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
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-brand to-pink-500">
          Bombando Agora
        </h1>
        {trending.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            Nenhum conteúdo em alta no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trending.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;