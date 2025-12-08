import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowLeft, Save, X, Shield, BarChart3 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { titlesAPI, titleToMovie, uploadAPI, getMediaUrl } from '../services/api';
import { Movie } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [titles, setTitles] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverUrl: '',
    hlsPath: '',
    duration: '',
    ageRating: 'L',
    type: 'movie',
    genre: 'Drama',
    seriesId: '',
    season: '',
    episode: '',
  });
  const [availableSeries, setAvailableSeries] = useState<any[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchTitles();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchTitles = async () => {
    try {
      setLoading(true);
      const titlesData = await titlesAPI.getAll();
      const convertedMovies = titlesData.map(titleToMovie);
      setTitles(convertedMovies);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar títulos:', err);
      setError(err.message || 'Erro ao carregar títulos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    try {
      const durationMinutes = parseInt(formData.duration);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        setError('Duração deve ser um número positivo (em minutos)');
        setUploading(false);
        return;
      }

      let coverUrl = formData.coverUrl;
      let hlsPath = formData.hlsPath || '';

      // Fazer upload dos arquivos se foram selecionados
      if (!editingId) {
        // Apenas fazer upload ao criar novo título
        // Se for episódio de série, não precisa fazer upload de capa (será herdada da série)
        if (coverFile && !(formData.type === 'series' && formData.seriesId)) {
          const coverUpload = await uploadAPI.uploadCover(coverFile);
          coverUrl = coverUpload.path;
        }
        // Se for episódio, deixar coverUrl vazio (backend vai usar da série)
        if (formData.type === 'series' && formData.seriesId) {
          coverUrl = '';
        }

        if (videoFile) {
          try {
            const videoUpload = await uploadAPI.uploadVideo(videoFile);
            hlsPath = videoUpload.path;
            
            // Se não for arquivo HLS, avisar o usuário mas continuar criando o título
            if (videoUpload.message && !videoFile.name.endsWith('.m3u8')) {
              // Avisar mas não bloquear a criação - o título será criado com o path do arquivo enviado
              // O usuário precisará converter para HLS depois e atualizar o caminho
              console.warn(`Aviso: ${videoUpload.message}`);
            }
          } catch (uploadError: any) {
            // Se houver erro no upload, ainda permite criar o título sem vídeo
            console.error('Erro no upload do vídeo:', uploadError);
            setError(`Aviso: Erro ao fazer upload do vídeo. O título será criado sem vídeo. Você pode adicionar o caminho HLS depois. Erro: ${uploadError.message}`);
            // Continua criando o título mesmo sem vídeo
          }
        }
      }

      if (editingId) {
        // Atualizar
        await titlesAPI.update(editingId, {
          name: formData.name,
          description: formData.description,
          coverUrl: coverUrl,
          hlsPath: hlsPath,
          duration: durationMinutes, // Enviar em minutos, backend converte para segundos
          ageRating: formData.ageRating,
          type: formData.type,
          genre: formData.genre,
        });
      } else {
        // Criar
        const createData: any = {
          name: formData.name,
          description: formData.description,
          coverUrl: coverUrl,
          hlsPath: hlsPath,
          duration: durationMinutes, // Enviar em minutos, backend converte para segundos
          ageRating: formData.ageRating,
          type: formData.type,
          genre: formData.genre,
        };

        // Se for episódio de série, adicionar dados da série
        // IMPORTANTE: Quando seriesId está presente, é um episódio (não uma nova série)
        if (formData.type === 'series' && formData.seriesId && formData.seriesId !== '') {
          createData.seriesId = parseInt(formData.seriesId);
          if (formData.season && formData.season !== '') {
            createData.season = parseInt(formData.season);
          }
          if (formData.episode && formData.episode !== '') {
            createData.episode = parseInt(formData.episode);
          }
          // Garantir que o tipo seja "series" para episódios
          createData.type = 'series';
          console.log('Criando episódio com dados:', createData);
        } else {
          console.log('Criando nova série/filme com dados:', createData);
        }

        await titlesAPI.create(createData);
      }

      resetForm();
      fetchTitles();
    } catch (err: any) {
      console.error('Erro ao salvar título:', err);
      const errorMessage = err.message || err.error || 'Erro ao salvar título.';
      setError(errorMessage);
      // Se houver detalhes no erro, mostrar também
      if (err.details) {
        console.error('Detalhes do erro:', err.details);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingId(Number(movie.id));
    // Converter duração de segundos (banco) para minutos (formulário)
    const durationMatch = movie.duration.match(/(\d+)h\s*(\d+)m|(\d+)m/);
    let durationMinutes = 0;
    if (durationMatch) {
      if (durationMatch[1]) {
        // Tem horas e minutos
        durationMinutes = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2] || '0');
      } else {
        // Só tem minutos
        durationMinutes = parseInt(durationMatch[3] || '0');
      }
    }
    
    setFormData({
      name: movie.title,
      description: movie.description,
      coverUrl: movie.coverUrl,
      hlsPath: movie.videoUrl.replace('http://localhost:3001', ''),
      duration: String(durationMinutes),
      ageRating: (movie as any).ageRating || 'L',
      type: movie.type || 'movie',
      genre: (movie as any).genre || 'Drama',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este título?')) {
      return;
    }

    try {
      await titlesAPI.delete(id);
      fetchTitles();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar título.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      coverUrl: '',
      hlsPath: '',
      duration: '',
      ageRating: 'L',
      type: 'movie',
      genre: 'Drama',
      seriesId: '',
      season: '',
      episode: '',
    });
    setCoverFile(null);
    setVideoFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const fetchSeries = async () => {
    try {
      const seriesData = await titlesAPI.getSeries();
      setAvailableSeries(seriesData);
    } catch (err: any) {
      console.error('Erro ao buscar séries:', err);
    }
  };

  useEffect(() => {
    if (formData.type === 'series' && !editingId) {
      fetchSeries();
    }
  }, [formData.type, editingId]);

  // Quando selecionar uma série, buscar seus dados e limpar arquivo de capa
  useEffect(() => {
    const loadSeriesData = async () => {
      if (formData.seriesId && formData.type === 'series' && !editingId) {
        try {
          const series = await titlesAPI.getById(parseInt(formData.seriesId));
          // Preencher automaticamente gênero da série (capa será herdada automaticamente pelo backend)
          setFormData(prev => ({
            ...prev,
            genre: series.genre || prev.genre
          }));
          // Limpar arquivo de capa selecionado, pois episódios herdam a capa da série
          setCoverFile(null);
        } catch (err) {
          console.error('Erro ao carregar dados da série:', err);
        }
      }
    };
    loadSeriesData();
  }, [formData.seriesId, formData.type, editingId]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-white pb-20 pt-24 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-400">Você não tem permissão para acessar esta página.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-brand hover:bg-brand-light text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background text-white pb-20 pt-24">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand">Painel Administrativo</h1>
            <p className="text-gray-400 mt-2">Gerencie o conteúdo da plataforma</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              <Plus className="h-5 w-5" />
              Adicionar Título
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-surface border border-white/10 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Título' : 'Novo Título'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {formData.type === 'series' && formData.seriesId ? 'Nome do Episódio *' : 'Nome do Título *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                  placeholder={formData.type === 'series' && formData.seriesId ? "Ex: Episódio 1 - O Início" : "Ex: O Poderoso Chefão"}
                />
                {formData.type === 'series' && formData.seriesId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Digite apenas o nome do episódio. O nome da série será adicionado automaticamente.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                  placeholder="Sinopse do filme ou série..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!(formData.type === 'series' && formData.seriesId) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {editingId ? 'URL da Capa' : 'Imagem de Capa *'}
                    </label>
                    {editingId ? (
                      <input
                        type="text"
                        value={formData.coverUrl}
                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                        className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                        placeholder="/media/capas/filme.jpg"
                      />
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCoverFile(file);
                              // Preview opcional
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                // Pode usar para preview se necessário
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          required={!editingId}
                          className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-light file:cursor-pointer"
                        />
                        {coverFile && (
                          <p className="text-xs text-gray-500 mt-1">
                            Arquivo selecionado: {coverFile.name}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {editingId ? 'Caminho HLS' : 'Arquivo HLS (master.m3u8) *'}
                  </label>
                  {editingId ? (
                    <input
                      type="text"
                      value={formData.hlsPath}
                      onChange={(e) => setFormData({ ...formData, hlsPath: e.target.value })}
                      className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                      placeholder="/media/movies/filme/master.m3u8"
                    />
                  ) : (
                    <>
                      <input
                        type="file"
                        accept=".m3u8,.mkv,.mp4,.avi,.mov,.webm,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setVideoFile(file);
                          }
                        }}
                        required={!editingId}
                        className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-light file:cursor-pointer"
                      />
                      {videoFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          Arquivo selecionado: {videoFile.name}
                          {!videoFile.name.endsWith('.m3u8') && (
                            <span className="text-yellow-400 block mt-1">
                              ⚠️ Arquivo não é HLS (.m3u8). Após o upload, você precisará converter para HLS usando o script converter-hls.ps1 antes de poder assistir.
                            </span>
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({ 
                        ...formData, 
                        type: newType,
                        seriesId: newType === 'movie' ? '' : formData.seriesId,
                        season: newType === 'movie' ? '' : formData.season,
                        episode: newType === 'movie' ? '' : formData.episode
                      });
                    }}
                    required
                    className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                  >
                    <option value="movie">Filme</option>
                    <option value="series">Série</option>
                  </select>
                </div>

                {formData.type === 'series' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Adicionar à Série Existente
                    </label>
                    <select
                      value={formData.seriesId}
                      onChange={(e) => {
                        const newSeriesId = e.target.value;
                        setFormData({ 
                          ...formData, 
                          seriesId: newSeriesId,
                          // Limpar campos de episódio se desmarcar série
                          season: newSeriesId ? formData.season : '',
                          episode: newSeriesId ? formData.episode : ''
                        });
                      }}
                      className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                    >
                      <option value="">Nova Série (Criar série principal)</option>
                      {availableSeries.map((series) => (
                        <option key={series.id} value={series.id}>
                          {series.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione uma série existente para adicionar este como episódio.
                    </p>
                  </div>
                )}

                {formData.type === 'series' && formData.seriesId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Temporada
                      </label>
                      <input
                        type="number"
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        min="1"
                        className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Episódio
                      </label>
                      <input
                        type="number"
                        value={formData.episode}
                        onChange={(e) => setFormData({ ...formData, episode: e.target.value })}
                        min="1"
                        className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                        placeholder="1"
                      />
                    </div>
                  </>
                )}

                {!(formData.type === 'series' && formData.seriesId) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Gênero *
                    </label>
                    <select
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      required={!(formData.type === 'series' && formData.seriesId)}
                      className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                    >
                      <option value="Ação">Ação</option>
                      <option value="Aventura">Aventura</option>
                      <option value="Comédia">Comédia</option>
                      <option value="Drama">Drama</option>
                      <option value="Ficção Científica">Ficção Científica</option>
                      <option value="Terror">Terror</option>
                      <option value="Romance">Romance</option>
                      <option value="Suspense">Suspense</option>
                      <option value="Thriller">Thriller</option>
                      <option value="Animação">Animação</option>
                      <option value="Documentário">Documentário</option>
                      <option value="Fantasia">Fantasia</option>
                      <option value="Guerra">Guerra</option>
                      <option value="Mistério">Mistério</option>
                      <option value="Musical">Musical</option>
                      <option value="Western">Western</option>
                    </select>
                  </div>
                )}
                {formData.type === 'series' && formData.seriesId && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      ℹ️ O gênero será herdado automaticamente da série selecionada.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Classificação Etária *
                  </label>
                  <select
                    value={formData.ageRating}
                    onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                    required
                    className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                  >
                    <option value="L">Livre</option>
                    <option value="10">10 anos</option>
                    <option value="12">12 anos</option>
                    <option value="14">14 anos</option>
                    <option value="16">16 anos</option>
                    <option value="18">18 anos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Duração (em minutos) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                    min="1"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
                    placeholder="90 (minutos)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplo: 90 minutos
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  {uploading ? 'Enviando...' : editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-surface border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Capa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {titles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Nenhum título cadastrado. Clique em "Adicionar Título" para começar.
                    </td>
                  </tr>
                ) : (
                  titles.map((title) => (
                    <tr key={title.id} className="hover:bg-black/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="relative w-16 h-24">
                          {title.coverUrl ? (
                            <>
                              <img
                                src={getMediaUrl(title.coverUrl)}
                                alt={title.title}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const placeholder = img.nextElementSibling as HTMLElement;
                                  if (placeholder) {
                                    placeholder.classList.remove('hidden');
                                    placeholder.classList.add('flex');
                                  }
                                }}
                              />
                              <div 
                                className="absolute inset-0 bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs text-center p-2 hidden"
                              >
                                Sem Imagem
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs text-center p-2">
                              Sem Imagem
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{title.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 max-w-md truncate">
                          {title.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {title.duration}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(title)}
                            className="p-2 text-blue-400 hover:bg-blue-400/20 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(Number(title.id))}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

