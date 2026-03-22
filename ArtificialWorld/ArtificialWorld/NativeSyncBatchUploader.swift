import Foundation
import OSLog

enum NativeSyncUploadError: Error, LocalizedError {
    case notHTTPResponse
    case httpStatus(code: Int, detail: String)

    var errorDescription: String? {
        switch self {
        case .notHTTPResponse:
            return "Respuesta HTTP inválida"
        case let .httpStatus(code, detail):
            return "HTTP \(code): \(detail)"
        }
    }
}

/// `POST` JSON al mismo contrato que `backend/src/routes/awSync.js`.
enum NativeSyncBatchUploader {
    /// `success` en JSON puede venir como booleano o como número (`0`/`1`) según el serializador.
    private nonisolated static func jsonIndicatesExplicitFailure(_ value: Any?) -> Bool {
        if let b = value as? Bool { return b == false }
        if let n = value as? NSNumber { return n.boolValue == false }
        return false
    }

    /// Prioriza `error.message` del JSON; si no aplica, reusa el cuerpo UTF-8 truncado o el texto del sistema para el código HTTP.
    /// Usa `JSONSerialization` (no `Decodable`) para poder llamarse desde `nonisolated` con aislamiento MainActor por defecto del target.
    private nonisolated static func detailForFailedResponse(data: Data, statusCode: Int, rawTrimmed: String) -> String {
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           jsonIndicatesExplicitFailure(obj["success"]),
           let err = obj["error"] as? [String: Any] {
            let msg = (err["message"] as? String)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !msg.isEmpty {
                let code = (err["code"] as? String)?
                    .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                if !code.isEmpty {
                    return "\(code): \(msg)"
                }
                return msg
            }
        }
        if rawTrimmed.isEmpty {
            return HTTPURLResponse.localizedString(forStatusCode: statusCode)
        }
        if rawTrimmed.count > 400 {
            return String(rawTrimmed.prefix(400)) + "…"
        }
        return rawTrimmed
    }

    nonisolated static func post(
        body: Data,
        url: URL,
        playerId: String,
        organizationId: String?
    ) async throws {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(playerId, forHTTPHeaderField: "x-player-id")
        if let org = organizationId?.trimmingCharacters(in: .whitespacesAndNewlines), !org.isEmpty {
            request.setValue(org, forHTTPHeaderField: "x-organization-id")
        }
        if let token = NativeSyncConfig.authorizationBearerValue() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = body

        AWLog.sync.debug("POST sync batch: \(body.count, privacy: .public) bytes → \(url.host ?? "?", privacy: .public)")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            AWLog.sync.error("sync batch: respuesta no HTTP")
            throw NativeSyncUploadError.notHTTPResponse
        }
        guard (200 ... 299).contains(http.statusCode) else {
            let raw = String(data: data, encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let detail = detailForFailedResponse(data: data, statusCode: http.statusCode, rawTrimmed: raw)
            AWLog.sync.error("sync batch: HTTP \(http.statusCode, privacy: .public) — \(detail, privacy: .public)")
            throw NativeSyncUploadError.httpStatus(code: http.statusCode, detail: detail)
        }
        AWLog.sync.info("sync batch: envío OK (\(body.count, privacy: .public) bytes)")
    }
}
