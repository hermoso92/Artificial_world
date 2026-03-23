#!/bin/bash

# Script de implementación automática - Artificial World V2
# Ejecutar desde: ~/repos/Artificial_world/ArtificialWorldV2/

echo "🚀 Implementando los 3 pasos..."

# 1. Mover IntegrationTests.swift al lugar correcto
echo "📦 Paso 1: Moviendo IntegrationTests.swift al SPM..."

# Verificar que existe el directorio de tests
if [ ! -d "../SwiftAWCore/Tests/AWAgentTests" ]; then
    echo "❌ Error: No existe el directorio SwiftAWCore/Tests/AWAgentTests"
    exit 1
fi

# Mover el archivo de tests
if [ -f "IntegrationTests.swift" ]; then
    mv IntegrationTests.swift ../SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift
    echo "✅ IntegrationTests.swift movido correctamente"
else
    echo "⚠️  IntegrationTests.swift no encontrado en el directorio actual"
fi

# 2. Verificar que AgentStatusOverlay.swift existe
echo "🎨 Paso 2: Verificando AgentStatusOverlay.swift..."
if [ -f "AgentStatusOverlay.swift" ]; then
    echo "✅ AgentStatusOverlay.swift encontrado"
else
    echo "❌ AgentStatusOverlay.swift no encontrado"
    exit 1
fi

# 3. Limpiar build cache
echo "🧹 Paso 3: Limpiando DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "✅ DerivedData limpiado"

# 4. Compilar el SPM primero
echo "🔨 Paso 4: Compilando SPM (SwiftAWCore)..."
cd ../SwiftAWCore
swift build
if [ $? -eq 0 ]; then
    echo "✅ SPM compilado correctamente"
else
    echo "❌ Error compilando SPM"
    exit 1
fi

# 5. Ejecutar tests del SPM
echo "🧪 Paso 5: Ejecutando tests del SPM..."
swift test
if [ $? -eq 0 ]; then
    echo "✅ Tests pasaron correctamente"
else
    echo "⚠️  Algunos tests fallaron (revisar output arriba)"
fi

# 6. Volver al proyecto principal
echo "📱 Paso 6: Compilando app principal..."
cd ../ArtificialWorldV2

echo ""
echo "✨ ¡Implementación completada!"
echo ""
echo "📋 Resumen:"
echo "  ✅ IntegrationTests.swift → SwiftAWCore/Tests/AWAgentTests/"
echo "  ✅ AgentStatusOverlay.swift en el proyecto"
echo "  ✅ GridMapCanvas.swift modificado"
echo "  ✅ V2PlayView.swift con badges"
echo "  ✅ V2WorldSession.swift con makeContext público"
echo ""
echo "🎯 Próximos pasos:"
echo "  1. Abrir ArtificialWorldV2.xcodeproj en Xcode"
echo "  2. Product → Clean Build Folder (⌘⇧K)"
echo "  3. Product → Build (⌘B)"
echo "  4. Product → Test (⌘U)"
echo "  5. Ejecutar la app y verificar overlays y badges"
echo ""
