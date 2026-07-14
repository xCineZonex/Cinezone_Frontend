'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Star, X, Ticket, Gift, Sparkles, TrendingUp, ToggleLeft, ToggleRight, Cake, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminBeneficiosPage() {
  const [beneficios, setBeneficios] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [togglingSedeId, setTogglingSedeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    pointsRequired: '0',
    ticketCount: 1,
    tierId: '',
    monthlyLimit: 0,
    formato: 'TODOS'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, nRes, sRes] = await Promise.all([
        api.get('/admin/beneficios'),
        api.get('/admin/catalogo/niveles-fidelidad'),
        api.get('/public/sedes'),
      ]);
      setBeneficios(bRes.data);
      setNiveles(nRes.data);
      setSedes(sRes.data);
    } catch (error) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (benefit?: any) => {
    if (benefit) {
      setEditingId(benefit.id);
      setFormData({
        name: benefit.name,
        price: (benefit.price || 0).toString(),
        pointsRequired: (benefit.pointsRequired || 0).toString(),
        ticketCount: benefit.ticketCount || 1,
        tierId: benefit.tierId || 0,
        monthlyLimit: benefit.monthlyLimit || 0,
        formato: benefit.formato || 'TODOS'
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', pointsRequired: '0', ticketCount: 1, tierId: '', monthlyLimit: 0, formato: 'TODOS' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        pointsRequired: parseInt(formData.pointsRequired),
        ticketCount: parseInt(String(formData.ticketCount)),
        tierId: parseInt(String(formData.tierId)),
        monthlyLimit: parseInt(String(formData.monthlyLimit))
      };

      if (editingId) {
        await api.put(`/admin/beneficios/${editingId}`, payload);
        toast.success('Beneficio actualizado exitosamente');
      } else {
        await api.post('/admin/beneficios', payload);
        toast.success('Beneficio creado exitosamente');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(editingId ? 'Error al actualizar beneficio' : 'Error al crear beneficio');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este beneficio permanentemente?')) {
      try {
        await api.delete(`/admin/beneficios/${id}`);
        toast.success('Beneficio eliminado exitosamente');
        fetchData();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const handleToggleSedeVip = async (sedeId: number, currentValue: boolean) => {
    setTogglingSedeId(sedeId);
    try {
      await api.patch(`/admin/sedes/${sedeId}/beneficio-vip-cumpleanos`, null, {
        params: { habilitado: !currentValue }
      });
      setSedes(prev => prev.map(s => s.id === sedeId ? { ...s, vipCumpleanosHabilitado: !currentValue } : s));
      toast.success(!currentValue ? '🎂 VIP de cumpleaños activado para esta sede' : 'VIP de cumpleaños desactivado');
    } catch {
      toast.error('Error al cambiar el estado');
    } finally {
      setTogglingSedeId(null);
    }
  };

  const filtered = beneficios.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.tierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-sm font-bold mb-4 border border-amber-500/20">
            <Sparkles className="w-4 h-4" /> Fidelización y Recompensas
          </div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
            Beneficios de Entradas
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Configura promociones, 2x1 y precios especiales exclusivos para los miembros de CineZone.
          </p>
        </div>
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/30 transition-all"
          >
            <Plus className="w-6 h-6" /> Nuevo Beneficio
          </motion.button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl"><Gift className="w-8 h-8 text-primary" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase">Beneficios Activos</p>
            <h3 className="text-3xl font-black">{beneficios.length}</h3>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-500/10 rounded-2xl"><Star className="w-8 h-8 text-amber-500" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase">Niveles Disponibles</p>
            <h3 className="text-3xl font-black">{niveles.length}</h3>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-2xl"><TrendingUp className="w-8 h-8 text-blue-500" /></div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase">Puntos Requeridos</p>
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Variables</h3>
          </div>
        </div>
      </div>

      {/* === SECCIÓN CUMPLEAÑOS VIP POR SEDE === */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-pink-500/10 rounded-xl"><Cake className="w-6 h-6 text-pink-500" /></div>
          <div>
            <h2 className="text-xl font-black">Cumpleaños VIP por Sede</h2>
            <p className="text-sm text-muted-foreground">Activa el upgrade a VIP para el nivel Negro. Los niveles Azul y Dorado reciben 2D siempre.</p>
          </div>
        </div>

        {/* Tabla de referencia de niveles */}
        <div className="bg-card/60 border border-white/5 rounded-2xl p-5 mb-5 overflow-x-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Tabla de beneficios por nivel (referencia)</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground uppercase">
                <th className="text-left pb-2">Nivel</th>
                <th className="text-center pb-2">Sede CON VIP</th>
                <th className="text-center pb-2">Sede SIN VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {[
                { tier: 'Negro', sedeConVip: '1 entrada VIP 🏆', sedeSinVip: '2 entradas 2D', color: 'text-zinc-300' },
                { tier: 'Dorado', sedeConVip: '2 entradas 2D', sedeSinVip: '2 entradas 2D', color: 'text-amber-500' },
                { tier: 'Azul', sedeConVip: '1 entrada 2D', sedeSinVip: '1 entrada 2D', color: 'text-blue-500' },
              ].map(row => (
                <tr key={row.tier}>
                  <td className={`py-2.5 font-black ${row.color}`}>{row.tier}</td>
                  <td className="py-2.5 text-center text-foreground font-semibold">{row.sedeConVip}</td>
                  <td className="py-2.5 text-center text-muted-foreground">{row.sedeSinVip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tarjetas por sede */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : sedes.length === 0 ? (
            <p className="col-span-3 text-muted-foreground text-sm">No hay sedes registradas.</p>
          ) : sedes.map(sede => (
            <motion.div
              key={sede.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                sede.vipCumpleanosHabilitado
                  ? 'bg-gradient-to-br from-pink-500/10 to-amber-500/10 border-pink-500/30'
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    sede.vipCumpleanosHabilitado ? 'bg-pink-500/20' : 'bg-secondary'
                  }`}>
                    <MapPin className={`w-5 h-5 ${
                      sede.vipCumpleanosHabilitado ? 'text-pink-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-black text-foreground text-sm">{sede.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">{sede.ciudad}</p>
                  </div>
                </div>
                <button
                  id={`toggle-sede-vip-${sede.id}`}
                  onClick={() => handleToggleSedeVip(sede.id, sede.vipCumpleanosHabilitado)}
                  disabled={togglingSedeId === sede.id}
                  className="flex-shrink-0 transition-opacity disabled:opacity-50"
                  title={sede.vipCumpleanosHabilitado ? 'Desactivar VIP cumpleaños' : 'Activar VIP cumpleaños'}
                >
                  {togglingSedeId === sede.id ? (
                    <div className="w-7 h-7 border-2 border-pink-500/40 border-t-pink-500 rounded-full animate-spin" />
                  ) : sede.vipCumpleanosHabilitado ? (
                    <ToggleRight className="w-10 h-10 text-pink-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full ${
                  sede.vipCumpleanosHabilitado
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {sede.vipCumpleanosHabilitado ? '🎂 VIP Activado — Negro recibe 1 VIP' : '2D — Negro recibe 2 entradas 2D'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
        <div className="p-6 border-b border-border bg-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Catálogo de Beneficios
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar promoción..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary/30 text-xs uppercase font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-8 py-5">Promoción</th>
                <th className="px-8 py-5">Nivel Exclusivo</th>
                <th className="px-8 py-5 text-center">Cant. Entradas</th>
                <th className="px-8 py-5 text-center">Precio Fijo</th>
                <th className="px-8 py-5 text-center">Costo Puntos</th>
                <th className="px-8 py-5 text-center">Límite Mensual</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                      <Gift className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Sin resultados</h3>
                    <p className="text-muted-foreground">No se encontraron beneficios con ese nombre.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    key={b.id} 
                    className="hover:bg-secondary/40 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="font-bold text-foreground text-lg">{b.name}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">ID: {b.id}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-widest">
                        {b.tierName}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-lg">
                        {b.ticketCount || 1}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-lg text-emerald-500 whitespace-nowrap">
                      S/ {b.price.toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">
                        {b.pointsRequired} pts
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg">
                        {b.monthlyLimit > 0 ? b.monthlyLimit : '∞'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(b)} 
                          className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors tooltip-trigger"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(b.id)} 
                          className="p-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors tooltip-trigger"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Moderno */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
              {/* Modal Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10" />

              <div className="p-8 border-b border-border/50 flex justify-between items-center relative">
                <div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                    {editingId ? 'Editar Beneficio' : 'Nuevo Beneficio'}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Configura las reglas de esta promoción</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-secondary text-muted-foreground hover:text-foreground rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Nombre de la Promoción *</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Ej: 2x1 Lunes y Miércoles" 
                    className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Precio Especial (S/) *</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">S/</span>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                        className="w-full pl-12 pr-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all font-black text-xl text-primary" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Cantidad Entradas *</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      value={formData.ticketCount} 
                      onChange={e => setFormData({...formData, ticketCount: Number(e.target.value)})} 
                      className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all font-bold text-xl text-center" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Costo en Puntos *</label>
                    <input 
                      required 
                      type="number"
                      min="0"
                      value={formData.pointsRequired} 
                      onChange={e => setFormData({...formData, pointsRequired: e.target.value})} 
                      className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-xl text-blue-500 text-center" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Nivel Exclusivo *</label>
                    <select 
                      required 
                      value={formData.tierId} 
                      onChange={e => setFormData({...formData, tierId: e.target.value})} 
                      className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-amber-500 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Elegir Nivel...</option>
                      {niveles.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Formato Aplicable *</label>
                    <select 
                      required 
                      value={formData.formato} 
                      onChange={e => setFormData({...formData, formato: e.target.value})} 
                      className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all font-bold text-base appearance-none"
                    >
                      <option value="TODOS">Cualquier Formato (TODOS)</option>
                      <option value="FORMAT_2D">2D</option>
                      <option value="FORMAT_3D">3D</option>
                      <option value="IMAX">IMAX</option>
                      <option value="FORMAT_4DX">4DX</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Límite Mensual *</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      value={formData.monthlyLimit} 
                      onChange={e => setFormData({...formData, monthlyLimit: Number(e.target.value)})} 
                      className="w-full px-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all font-bold text-xl text-center" 
                    />
                  </div>
                </div>
                
                <div className="pt-6 mt-8 border-t border-border/50 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-2xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:-translate-y-1"
                  >
                    {editingId ? 'Guardar Cambios' : 'Crear Beneficio'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
