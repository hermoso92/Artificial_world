#!/bin/bash
set -e

APP_DIR="${APP_DIR:-'/root/dobacksoft'}"
WEB_DIR="/var/www/html"
echo "🚀 Iniciando deploy de DobackSoft..."
echo "   Directorio: $APP_DIR"

# Verificar directorios
if [ ! -d "$APP_DIR/backend" ]; then
  echo "❌ Directorio $APP_DIR/backend no existe"
  exit 1
fi

# ============================================
# BACKEND
# ============================================
echo "📦 Actualizando Backend..."
cd "$APP_DIR/backend"

# Instalar dependencias backend
echo "   Instalando dependencias..."
npm ci || npm install

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npx prisma generate || echo "⚠️ Error generando Prisma (continuando...)"

# Ejecutar migraciones de base de datos
echo "🔄 Ejecutando migraciones de base de datos..."
npx prisma migrate deploy || echo "⚠️ Error en migraciones (continuando...)"

# Reiniciar usando iniciar-dobacksoft.sh (con todas las verificaciones)
echo "🔄 Reiniciando sistema con iniciar-dobacksoft.sh..."
if [ -f "$APP_DIR/iniciar-dobacksoft.sh" ]; then
  echo "   Ejecutando script de inicio completo..."
  cd "$APP_DIR"
  bash iniciar-dobacksoft.sh || {
    echo "⚠️ Error ejecutando iniciar-dobacksoft.sh, usando método alternativo..."
    cd "$APP_DIR/backend"
    pm2 restart dobacksoft-backend --update-env 2>/dev/null || pm2 start ts-node --name dobacksoft-backend -- --transpile-only src/index.ts
    pm2 save
  }
else
  echo "⚠️ iniciar-dobacksoft.sh no encontrado, usando método alternativo..."
  cd "$APP_DIR/backend"
  pm2 restart dobacksoft-backend --update-env 2>/dev/null || pm2 start ts-node --name dobacksoft-backend -- --transpile-only src/index.ts
  pm2 save
fi

# ============================================
# FRONTEND
# ============================================
echo "🎨 Actualizando Frontend en servidor web..."

# Verificar que el frontend existe
if [ ! -d "$APP_DIR/frontend/dist" ]; then
  echo "⚠️ Directorio $APP_DIR/frontend/dist no existe"
  echo "   El frontend no se actualizará en el servidor web"
else
  echo "   Copiando frontend a $WEB_DIR..."
  sudo rm -rf $WEB_DIR/*
  sudo cp -r "$APP_DIR/frontend/dist"/* $WEB_DIR/
  sudo chown -R www-data:www-data $WEB_DIR
  sudo chmod -R 755 $WEB_DIR

  WEB_SERVER=""
  if systemctl list-unit-files | grep -q "^apache2\\.service"; then
    echo "   Reiniciando Apache..."
    sudo systemctl restart apache2 && WEB_SERVER="apache2"
  elif systemctl list-unit-files | grep -q "^nginx\\.service"; then
    echo "   Reiniciando Nginx..."
    sudo systemctl restart nginx && WEB_SERVER="nginx"
  else
    echo "⚠️ No se encontró servicio web (apache2/nginx) para reiniciar"
  fi

  if [ -n "$WEB_SERVER" ]; then
    echo "✅ Frontend actualizado y $WEB_SERVER reiniciado"
  else
    echo "⚠️ Frontend actualizado pero sin reiniciar servicio web"
  fi
fi

echo "✅ Deploy completado"
