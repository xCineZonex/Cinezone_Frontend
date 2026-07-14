'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/useCartStore';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Image from 'next/image';
import { Plus, Minus, ShoppingCart, Popcorn, ArrowRight, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';

interface Sede {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: string;
  stock?: number;
}

const categorias = ['Todos', 'Combos', 'Popcorn', 'Bebidas', 'Snacks'];

export default function DulceriaPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [isTaquilla, setIsTaquilla] = useState(false);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [selectedSede, setSelectedSede] = useState<number | null>(null);
  const [showSedeModal, setShowSedeModal] = useState(false);
  
  const { addSnack, snacks, funcionId, getGranTotal } = useCartStore();

  useEffect(() => {
    const currentRol = localStorage.getItem('rol') || '';
    const isStaffRole = ['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'VALIDADOR', 'PORTERO', 'STAFF'].includes(currentRol);
    setIsTaquilla(isStaffRole);
    
    // Fetch sedes
    const fetchSedes = async () => {
      try {
        const response = await api.get('/public/sedes');
        setSedes(response.data);
        
        if (isStaffRole) {
          try {
            const userRes = await api.get('/users/me');
            if (userRes.data.sedesIds && userRes.data.sedesIds.length > 0) {
              const sId = userRes.data.sedesIds[0];
              setSelectedSede(sId);
              localStorage.setItem('selectedSede', sId.toString());
            } else {
              setShowSedeModal(true);
            }
          } catch (e) {
            console.error('Error fetching user profile for sede', e);
            setShowSedeModal(true);
          }
        } else {
          const storedSede = localStorage.getItem('selectedSede');
          if (storedSede) {
            setSelectedSede(Number(storedSede));
          } else {
            setShowSedeModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching sedes:', error);
      }
    };
    fetchSedes();
  }, []);

  const getProductsUrl = () => {
    if (!selectedSede && showSedeModal) return null;
    const categoryMap: Record<string, string> = {
      'Combos': 'COMBO',
      'Popcorn': 'POP_CORN',
      'Bebidas': 'BEBIDA',
      'Snacks': 'SNACK',
    };
    const mappedCat = categoryMap[categoriaActiva];
    return mappedCat 
      ? `/public/productos?categoria=${mappedCat}${selectedSede ? `&sedeId=${selectedSede}` : ''}` 
      : `/public/productos${selectedSede ? `?sedeId=${selectedSede}` : ''}`;
  };

  const fetcher = async (url: string) => {
    const response = await api.get(url);
    let prods = response.data;
    if (['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'VALIDADOR', 'PORTERO', 'STAFF'].includes(localStorage.getItem('rol') || '')) {
      prods = prods.filter((p: any) => {
        const n = p.nombre.toLowerCase();
        return !n.includes('socio') && !n.includes('azul') && !n.includes('dorado') && !n.includes('negro');
      });
    }
    return prods;
  };

  const { data: productosData, error, isLoading } = useSWR(getProductsUrl(), fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (productosData) {
      setProductos(productosData);
      setLoading(false);
    } else if (isLoading) {
      setLoading(true);
    }
  }, [productosData, isLoading]);

  const handleSelectSede = (sedeId: number) => {
    setSelectedSede(sedeId);
    localStorage.setItem('selectedSede', sedeId.toString());
    setShowSedeModal(false);
  };

  const handleCantidadChange = (id: number, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const handleAddToCart = (producto: Producto) => {
    const cantidad = cantidades[producto.id] || 0;
    if (cantidad <= 0) return;
    
    addSnack({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      imagen: producto.imagen || '/images/popcorn.jpg',
    });
    setCantidades((prev) => ({ ...prev, [producto.id]: 0 }));
  };

  return (
    <main className="min-h-screen pb-32 relative">
      <Navbar />

      {/* Sede Selection Modal */}
      {showSedeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-8 rounded-3xl shadow-2xl max-w-md w-full border border-border m-4"
          >
            <h2 className="text-2xl font-black mb-2 text-center text-foreground">Selecciona tu Cine</h2>
            <p className="text-muted-foreground text-center mb-6">Para mostrarte los productos disponibles en tu ubicación.</p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {sedes.length > 0 ? (
                sedes.map((sede) => (
                  <button
                    key={sede.id}
                    onClick={() => handleSelectSede(sede.id)}
                    className="w-full p-4 text-left rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                  >
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{sede.nombre}</span>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">Cargando cines...</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <div className="pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 text-accent text-sm font-semibold rounded-full border border-primary/30">
                <Popcorn className="w-4 h-4" />
                Dulcería Cinezone
              </div>
              <button 
                onClick={() => {
                  if (!isTaquilla) {
                    setShowSedeModal(true);
                  }
                }}
                disabled={isTaquilla}
                className={`inline-flex items-center gap-2 px-4 py-1.5 ${isTaquilla ? 'bg-secondary/50 cursor-default opacity-80' : 'bg-secondary/80 hover:bg-secondary cursor-pointer'} text-foreground text-sm font-semibold rounded-full border border-border transition-colors shadow-sm`}
              >
                📍 Sede: {selectedSede ? sedes.find(s => s.id === selectedSede)?.nombre || 'Seleccionada' : 'Seleccionar'}
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Compra tus <span className="text-primary">Snacks</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Prepara tu experiencia perfecta. Compra por adelantado y evita las filas.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {categorias.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                  categoriaActiva === cat
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>

          {/* Products Grid */}
          {loading ? (
             <div className="text-center py-16 text-muted-foreground">Cargando catálogo de dulces...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productos.map((producto, index) => {
                const snackInCart = snacks.find(s => s.productoId === producto.id);
                const currentQuantity = snackInCart ? snackInCart.cantidad : 0;

                const handleIncrement = () => {
                  if (producto.stock !== undefined && currentQuantity >= producto.stock) {
                    toast.warning(`Solo hay ${producto.stock} unidades disponibles en esta sede`);
                    return;
                  }
                  if (currentQuantity === 0) {
                    addSnack({
                      productoId: producto.id,
                      nombre: producto.nombre,
                      precio: producto.precio,
                      cantidad: 1,
                      imagen: producto.imagen || '/images/popcorn.jpg',
                    });
                  } else {
                    useCartStore.getState().updateSnackQuantity(producto.id, currentQuantity + 1);
                  }
                };

                const handleDecrement = () => {
                  if (currentQuantity > 0) {
                    useCartStore.getState().updateSnackQuantity(producto.id, currentQuantity - 1);
                  }
                };

                const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  let val = parseInt(e.target.value);
                  if (isNaN(val) || val < 0) val = 0;
                  
                  if (producto.stock !== undefined && val > producto.stock) {
                    toast.warning(`Solo hay ${producto.stock} unidades disponibles en esta sede`);
                    val = producto.stock;
                  }

                  if (val === 0) {
                    if (currentQuantity > 0) {
                      useCartStore.getState().updateSnackQuantity(producto.id, 0);
                    }
                  } else if (currentQuantity === 0) {
                    addSnack({
                      productoId: producto.id,
                      nombre: producto.nombre,
                      precio: producto.precio,
                      cantidad: val,
                      imagen: producto.imagen || '/images/popcorn.jpg',
                    });
                  } else {
                    useCartStore.getState().updateSnackQuantity(producto.id, val);
                  }
                };

                return (
                  <motion.div
                    key={producto.id}
                    className={`bg-card rounded-2xl overflow-hidden border transition-all ${currentQuantity > 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-secondary">
                      <Image
                        src={producto.imagen || '/images/popcorn.jpg'}
                        alt={producto.nombre}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 text-xs font-semibold bg-accent/90 text-accent-foreground rounded-full">
                          {producto.categoria || 'Snacks'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-foreground mb-1">{producto.nombre}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{producto.descripcion}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-2xl font-black text-primary">
                            S/ {(producto.precio * (currentQuantity || 1)).toFixed(2)}
                          </span>
                          {currentQuantity > 1 && <span className="text-[10px] text-muted-foreground">S/ {producto.precio.toFixed(2)} c/u</span>}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center rounded-xl overflow-hidden border ${currentQuantity > 0 ? 'border-primary bg-primary/10' : 'border-border bg-secondary'}`}>
                            <button
                              onClick={handleDecrement}
                              disabled={currentQuantity === 0}
                              className="p-3 hover:bg-black/10 disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={currentQuantity === 0 ? '' : currentQuantity}
                              onChange={handleInputChange}
                              className="w-12 bg-transparent text-center font-bold outline-none text-foreground border-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              onClick={handleIncrement}
                              className="p-3 hover:bg-black/10 transition-colors text-primary"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Barra de Acción Inferior */}
      {(funcionId || snacks.length > 0) && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-40"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()}
                className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-tighter">Total Acumulado</p>
                <div className="text-3xl font-black text-primary">
                  S/ {getGranTotal().toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <p className="text-xs text-muted-foreground text-center md:text-right max-w-[200px]">
                {snacks.length > 0 
                  ? 'Puedes seguir agregando productos o continuar al pago.' 
                  : 'La dulcería es opcional. Puedes continuar al pago sin agregar snacks.'}
              </p>
              <button
                onClick={() => router.push('/checkout/pago')}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg rounded-2xl transition-all shadow-xl shadow-primary/20"
              >
                Continuar al Pago <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <Footer />
    </main>
  );
}
