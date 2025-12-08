import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Search, Bell, User, LogOut, Settings, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-white font-bold' : 'text-gray-300 hover:text-white';
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-sm shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Film className="h-8 w-8 text-brand" />
            <span className="text-xl font-bold tracking-wider text-white">ZIONFLIX</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className={`${isActive('/')} transition-colors px-3 py-2 rounded-md text-sm font-medium`}>Início</Link>
              <Link to="/series" className={`${isActive('/series')} transition-colors px-3 py-2 rounded-md text-sm font-medium`}>Séries</Link>
              <Link to="/movies" className={`${isActive('/movies')} transition-colors px-3 py-2 rounded-md text-sm font-medium`}>Filmes</Link>
              {isAuthenticated && (
                <Link to="/mylist" className={`${isActive('/mylist')} transition-colors px-3 py-2 rounded-md text-sm font-medium`}>Minha Lista</Link>
              )}
              {isAdmin && (
                <Link to="/admin" className={`${isActive('/admin')} transition-colors px-3 py-2 rounded-md text-sm font-medium text-brand`}>Admin</Link>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/search')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            {isAuthenticated && (
              <button 
                onClick={() => navigate('/mylist')}
                className="text-gray-300 hover:text-white transition-colors"
                title="Minha Lista"
              >
                <Bookmark className="h-5 w-5" />
              </button>
            )}
            {isAuthenticated ? (
              <div className="group relative">
                <button className="flex items-center gap-2 py-2">
                  <div className="h-8 w-8 rounded bg-brand flex items-center justify-center border border-transparent group-hover:border-white transition-colors">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 mt-0 w-48 bg-surface border border-gray-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-xs text-gray-400">Logado como</p>
                    <p className="text-sm text-white truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white border-b border-gray-800"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Gerenciar Perfil
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sair da conta
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg font-medium transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;