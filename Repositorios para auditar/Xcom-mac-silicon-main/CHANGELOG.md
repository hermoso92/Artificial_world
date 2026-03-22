# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.6.0] - 2026-03-05

### Añadido

- Script de empaquetado reproducible `npm run build:dmg` para generar el instalador sin depender del AppleScript de Finder.
- Script `npm run build:app` para separar el build de la aplicación del build del instalador.
- Cobertura de tests para hash estable, derivación de claves por scope y serialización de snapshots de sesión.
- Nuevo asset fuente del icono (`icon-source.svg`) y regeneración completa de `png`, `icns` e `ico`.

### Modificado

- Detección de login integrada sobre la página real de X.com en lugar del flujo legado basado en `iframe`.
- Restauración best-effort de cookies y `localStorage` accesible al cambiar de cuenta o reiniciar la app.
- Frontend local simplificado a una vista de fallback honesta y mantenimiento menor de la página de ayuda.
- Documentación de instalación y release alineada con la versión `0.6.0`.

### Arreglado

- Claves de Keychain y derivación de cifrado para que sean deterministas y recuperables entre sesiones.
- Flujo multicuenta para conservar mejor la sesión activa y reducir pérdidas de estado al recargar.
- Empaquetado DMG intermitente causado por `bundle_dmg.sh` en la fase estética de Finder.
- Icono de aplicación para evitar el render plano/oscuro en Finder y Dock.

### Seguridad

- Derivación de claves basada en un secreto local de la aplicación con separación por `scope`.
- Persistencia de credenciales y snapshots manteniendo aislamiento por cuenta dentro de Keychain.

### Distribución

- Aplicación nativa: `X.app`
- Instalador DMG: `X_0.6.0_aarch64.dmg`
- Soporte para macOS 11.0 (Big Sur) o superior
- Arquitectura: Apple Silicon (ARM64)

## [0.5.0] - 2025-12-28

### Release inicial

Primera versión pública de X - Otro cliente no oficial de X para macOS.

### Añadido

**Core**:
- Aplicación nativa de macOS construida con Tauri 2.x
- WebView nativo utilizando WebKit de macOS
- Carga directa de X.com sin iframes
- Menús nativos completamente integrados con macOS
- Atajos de teclado estándar de macOS
- Sistema de logging con tracing para debugging

**Sistema multicuenta**:
- Soporte completo para múltiples cuentas de X
- Cambio rápido entre cuentas sin cerrar sesión
- Menú dinámico de cuentas con indicador visual de cuenta activa
- Detección automática de login
- Almacenamiento independiente por cuenta
- Atajos de teclado:
  - `Cmd+Shift+N`: Agregar cuenta
  - `Cmd+Backspace`: Eliminar cuenta activa

**Navegación**:
- Menú de navegación con acceso rápido a secciones de X:
  - Explorar (`Cmd+1`)
  - Grok (`Cmd+2`)
  - Notificaciones (`Cmd+3`)
  - Mensajes (`Cmd+4`)
  - Elementos guardados (`Cmd+L`)
  - Listas
  - Perfil (`Cmd+P`)
- Nueva publicación (`Cmd+N`)
- Búsqueda (`Cmd+F`)

**Visualización**:
- Recargar (`Cmd+R`)
- Pantalla completa (`Ctrl+Cmd+F`)
- Integración nativa con controles de ventana de macOS

**Edición**:
- Comandos estándar de macOS (deshacer, rehacer, cortar, copiar, pegar, seleccionar todo)
- Integración con el portapapeles del sistema

**Actualizaciones**:
- Sistema de verificación automática de actualizaciones desde GitHub Releases
- Opción manual de verificación desde el menú Ayuda
- Ventana de ayuda integrada con documentación completa

### Seguridad

**Encriptación de credenciales**:
- AES-256-GCM (Galois/Counter Mode) para cifrado autenticado
- Derivación de claves con Argon2id resistente a fuerza bruta
- Nonce único aleatorio de 96 bits por cada operación de encriptación
- Tag de autenticación de 128 bits (GMAC) para prevenir manipulación
- Cada cuenta tiene su propia clave de encriptación derivada

**Almacenamiento seguro**:
- Integración completa con macOS Keychain vía Security Framework
- Protección por hardware en chips Apple Silicon (Secure Enclave)
- Aislamiento entre aplicaciones a nivel de sistema operativo
- Encriptación en reposo automática del Keychain
- Service ID: `com.twitter.xmac`

**Privacidad**:
- Sin telemetría ni analytics
- Sin recolección de datos personales
- Comunicación directa con x.com sin proxies ni intermediarios
- Código 100% open source para auditoría pública

### Arquitectura técnica

**Stack tecnológico**:
- Backend: Rust (Tauri 2.x)
- Frontend: HTML/CSS/JavaScript (WebView nativa)
- Encriptación: AES-256-GCM con autenticación
- Hashing: Argon2id para derivación de claves
- Storage: macOS Keychain (Security Framework)
- Runtime: Tokio async runtime

**Módulos principales**:
- `lib.rs`: Core de la aplicación, comandos Tauri, encriptación
- `accounts.rs`: Sistema multicuenta y gestión de Keychain
- `menu/`: Sistema completo de menús nativos de macOS
  - `builder.rs`: Construcción dinámica de menús
  - `handlers.rs`: Event handlers para acciones de menú
  - `items.rs`: Constantes de IDs de menú
  - `navigation.rs`: Navegación entre secciones de X

### Distribución

**Formatos de distribución**:
- Aplicación nativa: `X.app`
- Instalador DMG: `X_0.5.0_aarch64.dmg`
- Soporte para macOS 11.0 (Big Sur) o superior
- Arquitectura: Apple Silicon (ARM64)

### Documentación

- README.md completo con documentación técnica profesional
- CHANGELOG.md siguiendo estándar Keep a Changelog
- LICENSE (MIT)
- Sección de FAQ
- Guías de instalación y construcción desde código fuente
- Documentación de arquitectura y seguridad
- Ejemplos de debugging y desarrollo
- Ventana de ayuda integrada en la aplicación

### Dependencias principales

**Rust**:
- tauri: 2.x
- tauri-plugin-opener: 2
- serde: 1.x
- serde_json: 1.x
- base64: 0.22
- aes-gcm: 0.10
- rand: 0.8
- argon2: 0.5
- reqwest: 0.12
- tokio: 1.x
- tracing: 0.1
- tracing-subscriber: 0.3
- uuid: 1.10
- chrono: 0.4
- security-framework: 2.11 (macOS)

**Node.js**:
- Tauri CLI para desarrollo y build

---

## Tipos de cambios

- **Añadido**: Para funcionalidades nuevas
- **Modificado**: Para cambios en funcionalidades existentes
- **Obsoleto**: Para funcionalidades que serán eliminadas
- **Eliminado**: Para funcionalidades eliminadas
- **Arreglado**: Para corrección de bugs
- **Seguridad**: Para cambios relacionados con vulnerabilidades

## Enlaces de versiones

- [0.6.0](https://github.com/686f6c61/Xcom-mac-silicon/releases/tag/v0.6.0) - 2026-03-05
- [0.5.0](https://github.com/686f6c61/Xcom-mac-silicon/releases/tag/v0.5.0) - 2025-12-28 (Release inicial)
