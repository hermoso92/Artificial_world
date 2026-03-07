# Artificial Word Engine — NPCs con memoria y relaciones

**Documento técnico para estudios de videojuegos**  
Versión 1.0 | artificialword.io

---

## 1. Qué es

**Artificial Word Engine** es un motor de IA para NPCs que toma decisiones por utilidad, mantiene memoria del entorno y gestiona relaciones sociales dinámicas (confianza, miedo, hostilidad). No usa LLMs ni APIs externas.

### Pipeline de decisión

```
Percepción (radio configurable) → Memoria (recursos/refugios/entidades vistos)
        ↓
Generar acciones candidatas (12 tipos: mover, comer, compartir, robar, huir...)
        ↓
Puntuar con 9 modificadores (hambre, energía, riesgo, rasgo, relaciones, directivas...)
        ↓
Seleccionar mejor acción → Ejecutar
```

Cada decisión es **trazable**: se conoce el motivo (ej. "hambre: +0.65", "relaciones: +0.24").

---

## 2. Por qué es distinto

| Aspecto | LLM-based (Inworld, etc.) | Artificial Word Engine |
|---------|---------------------------|------------------------|
| **Coste por NPC** | $ por token / API call | Cero (local) |
| **Latencia** | 100–500 ms por decisión | < 1 ms |
| **Determinismo** | No (respuestas variables) | Sí (reproducible con semilla) |
| **Control del diseñador** | Limitado | Total (pesos, rasgos, directivas) |
| **Memoria** | Ventana de contexto | Persistente (recursos, refugios, entidades) |
| **Relaciones** | Emergentes vía diálogo | Explícitas (confianza, miedo, hostilidad) |

**Ideal para:** juegos indie, simulaciones, mundos con muchos NPCs, plataformas con restricciones de coste o latencia.

---

## 3. Componentes integrables

- **Motor de decisión** — `MotorDecision`: generar → puntuar → seleccionar
- **Sistema de relaciones** — `GestorRelaciones`: confianza, miedo, hostilidad por par de entidades
- **Memoria espacial** — recursos y refugios recordados (capacidad configurable)
- **Directivas** — órdenes externas que modifican la utilidad (ir a X, priorizar supervivencia, etc.)
- **Rasgos de personalidad** — cooperativo, agresivo, explorador, oportunista… modifican preferencias

---

## 4. Integración conceptual

```
Tu juego                    Artificial Word Engine
─────────                   ─────────────────────
Mapa / mundo        →       ContextoDecision (mapa, tick, percepción)
Entidades (tus)     →       Estado interno (hambre, energía, inventario)
Input del jugador   →       Directivas (opcional)
Cada frame/tick     →       motor.decidir(entidad, contexto)
Resultado           ←       Acción seleccionada (tipo + parámetros)
```

El motor devuelve *qué hacer*; tu juego ejecuta la acción en su propio mundo (física, animaciones, etc.).

---

## 5. Próximos pasos

- **Demo:** Ejecutable Windows disponible para ver el motor en acción
- **SDK/API:** En desarrollo — contacto para early access
- **Licencia:** Modelo flexible (indie / estudio / enterprise)

**Contacto:** contacto@artificialword.io (cambia en docs/index.html)
