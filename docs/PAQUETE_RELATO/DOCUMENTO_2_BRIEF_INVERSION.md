# Documento 2 — Cómo esto puede convertirse en negocio

**Brief de negocio e inversión para socios, inversores y dirección**

---

## Elevator pitch

**Artificial World** es un motor de mundos virtuales 2D persistentes con agentes que tienen memoria y relaciones. No usa IA generativa de pago: cada decisión es local, trazable y sin coste por uso. El producto ya existe: motor Python completo, demo web, ejecutable Windows, 68+ tests. La oportunidad: convertirse en el estándar de referencia para emuladores de mundos artificiales — NPCs, simulaciones, formación — en un mercado donde la IA generativa es cara e impredecible.

---

## Propuesta de valor

| Artificial World | Competencia (LLM-based) |
|------------------|------------------------|
| Coste por decisión: **Cero** | $ por token |
| Latencia: **< 1 ms** | 100–500 ms |
| Determinismo: **Sí** | No |
| Memoria persistente: **Sí** | Limitada |
| Control del diseñador: **Total** | Bajo |
| Escalabilidad: **Miles de agentes** | Coste crece con uso |

**Mensaje central:** No vendemos hype de IA general. Vendemos simulación controlable, trazable y persistente.

---

## Mercado y casos de uso

| Segmento | Oportunidad | Estado actual |
|----------|-------------|---------------|
| **Estudios indie** | NPCs creíbles sin presupuesto de API | Documentación técnica, outreach preparado |
| **Simulaciones** | Gestión, logística, formación | Motor aplicable, DobackSoft como vertical |
| **Educación** | Enseñar IA por utilidad | Motor abierto, modificable |
| **Investigación** | Comportamiento reproducible, QA | Tests, trazabilidad, watchdog |
| **Entrenamiento** | Emergencias, conducción, rutas | DobackSoft como demo integrada |

---

## Diferenciación frente a IA generativa

- **No competimos con ChatGPT.** Ofrecemos un camino distinto: mundos donde el estado importa, las decisiones son explicables y el coste no escala con el uso.
- **Analogía:** Es como la diferencia entre una calculadora y un científico. No hace falta ser experto para usar una calculadora; no hace falta ser informático para entender que un motor de simulación con memoria es útil.
- **Posicionamiento:** "Emulador de mundos artificiales" — herramienta para crear entornos persistentes donde los personajes piensan, recuerdan y reaccionan.

---

## Líneas de monetización plausibles

1. **SDK / licencia** — Motor integrable para estudios de videojuegos (indie, AA). Modelo por proyecto o suscripción.
2. **SaaS vertical** — DobackSoft como producto B2B: telemetría, estabilidad, formación. Suscripción por flota/organización.
3. **Consultoría / laboratorio** — Simulación de equipos, dinámicas organizativas, formación. Servicio puntual.
4. **Educación** — Licencia para universidades, bootcamps, cursos de IA explicable.
5. **Open core** — Motor base abierto; extensiones, soporte o hosting de pago.

---

## Estado actual (evidencia)

- Motor Python funcional con 13 acciones, memoria, relaciones, persistencia SQLite.
- Demo web con API REST, WebSocket, módulos HeroRefuge y DobackSoft.
- Ejecutable Windows (.exe) listo.
- 68+ tests pasando, CI en cada commit.
- Documentación: ESENCIAL, CONOCE_ARTIFICIAL_WORLD, AGENTE_ENTRANTE, infografía.
- Plan de integración DobackSoft ↔ Artificial World documentado.

---

## Riesgos de credibilidad (y cómo mitigarlos)

| Riesgo | Mitigación |
|--------|------------|
| "Es solo 2D" | Enfatizar persistencia, memoria, trazabilidad. El valor no es la gráfica. |
| "No está a la última de la IA" | Posicionar como alternativa, no competencia. IA explicable vs. IA generativa. |
| "DobackSoft es demo" | Ser explícito: en este repo es demo; producto B2B en repo separado. |
| "Promesas excesivas" | Anclar en código, tests, documentación. No vender conciencia ni magia. |
| "Nombres confusos" | Usar **Artificial World** de forma consistente. Separar DobackSoft como vertical. |

---

## Hoja de ruta hacia adopción

1. **Validación** — Demos a estudios indie, feedback sobre integración.
2. **Producto mínimo vendible** — SDK o API documentada para integración externa.
3. **Vertical DobackSoft** — Completar flujo subir → procesar → ver ruta → jugar.
4. **Comunidad** — Documentación pública, ejemplos, contribuciones.
5. **Rondas** — Seed cuando haya tracción (usuarios, contratos, partners).

---

## Qué decir y qué no decir

**Sí decir:**
- Motor utility-based con memoria y persistencia.
- Demo web + ejecutable + núcleo Python completo.
- Aplicable a NPCs, entrenamiento, visualización.
- Producto demo integrado y vertical comercial separada.

**No decir (todavía):**
- Plataforma B2B ya operativa en este repo.
- Telemetría real integrada.
- Escala masiva probada.
- Latencia submilisegundo garantizada.
- Producto unificado si en realidad son varias líneas conviviendo.

---

## Conclusión

Artificial World tiene base técnica sólida, evidencia verificable y un posicionamiento claro frente a la IA generativa. La oportunidad está en ejecutar: validar con usuarios reales, cerrar la primera venta o partnership, y escalar el relato con datos. No es una idea en papel: es un motor que corre, se guarda y se prueba.
