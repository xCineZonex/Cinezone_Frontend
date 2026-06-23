'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, MapPin, CheckCircle, XCircle, X, Save } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminSedesPage() {
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSede, setEditingSede] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', direccion: '', ciudad: '', activa: true, imagen: '' });
  const [editImagenFile, setEditImagenFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { fetchSedes(); }, []);

  const fetchSedes = async () => {
    try {
      const response = await api.get('/public/sedes');
      setSedes(response.data);
    } catch {
      toast.error('Error al cargar las sedes');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (sede: any) => {
    setEditingSede(sede);
    setEditForm({ nombre: sede.nombre, direccion: sede.direccion, ciudad: sede.ciudad, activa: sede.activa, imagen: sede.imagen || '' });
    setEditImagenFile(null);
  };

  const closeEdit = () => { setEditingSede(null); };

  const handleSaveEdit = async () => {
    if (!editingSede) return;
    setSavingEdit(true);
    try {
      let finalImagenUrl = editForm.imagen;

      if (editImagenFile) {
        const uploadData = new FormData();
        uploadData.append('file', editImagenFile);
        
        const uploadRes = await api.post('/admin/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImagenUrl = uploadRes.data.url;
      }

      await api.put(`/admin/catalogo/sedes/${editingSede.id}`, { ...editForm, imagen: finalImagenUrl });
      toast.success('Sede actualizada correctamente');
      closeEdit();
      fetchSedes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar la sede');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActiva = async (id: number, estadoActual: boolean) => {
    try {
      await api.put(`/admin/catalogo/sedes/${id}`, { activa: !estadoActual });
      toast.success(estadoActual ? 'Sede desactivada' : 'Sede activada');
      fetchSedes();
    } catch {
      toast.error('No se pudo cambiar el estado de la sede');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando sedes...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Gestión de Sedes</h1>
          <p className="text-muted-foreground">Administra los complejos de cines de la cadena</p>
        </div>
        <Link href="/admin/sedes/nueva">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> Agregar Sede
          </button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sedes.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground italic">
            No hay sedes registradas.
          </div>
        ) : sedes.map((sede) => (
          <motion.div
            key={sede.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {sede.imagen ? (
                  <img src={sede.imagen} alt={sede.nombre} className="w-10 h-10 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg leading-tight">{sede.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{sede.ciudad}</p>
                </div>
              </div>
              <button
                onClick={() => toggleActiva(sede.id, sede.activa)}
                className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                  sede.activa
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                }`}
              >
                {sede.activa ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {sede.activa ? 'Activa' : 'Inactiva'}
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6 line-clamp-2" title={sede.direccion}>
              {sede.direccion}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground">ID: #{sede.id}</span>
              <button
                onClick={() => openEdit(sede)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Editar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {editingSede && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-foreground">Editar Sede</h2>
                <button onClick={closeEdit} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre</label>
                  <input
                    type="text"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editForm.nombre}
                    onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editForm.ciudad}
                    onChange={e => setEditForm({ ...editForm, ciudad: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Dirección</label>
                  <textarea
                    rows={2}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    value={editForm.direccion}
                    onChange={e => setEditForm({ ...editForm, direccion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Imagen de la Sede (JPG o PNG)</label>
                  <div className="flex items-center gap-4">
                    {editForm.imagen && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                        <img src={editForm.imagen} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => setEditImagenFile(e.target.files?.[0] || null)}
                        className="w-full bg-secondary border border-border rounded-xl px-2 py-2 text-sm focus:outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {editImagenFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Seleccionado: {editImagenFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-foreground">Estado:</label>
                  <button
                    onClick={() => setEditForm({ ...editForm, activa: !editForm.activa })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      editForm.activa
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {editForm.activa ? '✓ Activa' : '✗ Inactiva'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  className="flex-1 py-2.5 bg-secondary hover:bg-border text-foreground font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-colors"
                  whileHover={{ scale: savingEdit ? 1 : 1.01 }}
                  whileTap={{ scale: savingEdit ? 1 : 0.99 }}
                >
                  {savingEdit ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
