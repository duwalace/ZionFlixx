import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, Check, Trash2, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('Usuário ZionFlix');
  const [language, setLanguage] = useState('pt-BR');
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [autoplayPreview, setAutoplayPreview] = useState(true);
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBirthDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
  }, []);

  useEffect(() => {
    // Carregar dados do usuário
    const loadUserData = async () => {
      try {
        const { user: currentUser } = await authAPI.getMe();
        if (currentUser) {
          setName(currentUser.email.split('@')[0] || 'Usuário ZionFlix');
          if (currentUser.birthDate) {
            setBirthDate(currentUser.birthDate);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
      }
    };
    loadUserData();
  }, []);

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeRating = (age: number | null): string => {
    if (age === null) return 'Não definida';
    if (age >= 18) return '18 anos';
    if (age >= 16) return '16 anos';
    if (age >= 14) return '14 anos';
    if (age >= 12) return '12 anos';
    if (age >= 10) return '10 anos';
    return 'Livre';
  };

  const userAge = calculateAge(birthDate);
  const ageRating = getAgeRating(userAge);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await authAPI.updateProfile(birthDate || undefined);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white fade-in">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
        <h1 className="text-4xl md:text-5xl font-medium mb-8 border-b border-zinc-800 pb-4">
          Editar Perfil
        </h1>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Avatar Section */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-4">
            <div className="relative group cursor-pointer w-32 h-32 md:w-40 md:h-40">
              <div className="w-full h-full bg-gradient-to-br from-brand to-brand-dark rounded-md flex items-center justify-center overflow-hidden shadow-2xl relative">
                <User className="h-20 w-20 text-white" />
                
                {/* Overlay Edit Icon */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-md border-2 border-transparent group-hover:border-gray-400">
                  <div className="bg-black/80 rounded-full p-2 border border-white">
                     <span className="text-xs font-bold px-1">EDITAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="flex-1 space-y-6">
            
            {/* Name Input */}
            <div className="bg-zinc-600/30 p-4 rounded border border-transparent focus-within:border-brand transition-colors">
              <label className="block text-gray-400 text-sm mb-1">Nome</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-white text-lg focus:outline-none"
              />
            </div>

            {/* Language Dropdown */}
            <div>
              <h3 className="text-lg text-gray-300 mb-2">Idioma</h3>
              <div className="relative inline-block w-full md:w-auto">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none w-full md:w-64 bg-black border border-gray-600 text-white py-2 px-4 pr-8 rounded focus:outline-none focus:border-brand hover:bg-zinc-900 cursor-pointer"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English</option>
                  <option value="es-ES">Español</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 pointer-events-none text-white" />
              </div>
            </div>

            {/* Maturity Settings */}
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-lg text-gray-300 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configurações de Classificação Etária
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Data de Nascimento</label>
                  <input
                    key="birthdate-input-profile"
                    type="date"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand [color-scheme:dark]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sua data de nascimento é usada para filtrar conteúdo adequado à sua idade
                  </p>
                </div>

                {birthDate && userAge !== null && (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Idade:</span>
                      <span className="text-white font-bold">{userAge} anos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Classificação Etária:</span>
                      <span className="bg-brand/20 text-brand px-3 py-1 rounded text-sm font-bold">
                        {ageRating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Você pode assistir conteúdo classificado como: {ageRating === '18 anos' ? '18 anos' : ageRating === '16 anos' ? '16 anos ou menos' : ageRating === '14 anos' ? '14 anos ou menos' : ageRating === '12 anos' ? '12 anos ou menos' : ageRating === '10 anos' ? '10 anos ou menos' : 'Livre'}
                    </p>
                  </div>
                )}

                {!birthDate && (
                  <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Nenhuma data de nascimento cadastrada. Defina sua data de nascimento para filtrar conteúdo adequado à sua idade.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Autoplay Controls */}
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-lg text-gray-300 mb-4">Controles de reprodução automática</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 border flex items-center justify-center transition-colors ${autoplayNext ? 'bg-brand border-brand' : 'border-gray-500 bg-black'}`}>
                    {autoplayNext && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={autoplayNext} 
                    onChange={() => setAutoplayNext(!autoplayNext)} 
                  />
                  <span className="text-gray-300 group-hover:text-white transition-colors">Iniciar automaticamente o próximo episódio de uma série em todos os aparelhos.</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 border flex items-center justify-center transition-colors ${autoplayPreview ? 'bg-brand border-brand' : 'border-gray-500 bg-black'}`}>
                    {autoplayPreview && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={autoplayPreview} 
                    onChange={() => setAutoplayPreview(!autoplayPreview)} 
                  />
                  <span className="text-gray-300 group-hover:text-white transition-colors">Reproduzir automaticamente as prévias ao navegar em todos os aparelhos.</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
            Perfil atualizado com sucesso!
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-wrap gap-4 items-center">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-white text-black text-lg font-bold px-8 py-2 hover:bg-brand hover:text-white transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(138,43,226,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button 
            onClick={handleCancel}
            disabled={loading}
            className="border border-gray-500 text-gray-400 text-lg font-medium px-8 py-2 hover:border-white hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <div className="flex-1"></div>
          
          <button className="flex items-center gap-2 border border-gray-500 text-gray-400 px-6 py-2 hover:border-red-600 hover:text-red-600 transition-colors ml-auto">
            <Trash2 className="h-4 w-4" />
            Excluir Perfil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
