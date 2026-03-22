import Foundation
import OSLog

enum NativeAwAuthError: Error, LocalizedError {
    case badResponse
    case httpStatus(code: Int, detail: String)
    case invalidPayload
    case invalidLogoutPayload

    var errorDescription: String? {
        switch self {
        case .badResponse:
            return "Respuesta HTTP inválida"
        case let .httpStatus(code, detail):
            return "HTTP \(code): \(detail)"
        case .invalidPayload:
            return "Respuesta de login inválida"
        case .invalidLogoutPayload:
            return "Respuesta de logout inválida"
        }
    }
}

/// `POST /api/aw/auth/login` — guarda `data.token` en `UserDefaults` desde el llamador.
enum NativeAwAuth {
    nonisolated static func login(
        url: URL,
        playerId: String,
        organizationId: String?,
        bootstrapSecret: String?
    ) async throws -> String {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let b = bootstrapSecret?.trimmingCharacters(in: .whitespacesAndNewlines), !b.isEmpty {
            request.setValue(b, forHTTPHeaderField: "x-aw-bootstrap-secret")
        }

        var body: [String: Any] = ["playerId": playerId]
        if let o = organizationId?.trimmingCharacters(in: .whitespacesAndNewlines), !o.isEmpty {
            body["organizationId"] = o
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            AWLog.auth.error("login: respuesta no HTTP")
            throw NativeAwAuthError.badResponse
        }
        guard (200 ... 299).contains(http.statusCode) else {
            let raw = String(data: data, encoding: .utf8) ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
            let detail = raw.count > 400 ? String(raw.prefix(400)) + "…" : raw
            AWLog.auth.error("login: HTTP \(http.statusCode, privacy: .public) — \(detail, privacy: .public)")
            throw NativeAwAuthError.httpStatus(code: http.statusCode, detail: detail)
        }

        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let success = obj?["success"] as? Bool, success,
              let dataBlock = obj?["data"] as? [String: Any],
              let tokenRaw = dataBlock["token"] as? String
        else {
            throw NativeAwAuthError.invalidPayload
        }
        let token = tokenRaw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !token.isEmpty else {
            throw NativeAwAuthError.invalidPayload
        }
        AWLog.auth.info("login: JWT recibido y validado (token no registrado)")
        return token
    }

    /// `POST /api/aw/auth/logout` — sin cuerpo; Bearer opcional (simetría con sync).
    nonisolated static func logout(url: URL, bearerToken: String?) async throws {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        if let t = bearerToken?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty {
            request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            AWLog.auth.error("logout: respuesta no HTTP")
            throw NativeAwAuthError.badResponse
        }
        guard (200 ... 299).contains(http.statusCode) else {
            let raw = String(data: data, encoding: .utf8) ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
            let detail = raw.count > 400 ? String(raw.prefix(400)) + "…" : raw
            AWLog.auth.error("logout: HTTP \(http.statusCode, privacy: .public) — \(detail, privacy: .public)")
            throw NativeAwAuthError.httpStatus(code: http.statusCode, detail: detail)
        }

        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let success = obj?["success"] as? Bool, success,
              let dataBlock = obj?["data"] as? [String: Any],
              let loggedOut = dataBlock["loggedOut"] as? Bool,
              loggedOut
        else {
            throw NativeAwAuthError.invalidLogoutPayload
        }
        AWLog.auth.info("logout: servidor confirmó cierre de sesión")
    }
}
