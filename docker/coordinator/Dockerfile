# Coordinator — Orquesta agentes, agrega reportes, genera REPORTE_CHESS_1.md
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY run.js ./

ENV REPO_PATH=/repo
ENV OUTPUT_PATH=/output

CMD ["node", "run.js"]
