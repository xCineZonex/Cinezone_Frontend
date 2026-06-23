'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Mail, MailOpen } from 'lucide-react';
import api from '@/lib/api';

export default function ReclamosInboxPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/admin/reclamos');
      setComplaints(res.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => 
    c.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numeroDocumento.includes(searchTerm)
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" /> Libro de Reclamaciones
          </h1>
          <p className="text-muted-foreground mt-1">Bandeja de entrada de quejas y reclamos de clientes</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por cliente, email o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando bandeja...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-medium">
                      {new Date(c.fechaReclamo).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{c.nombreCompleto}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold">
                        {c.tipoReclamo}
                      </span>
                    </td>
                    <td className="p-4">
                      {c.estado === 'PENDIENTE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold">
                          <Mail className="w-3.5 h-3.5" /> Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                          <MailOpen className="w-3.5 h-3.5" /> Respondido
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/admin/reclamos/${c.id}`}>
                        <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg font-semibold transition-colors">
                          {c.estado === 'PENDIENTE' ? 'Responder' : 'Ver Detalles'}
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No se encontraron reclamos en la bandeja.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
