"""
Generador de crónica fundacional a partir del estado de la simulación.

Produce artefactos JSON y Markdown legibles con metadata, hitos, alertas
y veredicto de supervivencia. No modifica la persistencia del mundo.
"""

import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any

from utilidades.paths import obtener_base_path

if TYPE_CHECKING:
    from nucleo.simulacion import Simulacion


@dataclass
class CronicaFundacional:
    """Estructura de la crónica fundacional."""

    version: int = 1
    timestamp: str = ""
    metadata: dict = field(default_factory=dict)
    estado_inicial: dict = field(default_factory=dict)
    hitos: list[dict] = field(default_factory=list)
    entidades_finales: list[dict] = field(default_factory=list)
    alertas_watchdog: list[dict] = field(default_factory=list)
    metricas: dict = field(default_factory=dict)
    veredicto: str = ""
    resumen: str = ""


def _serializar_entidad(e: Any) -> dict:
    """Serializa una entidad para la crónica."""
    return {
        "id": e.id_entidad,
        "nombre": e.nombre,
        "tipo": getattr(e.tipo_entidad, "value", str(e.tipo_entidad)),
        "posicion": [e.posicion.x, e.posicion.y],
        "hambre": round(e.estado_interno.hambre, 3),
        "energia": round(e.estado_interno.energia, 3),
        "salud": round(getattr(e.estado_interno, "salud", 1.0), 3),
        "comida": e.estado_interno.inventario.comida,
        "material": e.estado_interno.inventario.material,
    }


def _extraer_hitos(sim: "Simulacion", ticks_max: int) -> list[dict]:
    """Extrae hitos narrativos de eventos y estado."""
    hitos: list[dict] = []
    eventos = sim.sistema_logs.obtener_eventos_recientes(30) if sim.sistema_logs else []

    # Primer tick
    hitos.append({
        "tick": 0,
        "tipo": "inicio",
        "descripcion": "Fundación iniciada. Comunidad despierta.",
    })

    # Eventos relevantes (muestreo)
    tipos_narrativos = {"comio", "compartio", "robo", "huyo", "entro_refugio", "ataque_ejecutado"}
    for ev in reversed(eventos):
        tipo_val = getattr(ev.tipo, "value", str(ev.tipo))
        if tipo_val in tipos_narrativos:
            hitos.append({
                "tick": ev.tick,
                "tipo": tipo_val,
                "descripcion": getattr(ev, "descripcion", tipo_val)[:80],
            })
            if len(hitos) >= 8:
                break

    # Tick final
    hitos.append({
        "tick": ticks_max,
        "tipo": "cierre",
        "descripcion": "Sesión fundacional completada.",
    })
    hitos.sort(key=lambda h: h["tick"])
    return hitos


def _calcular_veredicto(sim: "Simulacion") -> tuple[str, str]:
    """Calcula veredicto y resumen según estado final."""
    if not sim.entidades:
        return "colapso", "La comunidad no sobrevivió. Todas las entidades han caído."

    hambres = [e.estado_interno.hambre for e in sim.entidades]
    energias = [e.estado_interno.energia for e in sim.entidades]
    hambre_max = max(hambres)
    hambre_prom = sum(hambres) / len(hambres)
    energia_min = min(energias)

    alertas = sim.sistema_watchdog.problemas_detectados_total if sim.sistema_watchdog else 0

    if hambre_max >= 0.95 or energia_min <= 0.05:
        veredicto = "tension"
        resumen = (
            f"Supervivencia en tensión. {len(sim.entidades)} entidades vivas. "
            f"Hambre máxima {hambre_max:.2f}, energía mínima {energia_min:.2f}. "
            f"{alertas} alertas del sistema."
        )
    elif alertas > 15:
        veredicto = "tension"
        resumen = (
            f"Comunidad estable pero con anomalías. {len(sim.entidades)} entidades. "
            f"{alertas} alertas detectadas. Hambre promedio {hambre_prom:.2f}."
        )
    else:
        veredicto = "supervivencia"
        resumen = (
            f"Fundación exitosa. {len(sim.entidades)} entidades activas. "
            f"Hambre promedio {hambre_prom:.2f}, energía mínima {energia_min:.2f}. "
            f"Comunidad estable."
        )
    return veredicto, resumen


def generar_cronica(
    sim: "Simulacion",
    metadata: dict,
    ticks_ejecutados: int,
    ruta_json: str | None = None,
    ruta_md: str | None = None,
) -> CronicaFundacional:
    """
    Genera la crónica fundacional a partir del estado de la simulación.

    Args:
        sim: Simulación ya ejecutada.
        metadata: Dict con semilla, nombres, etc.
        ticks_ejecutados: Número de ticks ejecutados.
        ruta_json: Ruta para guardar JSON (opcional).
        ruta_md: Ruta para guardar Markdown (opcional).

    Returns:
        CronicaFundacional con todos los datos.
    """
    cronica = CronicaFundacional(
        timestamp=datetime.now().isoformat(),
        metadata=metadata,
        estado_inicial={
            "entidades_iniciales": len(sim.entidades),
            "mapa": f"{sim.mapa.ancho}x{sim.mapa.alto}" if sim.mapa else "?",
        },
        hitos=_extraer_hitos(sim, ticks_ejecutados),
        entidades_finales=[_serializar_entidad(e) for e in sim.entidades],
        alertas_watchdog=[],
        metricas=sim.sistema_metricas.obtener_resumen() if sim.sistema_metricas else {},
    )

    if sim.sistema_watchdog:
        for a in sim.sistema_watchdog.obtener_alertas_recientes(20):
            cronica.alertas_watchdog.append({
                "tick": a.tick,
                "nivel": a.nivel,
                "codigo": a.codigo,
                "entidad": a.entidad,
                "mensaje": a.mensaje,
            })
        cronica.metadata["alertas_total"] = sim.sistema_watchdog.problemas_detectados_total

    cronica.veredicto, cronica.resumen = _calcular_veredicto(sim)
    cronica.metadata["ticks_ejecutados"] = ticks_ejecutados

    base = obtener_base_path()
    ruta_json = ruta_json or os.path.join(base, "cronica_fundacional.json")
    ruta_md = ruta_md or os.path.join(base, "cronica_fundacional.md")

    # Guardar JSON
    ruta_json_abs = ruta_json if os.path.isabs(ruta_json) else os.path.join(base, ruta_json)
    with open(ruta_json_abs, "w", encoding="utf-8") as f:
        json.dump(
            {
                "version": cronica.version,
                "timestamp": cronica.timestamp,
                "metadata": cronica.metadata,
                "estado_inicial": cronica.estado_inicial,
                "hitos": cronica.hitos,
                "entidades_finales": cronica.entidades_finales,
                "alertas_watchdog": cronica.alertas_watchdog,
                "metricas": cronica.metricas,
                "veredicto": cronica.veredicto,
                "resumen": cronica.resumen,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    # Guardar Markdown
    ruta_md_abs = ruta_md if os.path.isabs(ruta_md) else os.path.join(base, ruta_md)
    md_lines = [
        "# Crónica Fundacional",
        "",
        f"**Fecha:** {cronica.timestamp}",
        f"**Veredicto:** {cronica.veredicto}",
        "",
        "## Resumen",
        "",
        cronica.resumen,
        "",
        "## Metadata",
        "",
        f"- Semilla: {cronica.metadata.get('semilla', '?')}",
        f"- Fundador: {cronica.metadata.get('nombre_fundador', '?')}",
        f"- Refugio: {cronica.metadata.get('nombre_refugio', '?')}",
        f"- Ticks: {cronica.metadata.get('ticks_ejecutados', '?')}",
        "",
        "## Hitos",
        "",
    ]
    for h in cronica.hitos:
        md_lines.append(f"- **Tick {h['tick']}** ({h['tipo']}): {h['descripcion']}")
    md_lines.extend([
        "",
        "## Entidades finales",
        "",
    ])
    for e in cronica.entidades_finales:
        md_lines.append(f"- {e['nombre']}: H={e['hambre']:.2f} E={e['energia']:.2f} pos=({e['posicion'][0]},{e['posicion'][1]})")
    if cronica.alertas_watchdog:
        md_lines.extend(["", "## Alertas", ""])
        for a in cronica.alertas_watchdog[:10]:
            md_lines.append(f"- [{a['nivel']}] {a['codigo']} @ tick {a['tick']}: {a['mensaje']}")

    with open(ruta_md_abs, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    return cronica
