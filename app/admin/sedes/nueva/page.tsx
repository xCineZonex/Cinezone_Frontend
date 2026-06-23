'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function NuevaSedePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    imagen: ''
  });
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImagenUrl = formData.imagen;

      if (imagenFile) {
        const uploadData = new FormData();
        uploadData.append('file', imagenFile);
        
        const uploadRes = await api.post('/admin/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImagenUrl = uploadRes.data.url;
      }

      await api.post('/admin/catalogo/sedes', {
        ...formData,
        imagen: finalImagenUrl
      });
      toast.success('Sede creada exitosamente');
      router.push('/admin/sedes');
    } catch (error: any) {
      console.error('Error creating sede:', error);
      toast.error(error.response?.data?.message || 'Error al crear la sede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/sedes" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">Nueva Sede</h1>
          <p className="text-muted-foreground">Registra un nuevo complejo de cines</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nombre de la Sede *</label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Ej. Cinezone Plaza Mall"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Ciudad *</label>
              <input
                type="text"
                name="ciudad"
                required
                value={formData.ciudad}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Ej. Lima"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Dirección Completa *</label>
              <input
                type="text"
                name="direccion"
                required
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Av. Principal 123..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Imagen de la Sede (JPG o PNG) *</label>
              <div className="flex items-center gap-4">
                {formData.imagen && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                    <img src={formData.imagen} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => setImagenFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {imagenFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Seleccionado: {imagenFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link href="/admin/sedes">
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
                  <Save className="w-5 h-5" /> Guardar Sede
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
