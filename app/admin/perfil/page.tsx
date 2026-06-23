'use client';

import { useState } from 'react';
import { Settings, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function MiPerfilPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las nuevas contraseñas no coinciden');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/password/update', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Contraseña actualizada con éxito');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" /> Mi Perfil
        </h1>
        <p className="text-muted-foreground mt-1">Administra la seguridad de tu cuenta de Cinezone</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Panel lateral de información */}
        <div className="col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Administrador</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Mantén tu cuenta segura cambiando tu contraseña regularmente. Evita usar claves de otros sitios web.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Contraseña */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Actualizar Contraseña</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Contraseña Actual *</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Nueva Contraseña *</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Vuelve a escribir la nueva contraseña"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Actualizando...' : (
                    <>
                      <Save className="w-5 h-5" /> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
