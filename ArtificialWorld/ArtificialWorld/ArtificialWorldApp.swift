import OSLog
import SwiftUI

@main
struct ArtificialWorldApp: App {
    init() {
        AWLog.app.info("Artificial World inició (\(AWLog.subsystem, privacy: .public))")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
