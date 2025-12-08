import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Film, Eye, Heart, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { adminAPI, DashboardStats, UserWithStats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchData();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err.message || 'Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-400">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Erro ao carregar dashboard.'}</p>
          <button
            onClick={() => navigate('/admin')}
            className="bg-brand hover:bg-brand-light text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            Voltar para Admin
          </button>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = 'brand' }) => (
    <div className="bg-surface border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}`}>{value}</p>
        </div>
        <div className={`text-${color} opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white pb-20 pt-24">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand mb-2">Dashboard</h1>
          <p className="text-gray-400">Estatísticas e gestão da plataforma</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Usuários"
            value={stats.users.total}
            icon={<Users className="h-12 w-12" />}
            color="blue-400"
          />
          <StatCard
            title="Total de Conteúdo"
            value={stats.content.total}
            icon={<Film className="h-12 w-12" />}
            color="purple-400"
          />
          <StatCard
            title="Visualizações"
            value={stats.engagement.totalViews}
            icon={<Eye className="h-12 w-12" />}
            color="green-400"
          />
          <StatCard
            title="Favoritos"
            value={stats.engagement.totalFavorites}
            icon={<Heart className="h-12 w-12" />}
            color="red-400"
          />
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usuários */}
          <div className="bg-surface border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Clientes</span>
                <span className="text-xl font-bold">{stats.users.clients}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Administradores</span>
                <span className="text-xl font-bold">{stats.users.admins}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold text-brand">{stats.users.total}</span>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="bg-surface border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Film className="h-5 w-5" />
              Conteúdo
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Filmes</span>
                <span className="text-xl font-bold">{stats.content.movies}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Séries</span>
                <span className="text-xl font-bold">{stats.content.series}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold text-brand">{stats.content.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Engajamento */}
        <div className="bg-surface border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engajamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total de Visualizações</p>
              <p className="text-3xl font-bold text-green-400">{stats.engagement.totalViews}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Visualizadores Únicos</p>
              <p className="text-3xl font-bold text-blue-400">{stats.engagement.uniqueViewers}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total de Favoritos</p>
              <p className="text-3xl font-bold text-red-400">{stats.engagement.totalFavorites}</p>
            </div>
          </div>
        </div>

        {/* Classificação Etária */}
        {stats.ageRatings.length > 0 && (
          <div className="bg-surface border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Classificação Etária
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {stats.ageRatings.map((rating) => (
                <div key={rating.rating} className="text-center">
                  <p className="text-gray-400 text-sm mb-1">
                    {rating.rating === 'L' ? 'Livre' : `${rating.rating} anos`}
                  </p>
                  <p className="text-2xl font-bold">{rating.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Usuários */}
        <div className="bg-surface border border-white/10 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Usuários
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Favoritos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Visualizações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-black/30 transition-colors">
                    <td className="px-6 py-4 text-sm">{user.id}</td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user._count.favorites}</td>
                    <td className="px-6 py-4 text-sm">{user._count.progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

