# Superficie de juego — Demo, entrenamiento y storytelling

> **Documento maestro.** FireSimulator y superficies jugables son capa de demostración, formación y storytelling. No son el núcleo del negocio ni el producto principal.

---

## Posicionamiento oficial

| Componente | Rol | No es |
|------------|-----|-------|
| **FireSimulator** | Demo jugable, entrenamiento, replay de rutas | Producto B2B, núcleo de negocio |
| **Emergencias (DobackSoft en Hub)** | Puerta de entrada a la vertical demo | Producto comercial completo |
| **Minijuegos (Arena)** | Superficie de exploración y engagement | Motor principal |
| **Simulación web** | Showcase del concepto | Motor Python real |

---

## Qué hace la superficie de juego

- **Demostración:** Muestra capacidades de telemetría, rutas y conducción en un formato accesible.
- **Entrenamiento:** Permite practicar con rutas exportadas o datasets controlados.
- **Storytelling:** Conecta la narrativa de emergencias con una experiencia interactiva.
- **Replay:** Reproduce rutas reales o ficticias cuando hay datos en sessionStorage (desde VisorRuta2D).

---

## Qué no hace

- No sustituye al producto DobackSoft (StabilSafe V3 en dobackv2).
- No es la razón de ser del negocio.
- No debe presentarse como integración completa con telemetría real sin evidencia.
- No absorbe la identidad enterprise de DobackSoft.

---

## Flujo de datos

La superficie de juego **consume** datos exportados:

```
DobackSoft (producto)  ──exporta session, route, event──►  Contratos
                                                                    │
FireSimulator  ◄──importa route (sessionStorage o API)──  Contratos
```

Cuando no hay datos reales, FireSimulator funciona en **modo demo** con mapa ficticio y telemetría simulada.

---

## Reglas de comunicación

- **Sí decir:** "FireSimulator es una demo jugable para entrenamiento y storytelling."
- **Sí decir:** "Puedes reproducir rutas exportadas desde DobackSoft."
- **No decir:** "FireSimulator es el producto principal."
- **No decir:** "La integración con telemetría real está cerrada" sin evidencia.

---

## Referencias

- [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md) — Juego = superficie, no núcleo
- [docs/FRONTERA_CONTRATOS.md](FRONTERA_CONTRATOS.md) — Contratos que alimentan el juego
- [docs/DOBACKSOFT_FLUJO.md](DOBACKSOFT_FLUJO.md) — Flujo de acceso Emergencias → FireSimulator
