'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Edit, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminFuncionesPage() {
  const [funciones, setFunciones] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [selectedSede, setSelectedSede] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [funcRes, sedesRes] = await Promise.all([
        api.get('/admin/catalogo/funciones'),
        api.get('/public/sedes')
      ]);
      setFunciones(funcRes.data);
      setSedes(sedesRes.data);
      if (sedesRes.data.length > 0) {
        setSelectedSede(sedesRes.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredFunciones = funciones.filter(f => f.cinema?.id?.toString() === selectedSede);

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
          <select
            value={selectedSede}
            onChange={(e) => setSelectedSede(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            {sedes.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          <Link href="/admin/funciones/nueva">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> Programar Función
            </button>
          </Link>
        </div>
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
                        <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{funcion.idioma}</span>
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">{funcion.formatoProyeccion}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        funcion.activa 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {funcion.activa ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {funcion.activa ? 'Activa' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/funciones/${funcion.id}/editar`}>
                        <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
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
