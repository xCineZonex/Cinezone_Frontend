import { MotionDiv } from "@/components/motion-div";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Film, Star, Users } from "lucide-react";

export default function NosotrosPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              Sobre <span className="text-primary">Nosotros</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Somos CineZone, tu destino favorito para disfrutar de la magia del cine con la mejor tecnología, comodidad y servicio de primera.
            </p>
          </MotionDiv>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-4">Nuestra Historia</h2>
              <p className="text-muted-foreground mb-4">
                Fundada con la pasión de llevar el entretenimiento a otro nivel, CineZone nació como una propuesta innovadora para los amantes del séptimo arte.
              </p>
              <p className="text-muted-foreground">
                A lo largo de los años, hemos crecido e incorporado salas IMAX, sonido Dolby Atmos y butacas premium para asegurar que cada visita sea una experiencia inolvidable.
              </p>
            </MotionDiv>
            <MotionDiv
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-secondary/50 rounded-2xl p-8 border border-border"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Film className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Tecnología</h3>
                    <p className="text-sm text-muted-foreground">Proyección láser 4K y sonido envolvente.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Comodidad</h3>
                    <p className="text-sm text-muted-foreground">Butacas reclinables y espacios amplios.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Servicio</h3>
                    <p className="text-sm text-muted-foreground">Atención personalizada y dulcería premium.</p>
                  </div>
                </div>
              </div>
            </MotionDiv>
          </div>


          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-10 text-center">Únete al <span className="text-primary">Club CineZone</span></h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Premiamos tu preferencia con el mejor programa de beneficios. Conoce nuestros tres niveles de membresía y disfruta de promociones exclusivas.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Nivel Azul */}
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="w-24 h-24 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-blue-500 mb-2">SOCIO AZUL</h3>
                <p className="text-sm text-muted-foreground mb-6">Nivel inicial gratuito al registrarte</p>
                <ul className="space-y-3 text-sm text-foreground/80">
                  <li className="flex gap-2"><span>✓</span> Lunes y miércoles a precio de martes</li>
                  <li className="flex gap-2"><span>✓</span> Entrada socio a precio especial (canje 5 pts, lun-vie)</li>
                  <li className="flex gap-2"><span>✓</span> 1 punto por cada entrada comprada</li>
                  <li className="flex gap-2"><span>✓</span> Regalo de cumpleaños: 1 entrada 2D gratis</li>
                  <li className="flex gap-2"><span>✓</span> 5% descuento en dulcería</li>
                  <li className="flex gap-2"><span>✓</span> Combo socio a precio especial (canje 5 pts, lun-vie)</li>
                </ul>
              </div>

              {/* Nivel Dorado */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="w-24 h-24 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-black text-yellow-500 mb-2">SOCIO DORADO</h3>
                <p className="text-sm text-muted-foreground mb-6">Siguiente nivel de beneficios</p>
                <ul className="space-y-3 text-sm text-foreground/80">
                  <li className="flex gap-2 font-semibold text-yellow-400"><span>★</span> Todo lo del nivel Azul, más:</li>
                  <li className="flex gap-2"><span>✓</span> Entrada y combo socio válido todos los días</li>
                  <li className="flex gap-2"><span>✓</span> 10% del gasto en dulcería se convierte en puntos</li>
                  <li className="flex gap-2"><span>✓</span> Cumpleaños: 2 entradas 2D + combo especial (14 días)</li>
                  <li className="flex gap-2"><span>✓</span> Combo Dúo o Trío a precio especial</li>
                  <li className="flex gap-2"><span>✓</span> Acceso a preventas exclusivas</li>
                </ul>
              </div>

              {/* Nivel Negro */}
              <div className="bg-gradient-to-br from-gray-500/20 to-gray-800/20 border border-gray-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-gray-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="w-24 h-24 text-gray-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-200 mb-2">SOCIO NEGRO</h3>
                <p className="text-sm text-muted-foreground mb-6">El nivel máximo de exclusividad</p>
                <ul className="space-y-3 text-sm text-foreground/80">
                  <li className="flex gap-2 font-semibold text-gray-300"><span>★</span> Todo lo del nivel Dorado, más:</li>
                  <li className="flex gap-2"><span>✓</span> 1 entrada 2D gratis cada inicio de mes</li>
                  <li className="flex gap-2"><span>✓</span> Cumpleaños: 2 entradas 2D + combo especial (30 días)</li>
                  <li className="flex gap-2"><span>✓</span> Combo con refill gratis en bebidas</li>
                  <li className="flex gap-2"><span>✓</span> Acceso a estrenos 1 semana antes</li>
                  <li className="flex gap-2"><span>✓</span> Asientos VIP a precio estándar</li>
                </ul>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>

      <Footer />
    </main>
  );
}
