import SwiftUI

/// Lista de partidas guardadas, guardar con nombre y cargar.
struct SaveLoadView: View {
    @Environment(\.dismiss) private var dismiss
    let makeSaveData: () -> WorldSaveData
    let onLoadSession: (V2WorldSession) -> Void

    @State private var saveNames: [String] = []
    @State private var newSaveName: String = "partida"
    @State private var message: String = ""
    @State private var isBusy = false
    @State private var pendingDeleteName: String?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField(String(localized: "save.field.filename"), text: $newSaveName)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityLabel(String(localized: "save.a11y.filename"))
                        .accessibilityHint(String(localized: "save.a11y.filename_hint"))
                    Button {
                        performSave(as: sanitizedName(newSaveName))
                    } label: {
                        Label(String(localized: "save.button.save"), systemImage: "square.and.arrow.down")
                    }
                    .disabled(sanitizedName(newSaveName).isEmpty || isBusy)
                    .accessibilityHint(String(localized: "save.hint.save"))
                } header: {
                    Text(String(localized: "save.section.new"))
                } footer: {
                    Text(String(localized: "save.footer.new"))
                        .font(.caption)
                }

                Section {
                    if saveNames.isEmpty {
                        ContentUnavailableView(
                            String(localized: "save.empty.title"),
                            systemImage: "tray",
                            description: Text(String(localized: "save.empty.desc"))
                        )
                        .frame(minHeight: 140)
                        .listRowInsets(EdgeInsets(top: 12, leading: 8, bottom: 12, trailing: 8))
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(String(localized: "save.empty.a11y"))
                    } else {
                        ForEach(saveNames, id: \.self) { name in
                            HStack(alignment: .center, spacing: 12) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(name)
                                        .font(.body)
                                    Text(String(localized: "save.row.load_hint"))
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                        .accessibilityHidden(true)
                                }
                                Spacer(minLength: 8)
                                Button {
                                    load(name: name)
                                } label: {
                                    Text(String(localized: "save.button.load"))
                                }
                                .buttonStyle(.bordered)
                                .disabled(isBusy)
                                .accessibilityLabel(
                                    String(format: String(localized: "save.a11y.load_fmt"), locale: .current, name)
                                )
                                .accessibilityHint(String(localized: "save.hint.load"))

                                Button {
                                    pendingDeleteName = name
                                } label: {
                                    Image(systemName: "trash")
                                }
                                .tint(.red)
                                .disabled(isBusy)
                                .accessibilityLabel(
                                    String(format: String(localized: "save.a11y.delete_fmt"), locale: .current, name)
                                )
                                .accessibilityHint(String(localized: "save.hint.delete"))
                            }
                            .accessibilityElement(children: .contain)
                        }
                    }
                } header: {
                    Text(String(localized: "save.section.list"))
                }

                if !message.isEmpty {
                    Section {
                        Text(message)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .accessibilityLabel(
                                String(format: String(localized: "save.a11y.message_fmt"), locale: .current, message)
                            )
                    } header: {
                        Text(String(localized: "save.section.status"))
                    }
                }
            }
            .navigationTitle(String(localized: "save.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Cerrar")) {
                        dismiss()
                    }
                    .accessibilityHint(String(localized: "save.close_hint"))
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        refreshList()
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel(String(localized: "save.refresh.label"))
                    .accessibilityHint(String(localized: "save.refresh.hint"))
                    .disabled(isBusy)
                }
            }
            .confirmationDialog(
                String(localized: "save.delete.title"),
                isPresented: Binding(
                    get: { pendingDeleteName != nil },
                    set: { if !$0 { pendingDeleteName = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button(String(localized: "save.delete.confirm"), role: .destructive) {
                    if let name = pendingDeleteName {
                        delete(name: name)
                    }
                    pendingDeleteName = nil
                }
                Button(String(localized: "Cancelar"), role: .cancel) {
                    pendingDeleteName = nil
                }
            } message: {
                if let name = pendingDeleteName {
                    Text(
                        String(format: String(localized: "save.delete.message_fmt"), locale: .current, name)
                    )
                }
            }
            .onAppear { refreshList() }
        }
    }

    private func sanitizedName(_ raw: String) -> String {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return "" }
        let bad = CharacterSet(charactersIn: "/\\:?%*|\"<>")
        return String(t.unicodeScalars.filter { !bad.contains($0) })
    }

    private func refreshList() {
        do {
            saveNames = try WorldPersistenceEngine.listSaves()
            message = ""
        } catch {
            message = String(
                format: String(localized: "save.error.list_fmt"),
                locale: .current,
                error.localizedDescription
            )
        }
    }

    private func performSave(as name: String) {
        guard !name.isEmpty else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            try WorldPersistenceEngine.save(makeSaveData(), name: name)
            message = String(format: String(localized: "save.ok.saved_fmt"), locale: .current, name)
            refreshList()
        } catch {
            message = String(
                format: String(localized: "save.error.save_fmt"),
                locale: .current,
                error.localizedDescription
            )
        }
    }

    private func load(name: String) {
        isBusy = true
        defer { isBusy = false }
        do {
            let data = try WorldPersistenceEngine.load(name: name)
            let session = try V2WorldSession.restored(from: data)
            onLoadSession(session)
            message = String(format: String(localized: "save.loading_fmt"), locale: .current, name)
            dismiss()
        } catch {
            message = String(
                format: String(localized: "save.error.load_fmt"),
                locale: .current,
                name,
                error.localizedDescription
            )
        }
    }

    private func delete(name: String) {
        isBusy = true
        defer { isBusy = false }
        do {
            try WorldPersistenceEngine.delete(name: name)
            message = String(format: String(localized: "save.ok.deleted_fmt"), locale: .current, name)
            refreshList()
        } catch {
            message = String(
                format: String(localized: "save.error.delete_fmt"),
                locale: .current,
                error.localizedDescription
            )
        }
    }
}
