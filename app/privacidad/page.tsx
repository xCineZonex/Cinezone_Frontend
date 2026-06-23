import { FadeIn } from "@/components/fade-in";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <FadeIn>
            <h1 className="text-4xl font-black mb-8 text-center">
              Políticas de <span className="text-primary">Privacidad</span>
            </h1>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">1. Recopilación de Información</h2>
                <p>
                  Recopilamos información personal que usted nos proporciona voluntariamente, como nombre, correo electrónico, número de teléfono y datos de pago al registrarse en el Club CineZone o comprar entradas a través de nuestra plataforma web.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">2. Uso de la Información</h2>
                <p>
                  La información recopilada se utiliza para procesar sus transacciones, gestionar su cuenta del Club CineZone, enviarle boletas electrónicas y, si ha dado su consentimiento, enviarle promociones, boletines informativos y ofertas especiales.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">3. Protección de Datos</h2>
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas diseñadas para proteger su información personal contra el acceso no autorizado, la alteración, divulgación o destrucción. No almacenamos los datos completos de sus tarjetas de crédito o débito.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">4. Compartir con Terceros</h2>
                <p>
                  No vendemos, intercambiamos ni transferimos de ninguna manera su información personal identificable a terceros externos. Esto no incluye a los terceros de confianza que nos asisten en operar nuestro sitio web o llevar a cabo nuestro negocio (como pasarelas de pago), siempre que esas partes acepten mantener esta información confidencial.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">5. Derechos del Usuario</h2>
                <p>
                  Usted tiene derecho a acceder, rectificar, actualizar o solicitar la eliminación de su información personal en cualquier momento. Para ejercer estos derechos, puede comunicarse a través de nuestro correo electrónico de contacto.
                </p>
              </section>

              <p className="text-sm pt-6 border-t border-border mt-8">
                Última actualización: Junio 2026
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      <Footer />
    </main>
  );
}
