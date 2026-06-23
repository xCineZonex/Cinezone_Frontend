'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Popcorn, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function EditarDulceriaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precioPuntos: '',
    categoria: 'COMBO',
    stock: '',
    requiredTierId: '-1',
    imagen: ''
  });
  
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    fetchTiers();
    if (params.id) {
      fetchProducto(params.id as string);
    }
  }, [params.id]);

  const fetchTiers = async () => {
    try {
      const res = await api.get('/admin/catalogo/niveles-fidelidad');
      setTiers(res.data);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchProducto = async (id: string) => {
    try {
      // Usamos el listado global ya que no hemos expuesto un GET /productos/{id}
      const res = await api.get('/admin/catalogo/productos');
      const producto = res.data.find((p: any) => p.id === parseInt(id, 10));
      
      if (producto) {
        setFormData({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio.toString(),
          precioPuntos: producto.precioPuntos ? producto.precioPuntos.toString() : '',
          categoria: producto.categoria,
          stock: producto.stock !== null ? producto.stock.toString() : '',
          requiredTierId: producto.requiredTier ? producto.requiredTier.id.toString() : '-1',
          imagen: producto.imagen || ''
        });
      } else {
        toast.error('Producto no encontrado');
        router.push('/admin/dulceria');
      }
    } catch (error) {
      console.error('Error fetching producto:', error);
      toast.error('Error al cargar el producto');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.imagen;
      
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        
        const uploadRes = await api.post('/admin/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      }

      await api.put(`/admin/catalogo/productos/${params.id}`, {
        ...formData,
        precio: parseFloat(formData.precio),
        precioPuntos: formData.precioPuntos ? parseInt(formData.precioPuntos, 10) : 0,
        stock: formData.stock ? parseInt(formData.stock, 10) : null,
        requiredTierId: formData.requiredTierId !== '-1' ? parseInt(formData.requiredTierId, 10) : -1,
        imagen: finalImageUrl
      });
      
      toast.success('Producto actualizado exitosamente');
      router.push('/admin/dulceria');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Popcorn className="w-8 h-8 text-primary" /> Editar Producto
        </h1>
        <p className="text-muted-foreground mt-1">Actualiza la información del combo o snack</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nombre del Producto *</label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
              <label className="text-sm font-semibold">Descripción *</label>
              <textarea
                name="descripcion"
                required
                rows={3}
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
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
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Stock (Opcional)</label>
              <input
                type="number"
                min="0"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold">Imagen del Producto *</label>
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {imageFile ? (
                <p className="text-xs text-muted-foreground mt-1">Nuevo seleccionado: {imageFile.name}</p>
              ) : formData.imagen ? (
                <p className="text-xs text-muted-foreground mt-1">Actual: <a href={formData.imagen} target="_blank" rel="noreferrer" className="text-primary hover:underline">Ver imagen</a></p>
              ) : null}
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
              <p className="text-xs text-muted-foreground mt-1">Selecciona si este producto solo puede ser comprado por clientes con cierto nivel de fidelidad.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
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
              {loading ? 'Actualizando...' : (
                <>
                  <Save className="w-5 h-5" /> Actualizar Producto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
