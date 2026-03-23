import SwiftUI

/// Ayuda breve de controles (mapa, barra inferior, menú).
struct QuickControlsHelpSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label(String(localized: "help.map.tap_agent"), systemImage: "hand.tap.fill")
                    Label(String(localized: "help.map.pinch_zoom"), systemImage: "arrow.up.left.and.arrow.down.right")
                    Label(String(localized: "help.map.refuge_names"), systemImage: "house.fill")
                } header: {
                    Text(String(localized: "help.section.map"))
                }
                Section {
                    Label(String(localized: "help.bottom.play_pause"), systemImage: "play.circle")
                    Label(String(localized: "help.bottom.step_tick"), systemImage: "forward.frame")
                    Label(String(localized: "help.bottom.dpad"), systemImage: "arrow.up.left")
                } header: {
                    Text(String(localized: "help.section.bottom_bar"))
                }
                Section {
                    Label(String(localized: "help.menu.items"), systemImage: "ellipsis.circle")
                    Label(String(localized: "help.menu.settings"), systemImage: "slider.horizontal.3")
                } header: {
                    Text(String(localized: "help.section.menu"))
                }
            }
            .navigationTitle(String(localized: "help.title.controls"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(localized: "help.button.done")) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
