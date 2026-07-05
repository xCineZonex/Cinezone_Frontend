'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import MovieCard from './movie-card';
import api from '@/lib/api';

const filtros = [
  { id: 'todos', label: 'Todos' },
  { id: 'EN_CARTELERA', label: 'En Cartelera' },
  { id: 'PROXIMAMENTE', label: 'Próximamente' },
  { id: 'PRE_VENTA', label: 'Pre-Venta' },
];

function MovieGridContent() {
  const [peliculas, setPeliculas] = useState<any[]>([]);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const sedeId = searchParams?.get('sede');

  useEffect(() => {
    const fetchPeliculas = async () => {
      setLoading(true);
      try {
        let url = filtroActivo === 'todos' 
          ? '/peliculas' 
          : `/peliculas/estado/${filtroActivo}`;
          
        if (sedeId) {
          url += `?sedeId=${sedeId}`;
        }
          
        const response = await api.get(url);
        setPeliculas(response.data);
      } catch (error) {
        console.error('Error al obtener la cartelera:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPeliculas();
  }, [filtroActivo, sedeId]);

  const peliculasFiltradas = peliculas;

  if (!loading && peliculas.length === 0 && filtroActivo === 'todos') return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4">
            Nuestra <span className="text-primary">Cartelera</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Disfruta de los mejores estrenos y clásicos en la pantalla grande
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {filtros.map((filtro) => (
            <motion.button
              key={filtro.id}
              onClick={() => setFiltroActivo(filtro.id)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filtroActivo === filtro.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {filtro.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Movie Grid */}
        {loading ? (
           <div className="text-center py-16 text-muted-foreground">Cargando cartelera...</div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 items-start"
            layout
          >
            {peliculasFiltradas.map((pelicula, index) => (
              <motion.div
                key={pelicula.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                layout
                className="flex flex-col"
              >
                {/* Asumimos que MovieCard espera las propiedades que manda backend */}
                <MovieCard pelicula={{
                    id: pelicula.id,
                    titulo: pelicula.titulo,
                    genero: pelicula.genero, 
                    duracionMinutos: pelicula.duracionMinutos || 120,
                    clasificacion: pelicula.clasificacion || 'ATP',
                    calificacion: pelicula.calificacion || 4.5,
                    posterUrl: pelicula.posterUrl || '/placeholder.png',
                    estado: pelicula.estado || 'EN_CARTELERA',
                    fechaEstreno: pelicula.fechaEstreno
                }} />
              </motion.div>
            ))}
          </motion.div>

        )}

        {/* Empty State */}
        {!loading && peliculasFiltradas.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground text-lg">
              No hay películas disponibles en esta categoría
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function MovieGrid() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-muted-foreground">Cargando cartelera...</div>}>
      <MovieGridContent />
    </Suspense>
  );
}
