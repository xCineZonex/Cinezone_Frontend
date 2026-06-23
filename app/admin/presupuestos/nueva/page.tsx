'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';

export default function NuevaSolicitudPresupuestoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    sedeId: '',
    amount: '',
    description: ''
  });

  const { assignedSedes } = useSedeStore();

  useEffect(() => {
    // Filtrar la opción 'all' y usar las sedes que le corresponden al usuario (ya calculadas en el layout global)
    const sedesReales = assignedSedes.filter(s => s.id !== 'all');
    setSedes(sedesReales);
  }, [assignedSedes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sedeId || !formData.amount || !formData.description) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/presupuestos', {
        sedeId: Number(formData.sedeId),
        amount: Number(formData.amount),
        description: formData.description
      });
      toast.success('Solicitud enviada al Super Admin');
      router.push('/admin/presupuestos');
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/presupuestos" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground">Solicitar Presupuesto</h1>
          <p className="text-muted-foreground">Envía una petición formal al Super Admin</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Sede Operativa *</label>
              <select
                name="sedeId"
                required
                value={formData.sedeId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
              >
                <option value="">Selecciona la sede...</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Monto Solicitado ($) *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  name="amount"
                  min="1"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ej. 1500.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Justificación y Detalles *</label>
              <textarea
                name="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Explica para qué se utilizará este presupuesto (Mantenimiento, insumos extra, marketing local, etc.)"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link href="/admin/presupuestos">
              <button type="button" className="px-6 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : (
                <>
                  <Save className="w-5 h-5" /> Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
