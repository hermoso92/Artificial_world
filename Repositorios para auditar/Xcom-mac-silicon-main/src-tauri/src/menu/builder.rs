// X - Cliente no oficial de X (Twitter) para macOS
// Copyright © 2024 686f6c61
//
// Author: 686f6c61 (https://github.com/686f6c61)
// Repository: https://github.com/686f6c61/Xcom-mac-silicon
//
// Construcción de menús nativos de macOS

use super::items::*;
use tauri::{
    menu::{AboutMetadataBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Runtime,
};

/// Construye el menú completo de la aplicación
pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    let menu = MenuBuilder::new(app)
        .item(&build_app_menu(app)?)
        .item(&build_file_menu(app)?)
        .item(&build_edit_menu(app)?)
        .item(&build_accounts_menu(app)?)
        .item(&build_view_menu(app)?)
        .item(&build_navigation_menu(app)?)
        .item(&build_window_menu(app)?)
        .item(&build_help_menu(app)?)
        .build()?;

    Ok(menu)
}

/// Reconstruye el menú completo (llamar después de cambios en cuentas)
pub fn rebuild_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = build_menu(app)?;
    app.set_menu(menu)?;
    Ok(())
}

/// Menú principal de la aplicación (X)
fn build_app_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    let settings = MenuItemBuilder::new("Ajustes...")
        .id(APP_PREFERENCES)
        .accelerator("CmdOrCtrl+,")
        .build(app)?;

    // Dark mode toggle no funciona con ventana directa a X.com - usar settings de X

    let switch_account = MenuItemBuilder::new("Cambiar de Cuenta")
        .id(APP_SWITCH_ACCOUNT)
        .build(app)?;

    let about_metadata = AboutMetadataBuilder::new()
        .name(Some("X"))
        .version(Some(env!("CARGO_PKG_VERSION")))
        .authors(Some(vec!["686f6c61".to_string()]))
        .website(Some("https://github.com/686f6c61/Xcom-mac-silicon"))
        .build();

    SubmenuBuilder::new(app, "X")
        .about(Some(about_metadata))
        .separator()
        .item(&settings)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .item(&switch_account)
        .separator()
        .quit()
        .build()
}

/// Menú Archivo
fn build_file_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    let new_post = MenuItemBuilder::new("Nueva Publicación")
        .id(FILE_NEW_POST)
        .accelerator("CmdOrCtrl+N")
        .build(app)?;

    let save = MenuItemBuilder::new("Guardar")
        .id(FILE_SAVE)
        .accelerator("CmdOrCtrl+S")
        .enabled(false)
        .build(app)?;

    let close_window = MenuItemBuilder::new("Cerrar")
        .id(FILE_CLOSE_WINDOW)
        .accelerator("CmdOrCtrl+W")
        .build(app)?;

    let close_all = MenuItemBuilder::new("Cerrar Todo")
        .id(FILE_CLOSE_ALL)
        .accelerator("CmdOrCtrl+Shift+W")
        .build(app)?;

    SubmenuBuilder::new(app, "Archivo")
        .item(&new_post)
        .separator()
        .item(&save)
        .separator()
        .item(&close_window)
        .item(&close_all)
        .build()
}

/// Menú Edición (con items nativos de macOS)
fn build_edit_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    let find = MenuItemBuilder::new("Buscar")
        .id(EDIT_FIND)
        .accelerator("CmdOrCtrl+F")
        .build(app)?;

    SubmenuBuilder::new(app, "Edición")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .item(&find)
        .build()
}

/// Menú Cuentas (dinámico, se reconstruye al cambiar)
fn build_accounts_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    use crate::accounts;

    let mut submenu = SubmenuBuilder::new(app, "Cuentas");

    // Obtener lista de cuentas
    match accounts::list_accounts() {
        Ok(accounts_list) => {
            let active = accounts::get_active_account().ok().flatten();

            if accounts_list.is_empty() {
                // Sin cuentas - solo mostrar "Agregar Cuenta..."
                let add = MenuItemBuilder::new("Agregar Cuenta...")
                    .id(ACCOUNTS_ADD)
                    .accelerator("CmdOrCtrl+Shift+N")
                    .build(app)?;
                submenu = submenu.item(&add);
            } else {
                // Mostrar cuentas (máximo 10)
                for account_info in accounts_list.iter().take(10) {
                    let is_active = active.as_ref() == Some(&account_info.username);
                    let label = if is_active {
                        format!("✓ @{}", account_info.username)
                    } else {
                        format!("@{}", account_info.username)
                    };

                    let item = MenuItemBuilder::new(&label)
                        .id(account_menu_id(&account_info.username))
                        .build(app)?;

                    submenu = submenu.item(&item);
                }

                // Separador y opciones de gestión
                submenu = submenu.separator();

                let add = MenuItemBuilder::new("Agregar Cuenta...")
                    .id(ACCOUNTS_ADD)
                    .accelerator("CmdOrCtrl+Shift+N")
                    .build(app)?;

                let delete = MenuItemBuilder::new("Eliminar Cuenta Activa")
                    .id(ACCOUNTS_DELETE_ACTIVE)
                    .accelerator("CmdOrCtrl+Backspace")
                    .enabled(active.is_some())
                    .build(app)?;

                submenu = submenu.item(&add).item(&delete);
            }
        }
        Err(e) => {
            tracing::error!("Failed to load accounts: {}", e);
            // En caso de error, mostrar solo "Agregar Cuenta..."
            let add = MenuItemBuilder::new("Agregar Cuenta...")
                .id(ACCOUNTS_ADD)
                .build(app)?;
            submenu = submenu.item(&add);
        }
    }

    submenu.build()
}

/// Menú Visualización
fn build_view_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    let reload = MenuItemBuilder::new("Recargar")
        .id(VIEW_RELOAD)
        .accelerator("CmdOrCtrl+R")
        .build(app)?;

    let fullscreen = MenuItemBuilder::new("Pantalla Completa")
        .id(VIEW_FULLSCREEN)
        .accelerator("Ctrl+Cmd+F")
        .build(app)?;

    // Zoom y text size no funcionan con ventana directa a X.com por CORS
    // Se pueden usar los controles nativos de X.com

    SubmenuBuilder::new(app, "Visualización")
        .item(&reload)
        .item(&fullscreen)
        .build()
}

/// Menú de Navegación (específico de X)
fn build_navigation_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    let explore = MenuItemBuilder::new("Explorar")
        .id(NAV_EXPLORE)
        .accelerator("CmdOrCtrl+1")
        .build(app)?;

    let grok = MenuItemBuilder::new("Grok")
        .id(NAV_GROK)
        .accelerator("CmdOrCtrl+2")
        .build(app)?;

    let notifications = MenuItemBuilder::new("Notificaciones")
        .id(NAV_NOTIFICATIONS)
        .accelerator("CmdOrCtrl+3")
        .build(app)?;

    let messages = MenuItemBuilder::new("Mensajes")
        .id(NAV_MESSAGES)
        .accelerator("CmdOrCtrl+4")
        .build(app)?;

    let bookmarks = MenuItemBuilder::new("Elementos Guardados")
        .id(NAV_BOOKMARKS)
        .accelerator("CmdOrCtrl+L")
        .build(app)?;

    let lists = MenuItemBuilder::new("Listas").id(NAV_LISTS).build(app)?;

    let profile = MenuItemBuilder::new("Perfil")
        .id(NAV_PROFILE)
        .accelerator("CmdOrCtrl+P")
        .build(app)?;

    // Scroll no funciona con ventana directa a X.com por CORS

    SubmenuBuilder::new(app, "Navegación")
        .item(&explore)
        .item(&grok)
        .item(&notifications)
        .item(&messages)
        .separator()
        .item(&bookmarks)
        .item(&lists)
        .item(&profile)
        .build()
}

/// Menú Ventana (Window) - Gestionado por macOS
fn build_window_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    SubmenuBuilder::new(app, "Ventana")
        .minimize()
        .maximize()
        .separator()
        .close_window()
        .build()
}

/// Menú Ayuda
fn build_help_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<tauri::menu::Submenu<R>> {
    let check_updates = MenuItemBuilder::new("Buscar Actualizaciones...")
        .id("check_updates")
        .build(app)?;

    SubmenuBuilder::new(app, "Ayuda")
        .item(&check_updates)
        .build()
}
