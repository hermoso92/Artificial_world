# Límites del Core — Artificial World

**Producto usuario final:** la app **iOS** (`SwiftAWCore` + `ArtificialWorld/`). Lo que sigue clasifica el **motor Python** del monorepo (laboratorio y spec), no redefine el binario de App Store — visión unificada en [AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md](AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md) §4.

Clasificación de módulos para la reestructuración del núcleo Python. Este documento fija qué forma parte de ese runtime y qué queda explícitamente fuera del core.

## Runtime principal (core)

Módulos que participan directamente en la simulación y deben formar parte del núcleo:

| Ruta | Responsabilidad |
|------|-----------------|
| `principal.py` | Punto de entrada |
| `configuracion.py` | Parámetros globales |
| `utilidades/arranque.py` | Bootstrap y dispatch |
| `nucleo/simulacion.py` | Orquestación y loop |
| `nucleo/contexto.py` | Contextos de decisión y simulación |
| `nucleo/bus_eventos.py` | Desacoplamiento de eventos |
| `nucleo/gestor_ticks.py` | Avance de ticks |
| `nucleo/constantes.py` | Constantes del núcleo |
| `mundo/mapa.py` | Grid y celdas |
| `mundo/celda.py` | Celda individual |
| `mundo/recurso.py` | Recurso en celda |
| `mundo/refugio.py` | Refugio (bonus descanso) |
| `mundo/generador_mundo.py` | Generación inicial |
| `mundo/zona.py` | Zona (esqueleto) |
| `entidades/entidad_base.py` | Base de entidades |
| `entidades/entidad_social.py` | Entidad social |
| `entidades/entidad_gato.py` | Entidad gato |
| `entidades/fabrica_entidades.py` | Creación de entidades |
| `agentes/motor_decision.py` | IA por utilidad |
| `agentes/percepcion.py` | Percepción del entorno |
| `agentes/memoria.py` | Memoria de entidad |
| `agentes/estado_interno.py` | Estado interno |
| `agentes/inventario.py` | Inventario |
| `agentes/directivas.py` | Directivas externas |
| `agentes/relaciones.py` | Relaciones sociales |
| `agentes/pesos_utilidad.py` | Pesos de utilidad |
| `agentes/rasgos.py` | Rasgos de personalidad |
| `acciones/*.py` | Acciones ejecutables |
| `tipos/enums.py` | Enumeraciones |
| `tipos/modelos.py` | Modelos de datos |
| `sistemas/sistema_persistencia.py` | Guardado/carga |
| `sistemas/sistema_logs.py` | Logs y eventos UI |
| `sistemas/sistema_metricas.py` | Métricas |
| `sistemas/sistema_regeneracion.py` | Regeneración recursos |
| `sistemas/sistema_watchdog.py` | Detección de problemas |
| `sistemas/gestor_modo_sombra.py` | Control manual |
| `interfaz/renderizador.py` | Render pygame |
| `interfaz/panel_control.py` | Panel lateral |
| `interfaz/estado_panel.py` | Estado UI |
| `interfaz/panel_modo_sombra.py` | Panel modo sombra |
| `utilidades/paths.py` | Rutas base |
| `utilidades/azar.py` | Aleatoriedad |
| `utilidades/geometria.py` | Helpers geométricos |

## Periféricos (fuera del core)

No forman parte del núcleo de simulación:

| Categoría | Rutas |
|-----------|-------|
| Demo / marketing | `artificial-world.html`, `docs/index.html`, `docs/landing_content.md`, `docs/emails_listos_para_enviar.md`, `docs/outreach_emails.md`, `docs/PROMPT_HOSTINGER_HORIZONS.md` |
| Build / CI / deploy | `.github/workflows/`, `Dockerfile.ci`, `docker-compose.ci.yml`, `build_exe.ps1`, `MundoArtificial.spec`, `scripts/deploy_landing.ps1`, `scripts/deploy_landing.sh`, `scripts/abrir_web.ps1` |
| Diagnóstico / verificación | `diagnostico.py`, `debug_runner.py`, `verificar_estado.py`, `analizar_debug.py`, `ejecutar_debug.py`, `test_directivas.py` |
| Artefactos generados | `build/`, `__pycache__/`, `*.pyc`, `*.log`, `*.db`, `reporte_sesion.json`, `debug_live.json`, `debug_output.json`, `verificacion_completa.json` |
| Documentación operativa | `AGENTE_ENTRANTE.md`, `PRODUCCION_PLAN.md`, `CAMINO_B_LISTO.md`, `ESTADO_ACTUAL_Y_VERIFICACION.md`, `VERIFICACION_COMPLETA.md`, `ENFOQUE_STARTUP.md`, `VISION_STARTUP_MILLONARIA.md`, `AUDITORIA_FASES_1-4.md`, `DEBUG_COMANDOS.md` |

## Red de seguridad (pruebas)

`pruebas/` se mantiene como red de seguridad para la migración. Los tests consumen el core y validan que la reestructuración no rompe comportamiento.

## Duplicaciones conocidas

- Reglas de simulación duplicadas entre Python y `artificial-world.html` (JS).
- Lógica de movimiento/energía/eventos repetida en acciones y `gestor_modo_sombra._traducir_comando`.
- Scripts de diagnóstico replican el pipeline de `Simulacion.actualizar_entidad()`.

## Integraciones externas (límite duro)

Motores de terceros orientados a **LLM + memoria cloud + simulación social tipo OASIS** (p. ej. ecosistemas estilo MiroFish) **no** forman parte del runtime de este monorepo: sin submódulos, sin código AGPL embebido en `backend/` o `SwiftAWCore`. Política y CI: [`docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md`](AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md) §10 y [`scripts/check_repo_hygiene.sh`](../scripts/check_repo_hygiene.sh).
