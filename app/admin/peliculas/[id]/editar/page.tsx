'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EditarPeliculaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    titulo: '',
    sinopsis: '',
    duracionHoras: '',
    duracionMins: '',
    genero: '',
    clasificacion: '',
    idioma: 'ESPANOL',
    estado: 'EN_CARTELERA',
    posterUrl: '',
    trailerUrl: '',
    fechaEstreno: '',
    fechaFinCartelera: ''
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [enums, setEnums] = useState({
    languages: [] as string[],
    movieStatuses: [] as string[]
  });

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  const maxDate = `${currentYear + 2}-12-31`;

  const getNextDay = (dateString: string) => {
    if (!dateString) return minDate;
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [movieRes, enumsRes] = await Promise.all([
        api.get('/admin/catalogo/peliculas'),
        api.get('/admin/catalogo/enums')
      ]);
      setEnums(enumsRes.data);
      
      const movie = movieRes.data.find((m: any) => m.id === parseInt(params.id as string));
      if (movie) {
        setFormData({
          titulo: movie.titulo || '',
          sinopsis: movie.sinopsis || '',
          duracionHoras: movie.duracionMinutos ? Math.floor(movie.duracionMinutos / 60).toString() : '',
          duracionMins: movie.duracionMinutos ? (movie.duracionMinutos % 60).toString() : '',
          genero: movie.genero || '',
          clasificacion: movie.clasificacion || '',
          idioma: movie.idioma || 'ESPANOL',
          estado: movie.estado || 'EN_CARTELERA',
          posterUrl: movie.posterUrl || '',
          trailerUrl: movie.trailerUrl || '',
          fechaEstreno: movie.fechaEstreno ? movie.fechaEstreno.split('T')[0] : '',
          fechaFinCartelera: movie.fechaFinCartelera ? movie.fechaFinCartelera.split('T')[0] : ''
        });
      } else {
        toast.error('Película no encontrada');
        router.push('/admin/peliculas');
      }
    } catch (error) {
      toast.error('Error al cargar la película');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.fechaFinCartelera && formData.fechaEstreno) {
      if (new Date(formData.fechaFinCartelera + 'T00:00:00') <= new Date(formData.fechaEstreno + 'T00:00:00')) {
        toast.error('La fecha de fin debe ser posterior a la fecha de estreno');
        return;
      }
    }

    if (formData.estado === 'PROXIMAMENTE' && formData.fechaEstreno) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const estreno = new Date(formData.fechaEstreno + 'T00:00:00');
      if (estreno < hoy) {
        toast.error('Una película ya estrenada no puede tener el estado Próximamente');
        return;
      }
    }

    setLoading(true);

    try {
      let finalPosterUrl = formData.posterUrl;
      
      if (posterFile) {
        const uploadData = new FormData();
        uploadData.append('file', posterFile);
        
        const uploadRes = await api.post('/admin/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalPosterUrl = uploadRes.data.url;
      }

      await api.put(`/admin/catalogo/peliculas/${params.id}`, {
        ...formData,
        posterUrl: finalPosterUrl,
        duracionMinutos: (parseInt(formData.duracionHoras || '0', 10) * 60) + parseInt(formData.duracionMins || '0', 10)
      });
      toast.success('Película actualizada exitosamente');
      router.push('/admin/peliculas');
    } catch (error: any) {
      console.error('Error updating movie:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar la película');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center animate-pulse">Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/peliculas" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">Editar Película</h1>
          <p className="text-muted-foreground">Actualiza la información de la película</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Título *</label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Sinopsis *</label>
              <textarea
                name="sinopsis"
                required
                rows={4}
                value={formData.sinopsis}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Duración *</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    name="duracionHoras"
                    required
                    min="0"
                    value={formData.duracionHoras}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Horas (ej. 2)"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="duracionMins"
                    required
                    min="0"
                    max="59"
                    value={formData.duracionMins}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Minutos (ej. 15)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-semibold">Fecha de Estreno *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal px-4 py-3 h-auto bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all",
                      !formData.fechaEstreno && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {formData.fechaEstreno ? format(parseISO(formData.fechaEstreno), "dd/MM/yyyy", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fechaEstreno ? parseISO(formData.fechaEstreno) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, fechaEstreno: format(date, "yyyy-MM-dd") });
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const min = parseISO(minDate);
                      const max = parseISO(maxDate);
                      return date < min || date > max;
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-semibold">Fecha Fin de Cartelera</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal px-4 py-3 h-auto bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all",
                      !formData.fechaFinCartelera && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {formData.fechaFinCartelera ? format(parseISO(formData.fechaFinCartelera), "dd/MM/yyyy", { locale: es }) : <span>Opcional</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fechaFinCartelera ? parseISO(formData.fechaFinCartelera) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, fechaFinCartelera: format(date, "yyyy-MM-dd") });
                      } else {
                        setFormData({ ...formData, fechaFinCartelera: '' });
                      }
                    }}
                    disabled={(date) => {
                      const min = parseISO(getNextDay(formData.fechaEstreno));
                      const max = parseISO(maxDate);
                      return date < min || date > max;
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Opcional. Si se deja en blanco, el sistema asignará 3 semanas (21 días) a partir del estreno.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Género *</label>
              <input
                type="text"
                name="genero"
                required
                value={formData.genero}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Clasificación *</label>
              <select
                name="clasificacion"
                required
                value={formData.clasificacion}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="">Selecciona...</option>
                <option value="ATP">ATP (Apta para todos)</option>
                <option value="MAY-14">MAY-14</option>
                <option value="MAY-18">MAY-18</option>

              </select>
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
                {enums.languages.length > 0 ? (
                  enums.languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.replace(/_/g, ' ')}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ESPANOL">ESPANOL</option>
                    <option value="SUBTITULADA">SUBTITULADA</option>
                    <option value="INGLES_DOBLADO">INGLES DOBLADO</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Estado de la Película *</label>
              <select
                name="estado"
                required
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                {enums.movieStatuses.length > 0 ? (
                  enums.movieStatuses.map((status) => {
                    const isPastRelease = formData.fechaEstreno ? new Date(formData.fechaEstreno + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0)) : false;
                    return (
                      <option key={status} value={status} disabled={status === 'PROXIMAMENTE' && isPastRelease}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="EN_CARTELERA">En Cartelera</option>
                    <option value="PROXIMAMENTE" disabled={formData.fechaEstreno ? new Date(formData.fechaEstreno + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0)) : false}>Próximamente</option>
                    <option value="PRE_VENTA">Pre-venta</option>
                    <option value="RETIRADA">Retirada</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Póster (Imagen) *</label>
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {posterFile ? (
                <p className="text-xs text-muted-foreground mt-1">Nuevo seleccionado: {posterFile.name}</p>
              ) : formData.posterUrl ? (
                <p className="text-xs text-muted-foreground mt-1">Actual: <a href={formData.posterUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Ver imagen</a></p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">URL del Tráiler (YouTube)</label>
              <input
                type="url"
                name="trailerUrl"
                value={formData.trailerUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link href="/admin/peliculas">
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
                  <Save className="w-5 h-5" /> Actualizar Película
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
