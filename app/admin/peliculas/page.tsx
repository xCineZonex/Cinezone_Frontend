'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Edit, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import AdminSedePeliculasPage from './AdminSedePeliculasPage';

export default function AdminPeliculasPage() {
  const [peliculas, setPeliculas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('rol');
    setUserRole(role);
    if (role !== 'ADMIN_SEDE') {
      fetchPeliculas();
    }
  }, []);

  const fetchPeliculas = async () => {
    try {
      const response = await api.get('/admin/catalogo/peliculas');
      setPeliculas(response.data);
    } catch (error) {
      console.error('Error fetching peliculas:', error);
      toast.error('Error al cargar las películas');
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id: number, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'EN_CARTELERA' ? 'RETIRADA' : 'EN_CARTELERA';
    try {
      await api.patch(`/admin/catalogo/peliculas/${id}/estado`, null, {
        params: { estado: nuevoEstado }
      });
      toast.success(`Estado cambiado a ${nuevoEstado}`);
      fetchPeliculas();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('No se pudo cambiar el estado');
    }
  };

  if (userRole === 'ADMIN_SEDE') {
    return <AdminSedePeliculasPage />;
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando catálogo...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Catálogo de Películas Maestro</h1>
          <p className="text-muted-foreground">Gestiona las películas disponibles a nivel central</p>
        </div>
        <Link href="/admin/peliculas/nueva">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> Agregar Película
          </button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Género / Clasif.</th>
                <th className="px-6 py-4">Estado Global</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {peliculas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                    No hay películas registradas.
                  </td>
                </tr>
              ) : peliculas.map((movie) => (
                <motion.tr 
                  key={movie.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{movie.id}</td>
                  <td className="px-6 py-4">
                    {movie.posterUrl ? (
                      <div className="w-10 h-14 bg-secondary rounded overflow-hidden relative">
                        <img src={movie.posterUrl} alt={movie.titulo} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 bg-secondary rounded flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate" title={movie.titulo}>
                    {movie.titulo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{movie.genero}</span>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">{movie.clasificacion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleEstado(movie.id, movie.estado)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        movie.estado === 'EN_CARTELERA' 
                          ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                          : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      }`}
                    >
                      {movie.estado === 'EN_CARTELERA' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {movie.estado.replace('_', ' ')}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/peliculas/${movie.id}/editar`}>
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
