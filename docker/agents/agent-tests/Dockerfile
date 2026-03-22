# Agent Tests — Auditoría de pytest, vitest, cobertura
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY audit.js ./

ENV REPO_PATH=/repo
ENV OUTPUT_PATH=/output

CMD ["node", "audit.js"]
