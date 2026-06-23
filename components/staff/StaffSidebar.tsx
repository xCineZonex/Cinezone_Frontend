import React from 'react';
import { LogOut, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';

export default function StaffSidebar({ 
  icon, 
  tooltip, 
  shiftStatus, 
  onRequestCloseShift 
}: { 
  icon: React.ReactNode, 
  tooltip: string, 
  shiftStatus: string, 
  onRequestCloseShift: () => void 
}) {
  const router = useRouter();

  return (
    <div className="w-24 bg-card border-r border-border flex flex-col items-center py-8 gap-8 shadow-xl z-10 shrink-0">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
        CZ
      </div>
      <div className="flex-1 flex flex-col gap-4 w-full px-4">
        <button className="p-4 rounded-2xl bg-primary/10 text-primary flex justify-center w-full relative group">
          {icon}
          <span className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
            {tooltip}
          </span>
        </button>
        
        <button 
          onClick={() => router.push('/staff/ventas')}
          className="p-4 rounded-2xl text-muted-foreground hover:bg-primary/10 hover:text-primary flex justify-center w-full transition-colors relative group"
        >
          <History className="w-6 h-6" />
          <span className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-50">
            Historial de Ventas
          </span>
        </button>
      </div>
      <button 
        onClick={async () => {
          if (shiftStatus === 'ABIERTA') {
            toast.error('Debes cerrar la caja antes de salir.');
            onRequestCloseShift();
            return;
          }
          try {
            await api.post('/users/me/module?module=NONE');
          } catch (e) {}
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('rol');
            localStorage.removeItem('token');
            useCartStore.getState().clearCart();
            router.push('/');
          } catch (error) {
            console.error('Error al cerrar sesión', error);
          }
        }}
        className="p-4 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex justify-center w-full transition-colors relative group"
      >
        <LogOut className="w-6 h-6" />
        <span className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
          Cerrar Sesión
        </span>
      </button>
    </div>
  );
}
