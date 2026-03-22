# Artificial World — Infografía en 6 páginas

> **Para informáticos, jefes, inversores y abuelos.** Cada página está pensada para que cualquiera entienda algo.

---

<div style="page-break-after: always;"></div>

---

# 📄 PÁGINA 1 — La idea en 30 segundos

**Para todos.** Si solo lees esto, ya sabes de qué va.

---

## ¿Qué es Artificial World?

**Un mundo virtual donde los personajes piensan, recuerdan y se relacionan.**

Como un acuario digital: pones criaturas, les das reglas, y ellas deciden qué hacer. Comen cuando tienen hambre, huyen del peligro, comparten con amigos y desconfían de quienes les han robado.

**La diferencia:** No usa ChatGPT ni nada parecido. Cada decisión es calculada, predecible y gratis. Corre en tu ordenador, sin internet.

---

## En una frase

> **No persigas la IA. Construye un mundo que la necesite.**

---

## Tres palabras clave

| | |
|---|---|
| **Memoria** | Los personajes recuerdan lo que vieron y lo que pasó |
| **Relaciones** | Confianza, miedo, hostilidad que cambian con el tiempo |
| **Local** | Todo en tu PC. Cero coste por uso |

---

*Artificial World — Constrúyelo. Habítalo. Haz que crezca.*

---

<div style="page-break-after: always;"></div>

---

# 📄 PÁGINA 2 — Para tu abuelo (y para cualquiera que no sea técnico)

**Analogía simple.** Sin jerga.

---

## Imagina un pueblo pequeño

En ese pueblo hay vecinos. Cada uno tiene su casa, su huerto y sus recuerdos.

- **Si ayudas a uno**, te guarda confianza. La próxima vez te tratará mejor.
- **Si le robas**, te tendrá miedo. Huirá cuando te vea.
- **Si no comes**, te debilitas. Si no descansas, te cansas.

**Artificial World es ese pueblo**, pero en pantalla. Los vecinos son personajes que el ordenador controla siguiendo reglas. No son aleatorios: cada acción tiene una razón (hambre, miedo, amistad).

---

## ¿Para qué sirve?

Para que los videojuegos y las simulaciones tengan personajes que **importan**. Que te reconozcan. Que cambien según lo que hagas.

---

## ¿Quién puede usarlo?

Cualquiera que quiera un mundo con vida. Estudiantes, creadores de juegos, empresas que simulan comportamientos.

---

*Página 2 — Artificial World*

---

<div style="page-break-after: always;"></div>

---

# 📄 PÁGINA 3 — Para tu jefe y para inversores

**Valor, mercado, oportunidad.** Lenguaje de negocio.

---

## El problema que resuelve

Los personajes de muchos juegos y simulaciones son **estáticos**. Dicen lo mismo, no recuerdan, no evolucionan. Los jugadores lo notan.

Las alternativas con IA generativa (ChatGPT, etc.) **cuestan dinero por uso**, tienen latencia y son impredecibles. No escalan para mundos con cientos de personajes.

---

## La solución

| Artificial World | Competencia (LLM) |
|------------------|-------------------|
| **Coste:** Cero por decisión | $ por token |
| **Latencia:** < 1 ms | 100–500 ms |
| **Predecible:** Sí | No |
| **Memoria persistente:** Sí | Limitada |
| **Escalable:** Miles de agentes | Coste crece con uso |

---

## Mercado y oportunidad

- **Estudios indie** — NPCs creíbles sin presupuesto de API
- **Simulaciones** — Gestión, logística, formación
- **Educación** — Enseñar IA por utilidad
- **Investigación** — Motor abierto, modificable

---

## Estado actual

- Motor funcional (Python + Web)
- 68+ tests pasando
- Ejecutable Windows (.exe) listo
- Documentación completa

---

*Página 3 — Artificial World*

---

<div style="page-break-after: always;"></div>

---

# 📄 PÁGINA 4 — Para el informático de 30 años

**Stack, arquitectura, cómo funciona.** Nivel técnico.

---

## Stack

| Capa | Tecnología |
|------|------------|
| **Motor principal** | Python 3.11+, pygame |
| **Persistencia** | SQLite (mundo_artificial.db) |
| **Web** | Node.js + Express, React + Vite |
| **Tiempo real** | WebSocket |

---

## Arquitectura del motor

```
nucleo.Simulacion → tick_runner
    ├── mundo/ (mapa, celdas, recursos)
    ├── entidades/ (EntidadSocial, EntidadGato)
    ├── agentes/ (MotorDecision, memoria, relaciones)
    ├── acciones/ (13: mover, comer, compartir, robar, huir, atacar...)
    └── sistemas/ (persistencia, watchdog, logs)
```

---

## Cómo decide un agente

1. **Genera** acciones candidatas (mover, comer, ir al refugio...)
2. **Puntúa** cada una por utilidad (hambre, energía, rasgo, relaciones)
3. **Selecciona** la de mayor puntuación
4. **Ejecuta** y actualiza memoria/relaciones

Sin LLMs. Todo determinista y trazable.

---

## Cómo probarlo

```powershell
# Python (motor completo)
pip install -r requirements.txt
python principal.py

# Web (demo)
.\scripts\iniciar_fullstack.ps1
# → http://localhost:5173

# Ejecutable Windows
.\build_exe.ps1
# → dist\MundoArtificial.exe
```

---

*Página 4 — Artificial World*

---

<div style="page-break-after: always;"></div>

---

# 📄 PÁGINA 5 — Cómo probarlo (para todos)

**Pasos concretos.** Cualquiera puede seguir esto.

---

## Opción A — Demo en el navegador (5 min)

1. Descarga el proyecto
2. Abre PowerShell en la carpeta del proyecto
3. Ejecuta: `.\scripts\iniciar_fullstack.ps1`
4. Espera a que abra el navegador en http://localhost:5173
5. Explora: crea refugios, suelta agentes, observa

---

## Opción B — Versión completa en tu PC (10 min)

1. Instala Python 3.11+
2. En la carpeta del proyecto: `pip install -r requirements.txt`
3. Ejecuta: `python principal.py`
4. Se abre una ventana con el mundo. Usa los paneles para dar órdenes, cambiar de entidad (Modo Sombra), guardar y cargar.

---

## Opción C — Sin instalar nada (Windows)

1. Descarga el archivo `MundoArtificial.exe`
2. Ejecútalo
3. Funciona igual que la versión completa

---

## Enlaces

- **Repositorio** — (añade tu URL de GitHub)
- **Documentación** — docs/ESENCIAL.md
- **Landing** — artificial-world.html

---

*Página 5 — Artificial World*

---

<div style="page-break-after: always;"></div>

---

# 📄 PÁGINA 6 — Resumen y cierre

**Un mensaje que funcione para todos.**

---

## Artificial World en tres líneas

1. **Es** un motor de vida artificial donde los personajes piensan, recuerdan y se relacionan.
2. **No usa** ChatGPT ni APIs de pago. Todo corre local, gratis y predecible.
3. **Sirve** para juegos, simulaciones, educación e investigación.

---

## Para cada persona

| Si eres... | Tu siguiente paso |
|------------|-------------------|
| **Abuelo / no técnico** | Pide que te enseñen la demo en pantalla |
| **Jefe / inversor** | Revisa la página 3 (valor y mercado) |
| **Informático** | Clona el repo y ejecuta `python principal.py` |
| **Cualquiera** | Comparte esta infografía con quien creas que le interese |

---

## Frase final

> **Constrúyelo. Habítalo. Haz que crezca.**

---

<div align="center">

**Artificial World**

*Simulación de vida artificial 2D con agentes autónomos*

</div>

---

*Página 6 — Artificial World*

---

**Para imprimir o exportar a PDF:**
- **PDF ya generado:** `docs/INFOGRAFIA_ARTIFICIAL_WORLD.pdf`
- **Regenerar PDF:** `node scripts/html-to-pdf.js` (usa Playwright)
- **Desde HTML:** Abre `docs/INFOGRAFIA_ARTIFICIAL_WORLD.html` en el navegador → Ctrl+P → Guardar como PDF
