import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import MovieCard from '../components/MovieCard';
import { titlesAPI, titleToMovie } from '../services/api';
import { Movie } from '../types';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const titles = await titlesAPI.getAll();
        const convertedMovies = titles.map(titleToMovie);
        setAllMovies(convertedMovies);
      } catch (err) {
        console.error('Erro ao buscar títulos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = allMovies.filter(
      (m) => 
        m.title.toLowerCase().includes(query.toLowerCase()) || 
        m.description.toLowerCase().includes(query.toLowerCase()) ||
        m.genre.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query, allMovies]);

  return (
    <div className="min-h-screen bg-background text-white pb-20 pt-24">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Input */}
        <div className="relative mb-12 max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Títulos, gente e gêneros"
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-lg rounded-full py-4 pl-14 pr-12 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            autoFocus
          />
          {query && (
            <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
                <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando...</p>
          </div>
        )}

        {!loading && query && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-300">
              {results.length > 0 ? `Resultados para "${query}"` : `Nenhum resultado para "${query}"`}
            </h2>
            
            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {results.map((item) => (
                  <MovieCard key={item.id} movie={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Default View / Suggestions when empty */}
        {!query && (
            <div className="text-center pt-10">
                <h3 className="text-2xl font-bold mb-4">Explore os gêneros</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {['Ação', 'Comédia', 'Drama', 'Ficção Científica', 'Suspense', 'Fantasia'].map(genre => (
                        <button 
                            key={genre}
                            onClick={() => setQuery(genre)}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition-colors border border-zinc-700"
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Search;