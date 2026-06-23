'use client';

import { motion } from 'framer-motion';
import { Sofa, Zap, Headphones, Sparkles, Monitor, Star } from 'lucide-react';

const features = [
  {
    icon: Monitor,
    title: 'Proyección 4K Láser',
    description: 'Tecnología de proyección de última generación para imágenes nítidas y brillantes',
  },
  {
    icon: Headphones,
    title: 'Dolby Atmos',
    description: 'Sonido envolvente que te sumerge completamente en la película',
  },
  {
    icon: Sofa,
    title: 'Butacas Reclinables',
    description: 'Asientos premium con reclinación eléctrica y amplio espacio',
  },
  {
    icon: Zap,
    title: 'Salas 4DX',
    description: 'Movimiento, agua, viento y aromas sincronizados con la película',
  },
  {
    icon: Star,
    title: 'Salas VIP',
    description: 'Experiencia exclusiva con servicio de comida gourmet a tu asiento',
  },
  {
    icon: Sparkles,
    title: 'IMAX',
    description: 'La pantalla más grande y el sonido más potente para épicas cinematográficas',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4">
            La Mejor <span className="text-primary">Experiencia</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tecnología de punta y comodidad excepcional en cada una de nuestras salas
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative p-6 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>

              {/* Decorative gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
