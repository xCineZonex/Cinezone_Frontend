'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Film, PackagePlus, Trash2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSedeStore } from '@/store/useSedeStore';

export default function AdminSedePeliculasPage() {
  const { activeSedeId, assignedSedes } = useSedeStore();
  const [view, setView] = useState<'catalogo' | 'mis_peliculas'>('catalogo');
  const [peliculasCatalogo, setPeliculasCatalogo] = useState<any[]>([]);
  const [misPeliculas, setMisPeliculas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const catRes = await api.get('/admin/catalogo/peliculas');
      setPeliculasCatalogo(catRes.data);
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'mis_peliculas' && activeSedeId && activeSedeId !== 'all') {
      loadMisPeliculas(Number(activeSedeId));
    }
  }, [view, activeSedeId]);

  const loadMisPeliculas = async (sedeId: number) => {
    try {
      const res = await api.get(`/admin/catalogo/sedes/${sedeId}/peliculas`);
      setMisPeliculas(res.data);
    } catch (err) {
      toast.error('Error al cargar las películas de la sede');
    }
  };

  const handleAssignClick = (movie: any) => {
    if (!activeSedeId || activeSedeId === 'all') {
      toast.error('Seleccione una sede específica');
      return;
    }
    executeAssign(movie.id, Number(activeSedeId));
  };

  const executeAssign = async (movieId: number, sedeId: number) => {
    try {
      await api.post(`/admin/catalogo/peliculas/${movieId}/distribuir/${sedeId}`);
      toast.success('Película asignada a tu Sede exitosamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al asignar (quizá ya estaba asignada)');
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!activeSedeId || activeSedeId === 'all') return;
    if (!confirm('¿Seguro que deseas quitar esta película de tu sede? Si ya hay funciones programadas podría causar conflictos.')) return;
    
    try {
      await api.delete(`/admin/catalogo/peliculas/${movieId}/distribuir/${activeSedeId}`);
      toast.success('Película removida de tu Sede');
      loadMisPeliculas(Number(activeSedeId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al quitar película');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando datos...</div>;

  const currentSedeName = assignedSedes.find(s => s.id === Number(activeSedeId))?.nombre || 'Sede';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Gestión de Películas (Sede)</h1>
          <p className="text-muted-foreground">Revisa el catálogo central y asigna películas a la sede {currentSedeName}</p>
        </div>
        <div className="flex bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setView('catalogo')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              view === 'catalogo' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Catálogo Global
          </button>
          <button
            onClick={() => setView('mis_peliculas')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              view === 'mis_peliculas' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mis Películas
          </button>
        </div>
      </div>

      {/* TABLA CATÁLOGO GLOBAL */}
      {view === 'catalogo' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Género / Clasif.</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {peliculasCatalogo.filter(m => m.estado !== 'RETIRADA').length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No hay películas disponibles en el catálogo global.</td></tr>
              ) : peliculasCatalogo.filter(m => m.estado !== 'RETIRADA').map((movie) => (
                <tr key={movie.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{movie.id}</td>
                  <td className="px-6 py-4">
                    {movie.posterUrl ? (
                      <div className="w-10 h-14 bg-secondary rounded overflow-hidden relative">
                        <img src={movie.posterUrl} alt={movie.titulo} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate" title={movie.titulo}>{movie.titulo}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{movie.genero}</span>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">{movie.clasificacion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleAssignClick(movie)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      <PackagePlus className="w-3.5 h-3.5" /> Asignar a mi Sede
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA MIS PELÍCULAS */}
      {view === 'mis_peliculas' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {misPeliculas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
                      <p className="text-muted-foreground font-medium">Esta sede aún no tiene películas asignadas.</p>
                      <button onClick={() => setView('catalogo')} className="text-primary text-sm font-bold hover:underline">Ir al Catálogo Global</button>
                    </div>
                  </td>
                </tr>
              ) : misPeliculas.map((movie) => (
                <tr key={movie.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{movie.id}</td>
                  <td className="px-6 py-4">
                    {movie.posterUrl ? (
                      <div className="w-10 h-14 bg-secondary rounded overflow-hidden relative">
                        <img src={movie.posterUrl} alt={movie.titulo} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">{movie.titulo}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleRemoveMovie(movie.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold text-xs rounded-lg transition-colors"
                      title="Quitar de mi sede"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
}
