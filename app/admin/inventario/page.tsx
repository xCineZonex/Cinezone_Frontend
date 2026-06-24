'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Product {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
  categoria: string;
  imagen: string;
}

interface Sede {
  id: number;
  nombre: string;
}

interface Movement {
  id: number;
  productId: number;
  productName: string;
  type: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  resultingStock: number;
  motivo: string;
  registeredBy: string;
  createdAt: string;
}

import { useSedeStore } from '@/store/useSedeStore';

export default function InventarioPage() {
  const { activeSedeId, assignedSedes } = useSedeStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [sedeStocks, setSedeStocks] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [kardex, setKardex] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [type, setType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'INVENTARIO' | 'SOLICITUDES'>('INVENTARIO');
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  // Ensamblar Combo
  const [ensamblajeCantidad, setEnsamblajeCantidad] = useState('');
  const [ensamblajeSedeId, setEnsamblajeSedeId] = useState('');
  const [isAssembling, setIsAssembling] = useState(false);

  // Nuevo Insumo Modal
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newInsumo, setNewInsumo] = useState({ nombre: '', sedeId: '', stock: '' });

  useEffect(() => {
    setUserRole(localStorage.getItem('rol'));
    fetchProducts();
    if (localStorage.getItem('rol') === 'ADMIN_SEDE') {
      fetchSolicitudes();
    }
  }, []);

  useEffect(() => {
    if (activeSedeId && activeSedeId !== 'all') {
      fetchSedeStocks(Number(activeSedeId));
    } else {
      setSedeStocks([]);
    }
  }, [activeSedeId]);

  const fetchSedeStocks = async (sedeId: number) => {
    try {
      const res = await api.get(`/admin/inventory/stock/sede/${sedeId}`);
      setSedeStocks(res.data);
    } catch (err) {
      console.error('Error fetching sede stocks:', err);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await api.get('/alertas/replacements');
      setSolicitudes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSolicitud = async (id: number, status: string) => {
    try {
      await api.put(`/alertas/replacements/${id}/status`, { status });
      toast.success(status === 'ATENDIDO' ? 'Solicitud en proceso' : 'Solicitud denegada');
      fetchSolicitudes();
    } catch (e) {
      toast.error('Error al actualizar solicitud');
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      fetchKardex(selectedProduct.id);
    }
  }, [selectedProduct, activeSedeId]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/catalogo/productos?esInsumo=true');
      setProducts(res.data);
    } catch (err) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchKardex = async (productId: number) => {
    try {
      const res = await api.get(`/admin/inventory/${productId}/kardex`);
      if (activeSedeId && activeSedeId !== 'all') {
        setKardex(res.data.filter((k: any) => k.sedeId === Number(activeSedeId)));
      } else {
        setKardex(res.data);
      }
    } catch (err) {
      toast.error('Error al cargar movimientos (Kardex)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !activeSedeId || activeSedeId === 'all') return;
    
    if (!cantidad || Number(cantidad) <= 0) {
      toast.error('Ingrese una cantidad válida mayor a 0');
      return;
    }

    const currentSedeStock = sedeStocks.find(s => s.product.id === selectedProduct.id)?.stock || 0;

    if (type === 'SALIDA' && currentSedeStock < Number(cantidad)) {
      toast.error('Stock insuficiente en la sede para esta salida');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/inventory/movement', {
        productId: selectedProduct.id,
        sedeId: Number(activeSedeId),
        type,
        cantidad: Number(cantidad),
        motivo
      });
      toast.success('Movimiento registrado');
      
      // Reset form
      setCantidad('');
      setMotivo('');
      
      // Reload data
      fetchSedeStocks(Number(activeSedeId));
      fetchKardex(selectedProduct.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsumo.nombre) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadRes = await api.post('/admin/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      await api.post('/admin/catalogo/productos', {
        nombre: newInsumo.nombre,
        descripcion: 'Insumo interno',
        precio: 0,
        categoria: 'INSUMO',
        esInsumo: true,
        imagen: imageUrl,
        cinemaId: newInsumo.sedeId ? parseInt(newInsumo.sedeId, 10) : null,
        stockGenerado: newInsumo.stock ? parseInt(newInsumo.stock, 10) : null
      });
      toast.success('Insumo creado correctamente');
      setIsModalOpen(false);
      setNewInsumo({ nombre: '', sedeId: '', stock: '' });
      setImageFile(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear insumo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnsamblar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !ensamblajeSedeId) {
      toast.error('Seleccione una sede para ensamblar');
      return;
    }
    
    if (!ensamblajeCantidad || Number(ensamblajeCantidad) <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    setIsAssembling(true);
    try {
      await api.post(`/admin/catalogo/productos/${selectedProduct.id}/generar-stock?stockGenerado=${ensamblajeCantidad}&sedeId=${ensamblajeSedeId}`);
      toast.success('Combo ensamblado y stock actualizado');
      setEnsamblajeCantidad('');
      fetchProducts();
      fetchKardex(selectedProduct.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al ensamblar combo');
    } finally {
      setIsAssembling(false);
    }
  };

  const displayedProducts = activeSedeId === 'all'
    ? products
    : products.map(p => {
        const sStock = sedeStocks.find(s => s.product.id === p.id);
        return { ...p, stock: sStock ? sStock.stock : 0 };
      });

  const filteredProducts = displayedProducts.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Gestión de Inventario
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Control total sobre insumos, stock y movimientos de sede.
          </p>
        </div>
        
        <div className="flex gap-4">
          {activeSedeId !== 'all' && (
            <div className="flex bg-secondary rounded-xl p-1">
              <button
                onClick={() => setActiveTab('INVENTARIO')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'INVENTARIO' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Inventario
              </button>
              <button
                onClick={() => setActiveTab('SOLICITUDES')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'SOLICITUDES' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Solicitudes
                {solicitudes.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{solicitudes.length}</span>
                )}
              </button>
            </div>
          )}
          {userRole === 'SUPER_ADMIN' && activeSedeId === 'all' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Nuevo Insumo Global
            </button>
          )}
        </div>
      </div>

      {/* Modal Nuevo Insumo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Añadir Nuevo Insumo</h2>
            <form onSubmit={handleCreateInsumo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre del Insumo *</label>
                <input
                  type="text"
                  required
                  value={newInsumo.nombre}
                  onChange={(e) => setNewInsumo({...newInsumo, nombre: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej. Vaso Plástico 16oz"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Imagen Referencial</label>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sede Inicial (Opcional)</label>
                <select
                  value={newInsumo.sedeId}
                  onChange={(e) => setNewInsumo({...newInsumo, sedeId: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Ninguna (Global)</option>
                  {assignedSedes.filter(s => s.id !== 'all').map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {newInsumo.sedeId && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Stock Inicial en Sede</label>
                  <input
                    type="number"
                    min="1"
                    value={newInsumo.stock}
                    onChange={(e) => setNewInsumo({...newInsumo, stock: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej. 100"
                  />
                </div>
              )}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {activeTab === 'SOLICITUDES' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Solicitudes de Restock Pendientes</h2>
          {solicitudes.length === 0 ? (
            <div className="text-center p-12 bg-card/50 rounded-2xl border border-border">
              <p className="text-muted-foreground font-medium">No hay solicitudes pendientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {solicitudes.map(sol => (
                <motion.div key={sol.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">{sol.productName}</h3>
                    <AlertTriangle className="text-amber-500 w-5 h-5" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">El jefe de sala reporta bajo stock y requiere reabastecimiento.</p>
                  <div className="flex gap-3">
                    <button onClick={() => handleSolicitud(sol.id, 'ATENDIDO')} className="flex-1 py-2 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl transition-all">
                      Atender
                    </button>
                    <button onClick={() => handleSolicitud(sol.id, 'DENEGADO')} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all">
                      Denegar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Modal Nuevo Insumo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Añadir Nuevo Insumo</h2>
            <form onSubmit={handleCreateInsumo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre del Insumo *</label>
                <input
                  type="text"
                  required
                  value={newInsumo.nombre}
                  onChange={(e) => setNewInsumo({...newInsumo, nombre: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej. Vaso Plástico 16oz"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Imagen Referencial</label>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sede Inicial (Opcional)</label>
                <select
                  value={newInsumo.sedeId}
                  onChange={(e) => setNewInsumo({...newInsumo, sedeId: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Ninguna (Global)</option>
                  {assignedSedes.filter(s => s.id !== 'all').map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {newInsumo.sedeId && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Stock Inicial en Sede</label>
                  <input
                    type="number"
                    min="1"
                    value={newInsumo.stock}
                    onChange={(e) => setNewInsumo({...newInsumo, stock: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej. 100"
                  />
                </div>
              )}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Lista de Productos */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 ring-primary transition-all"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (selectedProduct?.id !== p.id) {
                    setSelectedProduct(p);
                    setKardex([]);
                  }
                }}
                className={`w-full flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors text-left ${selectedProduct?.id === p.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
              >
                <div>
                  <h3 className="font-bold">{p.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{p.categoria}</p>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold text-lg ${p.stock <= 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {p.stock}
                  </span>
                  <p className="text-[10px] text-muted-foreground uppercase">Stock</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Detalles y Movimientos */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedProduct ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-card border border-border rounded-3xl p-12 text-center min-h-[400px]">
              <Package className="w-16 h-16 mb-4 opacity-20" />
              <p>Selecciona un producto para gestionar su inventario</p>
            </div>
          ) : (
            <>


              {/* Nuevo Movimiento */}
              {activeSedeId !== 'all' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-3xl p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Nuevo Movimiento
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Tipo</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'ENTRADA' | 'SALIDA')}
                        className="w-full bg-secondary rounded-xl px-4 py-3 outline-none"
                      >
                        <option value="ENTRADA">Entrada (Sumar)</option>
                        <option value="SALIDA">Salida (Restar)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="w-full bg-secondary rounded-xl px-4 py-3 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Motivo / Justificación</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          className="w-full bg-secondary rounded-xl px-4 py-3 outline-none flex-1"
                          placeholder="Ej. Compra proveedor, Merma, etc."
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            type === 'ENTRADA' 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {isSubmitting ? '...' : 'Registrar'}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm text-center">
                  <p className="text-muted-foreground">Seleccione una sede específica en el contexto de trabajo para registrar movimientos.</p>
                </div>
              )}


              {/* Historial (Kardex) */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col"
              >
                <h2 className="text-xl font-bold mb-6">Historial de Kardex</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Fecha y Hora</th>
                        <th className="pb-3 font-medium">Tipo</th>
                        <th className="pb-3 font-medium text-right">Cant.</th>
                        <th className="pb-3 font-medium text-right">Stock</th>
                        <th className="pb-3 font-medium px-4">Motivo</th>
                        <th className="pb-3 font-medium">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kardex.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay movimientos registrados para este producto.
                          </td>
                        </tr>
                      ) : (
                        kardex.map((mov) => (
                          <tr key={mov.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                            <td className="py-4 text-sm">
                              {new Date(mov.createdAt).toLocaleString()}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                                mov.type === 'ENTRADA' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {mov.type === 'ENTRADA' ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                                {mov.type}
                              </span>
                            </td>
                            <td className="py-4 text-right font-mono font-bold text-foreground">
                              {mov.type === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                            </td>
                            <td className="py-4 text-right font-mono text-muted-foreground">
                              {mov.resultingStock}
                            </td>
                            <td className="py-4 px-4 text-sm">
                              {mov.motivo}
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {mov.registeredBy}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
