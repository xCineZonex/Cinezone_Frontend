'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, ArrowDown, RefreshCw, Search, Plus, Minus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  categoriaId?: number;
  esInsumo?: boolean;
}

export default function JefeSalaInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Modal de Movimiento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Producto | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Restock
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProdId, setRestockProdId] = useState<number | null>(null);
  const [restockCantidad, setRestockCantidad] = useState('');

  const fetchProductos = async () => {
    try {
      setLoading(true);
      // 1. Obtener la sede asignada al Jefe de Sala
      const userRes = await api.get('/users/me');
      const sedesIds = userRes.data.sedesIds || [];
      
      if (sedesIds.length === 0) {
        toast.error('No tienes ninguna sede asignada');
        setLoading(false);
        return;
      }
      
      const sedeId = sedesIds[0];

      // 2. Obtener el stock físico de esa sede
      const res = await api.get(`/admin/inventory/stock/sede/${sedeId}`);
      let stockData = res.data || [];
      
      // Mapear la respuesta de ProductStockDTO al formato de Producto esperado por la UI
      let formatted = stockData.map((s: any) => ({
        id: s.product.id,
        nombre: s.product.nombre,
        descripcion: s.product.descripcion,
        precio: s.product.precio,
        stock: s.stock || 0,
        categoria: s.product.categoria,
        esInsumo: s.product.esInsumo,
      }));

      // El Jefe de Sala no debe gestionar productos de dulcería, solo insumos/productos físicos del inventario
      formatted = formatted.filter((p: Producto) => p.esInsumo === true);
      
      setProductos(formatted);
    } catch (error: any) {
      toast.error('Error al cargar el inventario de la sede');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/alertas/replacements');
      setPendingRequests(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching pending requests', error);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchPendingRequests();
  }, []);

  const openRestockModal = (id: number) => {
    setRestockProdId(id);
    setRestockCantidad('');
    setIsRestockModalOpen(true);
  };

  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProdId || !restockCantidad || Number(restockCantidad) <= 0) {
      toast.error('Ingrese una cantidad válida mayor a 0');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/alertas/restock', { productoId: restockProdId, cantidad: Number(restockCantidad) });
      toast.success('Solicitud de restock enviada al administrador', {
        description: 'El administrador ha sido notificado para reabastecer este insumo.',
        icon: <RefreshCw className="w-4 h-4 text-green-500" />
      });
      setIsRestockModalOpen(false);
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al pedir restock');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMovimientoModal = (producto: Producto, tipo: 'ENTRADA' | 'SALIDA') => {
    setSelectedProd(producto);
    setTipoMovimiento(tipo);
    setCantidad('');
    setMotivo('');
    setIsModalOpen(true);
  };

  const handleMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;
    if (!cantidad || Number(cantidad) <= 0) {
      toast.error('Ingrese una cantidad válida mayor a 0');
      return;
    }
    if (tipoMovimiento === 'SALIDA' && selectedProd.stock < Number(cantidad)) {
      toast.error('Stock insuficiente para esta salida');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/inventory/movement', {
        productId: selectedProd.id,
        type: tipoMovimiento,
        cantidad: Number(cantidad),
        motivo
      });
      toast.success('Movimiento registrado correctamente');
      setIsModalOpen(false);
      fetchProductos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProductos = productos.filter(p => 
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario de Dulcería</h1>
          <p className="text-muted-foreground mt-2">Monitorea e informa el stock físico (Mermas o Entradas).</p>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm overflow-hidden ring-1 ring-white/5">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center gap-4 justify-between bg-muted/10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 font-medium">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>Alerta de Stock: &lt;= 20 unidades</span>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-medium">Sincronizando inventario...</p>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Package className="w-12 h-12 opacity-20" />
              <p className="font-medium">No se encontraron productos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProductos.map((producto) => {
                const isLowStock = producto.stock <= 20;
                const isPending = pendingRequests.some(r => r.productoId === producto.id && (r.status === 'PENDING_ADMIN' || r.status === 'EN_PROCESO'));
                
                return (
                  <div 
                    key={producto.id} 
                    className={`bg-background/60 backdrop-blur-sm border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg ${
                      isLowStock 
                        ? 'border-orange-500/30 shadow-[0_4px_20px_-10px_rgba(249,115,22,0.2)]' 
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {isLowStock && (
                      <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-orange-500/20 to-transparent rotate-45 transform translate-x-12 -translate-y-12" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div className={`p-3 rounded-xl shadow-inner ${isLowStock ? 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20' : 'bg-primary/10 text-primary ring-1 ring-primary/20'}`}>
                        <Package className="w-6 h-6" />
                      </div>
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1.5 rounded-lg border border-orange-500/20 shadow-sm animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Stock Bajo
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <h3 className="font-bold text-lg text-foreground mb-1.5 line-clamp-1" title={producto.nombre}>
                        {producto.nombre}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 line-clamp-2 min-h-[40px]" title={producto.descripcion}>
                        {producto.descripcion || 'Sin descripción disponible para este producto.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-border/40 relative z-10">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground/80 mb-1">Unidades</p>
                          <p className={`font-black text-2xl flex items-center gap-1.5 ${isLowStock ? 'text-orange-500' : 'text-foreground'}`}>
                            {producto.stock}
                            {isLowStock && <ArrowDown className="w-5 h-5 text-orange-500/80 animate-bounce" />}
                          </p>
                        </div>
                        {isPending ? (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 cursor-not-allowed"
                            title="En Proceso"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> En Proceso
                          </button>
                        ) : (
                          <button
                            onClick={() => openRestockModal(producto.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-muted text-foreground hover:bg-muted/80 border border-border/50 hover:border-border active:scale-95"
                            title="Pedir reabastecimiento"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Pedir
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => openMovimientoModal(producto, 'ENTRADA')}
                          className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-xs font-bold flex justify-center items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ingreso
                        </button>
                        <button
                          onClick={() => openMovimientoModal(producto, 'SALIDA')}
                          className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-xs font-bold flex justify-center items-center gap-1 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" /> Merma
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Movimiento */}
      {isModalOpen && selectedProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${tipoMovimiento === 'ENTRADA' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {tipoMovimiento === 'ENTRADA' ? <Plus className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">Reportar {tipoMovimiento === 'ENTRADA' ? 'Ingreso' : 'Merma / Salida'}</h2>
                <p className="text-sm text-muted-foreground">{selectedProd.nombre}</p>
              </div>
            </div>
            
            <form onSubmit={handleMovimiento} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej. 5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Motivo / Justificación</label>
                <input
                  type="text"
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder={tipoMovimiento === 'ENTRADA' ? "Ej. Llegó pedido del proveedor" : "Ej. Vaso roto, Merma"}
                />
              </div>
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
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors ${tipoMovimiento === 'ENTRADA' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Restock */}
      {isRestockModalOpen && restockProdId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Solicitar Restock</h2>
                <p className="text-sm text-muted-foreground">Pedir reabastecimiento de insumo</p>
              </div>
            </div>
            
            <form onSubmit={submitRestock} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Cantidad Solicitada</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockCantidad}
                  onChange={(e) => setRestockCantidad(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej. 100"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
