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
                    TextField("Nombre del archivo", text: $newSaveName)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityLabel("Nombre del guardado")
                        .accessibilityHint("Letras y números; evitá barras y comillas. Se usa como nombre de archivo.")
                    Button {
                        performSave(as: sanitizedName(newSaveName))
                    } label: {
                        Label("Guardar partida", systemImage: "square.and.arrow.down")
                    }
                    .disabled(sanitizedName(newSaveName).isEmpty || isBusy)
                    .accessibilityHint("Crea o sobrescribe un archivo con el estado actual del mundo.")
                } header: {
                    Text("Nuevo guardado")
                } footer: {
                    Text("El nombre queda en este dispositivo. Podés cargar después desde la misma lista.")
                        .font(.caption)
                }

                Section {
                    if saveNames.isEmpty {
                        ContentUnavailableView(
                            "Todavía no hay partidas",
                            systemImage: "tray",
                            description: Text("Guardá con un nombre descriptivo para retomar el tick, el mapa y los agentes.")
                        )
                        .frame(minHeight: 140)
                        .listRowInsets(EdgeInsets(top: 12, leading: 8, bottom: 12, trailing: 8))
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel("Sin archivos guardados. Usá la sección anterior para guardar.")
                    } else {
                        ForEach(saveNames, id: \.self) { name in
                            HStack(alignment: .center, spacing: 12) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(name)
                                        .font(.body)
                                    Text("Tocá cargar para reemplazar la partida actual.")
                                        .font(.caption2)
                                        .foregroundStyle(.tertiary)
                                        .accessibilityHidden(true)
                                }
                                Spacer(minLength: 8)
                                Button {
                                    load(name: name)
                                } label: {
                                    Text("Cargar")
                                }
                                .buttonStyle(.bordered)
                                .disabled(isBusy)
                                .accessibilityLabel("Cargar partida \(name)")
                                .accessibilityHint("Cierra esta hoja y restaura el mundo desde el archivo.")

                                Button {
                                    pendingDeleteName = name
                                } label: {
                                    Image(systemName: "trash")
                                }
                                .tint(.red)
                                .disabled(isBusy)
                                .accessibilityLabel("Eliminar \(name)")
                                .accessibilityHint("Pide confirmación antes de borrar el archivo.")
                            }
                            .accessibilityElement(children: .contain)
                        }
                    }
                } header: {
                    Text("Partidas en el dispositivo")
                }

                if !message.isEmpty {
                    Section {
                        Text(message)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .accessibilityLabel("Mensaje: \(message)")
                    } header: {
                        Text("Estado")
                    }
                }
            }
            .navigationTitle("Guardar / Cargar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") {
                        dismiss()
                    }
                    .accessibilityHint("Volvé a la partida sin cambios.")
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        refreshList()
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Actualizar lista")
                    .accessibilityHint("Vuelve a leer los archivos guardados en el dispositivo.")
                    .disabled(isBusy)
                }
            }
            .confirmationDialog(
                "¿Eliminar esta partida?",
                isPresented: Binding(
                    get: { pendingDeleteName != nil },
                    set: { if !$0 { pendingDeleteName = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Eliminar", role: .destructive) {
                    if let name = pendingDeleteName {
                        delete(name: name)
                    }
                    pendingDeleteName = nil
                }
                Button("Cancelar", role: .cancel) {
                    pendingDeleteName = nil
                }
            } message: {
                if let name = pendingDeleteName {
                    Text("Se borrará «\(name)» de forma permanente en este dispositivo.")
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
            message = "No pudimos leer la lista de guardados: \(error.localizedDescription)"
        }
    }

    private func performSave(as name: String) {
        guard !name.isEmpty else { return }
        isBusy = true
        defer { isBusy = false }
        do {
            try WorldPersistenceEngine.save(makeSaveData(), name: name)
            message = "Listo: se guardó «\(name)»."
            refreshList()
        } catch {
            message = "No se pudo guardar: \(error.localizedDescription)"
        }
    }

    private func load(name: String) {
        isBusy = true
        defer { isBusy = false }
        do {
            let data = try WorldPersistenceEngine.load(name: name)
            let session = try V2WorldSession.restored(from: data)
            onLoadSession(session)
            message = "Cargando «\(name)»…"
            dismiss()
        } catch {
            message = "No se pudo cargar «\(name)»: \(error.localizedDescription)"
        }
    }

    private func delete(name: String) {
        isBusy = true
        defer { isBusy = false }
        do {
            try WorldPersistenceEngine.delete(name: name)
            message = "Se eliminó «\(name)»."
            refreshList()
        } catch {
            message = "No se pudo eliminar: \(error.localizedDescription)"
        }
    }
}
