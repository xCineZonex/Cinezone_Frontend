'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Popcorn, CheckCircle, XCircle, Trash2, Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';

export default function DulceriaPage() {
  const { activeSedeId } = useSedeStore();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sedeStocks, setSedeStocks] = useState<any[]>([]);

  // Ensamblar Combo
  const [showEnsamblarModal, setShowEnsamblarModal] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<any>(null);
  const [ensamblajeCantidad, setEnsamblajeCantidad] = useState('');
  const [isAssembling, setIsAssembling] = useState(false);
  const [comboRecipe, setComboRecipe] = useState<any[]>([]);
  const [maxCombos, setMaxCombos] = useState<number | null>(null);

  // Precio Local
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedPriceCombo, setSelectedPriceCombo] = useState<any>(null);
  const [precioLocal, setPrecioLocal] = useState('');
  const [isSettingPrice, setIsSettingPrice] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('rol');
    setUserRole(role);
    fetchProductos();
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

  const toggleSedeStock = async (productId: number) => {
     if (!activeSedeId || activeSedeId === 'all') return;
     try {
        await api.patch(`/admin/inventory/stock/${productId}/sede/${activeSedeId}/toggle`);
        fetchSedeStocks(Number(activeSedeId));
     } catch (err) {
        console.error('Error toggling sede stock:', err);
     }
  };

  const fetchProductos = async () => {
    try {
      const res = await api.get('/admin/catalogo/productos?esInsumo=false');
      setProductos(res.data);
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id: number, actual: boolean) => {
    try {
      await api.patch(`/admin/catalogo/productos/${id}/estado?disponible=${!actual}`);
      fetchProductos();
    } catch (error) {
      console.error('Error toggling estado:', error);
    }
  };

  const handleEnsamblar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCombo || !activeSedeId || activeSedeId === 'all') {
      toast.error('Seleccione un combo y asegúrese de tener una sede activa seleccionada');
      return;
    }
    
    if (!ensamblajeCantidad || Number(ensamblajeCantidad) <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    setIsAssembling(true);
    try {
      await api.post(`/admin/catalogo/productos/${selectedCombo.id}/generar-stock?stockGenerado=${ensamblajeCantidad}&sedeId=${activeSedeId}`);
      toast.success('Combo ensamblado y stock actualizado');
      setShowEnsamblarModal(false);
      setEnsamblajeCantidad('');
      fetchProductos();
      fetchSedeStocks(Number(activeSedeId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al ensamblar combo');
    } finally {
      setIsAssembling(false);
    }
  };

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceCombo || !activeSedeId || activeSedeId === 'all') {
      toast.error('Asegúrese de tener una sede activa seleccionada');
      return;
    }

    if (!precioLocal || Number(precioLocal) < 0) {
      toast.error('Ingrese un precio válido');
      return;
    }

    setIsSettingPrice(true);
    try {
      await api.patch(`/admin/inventory/stock/${selectedPriceCombo.id}/sede/${activeSedeId}/precio?precioLocal=${precioLocal}`);
      toast.success('Precio local actualizado');
      setShowPriceModal(false);
      setPrecioLocal('');
      fetchSedeStocks(Number(activeSedeId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar precio local');
    } finally {
      setIsSettingPrice(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Popcorn className="w-8 h-8 text-primary" /> Dulcería
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona los combos, snacks y bebidas</p>
        </div>
        {userRole === 'SUPER_ADMIN' && (
          <Link href="/admin/dulceria/nueva">
            <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> Nuevo Producto
            </button>
          </Link>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando productos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 font-semibold text-muted-foreground">Producto</th>
                  <th className="p-4 font-semibold text-muted-foreground">Categoría</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">Precio</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">Stock</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">Estado</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Popcorn className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold">{prod.nombre}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{prod.descripcion}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold">
                        {prod.categoria}
                      </span>
                      {prod.requiredTier && (
                        <span className="ml-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-semibold" title={prod.requiredTier.name}>
                          {prod.requiredTier.name === 'Azul' ? 'Socio' : `Socio ${prod.requiredTier.name}`}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center font-semibold">
                      {activeSedeId !== 'all' ? (() => {
                        const stock = sedeStocks.find(s => s.product.id === prod.id);
                        const localPrice = stock?.precioLocal;
                        return (
                          <div>
                            <div>S/ {localPrice ? Number(localPrice).toFixed(2) : prod.precio.toFixed(2)}</div>
                            {localPrice && localPrice !== prod.precio && (
                              <div className="text-xs text-muted-foreground line-through">S/ {prod.precio.toFixed(2)}</div>
                            )}
                            {prod.precioPuntos > 0 && (
                              <div className="text-xs text-amber-500 mt-0.5">{prod.precioPuntos} pts</div>
                            )}
                          </div>
                        );
                      })() : (
                        <div>
                          <div>S/ {prod.precio.toFixed(2)}</div>
                          {prod.precioPuntos > 0 && (
                            <div className="text-xs text-amber-500 mt-0.5">{prod.precioPuntos} pts</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {prod.stock || 'Ilimitado'}
                    </td>
                    <td className="p-4 text-center">
                      {activeSedeId !== 'all' ? (() => {
                         const stock = sedeStocks.find(s => s.product.id === prod.id);
                         const isSedeActive = stock ? stock.isActive : true;
                         return isSedeActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> Activo en Sede
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold">
                              <XCircle className="w-3.5 h-3.5" /> Inactivo en Sede
                            </span>
                         );
                      })() : prod.disponible ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {activeSedeId === 'all' && userRole === 'SUPER_ADMIN' ? (
                          <>
                            <button 
                              onClick={() => toggleEstado(prod.id, prod.disponible)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                prod.disponible ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              }`}
                            >
                              {prod.disponible ? 'Desactivar' : 'Activar'}
                            </button>
                            <Link href={`/admin/dulceria/${prod.id}/editar`}>
                              <button className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors" title="Editar">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Link>
                            <button 
                              onClick={async () => {
                                if(confirm('¿Estás seguro de que deseas eliminar este producto permanentemente? Esto no se puede deshacer.')) {
                                  try {
                                    await api.delete(`/admin/catalogo/productos/${prod.id}`);
                                    fetchProductos();
                                  } catch (error: any) {
                                    alert(error.response?.data?.message || 'No se puede eliminar el producto porque tiene ventas asociadas. Desactívalo en su lugar.');
                                  }
                                }
                              }}
                              className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-white transition-colors" 
                              title="Eliminar permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : activeSedeId !== 'all' ? (
                          <div className="flex flex-col gap-2 w-full">
                            <button 
                              onClick={() => toggleSedeStock(prod.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                              Alternar Estado en Sede
                            </button>
                            {prod.categoria === 'COMBO' && (
                              <button 
                                onClick={async () => {
                                  setSelectedCombo(prod);
                                  setEnsamblajeCantidad('');
                                  setComboRecipe([]);
                                  setMaxCombos(null);
                                  setShowEnsamblarModal(true);
                                  // Fetch recipe
                                  try {
                                    const res = await api.get(`/admin/catalogo/combos/${prod.id}/receta`);
                                    const recipe = res.data;
                                    setComboRecipe(recipe);
                                    
                                    // Calculate max combos
                                    let max = Infinity;
                                    recipe.forEach((ing: any) => {
                                      const sStock = sedeStocks.find(s => s.product.id === ing.ingredientProductId);
                                      const available = sStock ? sStock.stock : 0;
                                      const possible = Math.floor(available / ing.quantity);
                                      if (possible < max) max = possible;
                                    });
                                    setMaxCombos(max === Infinity ? 0 : max);
                                  } catch (err) {
                                    console.error('Error fetching recipe', err);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                              >
                                <Package className="w-3.5 h-3.5" /> Ensamblar
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedPriceCombo(prod);
                                const stock = sedeStocks.find(s => s.product.id === prod.id);
                                setPrecioLocal(stock?.precioLocal ? stock.precioLocal.toString() : prod.precio.toString());
                                setShowPriceModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Precio Local
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Seleccione una sede específica para ver acciones locales</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay productos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEnsamblarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" /> Ensamblar Combo
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedCombo?.nombre}
            </p>
            <form onSubmit={handleEnsamblar} className="space-y-4">
              {comboRecipe.length > 0 ? (
                <div className="bg-secondary/50 rounded-xl p-4 mb-4 border border-border">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">Receta del Combo</h3>
                  <div className="space-y-2">
                    {comboRecipe.map(ing => {
                      const sStock = sedeStocks.find(s => s.product.id === ing.ingredientProductId);
                      const available = sStock ? sStock.stock : 0;
                      const hasEnough = available >= ing.quantity;
                      return (
                        <div key={ing.ingredientProductId} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <div>
                            <span className="font-semibold">{ing.nombre}</span>
                            <span className="text-muted-foreground ml-2">x{ing.quantity} unid.</span>
                          </div>
                          <div className={`font-semibold ${hasEnough ? 'text-emerald-500' : 'text-destructive'}`}>
                            Stock: {available}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted-foreground">Máximo posible:</span>
                    <span className={`font-black text-lg ${maxCombos && maxCombos > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {maxCombos} combos
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mb-4 italic">Cargando receta...</div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">Cantidad a ensamblar</label>
                <input
                  type="number"
                  min="1"
                  max={maxCombos || undefined}
                  required
                  value={ensamblajeCantidad}
                  onChange={(e) => setEnsamblajeCantidad(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  placeholder={`Ej. ${maxCombos ? Math.min(10, maxCombos) : 10}`}
                  disabled={maxCombos === 0}
                />
                {maxCombos === 0 && (
                  <p className="text-xs text-destructive mt-2 font-medium">No tienes suficiente stock de insumos para ensamblar este combo.</p>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEnsamblarModal(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAssembling}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  {isAssembling ? 'Guardando...' : 'Ensamblar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" /> Editar Precio Local
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedPriceCombo?.nombre}
            </p>
            <form onSubmit={handleSetPrice} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nuevo Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={precioLocal}
                  onChange={(e) => setPrecioLocal(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ej. 25.50"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSettingPrice}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  {isSettingPrice ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
