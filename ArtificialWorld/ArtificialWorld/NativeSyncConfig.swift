import Foundation

/// Resuelve `POST …/api/aw/sync/batch` sin hardcodear en la UI.
enum NativeSyncConfig {
    private static let userDefaultsKey = "aw_native_sync_batch_url"

    /// JWT (`aw_native_jwt_access_token`) tras `POST /api/aw/auth/login` (`data.token`); si no, Bearer estático de sync.
    nonisolated static func authorizationBearerValue() -> String? {
        if let t = UserDefaults.standard.string(forKey: "aw_native_jwt_access_token")?
            .trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty {
            return t
        }
        return optionalBearerToken()
    }

    /// Si el servidor tiene `AW_NATIVE_SYNC_BEARER_TOKEN`, envía `Authorization: Bearer …`.
    nonisolated static func optionalBearerToken() -> String? {
        if let t = UserDefaults.standard.string(forKey: "aw_native_sync_bearer_token")?
            .trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty {
            return t
        }
        if let t = Bundle.main.object(forInfoDictionaryKey: "AWNativeSyncBearerToken") as? String {
            let trimmed = t.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { return trimmed }
        }
        return nil
    }

    /// Orden: `UserDefaults` → `Info.plist` `AWNativeSyncBatchURL` → en DEBUG, loopback al backend del repo (puerto 3001).
    static func resolvedBatchURL() -> URL? {
        if let raw = UserDefaults.standard.string(forKey: userDefaultsKey)?.trimmingCharacters(in: .whitespacesAndNewlines),
           !raw.isEmpty,
           let url = URL(string: raw) {
            return url
        }
        if let raw = Bundle.main.object(forInfoDictionaryKey: "AWNativeSyncBatchURL") as? String,
           !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           let url = URL(string: raw) {
            return url
        }
        #if DEBUG
        return URL(string: "http://127.0.0.1:3001/api/aw/sync/batch")
        #else
        return nil
        #endif
    }

    /// Derivada de la URL de sync: `…/sync/batch` → `…/auth/login`.
    static func resolvedAuthLoginURL() -> URL? {
        guard let batch = resolvedBatchURL() else { return nil }
        let s = batch.absoluteString
        if s.hasSuffix("/sync/batch") {
            return URL(string: String(s.dropLast("/sync/batch".count)) + "/auth/login")
        }
        return nil
    }

    /// Derivada de login: `…/auth/login` → `…/auth/logout`.
    static func resolvedAuthLogoutURL() -> URL? {
        guard let login = resolvedAuthLoginURL() else { return nil }
        let s = login.absoluteString
        if s.hasSuffix("/auth/login") {
            return URL(string: String(s.dropLast("/auth/login".count)) + "/auth/logout")
        }
        return nil
    }
}
