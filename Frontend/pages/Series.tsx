import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import { titlesAPI, titleToMovie } from '../services/api';
import { Movie } from '../types';
import { Filter } from 'lucide-react';

const Series: React.FC = () => {
  const [series, setSeries] = useState<Movie[]>([]);
  const [allSeries, setAllSeries] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const titles = await titlesAPI.getAll();
        const convertedMovies = titles.map(titleToMovie);
        // Filtrar apenas séries principais (sem seriesId) - não incluir episódios
        const seriesList = convertedMovies.filter(m => m.type === 'series' && !m.seriesId);
        setAllSeries(seriesList);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar séries:', err);
        setError('Erro ao carregar séries. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  useEffect(() => {
    if (ageFilter === 'all') {
      setSeries(allSeries);
    } else {
      setSeries(allSeries.filter(s => s.rating === ageFilter));
    }
  }, [ageFilter, allSeries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando séries...</p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-brand">Séries de TV</h1>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            >
              <option value="all">Todas as classificações</option>
              <option value="L">Livre</option>
              <option value="10">10 anos</option>
              <option value="12">12 anos</option>
              <option value="14">14 anos</option>
              <option value="16">16 anos</option>
              <option value="18">18 anos</option>
            </select>
          </div>
        </div>
        {series.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            {ageFilter === 'all' 
              ? 'Nenhuma série encontrada no momento.'
              : `Nenhuma série encontrada com classificação ${ageFilter === 'L' ? 'Livre' : ageFilter + ' anos'}.`}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {series.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Series;