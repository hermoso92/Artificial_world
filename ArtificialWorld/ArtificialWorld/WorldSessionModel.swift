import AWAgent
import AWDomain
import AWPersistence
import Foundation
import Observation
import OSLog

/// Estado de sesión: Fase 2 (vertical slice) + Fase 3 (SQLite + inventario + scoring de utilidad).
@Observable
@MainActor
final class WorldSessionModel {
    var vitals: SurvivalVitals
    var presence: PresenceState
    var controlMode: PlayerControlMode
    var score: Int
    var proximityToTarget: Double
    var nearestHostileDistance: Double?
    var lastDirective: UtilityDirective
    var lastCaptureMessage: String
    var statusBanner: String
    var pendingEncounter: SquareArchetype?
    var activeZone: ZoneID
    var inventory: InventoryState
    var refugeImprovements: RefugeImprovements
    var agentMemorySummary: AgentMemorySummary
    /// Ticks de simulación (para memoria / depuración).
    private(set) var worldTick: UInt64
    /// Semilla persistida con `WorldSnapshotMetadata`.
    private(set) var worldSeed: UInt64
    /// Multi-tenant futuro (cabeceras sync); hoy suele estar vacío.
    var tenantContext = TenantContext()
    /// Subida `POST /api/aw/sync/batch` en curso.
    private(set) var syncUploadInProgress = false
    /// `POST /api/aw/auth/login` en curso.
    private(set) var nativeJwtLoginInProgress = false
    /// `POST /api/aw/auth/logout` en curso.
    private(set) var nativeJwtLogoutInProgress = false
    /// Último error de red o HTTP (p. ej. backend apagado).
    var lastSyncUploadError: String?
    /// Último error al obtener JWT.
    var lastNativeJwtLoginError: String?
    /// Último error al cerrar sesión en servidor.
    var lastNativeJwtLogoutError: String?

    // MARK: - Feedback de juego (SwiftUI `sensoryFeedback`)

    /// Se incrementa en captura exitosa (disparador para `.success`).
    private(set) var sensoryCaptureSuccessCount = 0
    /// Hostil o rechazo duro (`.error`).
    private(set) var sensoryCaptureRejectCount = 0
    /// Fuera de rango o aviso leve (`.impact`).
    private(set) var sensoryCaptureMissCount = 0

    /// Hay token JWT guardado para `Authorization` en sync.
    var hasNativeJwtStored: Bool {
        let t = UserDefaults.standard.string(forKey: "aw_native_jwt_access_token") ?? ""
        return !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var lastTick: Date?
    private var rng = SystemRandomNumberGenerator()
    private let persistence: SessionPersistence
    private var sqliteStore: SQLiteArtificialWorldStore?
    private let sqlitePath: String?
    private let deviceInstallationId: String

    init(
        persistence: SessionPersistence = .shared,
        enableSQLite: Bool = true,
        sqlitePathOverride: String? = nil
    ) {
        self.persistence = persistence
        let path: String?
        if !enableSQLite {
            path = nil
        } else if let sqlitePathOverride {
            path = sqlitePathOverride
        } else {
            path = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
                .appendingPathComponent("aw_core.sqlite").path
        }
        self.sqlitePath = path
        let db = path.flatMap { try? SQLiteArtificialWorldStore(path: $0) }
        self.sqliteStore = db

        var vitalsOut: SurvivalVitals
        var presenceOut: PresenceState
        var scoreOut: Int
        var controlOut: PlayerControlMode
        var proximityOut: Double
        var nearestOut: Double?
        var zoneOut: ZoneID

        if let snap = persistence.load() {
            vitalsOut = snap.vitals
            presenceOut = snap.presence
            scoreOut = snap.score
            controlOut = snap.controlMode
            proximityOut = snap.proximityToTarget
            nearestOut = snap.nearestHostileDistance
            zoneOut = ZoneID(snap.activeZoneID)
        } else {
            vitalsOut = SurvivalVitals(energy: 0.85, hunger: 0.25)
            presenceOut = .insideRefuge
            scoreOut = 0
            controlOut = .manual
            proximityOut = 18
            nearestOut = 40
            zoneOut = BiomeCatalog.wildEdge.zoneID
        }

        var inventoryOut = InventoryState()
        var refugeOut = RefugeImprovements()
        var memoryOut = AgentMemorySummary()
        let worldTickOut: UInt64 = 0
        var worldSeedOut = UInt64.random(in: 1 ... UInt64.max)

        if let s = db {
            if let v = try? s.loadVitals() { vitalsOut = v }
            if let inv = try? s.loadInventory() { inventoryOut = inv }
            if let imp = try? s.loadImprovements() { refugeOut = imp }
            if let mem = try? s.loadSummary() { memoryOut = mem }
            if let meta = try? s.loadMetadata() {
                worldSeedOut = meta.worldSeed
            } else {
                try? s.save(metadata: WorldSnapshotMetadata(schemaVersion: 1, worldSeed: worldSeedOut, savedAt: .now))
            }
        }

        vitals = vitalsOut
        presence = presenceOut
        score = scoreOut
        controlMode = controlOut
        proximityToTarget = proximityOut
        nearestHostileDistance = nearestOut
        activeZone = zoneOut
        inventory = inventoryOut
        refugeImprovements = refugeOut
        agentMemorySummary = memoryOut
        worldTick = worldTickOut
        worldSeed = worldSeedOut
        lastDirective = .explore
        lastCaptureMessage = ""
        statusBanner = ""
        pendingEncounter = nil
        lastTick = Date()
        deviceInstallationId = Self.installationUUID()
        recomputeDirective()
    }

    private static func installationUUID() -> String {
        let key = "com.antoniohermoso.artificialworld.installation.uuid"
        let ud = UserDefaults.standard
        if let existing = ud.string(forKey: key) {
            return existing
        }
        let value = UUID().uuidString
        ud.set(value, forKey: key)
        return value
    }

    var spawnProfile: ZoneSpawnProfile {
        BiomeCatalog.profile(for: activeZone)
    }

    func persistNow() {
        let snap = PersistedSession(
            vitals: vitals,
            presence: presence,
            score: score,
            controlMode: controlMode,
            proximityToTarget: proximityToTarget,
            nearestHostileDistance: nearestHostileDistance,
            activeZoneID: activeZone.raw
        )
        do {
            try persistence.save(snap)
        } catch {
            AWLog.persistence.error("UserDefaults session save: \(error.localizedDescription, privacy: .public)")
        }
        persistToSQLite()
    }

    private func persistToSQLite() {
        guard let s = sqliteStore else { return }
        try? s.save(vitals: vitals)
        try? s.save(inventory: inventory)
        try? s.save(improvements: refugeImprovements)
        try? s.save(summary: agentMemorySummary)
        try? s.save(metadata: WorldSnapshotMetadata(schemaVersion: 1, worldSeed: worldSeed, savedAt: .now))
    }

    private func recordTelemetry(_ kind: TelemetryKind, _ metadata: [String: String] = [:]) {
        guard let s = sqliteStore else { return }
        _ = try? s.appendTelemetry(kind: kind, metadata: metadata, createdAt: .now)
    }

    /// Eventos pendientes de envío (cola local Fase 4).
    var pendingTelemetryCount: Int {
        (try? sqliteStore?.pendingTelemetryCount()) ?? 0
    }

    /// JSON `SyncEnvelopeV1` para depuración o `POST` futuro.
    func exportPendingSyncEnvelopeJSON(limit: Int = 40) -> String? {
        guard let s = sqliteStore else { return nil }
        guard let env = try? s.buildSyncEnvelopeV1(
            pendingLimit: limit,
            worldSeed: worldSeed,
            tenant: tenantContext,
            deviceInstallationId: deviceInstallationId
        ),
            let data = try? env.encodedJSON()
        else { return nil }
        return String(data: data, encoding: .utf8)
    }

    /// Tras un upload exitoso al backend, marcar el lote como enviado.
    func markTelemetryBatchSent(limit: Int = 40) {
        guard let s = sqliteStore, let rows = try? s.loadPendingTelemetry(limit: limit) else { return }
        try? s.markTelemetrySent(rowIds: rows.map(\.id))
    }

    /// Construye el cuerpo JSON del mismo lote que exporta `exportPendingSyncEnvelopeJSON`.
    private func pendingSyncEnvelopeData(limit: Int) -> Data? {
        guard let s = sqliteStore else { return nil }
        guard let env = try? s.buildSyncEnvelopeV1(
            pendingLimit: limit,
            worldSeed: worldSeed,
            tenant: tenantContext,
            deviceInstallationId: deviceInstallationId
        ) else { return nil }
        return try? env.encodedJSON()
    }

    /// Sube el lote pendiente al backend Node (`x-player-id` = instalación local, estable).
    func uploadPendingSyncBatch(limit: Int = 40) async {
        guard !syncUploadInProgress else { return }
        syncUploadInProgress = true
        lastSyncUploadError = nil
        defer { syncUploadInProgress = false }

        guard let url = NativeSyncConfig.resolvedBatchURL() else {
            lastSyncUploadError = "URL de sync no configurada (Info.plist o UserDefaults)."
            statusBanner = lastSyncUploadError ?? ""
            AWLog.sync.error("upload: sin URL de sync configurada")
            return
        }
        guard let body = pendingSyncEnvelopeData(limit: limit) else {
            lastSyncUploadError = "No se pudo construir el sobre de sync."
            statusBanner = lastSyncUploadError ?? ""
            AWLog.sync.error("upload: no se pudo armar SyncEnvelopeV1")
            return
        }

        do {
            try await NativeSyncBatchUploader.post(
                body: body,
                url: url,
                playerId: deviceInstallationId,
                organizationId: tenantContext.organizationId
            )
            markTelemetryBatchSent(limit: limit)
            statusBanner = "Sync: lote enviado (batchId en servidor)"
            AWLog.session.info("Cola de telemetría: lote enviado y marcado localmente")
        } catch {
            let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            lastSyncUploadError = msg
            statusBanner = "Sync falló: \(msg)"
            AWLog.sync.error("upload falló: \(msg, privacy: .public)")
        }
    }

    /// Obtiene JWT del backend (`playerId` = UUID de instalación; `organizationId` desde `tenantContext` si existe).
    func loginForNativeJwt(bootstrapSecret: String?) async {
        guard !nativeJwtLoginInProgress else { return }
        nativeJwtLoginInProgress = true
        lastNativeJwtLoginError = nil
        defer { nativeJwtLoginInProgress = false }

        guard let url = NativeSyncConfig.resolvedAuthLoginURL() else {
            lastNativeJwtLoginError = "URL de login no derivada (ajusta URL de sync o Info.plist)."
            statusBanner = lastNativeJwtLoginError ?? ""
            AWLog.auth.error("JWT login: URL de login no resuelta")
            return
        }

        do {
            let token = try await NativeAwAuth.login(
                url: url,
                playerId: deviceInstallationId,
                organizationId: tenantContext.organizationId,
                bootstrapSecret: bootstrapSecret
            )
            UserDefaults.standard.set(token, forKey: "aw_native_jwt_access_token")
            statusBanner = "JWT guardado; las subidas usarán Bearer"
            AWLog.session.info("JWT almacenado en dispositivo (valor no registrado)")
        } catch {
            let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            lastNativeJwtLoginError = msg
            statusBanner = "Login JWT falló: \(msg)"
            AWLog.auth.error("JWT login falló: \(msg, privacy: .public)")
        }
    }

    func clearNativeJwtToken() {
        UserDefaults.standard.removeObject(forKey: "aw_native_jwt_access_token")
        lastNativeJwtLogoutError = nil
        statusBanner = "JWT eliminado en este dispositivo"
    }

    /// `POST /api/aw/auth/logout` y borra `aw_native_jwt_access_token` si el servidor responde OK.
    func logoutNativeJwtFully() async {
        guard !nativeJwtLogoutInProgress else { return }
        nativeJwtLogoutInProgress = true
        lastNativeJwtLogoutError = nil
        defer { nativeJwtLogoutInProgress = false }

        guard let url = NativeSyncConfig.resolvedAuthLogoutURL() else {
            lastNativeJwtLogoutError = "URL de logout no derivada (ajusta URL de sync o Info.plist)."
            statusBanner = lastNativeJwtLogoutError ?? ""
            AWLog.auth.error("JWT logout: URL no resuelta")
            return
        }

        let trimmedJwt = UserDefaults.standard.string(forKey: "aw_native_jwt_access_token")?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let jwt = trimmedJwt, !jwt.isEmpty else {
            lastNativeJwtLogoutError = "No hay JWT guardado."
            statusBanner = lastNativeJwtLogoutError ?? ""
            AWLog.auth.debug("JWT logout omitido: sin token en UserDefaults")
            return
        }

        do {
            try await NativeAwAuth.logout(url: url, bearerToken: jwt)
            UserDefaults.standard.removeObject(forKey: "aw_native_jwt_access_token")
            statusBanner = "Sesión cerrada (servidor + dispositivo)"
            AWLog.session.info("JWT eliminado tras logout en servidor")
        } catch {
            let msg = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            lastNativeJwtLogoutError = msg
            statusBanner = "Logout falló: \(msg)"
            AWLog.auth.error("JWT logout falló: \(msg, privacy: .public)")
        }
    }

    private func appendNotableEvent(_ line: String) {
        var ev = agentMemorySummary.notableEvents
        ev.append(line)
        if ev.count > 25 { ev.removeFirst(ev.count - 25) }
        agentMemorySummary = AgentMemorySummary(lastRefugeExitTick: agentMemorySummary.lastRefugeExitTick, notableEvents: ev)
    }

    func recomputeDirective() {
        let ctx = UtilityContext(
            vitals: vitals,
            presence: presence,
            nearestHostileDistance: nearestHostileDistance,
            inventory: inventory
        )
        lastDirective = UtilitySafetyRules.chooseDirective(context: ctx)
    }

    func tickSimulation() {
        worldTick &+= 1
        let now = Date()
        let dt = min(2.0, now.timeIntervalSince(lastTick ?? now))
        lastTick = now

        switch presence {
        case .insideRefuge:
            vitals.applyRefugeRest(
                deltaTime: dt,
                recoveryMultiplier: refugeImprovements.restRecoveryMultiplier
            )
        case .exploring:
            vitals.applyExplorationDrain(deltaTime: dt)
        }
        recomputeDirective()
        applyAutonomousAfterTick()
        persistNow()
    }

    func autonomousPulse() {
        guard controlMode == .autonomous else { return }
        tickSimulation()
    }

    private func applyAutonomousAfterTick() {
        switch controlMode {
        case .manual:
            break
        case .autonomous:
            applyFullAutonomous()
        case .hybrid:
            if let forced = UtilitySafetyRules.forcedDirective(for: makeContext()), forced == .returnToRefuge {
                if case .exploring = presence {
                    enterRefuge(autonomous: true)
                }
            }
        }
    }

    private func makeContext() -> UtilityContext {
        UtilityContext(
            vitals: vitals,
            presence: presence,
            nearestHostileDistance: nearestHostileDistance,
            inventory: inventory
        )
    }

    private func applyFullAutonomous() {
        recomputeDirective()
        switch lastDirective {
        case .returnToRefuge:
            if case .exploring = presence {
                enterRefuge(autonomous: true)
            }
        case .captureNearest:
            if case .exploring = presence {
                if pendingEncounter == nil {
                    rollSpawnEncounter()
                }
                proximityToTarget = min(proximityToTarget, 6)
                if let encounter = pendingEncounter {
                    attemptCapture(archetype: encounter, autonomous: true)
                    pendingEncounter = nil
                    rollSpawnEncounter()
                }
            }
        case .rest, .explore:
            break
        }
    }

    func enterRefuge(autonomous: Bool = false) {
        presence = .insideRefuge
        pendingEncounter = nil
        if autonomous {
            statusBanner = "IA: retorno al refugio"
        }
        recordTelemetry(.refugeEnter, [
            "autonomous": autonomous ? "1" : "0",
            "tick": String(worldTick),
        ])
        recomputeDirective()
        persistNow()
    }

    func leaveRefuge() {
        presence = .exploring(zone: activeZone)
        rollSpawnEncounter()
        agentMemorySummary = AgentMemorySummary(
            lastRefugeExitTick: worldTick,
            notableEvents: agentMemorySummary.notableEvents
        )
        appendNotableEvent("Salida a \(activeZone.raw) (tick \(worldTick))")
        recordTelemetry(.refugeExit, [
            "zone": activeZone.raw,
            "tick": String(worldTick),
        ])
        statusBanner = "Explorando \(activeZone.raw) — encuentro: \(pendingEncounter?.rawValue ?? "?")"
        recomputeDirective()
        persistNow()
    }

    func rollSpawnEncounter() {
        pendingEncounter = spawnProfile.rollEncounter(using: &rng)
    }

    func attemptCapture(archetype: SquareArchetype, range: Double = 8, autonomous: Bool = false) {
        let outcome = CaptureRules.resolve(
            distance: proximityToTarget,
            captureRange: range,
            archetype: archetype,
            currentVitals: vitals
        )
        let prefix = autonomous ? "IA: " : ""
        switch outcome {
        case let .captured(gain, next):
            score += gain
            vitals = next
            inventory.fiberScraps += 1
            if archetype == .nourishing {
                inventory.nutrientPackets += 1
            }
            appendNotableEvent("Captura \(archetype.rawValue) +\(gain)")
            recordTelemetry(.captureSuccess, [
                "archetype": archetype.rawValue,
                "gain": String(gain),
                "score": String(score),
                "autonomous": autonomous ? "1" : "0",
            ])
            lastCaptureMessage = "\(prefix)Capturado (\(archetype.rawValue)): +\(gain)"
            sensoryCaptureSuccessCount += 1
        case .rejectedHostile:
            lastCaptureMessage = "\(prefix)Hostil — no aplicable"
            sensoryCaptureRejectCount += 1
        case .missed:
            lastCaptureMessage = "\(prefix)Fuera de rango (acércate con el deslizador)"
            sensoryCaptureMissCount += 1
        }
        recomputeDirective()
        persistNow()
    }

    func attemptCapturePending(range: Double = 8) {
        guard let encounter = pendingEncounter else {
            lastCaptureMessage = "Sin encuentro pendiente — sal del refugio o genera uno"
            sensoryCaptureMissCount += 1
            return
        }
        attemptCapture(archetype: encounter, range: range, autonomous: false)
    }

    func onControlModeChanged() {
        recomputeDirective()
        persistNow()
    }

    /// Recolección de prueba (hasta craft/bioma real).
    func gatherFiberScrap() {
        inventory.fiberScraps += 1
        persistNow()
    }

    /// Mejora de descanso: 3 fibras por rango (máx. 3).
    func upgradeRestIfPossible() {
        guard refugeImprovements.restEfficiencyRank < 3, inventory.fiberScraps >= 3 else {
            statusBanner = "Necesitas 3 fibras y rango < 3"
            return
        }
        inventory.fiberScraps -= 3
        refugeImprovements = RefugeImprovements(
            restEfficiencyRank: refugeImprovements.restEfficiencyRank + 1,
            storageRank: refugeImprovements.storageRank
        )
        statusBanner = "Refugio: descanso +1 (x\(String(format: "%.2f", refugeImprovements.restRecoveryMultiplier)))"
        persistNow()
    }

    func resetSession() {
        persistence.clear()
        if let sqlitePath {
            try? FileManager.default.removeItem(atPath: sqlitePath)
        }
        sqliteStore = sqlitePath.flatMap { try? SQLiteArtificialWorldStore(path: $0) }

        vitals = SurvivalVitals(energy: 0.85, hunger: 0.25)
        presence = .insideRefuge
        score = 0
        controlMode = .manual
        proximityToTarget = 18
        nearestHostileDistance = 40
        activeZone = BiomeCatalog.wildEdge.zoneID
        inventory = InventoryState()
        refugeImprovements = RefugeImprovements()
        agentMemorySummary = AgentMemorySummary()
        worldTick = 0
        worldSeed = UInt64.random(in: 1 ... UInt64.max)
        pendingEncounter = nil
        lastCaptureMessage = ""
        statusBanner = "Sesión reiniciada"
        sensoryCaptureSuccessCount = 0
        sensoryCaptureRejectCount = 0
        sensoryCaptureMissCount = 0
        lastTick = Date()
        AWLog.session.info("Sesión reiniciada (UserDefaults + SQLite limpiados)")

        if let s = sqliteStore {
            try? s.save(metadata: WorldSnapshotMetadata(schemaVersion: 1, worldSeed: worldSeed, savedAt: .now))
        }
        recordTelemetry(.sessionReset, ["tick": String(worldTick)])
        recomputeDirective()
        persistNow()
    }
}
