import OSLog

/// Logs para **Consola.app** (macOS) o **Console** (dispositivo).
///
/// **Filtrado:** en la barra de búsqueda o columna *Subsystem* usá
/// `com.antoniohermoso.artificialworld` o `artificialworld`.
/// **Categoría:** `app`, `auth`, `sync`, `session`, `persistence`.
///
/// `Logger` es `Sendable`; miembros `nonisolated` permiten loguear desde tareas fuera del actor principal
/// (p. ej. `URLSession`) con `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` en el target.
enum AWLog {
    nonisolated private static let subsystemConstant = "com.antoniohermoso.artificialworld"

    nonisolated static var subsystem: String { subsystemConstant }

    nonisolated static let app = Logger(subsystem: subsystemConstant, category: "app")
    nonisolated static let auth = Logger(subsystem: subsystemConstant, category: "auth")
    nonisolated static let sync = Logger(subsystem: subsystemConstant, category: "sync")
    nonisolated static let session = Logger(subsystem: subsystemConstant, category: "session")
    nonisolated static let persistence = Logger(subsystem: subsystemConstant, category: "persistence")
}
