'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Film, PackagePlus, Trash2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminSedePeliculasPage() {
  const [view, setView] = useState<'catalogo' | 'mis_peliculas'>('catalogo');
  const [peliculasCatalogo, setPeliculasCatalogo] = useState<any[]>([]);
  const [misPeliculas, setMisPeliculas] = useState<any[]>([]);
  const [misSedes, setMisSedes] = useState<any[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal para asignar (cuando tiene más de 1 sede)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [movieToAssign, setMovieToAssign] = useState<any>(null);
  const [targetSedeId, setTargetSedeId] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Cargar sedes del usuario
      const meRes = await api.get('/users/me');
      const userSedesIds = meRes.data.sedesIds || [];
      
      const sedesRes = await api.get('/public/sedes');
      const allSedes = sedesRes.data;
      const sedesFiltradas = allSedes.filter((s: any) => userSedesIds.includes(s.id));
      
      setMisSedes(sedesFiltradas);
      if (sedesFiltradas.length > 0) {
        setSelectedSedeId(sedesFiltradas[0].id);
        setTargetSedeId(sedesFiltradas[0].id);
      }

      // 2. Cargar catálogo global
      const catRes = await api.get('/admin/catalogo/peliculas');
      setPeliculasCatalogo(catRes.data);

    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambia la sede seleccionada o la vista a 'mis_peliculas', cargar
  useEffect(() => {
    if (view === 'mis_peliculas' && selectedSedeId) {
      loadMisPeliculas(selectedSedeId);
    }
  }, [view, selectedSedeId]);

  const loadMisPeliculas = async (sedeId: number) => {
    try {
      const res = await api.get(`/admin/catalogo/sedes/${sedeId}/peliculas`);
      setMisPeliculas(res.data);
    } catch (err) {
      toast.error('Error al cargar las películas de la sede');
    }
  };

  const handleAssignClick = (movie: any) => {
    if (misSedes.length === 1) {
      // Asignar directo
      executeAssign(movie.id, misSedes[0].id);
    } else {
      // Abrir modal
      setMovieToAssign(movie);
      setShowAssignModal(true);
    }
  };

  const executeAssign = async (movieId: number, sedeId: number) => {
    try {
      await api.post(`/admin/catalogo/peliculas/${movieId}/distribuir/${sedeId}`);
      toast.success('Película asignada a tu Sede exitosamente');
      setShowAssignModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al asignar (quizá ya estaba asignada)');
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!selectedSedeId) return;
    if (!confirm('¿Seguro que deseas quitar esta película de tu sede? Si ya hay funciones programadas podría causar conflictos.')) return;
    
    try {
      await api.delete(`/admin/catalogo/peliculas/${movieId}/distribuir/${selectedSedeId}`);
      toast.success('Película removida de tu Sede');
      loadMisPeliculas(selectedSedeId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al quitar película');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando datos...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Gestión de Películas (Sede)</h1>
          <p className="text-muted-foreground">Revisa el catálogo central y asigna películas a tus sedes</p>
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

      {view === 'mis_peliculas' && misSedes.length > 1 && (
        <div className="flex items-center gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm text-muted-foreground">Viendo películas de la Sede:</span>
          <select
            className="bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            value={selectedSedeId || ''}
            onChange={(e) => setSelectedSedeId(Number(e.target.value))}
          >
            {misSedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      )}

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
              {peliculasCatalogo.filter(m => m.estado === 'EN_CARTELERA').length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No hay películas en cartelera global.</td></tr>
              ) : peliculasCatalogo.filter(m => m.estado === 'EN_CARTELERA').map((movie) => (
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

      {/* MODAL PARA ELEGIR SEDE (Solo si tiene varias sedes) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Elegir Sede</h3>
            <p className="text-sm text-muted-foreground mb-4">¿A qué sede deseas asignar <strong>{movieToAssign?.titulo}</strong>?</p>
            <select
              className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary mb-6"
              value={targetSedeId || ''}
              onChange={(e) => setTargetSedeId(Number(e.target.value))}
            >
              {misSedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2 rounded-xl font-semibold bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => targetSedeId && executeAssign(movieToAssign.id, targetSedeId)}
                className="flex-1 py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
