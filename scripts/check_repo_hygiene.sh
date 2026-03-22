#!/usr/bin/env bash
# Falla el CI si se vuelve a colar una copia del monorepo bajo el árbol de la app iOS.
# Ver: .gitignore (ArtificialWorld/ArtificialWorld/Artificial_world/) y docs/AW_FASE0 §10.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NESTED="${ROOT}/ArtificialWorld/ArtificialWorld/Artificial_world"

if [[ -d "${NESTED}" ]]; then
  # Portable (bash 3.2+): cualquier archivo bajo ese path cuenta como contaminación
  count=$(find "${NESTED}" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d "[:space:]")
  if [[ "${count}" != "0" ]]; then
    echo "::error::Copia anidada del monorepo en ${NESTED} — vaciá ese directorio (no commitear el repo dentro de ArtificialWorld)."
    exit 1
  fi
fi

echo "check_repo_hygiene: OK"
