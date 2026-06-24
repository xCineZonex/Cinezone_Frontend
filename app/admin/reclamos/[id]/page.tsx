'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, FileText, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ResponderReclamoPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  // Safe unwrapping for Next.js 15+
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await api.get('/admin/reclamos');
      const found = res.data.find((c: any) => c.id.toString() === id);
      if (found) setComplaint(found);
    } catch (error) {
      console.error('Error fetching complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      await api.put(`/admin/reclamos/${id}/responder`, {
        respuestaAdmin: replyText
      });
      toast.success('Respuesta enviada al cliente');
      fetchComplaint(); // Recargar para ver estado RESPONDIDO
    } catch (error: any) {
      console.error('Error enviando respuesta:', error);
      toast.error(error.response?.data?.message || 'Error al enviar la respuesta');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando información...</div>;
  if (!complaint) return <div className="p-8 text-center text-destructive">Reclamo no encontrado</div>;

  const isResponded = complaint.estado === 'RESPONDIDO';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/admin/reclamos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Volver a Bandeja
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Detalle del {complaint.tipoReclamo === 'QUEJA' ? 'Queja' : 'Reclamo'} #{complaint.id}
          </h1>
          <p className="text-muted-foreground mt-1">
            Recibido el {new Date(complaint.fechaReclamo).toLocaleString()}
          </p>
        </div>
        <div>
          {isResponded ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold">
              <CheckCircle2 className="w-5 h-5" /> Respondido
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-xl font-bold">
              Pendiente de Respuesta
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info del Cliente */}
        <div className="col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b border-border pb-3">Datos del Cliente</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Nombre Completo</div>
                  <div className="font-semibold">{complaint.nombreCompleto}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{complaint.tipoDocumento}</div>
                  <div className="font-semibold">{complaint.numeroDocumento}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Correo Electrónico</div>
                  <div className="font-semibold break-all">{complaint.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Teléfono</div>
                  <div className="font-semibold">{complaint.telefono}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje y Respuesta */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Mensaje Original</h2>
            <div className="p-6 bg-muted/30 rounded-xl text-foreground whitespace-pre-wrap leading-relaxed border border-border">
              {complaint.detalle}
            </div>
          </div>

          <div className={`bg-card border ${isResponded ? 'border-emerald-500/20' : 'border-primary/20'} rounded-2xl p-8 shadow-sm`}>
            <h2 className="text-lg font-bold mb-4">
              {isResponded ? 'Historial de Respuesta' : 'Redactar Respuesta'}
            </h2>
            
            {isResponded ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Enviado el {new Date(complaint.fechaRespuesta).toLocaleString()} por el Administrador.
                </p>
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-foreground whitespace-pre-wrap leading-relaxed">
                  {complaint.respuestaAdmin}
                </div>
              </div>
            ) : (
              <form onSubmit={handleReply} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  El cliente recibirá esta respuesta mediante un correo electrónico oficial de CineZone.
                </p>
                <textarea
                  required
                  rows={6}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="Estimado cliente, lamentamos el inconveniente. Por favor indíquenos su número de cuenta para proceder con la devolución..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {sending ? 'Enviando...' : (
                      <>
                        <Send className="w-5 h-5" /> Enviar al Correo
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
