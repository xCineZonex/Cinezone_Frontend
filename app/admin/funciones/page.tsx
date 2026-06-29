'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Edit, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSedeStore } from '@/store/useSedeStore';

export default function AdminFuncionesPage() {
  const { activeSedeId, assignedSedes } = useSedeStore();
  const [funciones, setFunciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const funcRes = await api.get('/admin/catalogo/funciones');
      setFunciones(funcRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredFunciones = activeSedeId === 'all' 
    ? funciones 
    : funciones.filter(f => f.cinema?.id?.toString() === activeSedeId);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando funciones...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Programación de Funciones</h1>
          <p className="text-muted-foreground">Gestiona los horarios de proyección de las películas</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/funciones/nueva">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> Programar Función
            </button>
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-muted-foreground">Sede Activa:</span>
        <span className="px-3 py-1.5 bg-secondary text-secondary-foreground font-bold rounded-lg text-sm">
          {activeSedeId === 'all' ? 'Todas las Sedes' : assignedSedes.find(s => s.id.toString() === activeSedeId)?.nombre || 'Seleccione una sede'}
        </span>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredFunciones.length} función{filteredFunciones.length !== 1 ? 'es' : ''} encontrada{filteredFunciones.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Película</th>
                <th className="px-6 py-4">Sala</th>
                <th className="px-6 py-4">Formato</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFunciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                    No hay funciones programadas para esta sede.
                  </td>
                </tr>
              ) : filteredFunciones.map((funcion) => {
                const date = new Date(funcion.fechaHora);
                const isPast = date.getTime() < Date.now();
                const isEditable = !isPast && funcion.activa;
                return (
                  <motion.tr 
                    key={funcion.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-bold text-foreground">{date.toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate" title={funcion.movie?.titulo}>
                      {funcion.movie?.titulo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{funcion.auditorium?.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                          {funcion.idioma === 'ESPANOL' ? 'Español' : funcion.idioma === 'SUBTITULADA' ? 'Subtitulada' : funcion.idioma === 'INGLES_DOBLADO' ? 'Inglés Original' : funcion.idioma}
                        </span>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
                          {funcion.formatoProyeccion === 'FORMAT_2D' ? '2D' : funcion.formatoProyeccion === 'FORMAT_3D' ? '3D' : funcion.formatoProyeccion === 'FORMAT_4DX' ? '4DX' : funcion.formatoProyeccion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPast
                          ? 'bg-zinc-500/20 text-zinc-400'
                          : funcion.activa 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-red-500/20 text-red-500'
                      }`}>
                        {isPast ? <CheckCircle className="w-3 h-3" /> : funcion.activa ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isPast ? 'Finalizada' : funcion.activa ? 'Activa' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditable ? (
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/funciones/${funcion.id}/editar`}>
                            <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button 
                            onClick={async () => {
                              if (confirm('¿Está seguro de eliminar esta función?')) {
                                try {
                                  await api.delete(`/admin/catalogo/funciones/${funcion.id}`);
                                  toast.success('Función eliminada');
                                  fetchData();
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Error al eliminar la función');
                                }
                              }
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic px-2">Bloqueado</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
