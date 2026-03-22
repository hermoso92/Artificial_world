#!/usr/bin/env bash
# install-gga.sh — Instala Gentleman Guardian Angel en este proyecto
# Ejecutar desde Git Bash: bash install-gga.sh

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Instalando Gentleman Guardian Angel (gga)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar que Ollama está instalado
if ! command -v ollama &> /dev/null; then
  echo "❌ Ollama no encontrado."
  echo ""
  echo "   Descárgalo gratis desde: https://ollama.com/download/windows"
  echo "   Instálalo y vuelve a ejecutar este script."
  exit 1
fi
echo "✅ Ollama encontrado: $(ollama --version)"

# 2. Verificar/descargar el modelo de código
echo ""
echo "▶  Verificando modelo qwen2.5-coder:7b..."
if ollama list | grep -q "qwen2.5-coder:7b"; then
  echo "✅ Modelo ya disponible"
else
  echo "⬇  Descargando qwen2.5-coder:7b (~4GB, solo esta vez)..."
  ollama pull qwen2.5-coder:7b
  echo "✅ Modelo descargado"
fi

# 3. Clonar o actualizar gga
GGA_DIR="$HOME/.gga-tool"
if [ -d "$GGA_DIR" ]; then
  echo ""
  echo "▶  Actualizando gga existente..."
  cd "$GGA_DIR"
  git pull --quiet
  cd - > /dev/null
else
  echo ""
  echo "▶  Clonando gga..."
  git clone --quiet https://github.com/Gentleman-Programming/gentleman-guardian-angel.git "$GGA_DIR"
fi

# 4. Añadir gga al PATH de esta sesión y al perfil bash
export PATH="$GGA_DIR/bin:$PATH"

PROFILE="$HOME/.bashrc"
if ! grep -q "gga-tool/bin" "$PROFILE" 2>/dev/null; then
  echo "" >> "$PROFILE"
  echo "# Gentleman Guardian Angel" >> "$PROFILE"
  echo 'export PATH="$HOME/.gga-tool/bin:$PATH"' >> "$PROFILE"
  echo "✅ PATH actualizado en $PROFILE"
fi

# 5. Instalar el pre-commit hook en este repo
echo ""
echo "▶  Instalando pre-commit hook..."
gga install
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ ¡Todo listo!"
echo ""
echo "  Desde ahora, cada 'git commit' revisará tu"
echo "  código automáticamente con Ollama + AGENTS.md"
echo ""
echo "  Para saltarte el review puntualmente:"
echo "  git commit --no-verify -m 'wip: trabajo en curso'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
