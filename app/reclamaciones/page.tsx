'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReclamacionesPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    email: '',
    telefono: '',
    tipoReclamo: 'RECLAMO',
    sedeId: '',
    detalle: '',
  });

  const [sedes, setSedes] = useState<any[]>([]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await api.get('/public/sedes');
        setSedes(response.data);
      } catch (error) {
        console.error('Error al cargar las sedes:', error);
      }
    };
    fetchSedes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reclamaciones', formData);
      toast.success('Su solicitud ha sido enviada correctamente. Nos comunicaremos con usted a la brevedad.');
      setFormData({
        nombreCompleto: '',
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        email: '',
        telefono: '',
        tipoReclamo: 'RECLAMO',
        sedeId: '',
        detalle: '',
      });
    } catch (error) {
      console.error('Error al enviar el reclamo:', error);
      toast.error('Ocurrió un error al enviar su solicitud. Inténtelo nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6 py-12 space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
        <ChevronLeft className="w-5 h-5" />
        Volver al inicio
      </Link>
      
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Libro de Reclamaciones</CardTitle>
          <CardDescription>
            Conforme al Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones a tu disposición.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
                <input
                  required
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Documento</label>
                <select
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carnet de Extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Documento</label>
                <input
                  required
                  type="text"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="Número de documento"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  required
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="Número de contacto"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Correo Electrónico</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Tipo de Solicitud</label>
                <select
                  name="tipoReclamo"
                  value={formData.tipoReclamo}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                >
                  <option value="RECLAMO">Reclamo (Disconformidad relacionada a los productos o servicios)</option>
                  <option value="QUEJA">Queja (Disconformidad no relacionada a los productos o servicios)</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Sede</label>
                <select
                  required
                  name="sedeId"
                  value={formData.sedeId}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                >
                  <option value="" disabled>Seleccione una sede</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Detalle</label>
                <textarea
                  required
                  name="detalle"
                  value={formData.detalle}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="Describa el detalle de su solicitud aquí..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
