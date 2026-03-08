# Contenedor privado Chess — Imagen con mejoras aplicadas
# Contexto: raíz del repo. Uso: docker build -f docker/chess-private/Dockerfile -t chess-private:CLIENTE_ID .
FROM node:20-alpine

WORKDIR /app

# Copiar repo auditado
COPY . /repo

# Copiar reporte (requiere run_chess_audit.ps1 previo)
COPY docker/chess-output/reporte-completo.json /app/reporte-completo.json

# Metadatos
LABEL chess.audit="true"
LABEL chess.version="1.0"

CMD ["node", "-e", "console.log('Contenedor Chess privado. Exporte: docker save chess-private:CLIENTE_ID -o chess-private.tar')"]
