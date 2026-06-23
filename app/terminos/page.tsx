"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black mb-4">
                Términos y <span className="text-primary">Condiciones</span>
              </h1>
              <p className="text-muted-foreground uppercase tracking-widest text-sm font-bold">
                DE VENTA E INGRESO A SALAS DE CINE
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Última actualización: Junio 2026
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-10 text-muted-foreground leading-relaxed shadow-xl">
              
              <p className="text-foreground/80 font-medium">
                Los presentes Términos y Condiciones regulan la compra de entradas, el acceso a las instalaciones y el uso de los servicios ofrecidos por CineZone (en adelante, el "Cine"). Al adquirir una entrada o hacer uso de los servicios del Cine, el usuario acepta íntegramente las disposiciones establecidas en este documento.
              </p>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">1. COMPRA DE ENTRADAS</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">1.1.</span> Las entradas son válidas únicamente para la película, fecha, horario, formato, sala y asiento seleccionados al momento de la compra.</li>
                  <li><span className="font-bold text-primary mr-2">1.2.</span> El cliente es responsable de verificar la información de su compra antes de confirmar la transacción.</li>
                  <li><span className="font-bold text-primary mr-2">1.3.</span> Todas las compras están sujetas a disponibilidad de aforo y asientos.</li>
                  <li><span className="font-bold text-primary mr-2">1.4.</span> El Cine podrá establecer límites máximos de compra por transacción, usuario o promoción.</li>
                  <li><span className="font-bold text-primary mr-2">1.5.</span> Las entradas podrán emitirse en formato físico o digital y deberán conservarse en buen estado para su validación.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">2. VALIDACIÓN DE ENTRADAS</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">2.1.</span> Para ingresar a la sala, el cliente deberá presentar una entrada válida, código QR o comprobante de compra emitido por el Cine.</li>
                  <li><span className="font-bold text-primary mr-2">2.2.</span> El Cine podrá solicitar la presentación de un documento oficial de identidad para verificar la titularidad de la entrada o el cumplimiento de requisitos asociados a promociones o tarifas especiales.</li>
                  <li><span className="font-bold text-primary mr-2">2.3.</span> Las entradas alteradas, duplicadas, falsificadas o adquiridas mediante medios fraudulentos serán anuladas sin derecho a reembolso.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">3. TARIFAS PREFERENCIALES Y BENEFICIOS ESPECIALES</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">3.1.</span> Las tarifas promocionales o preferenciales están sujetas al cumplimiento de los requisitos establecidos por el Cine.</li>
                  <li><span className="font-bold text-primary mr-2">3.2.</span> Los clientes que adquieran entradas con descuentos destinados a personas con discapacidad, estudiantes, niños, adultos mayores, convenios corporativos u otros beneficios deberán acreditar dicha condición mediante la documentación correspondiente (DNI) cuando sea requerida por el personal de portería.</li>
                  <li><span className="font-bold text-primary mr-2">3.3.</span> En el caso de beneficios destinados a personas con discapacidad, el cliente deberá presentar el documento acreditativo vigente exigido por la normativa aplicable o por las políticas del Cine.</li>
                  <li><span className="font-bold text-primary mr-2">3.4.</span> El Cine podrá verificar el cumplimiento de los requisitos antes, durante o después de la compra, así como al momento del ingreso.</li>
                  <li>
                    <span className="font-bold text-primary mr-2">3.5.</span> Si el cliente no presenta la documentación requerida para acreditar el beneficio utilizado, el Cine podrá:
                    <ul className="list-disc pl-10 mt-2 space-y-1">
                      <li>Denegar la aplicación del descuento.</li>
                      <li>Solicitar el pago de la diferencia entre la tarifa preferencial y la tarifa regular vigente en la caja presencial (Taquilla).</li>
                      <li>Denegar el ingreso hasta que se regularice la situación.</li>
                      <li>Anular la transacción cuando existan indicios de uso indebido del beneficio.</li>
                    </ul>
                  </li>
                  <li><span className="font-bold text-primary mr-2">3.6.</span> El uso indebido de tarifas preferenciales podrá generar la restricción temporal o permanente del acceso a promociones futuras.</li>
                </ul>

                <div className="mt-6 p-6 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl">
                  <h3 className="font-black text-red-500 mb-2">CLÁUSULA ESPECÍFICA CONADIS</h3>
                  <p className="text-red-400 font-medium">
                    El beneficio tarifario destinado a personas con discapacidad es personal e intransferible. El Cine podrá solicitar la presentación del Carné CONADIS, certificado de discapacidad u otro documento legalmente válido para acreditar el beneficio. La falta de presentación de la documentación requerida facultará al Cine a exigir el pago de la diferencia respecto de la tarifa regular vigente o a denegar el acceso al beneficio, sin perjuicio de otras medidas aplicables en caso de uso indebido o fraudulento.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">4. PROMOCIONES Y PROGRAMA DE FIDELIDAD</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">4.1.</span> Las promociones tienen vigencia limitada y podrán estar sujetas a restricciones de horario, formato, película, sala o ubicación.</li>
                  <li><span className="font-bold text-primary mr-2">4.2.</span> Salvo indicación expresa, las promociones no son acumulables entre sí.</li>
                  <li><span className="font-bold text-primary mr-2">4.3.</span> El Cine se reserva el derecho de modificar, suspender o cancelar promociones por razones operativas, comerciales o legales.</li>
                  <li><span className="font-bold text-primary mr-2">4.4.</span> Toda promoción estará sujeta a disponibilidad y a los términos específicos que la regulen.</li>
                  <li><span className="font-bold text-primary mr-2">4.5.</span> <strong>Club CineZone:</strong> La acumulación de puntos es exclusiva para cuentas de usuario validadas. Las compras directas o anónimas en Taquilla/Dulcería no suman puntos ni nivel.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">5. CAMBIOS, CANCELACIONES Y REEMBOLSOS</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">5.1.</span> Los cambios o devoluciones se regirán por la normativa vigente y las políticas internas del Cine.</li>
                  <li><span className="font-bold text-primary mr-2">5.2.</span> No procederán devoluciones por errores atribuibles al cliente en la selección de película, horario, formato, fecha o asiento, salvo disposición legal en contrario.</li>
                  <li><span className="font-bold text-primary mr-2">5.3.</span> Cuando una función sea cancelada por causas atribuibles al Cine, el cliente podrá solicitar el reembolso correspondiente o la reprogramación de su entrada.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">6. INGRESO Y PERMANENCIA EN LAS INSTALACIONES</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">6.1.</span> Todo asistente deberá respetar las normas de convivencia, seguridad e higiene establecidas por el Cine.</li>
                  <li>
                    <span className="font-bold text-primary mr-2">6.2.</span> Se prohíbe:
                    <ul className="list-disc pl-10 mt-2 space-y-1">
                      <li>Grabar, fotografiar o reproducir total o parcialmente las películas exhibidas.</li>
                      <li>Alterar el orden o perturbar la experiencia de otros asistentes.</li>
                      <li>Ingresar bajo efectos evidentes de alcohol o sustancias que comprometan la seguridad.</li>
                      <li>Dañar las instalaciones o bienes del establecimiento.</li>
                    </ul>
                  </li>
                  <li><span className="font-bold text-primary mr-2">6.3.</span> El Cine podrá solicitar el retiro de cualquier persona que incumpla estas disposiciones, sin derecho a reembolso.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">7. MENORES DE EDAD</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">7.1.</span> El ingreso a las funciones estará sujeto a la clasificación por edades de cada película.</li>
                  <li><span className="font-bold text-primary mr-2">7.2.</span> Los menores de edad deberán cumplir las restricciones establecidas por la normativa vigente.</li>
                  <li><span className="font-bold text-primary mr-2">7.3.</span> Los padres, tutores o responsables legales serán responsables de la supervisión y conducta de los menores a su cargo.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">8. ALIMENTOS Y BEBIDAS</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">8.1.</span> El ingreso de alimentos y bebidas estará sujeto a la normativa aplicable y a las políticas publicadas por el Cine.</li>
                  <li><span className="font-bold text-primary mr-2">8.2.</span> Por razones de seguridad e higiene, podrán restringirse productos que representen riesgos para los asistentes o para las instalaciones.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">9. SEGURIDAD</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">9.1.</span> El Cine podrá implementar medidas razonables de control y seguridad para proteger a clientes, trabajadores e instalaciones.</li>
                  <li><span className="font-bold text-primary mr-2">9.2.</span> Se encuentra prohibido el ingreso de objetos peligrosos, sustancias ilícitas o cualquier elemento que represente un riesgo para terceros.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">10. PROTECCIÓN DE DATOS PERSONALES</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">10.1.</span> Los datos personales proporcionados por los usuarios serán tratados conforme a la legislación vigente en materia de protección de datos personales.</li>
                  <li><span className="font-bold text-primary mr-2">10.2.</span> El usuario autoriza el tratamiento de sus datos para fines operativos, administrativos, comerciales y de atención al cliente, de acuerdo con la Política de Privacidad del Cine.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">11. DERECHO DE ADMISIÓN</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">11.1.</span> El Cine podrá ejercer el derecho de admisión conforme a la legislación vigente y sin incurrir en prácticas discriminatorias.</li>
                  <li><span className="font-bold text-primary mr-2">11.2.</span> El ejercicio del derecho de admisión tendrá como finalidad preservar la seguridad, el orden y la adecuada prestación del servicio.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">12. RESPONSABILIDAD</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">12.1.</span> El Cine no será responsable por pérdidas, robos o daños de bienes personales de los asistentes, salvo cuando exista responsabilidad legal comprobada.</li>
                  <li><span className="font-bold text-primary mr-2">12.2.</span> La responsabilidad del Cine estará limitada a lo establecido por la legislación aplicable.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">13. MODIFICACIONES</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">13.1.</span> El Cine podrá modificar los presentes Términos y Condiciones en cualquier momento.</li>
                  <li><span className="font-bold text-primary mr-2">13.2.</span> Las modificaciones serán publicadas a través de los canales oficiales y entrarán en vigor desde su publicación, salvo disposición distinta.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black text-foreground border-b border-border pb-2">14. LEGISLACIÓN APLICABLE</h2>
                <ul className="space-y-2 list-none pl-0">
                  <li><span className="font-bold text-primary mr-2">14.1.</span> Los presentes Términos y Condiciones se interpretarán y ejecutarán conforme a las leyes de la República del Perú.</li>
                  <li><span className="font-bold text-primary mr-2">14.2.</span> Cualquier controversia derivada de su aplicación será resuelta conforme a los mecanismos previstos por la legislación peruana vigente.</li>
                </ul>
              </section>

            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
