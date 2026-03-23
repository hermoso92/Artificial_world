import AWDomain
import Combine
import SwiftUI
import UIKit

struct RootContentView: View {
    @State private var session = V2WorldSession()
    private let autosavePulse = Timer.publish(every: 300, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            V2PlayView(
                session: session,
                makeSaveData: { session.makeSaveData() },
                onLoadSession: { session = $0 },
                onStartNewGame: { profile in
                    session = V2WorldSession(terrainProfile: profile)
                }
            )
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .onReceive(autosavePulse) { _ in
            do {
                try WorldPersistenceEngine.quickSave(session.makeSaveData())
                session.autosaveWarning = nil
            } catch {
                session.autosaveWarning = String(
                    format: String(localized: "root.autosave_failed_fmt"),
                    locale: .current,
                    error.localizedDescription
                )
            }
        }
    }
}

#Preview {
    RootContentView()
}
