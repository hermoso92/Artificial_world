// X - Cliente no oficial de X (Twitter) para macOS
// Copyright © 2024 686f6c61
//
// Author: 686f6c61 (https://github.com/686f6c61)
// Repository: https://github.com/686f6c61/Xcom-mac-silicon
//
// Definiciones de IDs y constantes para menu items

// IDs de menú - Navegación X
pub const NAV_EXPLORE: &str = "nav_explore";
pub const NAV_GROK: &str = "nav_grok";
pub const NAV_NOTIFICATIONS: &str = "nav_notifications";
pub const NAV_MESSAGES: &str = "nav_messages";
pub const NAV_BOOKMARKS: &str = "nav_bookmarks";
pub const NAV_LISTS: &str = "nav_lists";
pub const NAV_PROFILE: &str = "nav_profile";

// IDs de menú - Vista
pub const VIEW_RELOAD: &str = "view_reload";
pub const VIEW_ZOOM_IN: &str = "view_zoom_in";
pub const VIEW_ZOOM_OUT: &str = "view_zoom_out";
pub const VIEW_ZOOM_RESET: &str = "view_zoom_reset";
pub const VIEW_TEXT_LARGER: &str = "view_text_larger";
pub const VIEW_TEXT_SMALLER: &str = "view_text_smaller";
pub const VIEW_TEXT_RESET: &str = "view_text_reset";
pub const VIEW_FULLSCREEN: &str = "view_fullscreen";

// IDs de menú - Archivo
pub const FILE_NEW_POST: &str = "file_new_post";
pub const FILE_SAVE: &str = "file_save";
pub const FILE_CLOSE_WINDOW: &str = "file_close_window";
pub const FILE_CLOSE_ALL: &str = "file_close_all";

// IDs de menú - Edición
pub const EDIT_FIND: &str = "edit_find";

// IDs de menú - Configuración
pub const APP_PREFERENCES: &str = "app_preferences";
pub const APP_TOGGLE_DARK_MODE: &str = "app_toggle_dark_mode";
pub const APP_SWITCH_ACCOUNT: &str = "app_switch_account";

// IDs de menú - Scroll
pub const SCROLL_TOP: &str = "scroll_top";
pub const SCROLL_BOTTOM: &str = "scroll_bottom";

// IDs de menú - Cuentas
pub const ACCOUNTS_ADD: &str = "accounts_add";
pub const ACCOUNTS_DELETE_ACTIVE: &str = "accounts_delete_active";
pub const ACCOUNTS_ACCOUNT_PREFIX: &str = "accounts_account_";

/// Genera el ID de menú para una cuenta específica
pub fn account_menu_id(username: &str) -> String {
    format!("{}{}", ACCOUNTS_ACCOUNT_PREFIX, username)
}

// URLs para navegación directa (la ventana carga X.com directamente, no hay iframe)
pub const URL_NAV_EXPLORE: &str = "https://x.com/explore";
pub const URL_NAV_NOTIFICATIONS: &str = "https://x.com/notifications";
pub const URL_NAV_MESSAGES: &str = "https://x.com/messages";
pub const URL_NAV_BOOKMARKS: &str = "https://x.com/i/bookmarks";
pub const URL_NAV_LISTS: &str = "https://x.com/i/lists";
pub const URL_NAV_PROFILE: &str = "https://x.com/home";
pub const URL_NAV_GROK: &str = "https://x.com/i/grok";
pub const URL_SETTINGS: &str = "https://x.com/settings";
pub const URL_COMPOSE: &str = "https://x.com/compose/tweet";
