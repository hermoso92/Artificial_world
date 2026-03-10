# X - Otro cliente no oficial de X para macOS

Cliente no oficial de X (anteriormente Twitter) para macOS, construido con Tauri 2.x. Este proyecto proporciona una experiencia nativa de escritorio utilizando el motor WebKit de macOS y aprovecha las capacidades del sistema operativo para ofrecer un almacenamiento seguro de credenciales mediante el Keychain.

La aplicación está diseñada con un enfoque en la seguridad, la privacidad y el rendimiento. Toda la comunicación es directa con los servidores de X, sin intermediarios, y las credenciales se protegen mediante encriptación AES-256-GCM antes de almacenarse en el Keychain del sistema.

## Características

- **WebView nativo**: Utiliza el motor WebKit de macOS para renderizado óptimo del contenido web
- **Soporte multicuenta**: Gestión de múltiples cuentas con cambio rápido y sin necesidad de cerrar sesión
- **Encriptación AES-256-GCM**: Credenciales protegidas con cifrado autenticado de nivel militar
- **Almacenamiento seguro**: Integración completa con macOS Keychain y soporte para Secure Enclave
- **Menús nativos**: Interfaz completamente nativa de macOS con atajos de teclado estándar
- **Actualizaciones automáticas**: Verificación de nuevas versiones desde GitHub Releases
- **Ligero**: Footprint mínimo de memoria y disco sin dependencias externas
- **Código abierto**: Totalmente auditable y modificable bajo licencia MIT

## Motivación

Este proyecto surge de la necesidad de tener un cliente de escritorio nativo para macOS que respete la privacidad del usuario y aproveche las capacidades del sistema operativo. A diferencia de las aplicaciones web tradicionales o clientes Electron, este cliente:

- Utiliza componentes nativos del sistema operativo para mejor rendimiento
- No incluye telemetría ni rastreadores de terceros
- Se integra de forma nativa con las funcionalidades de macOS (Keychain, notificaciones, menús)
- Ocupa significativamente menos recursos que alternativas basadas en Chromium

## Instalación

### Desde binarios pre-compilados

La forma más sencilla de instalar la aplicación es descargando el archivo DMG pre-compilado:

1. Descarga `X_0.6.0_aarch64.dmg` desde [Releases](https://github.com/686f6c61/Xcom-mac-silicon/releases)
2. Monta el DMG haciendo doble click
3. Arrastra `X.app` a tu carpeta `/Applications`
4. Ejecuta la aplicación desde Launchpad o Finder

**Nota de seguridad**: En el primer inicio, macOS puede mostrar una advertencia porque la aplicación no está firmada con un certificado de Apple Developer. Para ejecutarla:
1. Ve a Preferencias del Sistema > Seguridad y Privacidad
2. En la pestaña General, haz click en "Abrir de todas formas"
3. Confirma que deseas ejecutar la aplicación

Este es el comportamiento estándar de macOS para aplicaciones que no provienen de la Mac App Store.

### Construcción desde código fuente

Para desarrolladores que desean compilar la aplicación desde el código fuente o contribuir al proyecto:

#### Requisitos previos

Asegúrate de tener instalado el siguiente software en tu sistema:

- **Node.js**: 18.x o superior (recomendado: última versión LTS)
- **Rust**: 1.70.0 o superior (instalar via [rustup](https://rustup.rs/))
- **Xcode Command Line Tools**: Ejecuta `xcode-select --install` en Terminal
- **macOS**: 11.0 (Big Sur) o superior (requerido para Tauri 2.x)

#### Pasos de construcción

```bash
# Clonar el repositorio
git clone https://github.com/686f6c61/Xcom-mac-silicon.git
cd Xcom-mac-silicon

# Instalar dependencias de Node.js
npm install

# Desarrollo (modo debug con hot reload)
# Esta opción permite desarrollo iterativo con recarga automática
npm run tauri dev

# Producción (solo .app)
npm run build:app

# Producción (DMG estable para distribución)
npm run build:dmg
```

#### Artefactos generados

Después de ejecutar los builds de producción, los binarios se generan en:
- **Aplicación nativa**: `src-tauri/target/release/bundle/macos/X.app`
- **Instalador DMG**: `src-tauri/target/release/bundle/dmg/X_0.6.0_aarch64.dmg`

El archivo `.app` puede ejecutarse directamente, mientras que el `.dmg` está diseñado para distribución.

## Arquitectura

Este proyecto sigue una arquitectura híbrida que combina un backend en Rust con un frontend web, aprovechando lo mejor de ambos mundos: la seguridad y el rendimiento de Rust, con la flexibilidad de las tecnologías web.

### Stack tecnológico

- **Backend**: Rust (Tauri 2.x) - Manejo de sistema, encriptación, y comunicación con macOS APIs
- **Frontend**: HTML/CSS/JavaScript (WebView nativa) - Interfaz de usuario renderizada por WebKit
- **Encriptación**: AES-256-GCM con autenticación - Protección de credenciales en reposo
- **Hashing**: Argon2id para derivación de claves - Resistente a ataques GPU/ASIC
- **Storage**: macOS Keychain (Security Framework) - Almacenamiento seguro con protección por hardware
- **Runtime**: Tokio async runtime - Ejecución asíncrona eficiente de tareas

### Diseño de componentes

El proyecto está dividido en dos componentes principales:

**Backend (Rust)**:
- Gestiona toda la lógica de negocio crítica para seguridad
- Implementa encriptación/desencriptación de credenciales
- Interfaz con macOS Keychain vía Security Framework
- Manejo de menús nativos y eventos del sistema
- Sistema de actualizaciones automáticas

**Frontend (Web)**:
- Carga directa de X.com en WebView nativo
- Interfaz de usuario para diálogos y configuración
- Comunicación con backend vía Tauri IPC bridge
- Detección automática de login para multicuenta

### Estructura del proyecto

```
.
├── src/                      # Frontend (HTML/JS)
│   ├── index.html           # Ventana principal (carga X.com)
│   ├── login-detector.js    # Captura login, snapshot de sesión y persistencia
│   ├── main.js              # Lógica de frontend e IPC
│   ├── help.html            # Diálogo de ayuda
│   └── styles.css           # Estilos personalizados
├── scripts/
│   └── build-dmg.sh         # Empaquetado DMG reproducible sin AppleScript de Finder
├── src-tauri/               # Backend (Rust)
│   ├── src/
│   │   ├── lib.rs           # Core: comandos Tauri, encriptación, IPC
│   │   ├── accounts.rs      # Sistema multicuenta y gestión de Keychain
│   │   └── menu/            # Menús nativos de macOS
│   │       ├── builder.rs   # Construcción dinámica de menús
│   │       ├── handlers.rs  # Event handlers para acciones de menú
│   │       └── items.rs     # Constantes de IDs de menú
│   ├── Cargo.toml           # Dependencias de Rust
│   ├── tauri.conf.json      # Configuración de Tauri (permisos, ventanas)
│   └── build.rs             # Script de build para generación de código
└── package.json             # Dependencias de Node.js y scripts npm
```

## Sistema multicuenta

### Funcionalidad

El sistema multicuenta es una de las características principales de la aplicación. Permite a los usuarios gestionar múltiples cuentas de X simultáneamente sin necesidad de cerrar sesión constantemente. Cada cuenta mantiene su propia sesión independiente, cookies y estado de autenticación.

Cuando cambias entre cuentas, la aplicación restaura el snapshot de sesión disponible y recarga el WebView, permitiendo acceso casi instantáneo a diferentes perfiles. Esto es especialmente útil para usuarios que gestionan cuentas personales y profesionales, o para community managers que administran múltiples perfiles.

#### Agregar cuenta

Para agregar una nueva cuenta al sistema:

- **Menú**: Cuentas > Agregar Cuenta...
- **Atajo de teclado**: `Cmd+Shift+N`

La aplicación navegará al flujo oficial de login de X. Una vez completado el proceso de autenticación, el sistema detecta automáticamente el login exitoso y almacena las credenciales de forma segura en el Keychain. No es necesaria ninguna configuración adicional.

#### Cambiar cuenta

Para cambiar entre cuentas ya configuradas:

- **Menú**: Cuentas > @username
- Selecciona el nombre de usuario deseado con un click
- La aplicación recarga automáticamente con la sesión de la cuenta seleccionada
- Un checkmark indica la cuenta actualmente activa

El cambio de cuenta es prácticamente instantáneo ya que las credenciales ya están almacenadas localmente.

#### Eliminar cuenta

Para remover una cuenta del sistema:

- **Menú**: Cuentas > Eliminar Cuenta Activa
- **Atajo de teclado**: `Cmd+Backspace`

Esta acción solo elimina la cuenta que está actualmente activa. Los datos se eliminan permanentemente del Keychain y no pueden recuperarse. Si deseas volver a usar esa cuenta, deberás agregarla nuevamente.

### Implementación técnica

#### Almacenamiento en Keychain

Cada cuenta se almacena como una entrada independiente en el macOS Keychain, aprovechando el sistema de seguridad nativo del sistema operativo. La estructura de almacenamiento es:

- **Service**: `com.twitter.xmac` - Identificador único de la aplicación
- **Account**: `username` - Nombre de usuario de la cuenta
- **Password**: Credenciales encriptadas con AES-256-GCM

El uso del Keychain proporciona múltiples beneficios:
- Protección automática por hardware en chips Apple Silicon (Secure Enclave)
- Integración con el sistema de desbloqueo de macOS
- Backup automático vía iCloud Keychain (opcional)
- Aislamiento entre aplicaciones a nivel de sistema operativo

#### Encriptación de credenciales

Las credenciales nunca se almacenan en texto plano. El proceso de encriptación es el siguiente:

```rust
// Derivación de clave por scope a partir de un secreto local de la app
app_secret + scope => Argon2id(app_secret, salt(scope)) => 256-bit key

// Encriptación de credenciales JSON
plaintext => AES-256-GCM(key, nonce) => ciphertext || tag

// Formato final almacenado en Keychain
nonce (12 bytes) || ciphertext || tag (16 bytes)
```

**Parámetros de seguridad utilizados**:
- **Algoritmo**: AES-256-GCM (Galois/Counter Mode) - Cifrado autenticado estándar NIST
- **Clave**: 256 bits derivada con Argon2id - Ganador de la Password Hashing Competition 2015
- **Nonce**: 96 bits generados aleatoriamente - Único por cada operación de encriptación
- **Tag de autenticación**: 128 bits (GMAC) - Protección contra manipulación de datos

Este esquema proporciona tanto confidencialidad (nadie puede leer las credenciales) como integridad (nadie puede modificarlas sin detección).

#### Flujo de cambio de cuenta

Cuando el usuario selecciona una cuenta diferente, se ejecuta el siguiente proceso:

1. Usuario selecciona `@username` del menú dinámico de cuentas
2. Backend actualiza la metadata indicando la cuenta activa actual
3. Menú se reconstruye dinámicamente para reflejar el checkmark en la nueva cuenta
4. Backend recupera y desencripta las credenciales de la cuenta seleccionada
5. Frontend restaura cookies y `localStorage` accesible para la cuenta seleccionada
6. WebView recarga X.com con el snapshot de sesión recuperado

Este proceso toma menos de 1 segundo en hardware moderno.

## Seguridad

La seguridad es una prioridad fundamental en el diseño de esta aplicación. Todas las decisiones arquitectónicas priorizan la protección de las credenciales del usuario y la privacidad de sus datos.

### Encriptación de credenciales

Las credenciales se protegen mediante múltiples capas de seguridad:

**AES-256-GCM (Advanced Encryption Standard)**:
- Cifrado de grado militar aprobado por NSA para información clasificada
- Modo GCM (Galois/Counter Mode) que proporciona autenticación además de confidencialidad
- Detecta automáticamente cualquier manipulación de los datos encriptados
- Cada operación de encriptación utiliza un nonce aleatorio único (nunca reutilizado)

**Derivación de claves con Argon2id**:
- Algoritmo ganador de la Password Hashing Competition (2015)
- Resistente a ataques de fuerza bruta mediante GPUs y ASICs
- Ajustable en términos de memoria, tiempo de CPU y paralelismo
- Cada usuario tiene una clave de encriptación única derivada de su username

**Protección contra ataques**:
- Tag de autenticación previene ataques de manipulación (tampering)
- Nonce aleatorio previene ataques de análisis de patrones
- Argon2id previene ataques de rainbow tables y fuerza bruta
- Keychain previene extracción de credenciales por otras aplicaciones

### Almacenamiento en macOS Keychain

El uso del Keychain de macOS proporciona beneficios significativos de seguridad:

**Protección por hardware**:
- En chips Apple Silicon (M1/M2/M3), el Keychain utiliza el Secure Enclave
- Enclave separado del procesador principal con su propia memoria encriptada
- Claves criptográficas nunca salen del Secure Enclave
- Protección contra ataques físicos y de firmware

**Aislamiento de aplicaciones**:
- Solo la aplicación firmada con el mismo bundle ID puede acceder a sus credenciales
- Otras aplicaciones (incluso con permisos de administrador) no pueden leer las credenciales
- Sandboxing automático del sistema operativo

**Encriptación en reposo**:
- El Keychain encripta automáticamente todos los datos almacenados
- La clave de encriptación del Keychain deriva de la contraseña de login del usuario
- Sin autenticación del usuario, los datos son inaccesibles incluso con acceso físico

### Política de privacidad

Este proyecto mantiene un compromiso firme con la privacidad del usuario:

**Sin telemetría ni analytics**:
- No se recopila ninguna información sobre el uso de la aplicación
- No hay seguimiento de páginas visitadas o interacciones
- No se envían datos a servidores de terceros

**Sin recolección de datos personales**:
- Las credenciales nunca se envían a ningún servidor excepto X.com
- No hay logging de actividad del usuario
- No se comparten datos con terceros bajo ninguna circunstancia

**Comunicación directa**:
- Toda la comunicación es directa con `x.com` sin proxies ni intermediarios
- No hay modificación del tráfico de red
- El WebView se comporta exactamente como Safari nativo

**Código abierto**:
- 100% del código fuente disponible para auditoría pública
- Cualquier desarrollador puede verificar que no hay funcionalidad oculta
- Las contribuciones son bienvenidas y revisadas públicamente

## Desarrollo

Esta sección es para desarrolladores que desean contribuir al proyecto o entender su funcionamiento interno.

### Comandos útiles

```bash
# Ejecutar en modo desarrollo con hot reload
# Los cambios en el código frontend se reflejan inmediatamente
# Los cambios en Rust requieren recompilación automática
npm run tauri dev

# Build de producción de la aplicación
npm run build:app

# Build de producción del instalador DMG
npm run build:dmg

# Linter de Rust (análisis estático)
# Detecta errores comunes y sugiere mejoras
cargo clippy

# Tests unitarios de Rust
# Ejecuta toda la suite de tests
cargo test

# Formateo automático de código Rust
# Aplica el estilo estándar de Rust
cargo fmt

# Verificar compilación sin generar binarios
# Útil para CI/CD
cargo check
```

### Debugging

#### Logs de aplicación

La aplicación utiliza el sistema `tracing` de Rust para logging estructurado. Los logs se emiten a stdout y pueden filtrarse por nivel:

```bash
# Ver todos los logs (debug, info, warn, error)
RUST_LOG=debug npm run tauri dev

# Solo warnings y errores
RUST_LOG=warn npm run tauri dev

# Filtrar por módulo específico
RUST_LOG=twitter_mac::accounts=debug npm run tauri dev

# Múltiples filtros
RUST_LOG=twitter_mac=debug,tauri=info npm run tauri dev
```

Los logs incluyen información sobre:
- Operaciones de Keychain (añadir/eliminar/recuperar cuentas)
- Eventos de menú y navegación
- Errores de encriptación/desencriptación
- Actualizaciones automáticas

#### Inspección de Keychain

Para depurar problemas relacionados con el almacenamiento de credenciales:

```bash
# Listar todas las cuentas almacenadas por la aplicación
security find-generic-password -s "com.twitter.xmac"

# Ver información detallada de una cuenta específica
security find-generic-password -s "com.twitter.xmac" -a "username"

# Ver la contraseña encriptada (requiere autorización del usuario)
security find-generic-password -s "com.twitter.xmac" -a "username" -w

# Eliminar una cuenta específica manualmente
security delete-generic-password -s "com.twitter.xmac" -a "username"

# Eliminar todas las cuentas de la aplicación
security delete-generic-password -s "com.twitter.xmac"
```

#### DevTools del WebView

Para depurar el frontend JavaScript:

1. En modo desarrollo, click derecho en la ventana
2. Selecciona "Inspeccionar Elemento" (si está disponible)
3. Alternativamente, usa Safari > Develop > nombre-de-la-aplicación

### Contribuir

Las contribuciones son bienvenidas y apreciadas. Este es un proyecto de código abierto mantenido por la comunidad. Ya sea que encuentres un bug, tengas una idea para una nueva característica, o simplemente quieras mejorar la documentación, tu contribución será valiosa.

#### Proceso de contribución

1. **Fork del repositorio**: Crea tu propia copia del proyecto
2. **Crea una rama feature**: `git checkout -b feature/nueva-funcionalidad`
3. **Implementa tus cambios**: Escribe código limpio y bien documentado
4. **Añade tests**: Si es aplicable, añade tests unitarios
5. **Commit con mensajes descriptivos**: `git commit -m 'feat: agregar funcionalidad X'`
6. **Push a tu fork**: `git push origin feature/nueva-funcionalidad`
7. **Abre un Pull Request**: Describe claramente qué cambios introduces y por qué

#### Convenciones de código

Para mantener la consistencia del código, por favor sigue estas convenciones:

**Rust**:
- Ejecuta `cargo fmt` antes de hacer commit
- Asegúrate de que `cargo clippy` no genera warnings
- Documenta funciones públicas con doc comments (`///`)
- Usa Result/Option para manejo de errores (evita unwrap en código de producción)

**JavaScript**:
- Usa ES6+ con const/let (evita var)
- JSDoc para funciones públicas
- Nombres descriptivos de variables y funciones
- Evita código síncrono bloqueante

**Commits**:
- Mensajes en español, claros y descriptivos
- Formato: `tipo: descripción breve`
- Tipos: feat (feature), fix (bugfix), docs (documentación), refactor, test, chore

**Ejemplo de buenos mensajes de commit**:
- `feat: agregar soporte para dark mode`
- `fix: corregir error de encriptación en cuentas con caracteres especiales`
- `docs: actualizar README con instrucciones de instalación`

## Versiones

### v0.6.0 (5 de Marzo de 2026)

**Release de consolidación** enfocada en que la app funcione de forma consistente con X.com y pueda distribuirse con un instalador reproducible.

**Cambios principales**:
- Integración real con X.com sin depender del `iframe` legado
- Persistencia best-effort de cookies y `localStorage` accesible por cuenta
- Derivación de claves basada en un secreto local de la app y scopes diferenciados
- Limpieza de deuda técnica en frontend y menús nativos
- Nuevos tests para hashing, derivación de claves y serialización de snapshots
- Flujo de empaquetado DMG estable con `npm run build:dmg`
- Icono renovado para Finder, Dock y bundle de macOS

Ver [CHANGELOG.md](CHANGELOG.md) para el detalle completo.

### v0.5.0 (28 de Diciembre de 2025) - Release Inicial

**Primera versión pública** de X - Otro cliente no oficial de X para macOS.

**Características principales**:
- Cliente nativo de macOS construido con Tauri 2.x
- Sistema completo de soporte multicuenta con cambio rápido
- Encriptación AES-256-GCM de credenciales con Argon2id
- Integración profunda con macOS Keychain y Secure Enclave
- Menús nativos de macOS con navegación por teclado
- Atajos de teclado para todas las funciones principales
- WebView nativo utilizando WebKit de macOS
- Sistema de actualizaciones automáticas desde GitHub Releases
- Documentación técnica completa y profesional
- Licencia MIT - Código 100% open source

**Seguridad y privacidad**:
- Sin telemetría ni analytics
- Sin recolección de datos personales
- Comunicación directa con x.com sin intermediarios
- Protección por hardware en chips Apple Silicon
- Código completamente auditable

Ver [CHANGELOG.md](CHANGELOG.md) para detalles completos de esta versión.

## Preguntas frecuentes (FAQ)

**¿Por qué necesito autorizar la aplicación en Seguridad y Privacidad?**

La aplicación no está firmada con un certificado de Apple Developer. macOS muestra esta advertencia para cualquier aplicación descargada de fuera de la Mac App Store. Es completamente seguro autorizarla manualmente si confías en el código fuente.

**¿Las credenciales están seguras?**

Sí. Las credenciales se encriptan con AES-256-GCM antes de almacenarse en el Keychain de macOS. El Keychain tiene protección por hardware en chips Apple Silicon. Además, solo esta aplicación puede acceder a sus propias credenciales.

**¿Por qué la aplicación pide acceso a Keychain?**

Es el comportamiento normal. macOS pide autorización la primera vez que cualquier aplicación intenta almacenar o recuperar credenciales del Keychain. Puedes elegir "Permitir siempre" para evitar esta pregunta en el futuro.

**¿Funciona con cuentas verificadas/Premium?**

Sí. La aplicación carga X.com directamente, por lo que todas las funcionalidades de la web (verificación, premium, espacios, etc.) funcionan exactamente igual.

**¿Consume mucha batería?**

No más que Safari cargando X.com, ya que usa el mismo motor WebKit. De hecho, suele consumir menos que alternativas basadas en Electron o Chromium.

## Aviso legal

Este es un cliente **no oficial** de X (Twitter). No está afiliado, asociado, autorizado, respaldado ni relacionado de ninguna manera con X Corp (anteriormente Twitter, Inc.) o cualquiera de sus subsidiarias o afiliadas.

El nombre "X", "Twitter", y todos los logos relacionados son marcas registradas de X Corp. Este proyecto es independiente y se proporciona "tal cual" sin garantías de ningún tipo.

El uso de este software es bajo tu propio riesgo. Los autores no se responsabilizan por:
- Suspensión o baneo de cuentas
- Pérdida de datos o credenciales
- Violaciones de los Términos de Servicio de X
- Cualquier daño directo o indirecto derivado del uso de esta aplicación

Se recomienda leer y respetar los [Términos de Servicio de X](https://twitter.com/tos) en todo momento.

## Licencia

Este proyecto está licenciado bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para detalles completos.

La licencia MIT permite:
- Uso comercial y privado
- Modificación del código
- Distribución del código
- Sublicenciamiento

Con las siguientes condiciones:
- Se debe incluir el aviso de copyright y licencia en todas las copias
- El software se proporciona "tal cual" sin garantías

## Autor

**686f6c61**

Desarrollador independiente enfocado en privacidad, seguridad y software de código abierto para macOS.

- GitHub: [@686f6c61](https://github.com/686f6c61)
- Repositorio: [Xcom-mac-silicon](https://github.com/686f6c61/Xcom-mac-silicon)

Contribuciones, bugs reports y feature requests son siempre bienvenidos.

## Enlaces

- **Repositorio**: https://github.com/686f6c61/Xcom-mac-silicon
- **Issues**: https://github.com/686f6c61/Xcom-mac-silicon/issues
- **Releases**: https://github.com/686f6c61/Xcom-mac-silicon/releases
- **Discussions**: https://github.com/686f6c61/Xcom-mac-silicon/discussions
