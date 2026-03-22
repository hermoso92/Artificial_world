import AWAgent
import AWDomain
import Foundation

/// Snapshot serializable para guardado mínimo (Fase 2: UserDefaults + JSON).
struct PersistedSession: Codable, Equatable {
    var vitals: SurvivalVitals
    var presence: PresenceState
    var score: Int
    var controlMode: PlayerControlMode
    var proximityToTarget: Double
    var nearestHostileDistance: Double?
    var activeZoneID: String
}

/// Snapshot rápido en UserDefaults; vitales/inventario/memoria/refugio también van a SQLite vía `WorldSessionModel`.
final class SessionPersistence: @unchecked Sendable {
    static let shared = SessionPersistence()

    private let key = "com.antoniohermoso.artificialworld.session.v1"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func load() -> PersistedSession? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(PersistedSession.self, from: data)
    }

    func save(_ session: PersistedSession) throws {
        let data = try JSONEncoder().encode(session)
        defaults.set(data, forKey: key)
    }

    func clear() {
        defaults.removeObject(forKey: key)
    }
}
