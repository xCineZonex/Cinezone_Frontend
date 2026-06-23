'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Popcorn, Save, Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function NuevaDulceriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precioPuntos: '',
    categoria: 'COMBO',
    requiredTierId: '-1',
    cinemaId: '',
  });
  
  const [tiers, setTiers] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [insumosRequeridos, setInsumosRequeridos] = useState<{insumoId: number, cantidad: number, nombre: string}[]>([]);

  useEffect(() => {
    fetchData();
    fetchInsumos();
  }, []);

  const fetchData = async () => {
    try {
      const [tiersRes, sedesRes] = await Promise.all([
        api.get('/admin/catalogo/niveles-fidelidad').catch(() => ({ data: [] })),
        api.get('/public/sedes').catch(() => ({ data: [] }))
      ]);
      setTiers(tiersRes.data);
      setSedes(sedesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInsumos = async () => {
    try {
      // InventoryController ignores sedeId if it just returns all products that are insumos
      const res = await api.get('/admin/inventory/insumos/sede/0');
      setInsumosDisponibles(res.data);
    } catch (error) {
      console.error('Error fetching insumos:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addInsumo = (insumo: any) => {
    if (insumosRequeridos.some(i => i.insumoId === insumo.id)) {
      toast.error('Este insumo ya fue agregado');
      return;
    }
    setInsumosRequeridos([...insumosRequeridos, { insumoId: insumo.id, cantidad: 1, nombre: insumo.nombre }]);
  };

  const removeInsumo = (index: number) => {
    const newList = [...insumosRequeridos];
    newList.splice(index, 1);
    setInsumosRequeridos(newList);
  };

  const updateInsumo = (index: number, value: string) => {
    const newList = [...insumosRequeridos];
    newList[index].cantidad = parseInt(value) || 1;
    setInsumosRequeridos(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      const payload = {
        ...formData,
        precio: parseFloat(formData.precio || '0'),
        precioPuntos: formData.precioPuntos ? parseInt(formData.precioPuntos, 10) : 0,
        requiredTierId: formData.requiredTierId !== '-1' ? parseInt(formData.requiredTierId, 10) : null,
        esInsumo: false,
        imagen: imageUrl,
        cinemaId: formData.cinemaId ? parseInt(formData.cinemaId, 10) : null,
        stockGenerado: null // Always 0 units globally or locally
      };

      // 1. Crear el Producto (Combo)
      const res = await api.post('/admin/catalogo/productos', payload);
      const newComboId = res.data.id;
      
      // 2. Si hay receta configurada, guardarla explícitamente
      if (insumosRequeridos.length > 0) {
        const recipePayload = {
          comboProductId: newComboId,
          ingredients: insumosRequeridos.map(i => ({
            ingredientProductId: i.insumoId,
            quantity: i.cantidad
          }))
        };
        await api.post('/admin/catalogo/combos/receta', recipePayload);
      }

      toast.success('Combo creado exitosamente con 0 unidades. Los administradores de Sede podrán ensamblarlo desde Inventario.');
      router.push('/admin/dulceria');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Popcorn className="w-8 h-8 text-primary" /> Nuevo Combo
        </h1>
        <p className="text-muted-foreground mt-1">Arma un nuevo combo global con 0 unidades. Cada Sede generará su propio stock ensamblando la receta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Formulario */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Sede (Opcional - Para exclusividad)</label>
                <select
                  name="cinemaId"
                  value={formData.cinemaId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Global (Para todas las Sedes)</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Nombre del Combo *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ej. Combo Mega Familiar"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Categoría *</label>
                <select
                  name="categoria"
                  required
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="COMBO">Combo</option>
                  <option value="POP_CORN">Popcorn (Canchita)</option>
                  <option value="BEBIDA">Bebida</option>
                  <option value="SNACK">Snack</option>
                  <option value="DULCE">Dulce</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Exclusividad (Nivel Requerido)</label>
                <select
                  name="requiredTierId"
                  value={formData.requiredTierId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                >
                  <option value="-1">Público General (No exclusivo)</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      SOCIO: {tier.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Descripción *</label>
                <textarea
                  name="descripcion"
                  required
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="Incluye 1 Popcorn gigante, 2 bebidas medianas..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Precio (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio"
                  required
                  value={formData.precio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Precio en Puntos (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  name="precioPuntos"
                  value={formData.precioPuntos}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ej. 1500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold">Imagen del Combo *</label>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  required
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </div>

            {/* SECCIÓN DE ENSAMBLAJE DE COMBO */}
            <div className="mt-8 p-6 bg-secondary/30 rounded-2xl border border-border">
              <h3 className="text-lg font-bold mb-1">Insumos Requeridos (Receta Global)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define la receta general para todas las sedes. Las sedes solo podrán ensamblar este combo si tienen estos insumos en stock.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                <p className="text-sm text-amber-600 font-medium">
                  💡 <strong>Tip de Cine:</strong> Normalmente solo se agregan los <strong>empaques cuantificables</strong> (ej. Vasos de 16oz, Cajas de Popcorn, Platos).
                </p>
              </div>

              {insumosRequeridos.length > 0 ? (
                <div className="space-y-3">
                  {insumosRequeridos.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center bg-background p-3 rounded-xl border border-border">
                      <div className="flex-1 font-semibold">{item.nombre}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Cant. por combo:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateInsumo(index, e.target.value)}
                          className="w-20 px-3 py-1.5 bg-secondary rounded-lg outline-none text-center"
                        />
                      </div>
                      <button type="button" onClick={() => removeInsumo(index)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold text-center">
                      El combo se creará con 0 unidades. Los Administradores de cada Sede usarán esta receta para generar stock local.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  Aún no has agregado insumos a la receta.
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-end gap-4">
              <Link href="/admin/dulceria">
                <button type="button" className="px-6 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (
                  <>
                    <Save className="w-5 h-5" /> Guardar Combo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lado Derecho: Panel de Insumos Globales */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm sticky top-8 h-[calc(100vh-8rem)] flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary" /> Insumos Globales
            </h2>
            <p className="text-sm text-muted-foreground mb-6 pb-4 border-b border-border">
              Agrega insumos a la receta de este combo.
            </p>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {insumosDisponibles.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm mt-8">No hay insumos registrados en el catálogo.</div>
              ) : (
                insumosDisponibles.map((insumo) => (
                  <div key={insumo.id} className="p-4 bg-secondary/50 rounded-xl border border-border flex justify-between items-center hover:bg-secondary transition-colors">
                    <div>
                      <h4 className="font-bold text-sm">{insumo.nombre}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => addInsumo(insumo)}
                      disabled={insumosRequeridos.some(i => i.insumoId === insumo.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
