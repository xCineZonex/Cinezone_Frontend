'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, User, Trash2, Edit } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSedeStore } from '@/store/useSedeStore';

export default function AdminUsuariosPage() {
  const { activeSedeId } = useSedeStore();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const userRes = await api.get('/users/me');
        setCurrentUser(userRes.data);
        await fetchUsuarios();
      } catch (error) {
        console.error('Error in init:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar los usuarios');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Usuario eliminado exitosamente');
      fetchUsuarios();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('No se pudo eliminar el usuario');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando usuarios...</div>;
  }

  // Filtrado final: por rol + por contexto de trabajo (activeSedeId)
  const filteredUsers = usuarios.filter((user) => {
    // 1. Reglas de permisos (un ADMIN_SEDE no puede ver SUPER_ADMINs, ni a otros ADMIN_SEDE salvo él mismo)
    if (currentUser?.rol === 'ADMIN_SEDE') {
      if (user.rol === 'SUPER_ADMIN') return false;
      if (user.rol === 'ADMIN_SEDE' && user.id !== currentUser.id) return false;
    }

    // 2. Filtro por Contexto de Trabajo
    if (activeSedeId && activeSedeId !== 'all') {
      // Si el usuario no tiene la sede asignada, no se muestra en este contexto
      if (!user.sedesIds?.includes(Number(activeSedeId))) {
        // Excepción: los SUPER_ADMIN se ven en todos lados (siempre que los permisos lo permitan)
        if (user.rol !== 'SUPER_ADMIN') {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra clientes, staff y administradores del sistema</p>
        </div>
        <Link href="/admin/usuarios/nuevo">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> Registrar Staff
          </button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Celular</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                    No hay usuarios registrados en este contexto.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-foreground">
                        {user.nombre} {user.apellido}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{user.dni}</td>
                  <td className="px-6 py-4">{user.correo}</td>
                  <td className="px-6 py-4">{user.celular}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      user.rol === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-500' :
                      user.rol === 'ADMIN_SEDE' ? 'bg-primary/20 text-primary' :
                      user.rol === 'JEFE_SALA' ? 'bg-purple-500/20 text-purple-500' :
                      user.rol === 'STAFF' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/usuarios/${user.id}/editar`}>
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                    {user.rol !== 'SUPER_ADMIN' && user.rol !== 'ADMIN' && currentUser?.id !== user.id && (
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
