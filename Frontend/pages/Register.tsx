import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleBirthDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, birthDate || undefined);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black relative">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-4 right-4 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Voltar para Home</span>
      </Link>

      {/* Left Side - Image/Artistic */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand/20 z-10 mix-blend-overlay"></div>
        <img 
          src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1300&q=80" 
          alt="Cinema Art" 
          className="w-full h-full object-cover animate-[pulse_10s_ease-in-out_infinite]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-20"></div>
        <div className="absolute bottom-20 left-12 z-30">
          <div className="flex items-center gap-3 mb-4">
            <Film className="h-10 w-10 text-brand" />
            <span className="text-3xl font-bold text-white tracking-wider">ZIONFLIX</span>
          </div>
          <p className="text-xl text-gray-200 max-w-md">
            Mergulhe em histórias infinitas. Onde o cinema encontra a tecnologia.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
            <Film className="h-8 w-8 text-brand" />
            <span className="text-xl font-bold text-white tracking-wider">ZIONFLIX</span>
        </div>

        <div className="w-full max-w-md bg-surface p-10 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            Criar Conta
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Comece sua jornada cinematográfica hoje
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-black/50 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Data de Nascimento
              </label>
              <input
                key="birthdate-input"
                type="date"
                value={birthDate}
                onChange={handleBirthDateChange}
                className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all [color-scheme:dark]"
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Usado para filtrar conteúdo adequado à sua idade
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-light text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(138,43,226,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Cadastrar'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            <p>
              Já tem uma conta?{' '}
              <Link to="/auth" className="text-brand font-bold hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

