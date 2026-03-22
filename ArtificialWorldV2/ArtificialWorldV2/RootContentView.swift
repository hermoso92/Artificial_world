import Combine
import SwiftUI

struct RootContentView: View {
    @State private var session = V2WorldSession()
    private let autosavePulse = Timer.publish(every: 300, on: .main, in: .common).autoconnect()

    var body: some View {
        TabView {
            NavigationStack {
                V2PlayView(
                    session: session,
                    makeSaveData: { session.makeSaveData() },
                    onLoadSession: { session = $0 }
                )
                .navigationTitle("Partida")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem { Label("Partida", systemImage: "map.fill") }

            AboutV2View()
                .tabItem { Label("Acerca", systemImage: "info.circle.fill") }
        }
        .onReceive(autosavePulse) { _ in
            do {
                try WorldPersistenceEngine.quickSave(session.makeSaveData())
                session.autosaveWarning = nil
            } catch {
                session.autosaveWarning =
                    "Autosave falló: \(error.localizedDescription). Podés usar Guardar / Cargar con nombre."
            }
        }
    }
}

#Preview {
    RootContentView()
}
