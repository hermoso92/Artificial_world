
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Database, Users, CheckCircle, Zap, Shield } from 'lucide-react';

const TechnicalPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Documentación Técnica - Artificial Word</title>
        <meta name="description" content="Documentación técnica del motor de IA de Artificial Word: sistema basado en utilidad, memoria persistente, relaciones sociales y determinismo." />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:text-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-lg">Artificial Word</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Documentación Técnica
          </h1>
          <p className="text-xl text-muted-foreground">
            Cómo funciona el motor de IA
          </p>
        </div>
      </section>

      {/* Technical Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* Motor basado en utilidad */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Cpu className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Motor basado en utilidad</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Artificial Word utiliza un sistema de decisión basado en utilidad, donde cada NPC evalúa múltiples acciones posibles y selecciona la que maximiza su utilidad en función de sus necesidades actuales, estado emocional y contexto del entorno.
                </p>
                <p>
                  A diferencia de los LLMs que generan respuestas probabilísticas, nuestro motor calcula puntuaciones deterministas para cada acción disponible. Esto significa que dado el mismo estado del mundo y del NPC, siempre se tomará la misma decisión, permitiendo reproducibilidad total y debugging eficiente.
                </p>
                <div className="bg-secondary p-4 rounded-lg border border-border">
                  <p className="font-mono text-sm text-foreground">
                    <span className="text-accent">Utilidad(acción)</span> = f(necesidades, memoria, relaciones, contexto)
                  </p>
                </div>
                <p>
                  El sistema evalúa factores como hambre, sed, seguridad, objetivos a largo plazo, y relaciones sociales para determinar la acción óptima en cada momento.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sistema de memoria */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Database className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Sistema de memoria</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Cada NPC mantiene una memoria persistente estructurada que almacena información sobre:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Recursos descubiertos:</strong> Ubicaciones de comida, agua, materiales y refugios</li>
                  <li><strong>Entidades conocidas:</strong> Otros NPCs, criaturas, y objetos importantes del mundo</li>
                  <li><strong>Eventos significativos:</strong> Interacciones pasadas, amenazas encontradas, logros alcanzados</li>
                  <li><strong>Conocimiento espacial:</strong> Mapas mentales de áreas exploradas y rutas seguras</li>
                </ul>
                <p>
                  La memoria se organiza por relevancia temporal y emocional. Los eventos recientes y emocionalmente intensos tienen mayor peso en las decisiones, mientras que información antigua se degrada gradualmente, simulando el olvido natural.
                </p>
                <div className="bg-secondary p-4 rounded-lg border border-border space-y-2">
                  <p className="font-semibold text-foreground">Ejemplo de entrada de memoria:</p>
                  <p className="font-mono text-sm text-foreground">
                    {`{`}<br />
                    &nbsp;&nbsp;<span className="text-accent">"tipo"</span>: "recurso_descubierto",<br />
                    &nbsp;&nbsp;<span className="text-accent">"objeto"</span>: "fuente_agua",<br />
                    &nbsp;&nbsp;<span className="text-accent">"ubicación"</span>: [125, 67],<br />
                    &nbsp;&nbsp;<span className="text-accent">"timestamp"</span>: 1847,<br />
                    &nbsp;&nbsp;<span className="text-accent">"relevancia"</span>: 0.95<br />
                    {`}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Relaciones sociales */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Relaciones sociales</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Cada NPC mantiene un grafo de relaciones con otros personajes, donde cada relación se caracteriza por múltiples dimensiones:
                </p>
                <div className="grid sm:grid-cols-3 gap-4 my-6">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">Confianza</h3>
                    <p className="text-sm">Aumenta con interacciones positivas, compartir recursos, y ayuda mutua. Disminuye con traiciones o engaños.</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">Miedo</h3>
                    <p className="text-sm">Se desarrolla tras amenazas, agresiones o demostraciones de poder. Afecta comportamiento defensivo.</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">Hostilidad</h3>
                    <p className="text-sm">Surge de conflictos, competencia por recursos o daño directo. Puede escalar a agresión activa.</p>
                  </div>
                </div>
                <p>
                  Las relaciones evolucionan orgánicamente basándose en interacciones. Un NPC que comparte comida repetidamente ganará confianza, mientras que uno que roba recursos generará hostilidad. Estas dinámicas crean narrativas emergentes sin necesidad de scripting manual.
                </p>
                <p>
                  El sistema también modela relaciones indirectas: si el NPC A confía en B, y B confía en C, entonces A tendrá una predisposición inicial positiva hacia C, aunque nunca se hayan encontrado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Determinismo */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Determinismo</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  El comportamiento determinista es una característica fundamental de Artificial Word que lo diferencia radicalmente de sistemas basados en LLMs:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Reproducibilidad total:</strong> Dado el mismo estado inicial y secuencia de eventos, el comportamiento será idéntico en cada ejecución</li>
                  <li><strong>Debugging eficiente:</strong> Los diseñadores pueden reproducir exactamente cualquier situación para analizar y ajustar comportamientos</li>
                  <li><strong>Testing automatizado:</strong> Posibilidad de crear tests de regresión que verifican comportamientos específicos</li>
                  <li><strong>Control creativo:</strong> Los diseñadores saben exactamente qué causó cada decisión y pueden ajustar parámetros con precisión</li>
                </ul>
                <p>
                  Esto no significa que los NPCs sean predecibles para los jugadores. La complejidad emerge de la interacción entre múltiples sistemas (necesidades, memoria, relaciones, entorno), creando comportamientos ricos y variados que responden de forma coherente al mundo del juego.
                </p>
                <div className="bg-accent/5 border-l-4 border-accent p-4 rounded">
                  <p className="text-foreground font-semibold mb-2">Ventaja clave para desarrollo:</p>
                  <p>
                    Los diseñadores pueden usar herramientas de replay para ver exactamente por qué un NPC tomó una decisión específica, ajustar parámetros, y verificar inmediatamente el impacto del cambio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ventajas vs LLMs */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Ventajas vs LLMs</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Performance y escalabilidad
                    </h3>
                    <p>
                      Mientras que un LLM puede tardar 100-500ms en generar una respuesta para un solo NPC, Artificial Word puede procesar decisiones para cientos de NPCs en menos de 16ms (un frame a 60 FPS). Esto permite mundos densamente poblados sin comprometer el rendimiento.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Coste cero de operación
                    </h3>
                    <p>
                      Sin llamadas a APIs externas ni costes por token. El motor corre completamente local, eliminando dependencias de servicios de terceros y costes recurrentes. Ideal para estudios indie con presupuestos limitados.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Control total del diseñador
                    </h3>
                    <p>
                      Los LLMs son cajas negras impredecibles. Artificial Word expone cada factor que influye en una decisión, permitiendo ajustes precisos. Los diseñadores definen exactamente cómo los NPCs priorizan necesidades, valoran relaciones, y responden a eventos.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Memoria persistente real
                    </h3>
                    <p>
                      Los LLMs tienen ventanas de contexto limitadas y "olvidan" información fuera de ellas. Artificial Word mantiene memoria estructurada ilimitada que persiste entre sesiones, permitiendo que los NPCs recuerden eventos de hace horas de juego y construyan relaciones a largo plazo.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      Sin dependencias externas
                    </h3>
                    <p>
                      Tu juego no depende de la disponibilidad de servicios de terceros, cambios en APIs, o aumentos de precios. El motor es tuyo, funciona offline, y escala sin límites de cuota.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-2">
            <p className="text-foreground font-semibold">Artificial Word · NPCs con memoria y relaciones</p>
            <a 
              href="mailto:contacto@artificial.world" 
              className="text-accent hover:underline inline-block transition-colors"
            >
              contacto@artificial.world
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TechnicalPage;
