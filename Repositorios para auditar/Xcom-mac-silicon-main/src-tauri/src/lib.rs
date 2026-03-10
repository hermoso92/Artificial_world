// X - Cliente no oficial de X (Twitter) para macOS
// Copyright © 2024 686f6c61
//
// Author: 686f6c61 (https://github.com/686f6c61)
// Repository: https://github.com/686f6c61/Xcom-mac-silicon
//
// Core library module - Implementa comandos Tauri, manejo de credenciales seguras
// con encriptación AES-256-GCM y almacenamiento en macOS Keychain, y verificación
// automática de actualizaciones desde GitHub.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::Argon2;
use base64::Engine;
use rand::{rngs::OsRng, Rng};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::Manager;
use tracing_subscriber::EnvFilter;

mod accounts;
mod menu;

pub(crate) const KEYCHAIN_SERVICE: &str = "com.twitter.xmac";
#[cfg(not(test))]
const APP_SECRET_KEY_ALIAS: &str = "app_secret_v2";
const LOGIN_DETECTOR_SCRIPT: &str = include_str!("../../src/login-detector.js");
/// Tamaño de la clave AES-256 (32 bytes)
const KEY_SIZE: usize = 32;
/// Tamaño del nonce AES-GCM (12 bytes)
const NONCE_SIZE: usize = 12;

#[derive(Serialize, Deserialize, Clone)]
struct Credentials {
    username: String,
    token: Option<String>,
    session_data: Option<String>,
    cookie_data: Option<String>,
    storage_data: Option<String>,
}

#[cfg(target_os = "macos")]
fn get_keychain_item(key: &str) -> Option<String> {
    use security_framework::passwords::get_generic_password;

    match get_generic_password(KEYCHAIN_SERVICE, key) {
        Ok(data) => String::from_utf8(data).ok(),
        Err(_) => None,
    }
}

#[cfg(target_os = "macos")]
fn set_keychain_item(key: &str, value: &str) -> Result<(), String> {
    use security_framework::passwords::{delete_generic_password, set_generic_password};

    let _ = delete_generic_password(KEYCHAIN_SERVICE, key);
    set_generic_password(KEYCHAIN_SERVICE, key, value.as_bytes()).map_err(|e| e.to_string())
}

#[cfg(not(target_os = "macos"))]
fn get_keychain_item(_key: &str) -> Option<String> {
    None
}

#[cfg(not(target_os = "macos"))]
fn set_keychain_item(_key: &str, _value: &str) -> Result<(), String> {
    Err("Not supported on this platform".to_string())
}

/// Genera un identificador estable para las entradas del Keychain.
///
/// # Arguments
/// * `key` - Clave base (por ejemplo, "credentials_{username}")
///
/// # Returns
/// Hash SHA-256 hexadecimal
///
/// # Security
/// Debe ser determinístico para poder recuperar siempre la misma entrada del Keychain.
pub fn hash_key(key: &str) -> String {
    let digest = Sha256::digest(key.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

#[cfg(test)]
fn get_app_secret() -> Result<String, String> {
    Ok("xmac-test-secret".to_string())
}

#[cfg(all(target_os = "macos", not(test)))]
fn get_app_secret() -> Result<String, String> {
    let secret_key = hash_key(APP_SECRET_KEY_ALIAS);

    if let Some(secret) = get_keychain_item(&secret_key) {
        return Ok(secret);
    }

    let mut secret_bytes = [0u8; KEY_SIZE];
    OsRng.fill(&mut secret_bytes);
    let secret = base64::engine::general_purpose::STANDARD.encode(secret_bytes);
    set_keychain_item(&secret_key, &secret)?;

    Ok(secret)
}

#[cfg(all(not(target_os = "macos"), not(test)))]
fn get_app_secret() -> Result<String, String> {
    Err("Not supported on this platform".to_string())
}

pub(crate) fn derive_named_key(scope: &str) -> Result<[u8; KEY_SIZE], String> {
    let argon2 = Argon2::default();
    let mut key = [0u8; KEY_SIZE];
    let secret = get_app_secret()?;
    let material = format!("{scope}:{secret}");
    let scope_hash = Sha256::digest(scope.as_bytes());
    let mut salt = [0u8; 16];
    salt.copy_from_slice(&scope_hash[..16]);

    argon2
        .hash_password_into(material.as_bytes(), &salt, &mut key)
        .map_err(|e| format!("Error deriving key: {}", e))?;

    Ok(key)
}

/// Deriva una clave AES-256 desde el username usando Argon2id.
///
/// # Arguments
/// * `username` - Username del usuario
///
/// # Returns
/// Array de 32 bytes para AES-256-GCM
///
/// # Security
/// Cada usuario tiene su propia clave de encriptación derivada del username y
/// de un secreto local de la aplicación almacenado en Keychain.
fn derive_encryption_key(username: &str) -> Result<[u8; KEY_SIZE], String> {
    derive_named_key(&format!("credentials:{username}"))
}

/// Encripta datos usando AES-256-GCM (función genérica).
///
/// # Arguments
/// * `plaintext` - Datos en texto plano
/// * `key` - Clave de 32 bytes para AES-256
///
/// # Returns
/// String base64 en formato: nonce || ciphertext || tag
///
/// # Security
/// - AES-256-GCM provee autenticación y confidencialidad
/// - Nonce aleatorio por cada encriptación (never reuse)
/// - Tag de autenticación detecta manipulación
pub fn encrypt_data(plaintext: &str, key: &[u8; 32]) -> Result<String, String> {
    let aes_key = aes_gcm::Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(aes_key);

    // Generar nonce aleatorio (CRITICAL: nunca reusar)
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encriptar
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption error: {}", e))?;

    // Formato: nonce || ciphertext (que incluye el tag de 16 bytes)
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);

    // Retornar como base64
    Ok(base64::engine::general_purpose::STANDARD.encode(&result))
}

/// Desencripta datos cifrados con AES-256-GCM (función genérica).
///
/// # Arguments
/// * `encrypted_b64` - String base64 en formato: nonce || ciphertext || tag
/// * `key` - Clave de 32 bytes para AES-256
///
/// # Returns
/// Datos en texto plano
///
/// # Errors
/// Retorna error si:
/// - Los datos están corruptos (formato inválido)
/// - La clave es incorrecta
/// - Los datos fueron manipulados (falla verificación de tag)
pub fn decrypt_data(encrypted_b64: &str, key: &[u8; 32]) -> Result<String, String> {
    // Decodificar de base64
    let encrypted_data = base64::engine::general_purpose::STANDARD
        .decode(encrypted_b64)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    if encrypted_data.len() < NONCE_SIZE {
        return Err("Invalid encrypted data: too short".to_string());
    }

    let aes_key = aes_gcm::Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(aes_key);

    // Extraer nonce (primeros 12 bytes)
    let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Desencriptar y verificar tag
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption error (data corrupted or wrong key): {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8 in decrypted data: {}", e))
}

/// Encripta credenciales JSON usando AES-256-GCM.
///
/// # Arguments
/// * `plaintext` - JSON de credenciales en texto plano
/// * `username` - Username para derivar clave única
///
/// # Returns
/// Vec<u8> en formato: nonce || ciphertext || tag
/// Los primeros 12 bytes son el nonce, el resto es ciphertext+tag
///
/// # Security
/// - AES-256-GCM provee autenticación y confidencialidad
/// - Nonce aleatorio por cada encriptación (never reuse)
/// - Tag de autenticación detecta manipulación
fn encrypt_credentials(plaintext: &str, username: &str) -> Result<Vec<u8>, String> {
    let key_bytes = derive_encryption_key(username)?;
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Generar nonce aleatorio (CRITICAL: nunca reusar)
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encriptar
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption error: {}", e))?;

    // Formato: nonce || ciphertext (que incluye el tag de 16 bytes)
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);

    Ok(result)
}

/// Desencripta credenciales cifradas con AES-256-GCM.
///
/// # Arguments
/// * `encrypted_data` - Bytes en formato: nonce || ciphertext || tag
/// * `username` - Username para derivar la misma clave
///
/// # Returns
/// JSON de credenciales en texto plano
///
/// # Errors
/// Retorna error si:
/// - Los datos están corruptos (formato inválido)
/// - La clave es incorrecta
/// - Los datos fueron manipulados (falla verificación de tag)
fn decrypt_credentials(encrypted_data: &[u8], username: &str) -> Result<String, String> {
    if encrypted_data.len() < NONCE_SIZE {
        return Err("Invalid encrypted data: too short".to_string());
    }

    let key_bytes = derive_encryption_key(username)?;
    let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Extraer nonce (primeros 12 bytes)
    let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Desencriptar y verificar tag
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption error (data corrupted or wrong key): {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8 in decrypted data: {}", e))
}

/// Guarda credenciales encriptadas en el Keychain de macOS.
///
/// # Arguments
/// * `username` - Username del usuario
/// * `token` - Token de autenticación opcional
/// * `session_data` - Datos de sesión opcionales
///
/// # Returns
/// `Ok(())` si se guardó correctamente
///
/// # Security
/// Las credenciales se encriptan con AES-256-GCM antes de almacenarse.
/// La clave se deriva del username usando Argon2id.
#[tauri::command]
async fn save_credentials(
    username: &str,
    token: Option<String>,
    session_data: Option<String>,
    cookie_data: Option<String>,
    storage_data: Option<String>,
) -> Result<(), String> {
    tracing::info!("Saving credentials for user: {}", username);

    let creds = Credentials {
        username: username.to_string(),
        token,
        session_data,
        cookie_data,
        storage_data,
    };

    // Serializar a JSON
    let creds_json =
        serde_json::to_string(&creds).map_err(|e| format!("JSON serialization error: {}", e))?;

    // Encriptar credenciales
    let encrypted = encrypt_credentials(&creds_json, username)?;

    // Convertir a base64 para almacenar como string en Keychain
    let encrypted_b64 = base64::engine::general_purpose::STANDARD.encode(&encrypted);

    // Hash del username para la key del Keychain
    let hashed_key = hash_key(&format!("credentials_{}", username));

    // Guardar en Keychain
    set_keychain_item(&hashed_key, &encrypted_b64)?;

    tracing::info!("Credentials saved successfully for user: {}", username);
    Ok(())
}

/// Recupera y desencripta credenciales desde el Keychain de macOS.
///
/// # Arguments
/// * `username` - Username del usuario
///
/// # Returns
/// `Ok(Some(json))` con las credenciales desencriptadas, o `Ok(None)` si no existen
///
/// # Security
/// Verifica la integridad de los datos mediante el tag de autenticación AES-GCM.
#[tauri::command]
async fn get_credentials(username: &str) -> Result<Option<String>, String> {
    tracing::info!("Retrieving credentials for user: {}", username);

    let hashed_key = hash_key(&format!("credentials_{}", username));

    match get_keychain_item(&hashed_key) {
        Some(encrypted_b64) => {
            // Decodificar de base64
            let encrypted = base64::engine::general_purpose::STANDARD
                .decode(&encrypted_b64)
                .map_err(|e| format!("Base64 decode error: {}", e))?;

            // Desencriptar
            let plaintext = decrypt_credentials(&encrypted, username)?;

            tracing::info!("Credentials retrieved successfully for user: {}", username);
            Ok(Some(plaintext))
        }
        None => {
            tracing::info!("No credentials found for user: {}", username);
            Ok(None)
        }
    }
}

/// Elimina credenciales del Keychain de macOS.
///
/// # Arguments
/// * `username` - Username del usuario
///
/// # Security
/// Esta operación es irreversible.
#[tauri::command]
async fn delete_credentials(username: &str) -> Result<(), String> {
    tracing::info!("Deleting credentials for user: {}", username);

    use security_framework::passwords::delete_generic_password;

    let hashed_key = hash_key(&format!("credentials_{}", username));
    let _ = delete_generic_password(KEYCHAIN_SERVICE, &hashed_key);

    tracing::info!("Credentials deleted for user: {}", username);
    Ok(())
}

// =============================================================================
// Comandos de Multi-cuenta
// =============================================================================

/// Lista todas las cuentas disponibles
#[tauri::command]
async fn list_accounts() -> Result<Vec<accounts::AccountInfo>, String> {
    accounts::list_accounts()
}

/// Obtiene la cuenta activa actual
#[tauri::command]
async fn get_active_account() -> Result<Option<String>, String> {
    accounts::get_active_account()
}

/// Establece la cuenta activa
#[tauri::command]
async fn set_active_account(username: String) -> Result<(), String> {
    accounts::set_active_account(&username)
}

/// Guarda credenciales de una cuenta (usado por login-detector.js)
#[tauri::command]
async fn save_account_credentials(
    username: String,
    token: Option<String>,
    session_data: Option<String>,
    cookie_data: Option<String>,
    storage_data: Option<String>,
) -> Result<String, String> {
    accounts::add_account(&username, token, session_data, cookie_data, storage_data)
}

/// Elimina una cuenta
#[tauri::command]
async fn delete_account(username: String) -> Result<(), String> {
    accounts::remove_account(&username)
}

/// Cambia a otra cuenta
#[tauri::command]
async fn switch_account(username: String) -> Result<(), String> {
    accounts::set_active_account(&username)
}

/// Reconstruye el menú de cuentas (llamar después de agregar/eliminar)
#[tauri::command]
async fn rebuild_accounts_menu(app: tauri::AppHandle) -> Result<(), String> {
    menu::builder::rebuild_menu(&app).map_err(|e| e.to_string())
}

// =============================================================================
// Actualización y Ayuda
// =============================================================================

/// Verifica actualizaciones desde GitHub Releases.
///
/// # Arguments
/// * `_window` - Ventana Webview (para futuras notificaciones)
///
/// # Returns
/// Versión más reciente encontrada
///
/// # Behavior
/// Si hay una nueva versión, abre automáticamente la página de releases.
#[tauri::command]
async fn check_updates(_window: tauri::WebviewWindow) -> Result<String, String> {
    tracing::info!("Checking for updates...");

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get("https://api.github.com/repos/686f6c61/Xcom-mac-silicon/releases/latest")
        .header("User-Agent", "X-Mac-Client")
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if response.status().is_success() {
        let release: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let latest_version = release["tag_name"]
            .as_str()
            .ok_or("Missing tag_name in release response")?
            .replace('v', "");

        let current_version = env!("CARGO_PKG_VERSION").to_string();

        tracing::info!("Current: {}, Latest: {}", current_version, latest_version);

        if latest_version != current_version {
            tracing::info!("New version available: {}", latest_version);
            tauri_plugin_opener::open_url(
                "https://github.com/686f6c61/Xcom-mac-silicon/releases",
                None::<String>,
            )
            .map_err(|e| format!("Failed to open URL: {}", e))?;
            Ok(latest_version)
        } else {
            tracing::info!("Already on latest version");
            Ok(current_version)
        }
    } else {
        let status = response.status();
        tracing::error!("GitHub API returned status: {}", status);
        Err(format!("GitHub API error: {}", status))
    }
}

#[tauri::command]
async fn open_help() -> Result<(), String> {
    tauri_plugin_opener::open_url(
        "https://github.com/686f6c61/Xcom-mac-silicon",
        None::<String>,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Punto de entrada de la aplicación Tauri.
///
/// Inicializa logging, plugins y handlers de comandos.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicializar logging
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    tracing::info!("Starting X macOS Client v{}", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .append_invoke_initialization_script(LOGIN_DETECTOR_SCRIPT)
        .setup(|app| {
            // Migrar credenciales de v0.3.0 a v0.4.0 si es necesario
            tauri::async_runtime::spawn(async {
                if let Err(e) = accounts::migrate_legacy_credentials() {
                    tracing::error!("Migration failed: {}", e);
                }
            });

            // Construir y establecer menú nativo
            let menu = menu::builder::build_menu(app.handle()).expect("Failed to build menu");

            app.set_menu(menu).expect("Failed to set menu");

            // Configurar handlers de menú
            menu::handlers::setup_menu_handlers(app.handle());

            if let Ok(Some(active_username)) = accounts::get_active_account() {
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                    menu::handlers::restore_account_session(&app_handle, &active_username);
                });
            }

            let window = app
                .get_webview_window("main")
                .ok_or("Failed to get main window")?;

            let window_clone = window.clone();
            tauri::async_runtime::spawn(async move {
                // Reducir delay de 5s a 2s
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                tracing::info!("Starting automatic update check");
                if let Err(e) = check_updates(window_clone).await {
                    tracing::error!("Update check failed: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_credentials,
            get_credentials,
            delete_credentials,
            list_accounts,
            get_active_account,
            set_active_account,
            save_account_credentials,
            delete_account,
            switch_account,
            rebuild_accounts_menu,
            check_updates,
            open_help
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_roundtrip() {
        let username = "test_user";
        let original = r#"{"username":"test","token":"secret123"}"#;

        let encrypted = encrypt_credentials(original, username).unwrap();
        let decrypted = decrypt_credentials(&encrypted, username).unwrap();

        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_encryption_wrong_user() {
        let original = r#"{"username":"test","token":"secret"}"#;

        let encrypted = encrypt_credentials(original, "user1").unwrap();
        let result = decrypt_credentials(&encrypted, "user2");

        assert!(result.is_err());
    }

    #[test]
    fn test_encryption_different_each_time() {
        let username = "test_user";
        let original = r#"{"username":"test","token":"secret123"}"#;

        let encrypted1 = encrypt_credentials(original, username).unwrap();
        let encrypted2 = encrypt_credentials(original, username).unwrap();

        // Los nonces aleatorios hacen que cada encriptación sea diferente
        assert_ne!(encrypted1, encrypted2);

        // Pero ambos deben desencriptar correctamente
        let decrypted1 = decrypt_credentials(&encrypted1, username).unwrap();
        let decrypted2 = decrypt_credentials(&encrypted2, username).unwrap();

        assert_eq!(decrypted1, original);
        assert_eq!(decrypted2, original);
    }

    #[test]
    fn test_decrypt_corrupted_data() {
        let username = "test_user";
        let corrupted_data = vec![1, 2, 3, 4, 5]; // Datos inválidos

        let result = decrypt_credentials(&corrupted_data, username);

        assert!(result.is_err());
    }

    #[test]
    fn test_derive_encryption_key_consistency() {
        let username = "test_user";

        let key1 = derive_encryption_key(username).unwrap();
        let key2 = derive_encryption_key(username).unwrap();

        // La misma clave debe generarse para el mismo usuario
        assert_eq!(key1, key2);
    }

    #[test]
    fn test_hash_key_is_deterministic_hex() {
        let hash1 = hash_key("credentials_test_user");
        let hash2 = hash_key("credentials_test_user");

        assert_eq!(hash1, hash2);
        assert_eq!(hash1.len(), 64);
        assert!(hash1.chars().all(|ch| ch.is_ascii_hexdigit()));
    }

    #[test]
    fn test_derive_named_key_changes_per_scope() {
        let key1 = derive_named_key("credentials:user-a").unwrap();
        let key2 = derive_named_key("credentials:user-b").unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_command_credentials_serialization_preserves_snapshots() {
        let credentials = Credentials {
            username: "test_user".to_string(),
            token: Some("token-123".to_string()),
            session_data: Some("{\"screen_name\":\"test_user\"}".to_string()),
            cookie_data: Some("auth_token=token-123".to_string()),
            storage_data: Some("{\"user\":\"serialized\"}".to_string()),
        };

        let json = serde_json::to_string(&credentials).unwrap();
        let deserialized: Credentials = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.username, credentials.username);
        assert_eq!(deserialized.token, credentials.token);
        assert_eq!(deserialized.session_data, credentials.session_data);
        assert_eq!(deserialized.cookie_data, credentials.cookie_data);
        assert_eq!(deserialized.storage_data, credentials.storage_data);
    }
}
