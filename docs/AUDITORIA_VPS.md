# Auditoría Chess en VPS de producción

> Ejecutar la auditoría completa de forma independiente en el VPS.

---

## Requisitos

- VPS con Docker y Docker Compose
- SSH al servidor
- Repo clonado en el VPS (o acceso para clonar)

---

## Opción 1: Script directo en el VPS

```bash
# Conectar por SSH
ssh root@TU_IP_VPS

# Descargar y ejecutar (o copiar scripts/audit_vps.sh al VPS)
cd /opt
git clone https://github.com/TU_USUARIO/artificial-word.git
cd artificial-word

# Ejecutar auditoría
bash scripts/audit_vps.sh
```

---

## Opción 2: Comandos manuales

```bash
# En el VPS, dentro del repo
cd /opt/artificial-word  # o la ruta donde esté el repo

# Pull último código
git pull

# Crear salida
mkdir -p docker/chess-output

# Ejecutar agentes + coordinator
docker compose -f docker/docker-compose.agents.yml --profile agents up coordinator
```

---

## Salida

| Archivo | Ubicación |
|---------|-----------|
| REPORTE_CHESS_1.md | `docker/chess-output/REPORTE_CHESS_1.md` |
| reporte-completo.json | `docker/chess-output/reporte-completo.json` |
| reporte-*.json | `docker/chess-output/reporte-{docs,backend,frontend,bd,tests,marketing}.json` |

---

## Variables de entorno

| Variable | Uso |
|----------|-----|
| REPO_DIR | Ruta al repo (default: /opt/artificial-word) |

---

## Notas

- La auditoría es **independiente** del servicio en producción: no afecta al juego ni a la API.
- Los agentes se ejecutan en contenedores aislados.
- El reporte se genera en el VPS; puede descargarse con `scp` o visualizarse por SSH.
