import AWAgent
import AWDomain
import Foundation
import Testing
@testable import ArtificialWorld

@MainActor
struct ArtificialWorldTests {
    @Test
    func captureInRangeUpdatesVitals() {
        var vitals = SurvivalVitals(energy: 0.5, hunger: 0.5)
        let outcome = CaptureRules.resolve(
            distance: 4,
            captureRange: 8,
            archetype: .nourishing,
            currentVitals: vitals
        )
        guard case let .captured(_, next) = outcome else {
            Issue.record("Expected capture")
            return
        }
        vitals = next
        #expect(vitals.hunger < 0.5)
    }

    @Test
    func sessionStartsInsideRefugeWhenNoSave() {
        let suite = "aw.fresh.\(UUID().uuidString)"
        guard let defaults = UserDefaults(suiteName: suite) else {
            Issue.record("No defaults suite")
            return
        }
        defer { defaults.removePersistentDomain(forName: suite) }
        let persistence = SessionPersistence(defaults: defaults)
        let session = WorldSessionModel(persistence: persistence, enableSQLite: false)
        if case .insideRefuge = session.presence {
            #expect(true)
        } else {
            Issue.record("Expected inside refuge")
        }
    }

    @Test
    func persistenceRoundTrip() throws {
        let suite = "aw.rt.\(UUID().uuidString)"
        guard let defaults = UserDefaults(suiteName: suite) else {
            Issue.record("No defaults")
            return
        }
        defer { defaults.removePersistentDomain(forName: suite) }

        let persistence = SessionPersistence(defaults: defaults)
        let original = PersistedSession(
            vitals: SurvivalVitals(energy: 0.4, hunger: 0.6),
            presence: .exploring(zone: ZoneID("wild-1")),
            score: 42,
            controlMode: .hybrid,
            proximityToTarget: 7,
            nearestHostileDistance: 20,
            activeZoneID: "wild-1"
        )
        try persistence.save(original)
        let loaded = persistence.load()
        #expect(loaded == original)
    }

    @Test
    func hybridForcesRefugeWhenHostileClose() {
        let suite = "aw.hybrid.\(UUID().uuidString)"
        guard let defaults = UserDefaults(suiteName: suite) else {
            Issue.record("No defaults")
            return
        }
        defer { defaults.removePersistentDomain(forName: suite) }
        let persistence = SessionPersistence(defaults: defaults)
        let session = WorldSessionModel(persistence: persistence, enableSQLite: false)
        session.controlMode = .hybrid
        session.enterRefuge()
        session.leaveRefuge()
        session.nearestHostileDistance = 5
        session.vitals = SurvivalVitals(energy: 0.9, hunger: 0.2)
        session.tickSimulation()
        if case .insideRefuge = session.presence {
            #expect(true)
        } else {
            Issue.record("Hybrid should force refuge when hostile is close")
        }
    }

    @Test
    func sqliteStoresVitalsAcrossModelReload() throws {
        let tmp = FileManager.default.temporaryDirectory
            .appendingPathComponent("aw-app-test-\(UUID().uuidString).sqlite")
            .path
        defer { try? FileManager.default.removeItem(atPath: tmp) }

        let suite = "aw.sqlite.\(UUID().uuidString)"
        guard let defaults = UserDefaults(suiteName: suite) else {
            Issue.record("No defaults")
            return
        }
        defer { defaults.removePersistentDomain(forName: suite) }

        let persistence = SessionPersistence(defaults: defaults)
        let a = WorldSessionModel(persistence: persistence, sqlitePathOverride: tmp)
        a.vitals = SurvivalVitals(energy: 0.11, hunger: 0.88)
        a.persistNow()

        let b = WorldSessionModel(persistence: persistence, sqlitePathOverride: tmp)
        #expect(b.vitals.energy == 0.11)
        #expect(b.vitals.hunger == 0.88)
    }
}
