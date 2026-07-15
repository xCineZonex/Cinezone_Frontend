'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import GrillaProgramacion from '@/components/admin/GrillaProgramacion';

import { useSedeStore } from '@/store/useSedeStore';

export default function NuevaFuncionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { activeSedeId, assignedSedes } = useSedeStore();
  const [peliculas, setPeliculas] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    movieId: '',
    cinemaId: activeSedeId !== 'all' ? activeSedeId : '',
    auditoriumId: '',
    fechaHora: '',
    idioma: 'ESPANOL',
    formatoProyeccion: 'FORMAT_2D'
  });

  useEffect(() => {
    if (activeSedeId !== 'all') {
      setFormData(prev => ({ ...prev, cinemaId: activeSedeId }));
    }
  }, [activeSedeId]);

  useEffect(() => {
    // Cargar películas iniciales
    const fetchInitialData = async () => {
      try {
        const movRes = await api.get('/admin/catalogo/peliculas/disponibles');
        setPeliculas(movRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Cargar salas al seleccionar una sede
      const fetchSalas = async () => {
        if (!formData.cinemaId) {
          setSalas([]);
          return;
        }
        try {
          const response = await api.get(`/admin/catalogo/sedes/${formData.cinemaId}/salas`);
          // Filtrar salas para que solo se muestren las activas
          const salasActivas = response.data.filter((s: any) => s.estado === 'ACTIVO');
          setSalas(salasActivas);
        } catch (error) {
          console.error('Error fetching salas:', error);
        }
      };
    fetchSalas();
  }, [formData.cinemaId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'movieId') {
      const selectedMov = peliculas.find(p => p.id.toString() === value);
      setFormData({
        ...formData,
        [name]: value,
        idioma: selectedMov?.idioma || 'ESPANOL'
      });
    } else if (name === 'auditoriumId') {
      const selectedSala = salas.find(s => s.id.toString() === value);
      let newFormato = formData.formatoProyeccion;
      if (selectedSala) {
        const tipoSala = selectedSala.tipo?.toUpperCase() || 'FORMAT_2D';
        if (tipoSala === 'REGULAR' || tipoSala === 'FORMAT_2D') newFormato = 'FORMAT_2D';
        else if (tipoSala === '3D' || tipoSala === 'FORMAT_3D') newFormato = 'FORMAT_3D';
        else if (tipoSala === 'IMAX') newFormato = 'IMAX';
        else if (tipoSala === '4DX' || tipoSala === 'FORMAT_4DX') newFormato = 'FORMAT_4DX';
        else if (tipoSala === 'VIP') newFormato = 'VIP';
      }
      setFormData({
        ...formData,
        [name]: value,
        formatoProyeccion: newFormato
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones de horario
    const dt = new Date(formData.fechaHora);
    const h = dt.getHours();
    const m = dt.getMinutes();
    const timeInMinutes = h * 60 + m;
    
    const selectedMovie = peliculas.find(p => p.id.toString() === formData.movieId);
    const isEstreno = selectedMovie?.estado === 'PRE_ESTRENO' || selectedMovie?.estado === 'ESTRENO' || 
                      (selectedMovie?.fechaEstreno && selectedMovie.fechaEstreno >= formData.fechaHora.split('T')[0]);

    const minTime = 16 * 60; // 4:00 PM
    const maxTimeRegular = 22 * 60; // 10:00 PM
    
    // Si es a las 00:xx, lo consideramos como medianoche para estreno
    const isMidnight = h === 0;

    if (!isEstreno) {
      if (timeInMinutes < minTime || timeInMinutes > maxTimeRegular) {
        toast.error('Para funciones regulares, el horario permitido es de 4:00 PM a 10:00 PM.');
        return;
      }
    } else {
      if (!isMidnight && (timeInMinutes < minTime)) {
        toast.error('Para funciones de estreno, el horario permitido es de 4:00 PM a 12:00 AM.');
        return;
      }
    }

    setLoading(true);

    try {
      await api.post('/admin/catalogo/funciones', {
        ...formData,
        movieId: parseInt(formData.movieId),
        cinemaId: parseInt(formData.cinemaId),
        auditoriumId: parseInt(formData.auditoriumId)
      });
      toast.success('Función programada exitosamente');
      router.push('/admin/funciones');
    } catch (error: any) {
      console.error('Error creating funcion:', error);
      const serverError = error.response?.data?.error || error.response?.data?.message || 'Error al programar la función (¿Cruce de horarios?)';
      // Mostrar en cuadro emergente para mayor visibilidad
      alert(serverError);
      // Mantener el toast
      toast.error(serverError);
    } finally {
      setLoading(false);
    }
  };

  const selectedDate = formData.fechaHora ? formData.fechaHora.split('T')[0] : new Date().toISOString().split('T')[0];

  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  
  const minDateTime = localISOTime;
  const maxDateTime = `${now.getFullYear()}-12-31T23:59`;

  const availableMovies = peliculas.filter(p => {
    if (p.estado === 'RETIRADA') return false;
    if (!formData.fechaHora) return true;
    const selectedDateStr = formData.fechaHora.split('T')[0];
    if (p.fechaFinCartelera && p.fechaFinCartelera < selectedDateStr) return false;
    return true;
  });

  const selectedMovie = peliculas.find(p => p.id.toString() === formData.movieId);
  const selectedSala = salas.find(s => s.id.toString() === formData.auditoriumId);
  const isFormatoDisabled = !!selectedSala;
  
  const previewFunction = formData.auditoriumId && formData.fechaHora && selectedMovie ? {
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
          <h1 className="text-3xl font-black text-foreground">Programar Función</h1>
          <p className="text-muted-foreground">Asigna una película a una sala en un horario específico</p>
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
                disabled={activeSedeId !== 'all'}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, auditoriumId: '' })); // Reset sala
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
              >
                <option value="">Selecciona una sede...</option>
                {assignedSedes.filter(s => s.id !== 'all').map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              {activeSedeId !== 'all' && (
                <p className="text-xs text-muted-foreground mt-2">La sede está fijada por tu Contexto de Trabajo actual.</p>
              )}
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
                min={minDateTime}
                max={maxDateTime}
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
                disabled
                value={formData.idioma}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-zinc-400 cursor-not-allowed"
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
                disabled={isFormatoDisabled}
                className={`w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${isFormatoDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="FORMAT_2D">2D Estándar</option>
                <option value="FORMAT_3D">3D Digital</option>
                <option value="IMAX">IMAX</option>
                <option value="VIP">VIP</option>
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
                  <Save className="w-5 h-5" /> Programar Función
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
        />
      </div>

      </div>
    </div>
  );
}
