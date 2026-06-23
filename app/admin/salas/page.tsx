'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Edit2, Sofa, Building2, CheckCircle, XCircle, Users, Wrench } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminSalasPage() {
  const [sedes, setSedes] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSede, setSelectedSede] = useState<string>('');

  useEffect(() => {
    fetchSedes();
  }, []);

  useEffect(() => {
    if (selectedSede) fetchSalas(Number(selectedSede));
    else fetchAllSalas();
  }, [selectedSede]);

  const fetchSedes = async () => {
    try {
      const userRes = await api.get('/users/me');
      const currentUser = userRes.data;

      const res = await api.get('/public/sedes');
      let allSedes = res.data;
      if (currentUser.rol === 'ADMIN_SEDE' && currentUser.sedesIds) {
        allSedes = allSedes.filter((s: any) => currentUser.sedesIds.includes(s.id));
      }
      setSedes(allSedes);
    } catch {
      toast.error('Error al cargar sedes');
    }
  };

  const fetchSalas = async (cinemaId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/catalogo/sedes/${cinemaId}/salas`);
      setSalas(res.data);
    } catch {
      toast.error('Error al cargar salas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSalas = async () => {
    setLoading(true);
    try {
      const userRes = await api.get('/users/me');
      const currentUser = userRes.data;

      // Trae salas de todas las sedes
      const sedesRes = await api.get('/public/sedes');
      let allSedes = sedesRes.data;
      if (currentUser.rol === 'ADMIN_SEDE' && currentUser.sedesIds) {
        allSedes = allSedes.filter((s: any) => currentUser.sedesIds.includes(s.id));
      }

      const allSalas: any[] = [];
      for (const sede of allSedes) {
        const res = await api.get(`/admin/catalogo/sedes/${sede.id}/salas`);
        allSalas.push(...res.data.map((s: any) => ({ ...s, sedeNombre: sede.nombre })));
      }
      setSalas(allSalas);
    } catch {
      toast.error('Error al cargar salas');
    } finally {
      setLoading(false);
    }
  };

  const toggleMantenimiento = async (sala: any) => {
    try {
      await api.patch(`/admin/catalogo/salas/${sala.id}/mantenimiento?activar=${sala.activa}`);
      toast.success(sala.activa ? 'Sala en mantenimiento' : 'Sala activada');
      selectedSede ? fetchSalas(Number(selectedSede)) : fetchAllSalas();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Gestión de Salas</h1>
          <p className="text-muted-foreground">Diseña y administra las salas de cada sede</p>
        </div>
        <Link href="/admin/salas/nueva">
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" /> Nueva Sala
          </motion.button>
        </Link>
      </div>

      {/* Filtro por sede */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-muted-foreground">Filtrar por sede:</label>
        <select
          className="bg-secondary border border-border rounded-xl px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={selectedSede}
          onChange={e => setSelectedSede(e.target.value)}
        >
          <option value="">Todas las sedes</option>
          {sedes.map(s => (
            <option key={s.id} value={s.id}>{s.nombre} · {s.ciudad}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {salas.length} sala{salas.length !== 1 ? 's' : ''} encontrada{salas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid de salas */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-secondary rounded w-2/3" />
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="h-8 bg-secondary rounded" />
            </div>
          ))}
        </div>
      ) : salas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Sofa className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No hay salas registradas</h3>
          <p className="text-muted-foreground mb-6">Crea tu primera sala usando el editor interactivo</p>
          <Link href="/admin/salas/nueva">
            <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors">
              <Plus className="w-5 h-5" /> Crear primera sala
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salas.map((sala, idx) => (
            <motion.div
              key={sala.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all group"
            >
              {/* Cabecera */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <Sofa className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{sala.nombre}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {sala.sedeNombre || 'Sede'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  sala.activa
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {sala.activa ? 'Activa' : 'Mantenimiento'}
                </span>
              </div>

              {/* Capacidad */}
              <div className="flex items-center gap-2 mb-5 py-3 px-4 bg-secondary/50 rounded-xl">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Capacidad:</span>
                <span className="font-black text-foreground text-lg ml-auto">{sala.capacidadTotal}</span>
                <span className="text-xs text-muted-foreground">asientos</span>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Link href={`/admin/salas/${sala.id}/editor`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-sm transition-colors">
                    <Edit2 className="w-4 h-4" /> Editar Mapa
                  </button>
                </Link>
                <button
                  onClick={() => toggleMantenimiento(sala)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    sala.activa
                      ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'
                      : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                  }`}
                  title={sala.activa ? 'Poner en mantenimiento' : 'Activar sala'}
                >
                  <Wrench className="w-4 h-4" />
                  {sala.activa ? 'Mant.' : 'Activar'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
