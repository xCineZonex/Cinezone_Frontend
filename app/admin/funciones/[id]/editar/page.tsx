'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import GrillaProgramacion from '@/components/admin/GrillaProgramacion';

export default function EditarFuncionPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [peliculas, setPeliculas] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    movieId: '',
    cinemaId: '',
    auditoriumId: '',
    fechaHora: '',
    idioma: 'ESPANOL',
    formatoProyeccion: 'FORMAT_2D'
  });

  useEffect(() => {
    if (params.id) {
      fetchInitialDataAndFuncion();
    }
  }, [params.id]);

  const [originalData, setOriginalData] = useState({
    movieId: '',
    auditoriumId: '',
    fechaHora: ''
  });

  const fetchInitialDataAndFuncion = async () => {
    try {
      const [movRes, sedesRes, funcionesRes] = await Promise.all([
        api.get('/admin/catalogo/peliculas'),
        api.get('/public/sedes'),
        api.get('/admin/catalogo/funciones')
      ]);
      
      setPeliculas(movRes.data);
      setSedes(sedesRes.data);

      const funcion = funcionesRes.data.find((f: any) => f.id === parseInt(params.id as string));
      if (funcion) {
        const initialDateStr = funcion.fechaHora ? funcion.fechaHora.substring(0, 16) : '';
        setFormData({
          movieId: funcion.movie?.id?.toString() || '',
          cinemaId: funcion.cinema?.id?.toString() || '',
          auditoriumId: funcion.auditorium?.id?.toString() || '',
          fechaHora: initialDateStr,
          idioma: funcion.idioma || 'ESPANOL',
          formatoProyeccion: funcion.formatoProyeccion || 'FORMAT_2D'
        });
        setOriginalData({
          movieId: funcion.movie?.id?.toString() || '',
          auditoriumId: funcion.auditorium?.id?.toString() || '',
          fechaHora: initialDateStr
        });

        // Fetch salas for the existing cinema
        if (funcion.cinema?.id) {
          const salasRes = await api.get(`/admin/catalogo/sedes/${funcion.cinema.id}/salas`);
          setSalas(salasRes.data);
        }
      } else {
        toast.error('Función no encontrada');
        router.push('/admin/funciones');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar la función');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    // Only fetch salas when cinemaId changes AFTER initial load
    if (fetching) return;

    const fetchSalas = async () => {
      if (!formData.cinemaId) {
        setSalas([]);
        return;
      }
      try {
        const response = await api.get(`/admin/catalogo/sedes/${formData.cinemaId}/salas`);
        setSalas(response.data);
      } catch (error) {
        console.error('Error fetching salas:', error);
      }
    };
    fetchSalas();
  }, [formData.cinemaId, fetching]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCinemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e);
    setFormData(prev => ({ ...prev, auditoriumId: '' })); // Reset sala when cinema changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/admin/catalogo/funciones/${params.id}`, {
        ...formData,
        movieId: parseInt(formData.movieId),
        cinemaId: parseInt(formData.cinemaId),
        auditoriumId: parseInt(formData.auditoriumId)
      });
      toast.success('Función actualizada exitosamente');
      router.push('/admin/funciones');
    } catch (error: any) {
      console.error('Error updating funcion:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar la función');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center animate-pulse">Cargando...</div>;

  const selectedDate = formData.fechaHora ? formData.fechaHora.split('T')[0] : new Date().toISOString().split('T')[0];

  const availableMovies = peliculas.filter(p => {
    if (p.estado === 'RETIRADA') return false;
    if (!formData.fechaHora) return true;
    const selectedDateStr = formData.fechaHora.split('T')[0];
    if (p.fechaFinCartelera && p.fechaFinCartelera < selectedDateStr) return false;
    return true;
  });

  const isUnchanged = formData.movieId === originalData.movieId && 
                      formData.auditoriumId === originalData.auditoriumId && 
                      formData.fechaHora === originalData.fechaHora;

  const selectedMovie = peliculas.find(p => p.id.toString() === formData.movieId);
  const previewFunction = (!isUnchanged && formData.auditoriumId && formData.fechaHora && selectedMovie) ? {
    auditoriumId: formData.auditoriumId,
    fechaHora: formData.fechaHora,
    durationMinutes: selectedMovie.duracionMinutos,
    title: selectedMovie.titulo
  } : null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/funciones" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">Editar Función</h1>
          <p className="text-muted-foreground">Actualiza el horario o sala de esta proyección</p>
        </div>
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Película *</label>
              <select
                name="movieId"
                required
                value={formData.movieId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="">Selecciona...</option>
                {availableMovies.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.titulo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Sede (Cine) *</label>
              <select
                name="cinemaId"
                required
                value={formData.cinemaId}
                onChange={handleCinemaChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="">Selecciona una sede...</option>
                {sedes.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Sala *</label>
              <select
                name="auditoriumId"
                required
                disabled={!formData.cinemaId}
                value={formData.auditoriumId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
              >
                <option value="">Selecciona una sala...</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} (Cap: {s.capacidadTotal})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Fecha y Hora de Inicio *</label>
              <input
                type="datetime-local"
                name="fechaHora"
                required
                value={formData.fechaHora}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:[color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Idioma (Audio) *</label>
              <select
                name="idioma"
                required
                value={formData.idioma}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="ESPANOL">Español (Doblada)</option>
                <option value="SUBTITULADA">Subtitulada</option>
                <option value="INGLES_DOBLADO">Inglés Original</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Formato de Proyección *</label>
              <select
                name="formatoProyeccion"
                required
                value={formData.formatoProyeccion}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="FORMAT_2D">2D Estándar</option>
                <option value="FORMAT_3D">3D Digital</option>
                <option value="IMAX">IMAX</option>
                <option value="FORMAT_4DX">4DX</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link href="/admin/funciones">
              <button type="button" className="px-6 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (
                <>
                  <Save className="w-5 h-5" /> Actualizar Función
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Grilla (Visible when Sede is selected) */}
      <div className="hidden xl:block h-[600px] sticky top-8">
        <GrillaProgramacion 
          sedeId={formData.cinemaId} 
          selectedDate={selectedDate} 
          previewFunction={previewFunction}
          excludeFunctionId={!isUnchanged ? params.id as string : undefined}
        />
      </div>

      </div>
    </div>
  );
}
