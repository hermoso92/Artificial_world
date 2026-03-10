// X - Cliente no oficial de X (Twitter) para macOS
// Copyright © 2024 686f6c61
//
// Author: 686f6c61 (https://github.com/686f6c61)
// Repository: https://github.com/686f6c61/Xcom-mac-silicon
//
// Módulo de gestión multicuenta

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[cfg(target_os = "macos")]
use security_framework::passwords::{
    delete_generic_password, get_generic_password, set_generic_password,
};

use crate::{decrypt_data, derive_named_key, encrypt_data, hash_key, KEYCHAIN_SERVICE};

/// Información pública de una cuenta (sin credenciales sensibles)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AccountInfo {
    pub username: String,
    pub uuid: String,
    pub created_at: i64,
    pub last_used: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
}

/// Lista maestra de cuentas
#[derive(Serialize, Deserialize, Clone, Debug)]
struct AccountsList {
    accounts: Vec<AccountInfo>,
    active_username: Option<String>,
}

/// Credenciales de cuenta (sensible, encriptado)
#[derive(Serialize, Deserialize, Clone)]
pub struct Credentials {
    pub username: String,
    pub uuid: String,
    pub token: Option<String>,
    pub session_data: Option<String>,
    pub cookie_data: Option<String>,
    pub storage_data: Option<String>,
    pub created_at: i64,
    pub last_used: i64,
}

/// Obtiene la clave maestra para encriptar AccountsList
fn derive_master_key() -> Result<[u8; 32], String> {
    derive_named_key("accounts_list")
}

/// Obtiene la lista de cuentas desde Keychain
fn get_accounts_list() -> Result<AccountsList, String> {
    #[cfg(target_os = "macos")]
    {
        let account = &hash_key("accounts_list");

        match get_generic_password(KEYCHAIN_SERVICE, account) {
            Ok(password_data) => {
                let encrypted =
                    String::from_utf8(password_data.to_vec()).map_err(|e| e.to_string())?;

                let master_key = derive_master_key()?;
                let decrypted = decrypt_data(&encrypted, &master_key)?;

                let accounts_list: AccountsList = serde_json::from_str(&decrypted)
                    .map_err(|e| format!("Failed to parse accounts list: {}", e))?;

                Ok(accounts_list)
            }
            Err(_) => {
                // No existe lista, crear una vacía
                Ok(AccountsList {
                    accounts: Vec::new(),
                    active_username: None,
                })
            }
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Only macOS is supported".to_string())
    }
}

/// Guarda la lista de cuentas en Keychain
fn save_accounts_list(list: &AccountsList) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let account = &hash_key("accounts_list");

        let json = serde_json::to_string(list)
            .map_err(|e| format!("Failed to serialize accounts list: {}", e))?;

        let master_key = derive_master_key()?;
        let encrypted = encrypt_data(&json, &master_key)?;

        set_generic_password(KEYCHAIN_SERVICE, account, encrypted.as_bytes())
            .map_err(|e| format!("Failed to save accounts list: {}", e))?;

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Only macOS is supported".to_string())
    }
}

/// Lista todas las cuentas disponibles
pub fn list_accounts() -> Result<Vec<AccountInfo>, String> {
    let accounts_list = get_accounts_list()?;
    Ok(accounts_list.accounts)
}

/// Obtiene la cuenta activa actual
pub fn get_active_account() -> Result<Option<String>, String> {
    let accounts_list = get_accounts_list()?;
    Ok(accounts_list.active_username)
}

/// Establece la cuenta activa
pub fn set_active_account(username: &str) -> Result<(), String> {
    let mut accounts_list = get_accounts_list()?;

    // Verificar que la cuenta existe
    let exists = accounts_list
        .accounts
        .iter()
        .any(|a| a.username == username);
    if !exists {
        return Err(format!("Account '{}' not found", username));
    }

    // Actualizar last_used del AccountInfo
    if let Some(account) = accounts_list
        .accounts
        .iter_mut()
        .find(|a| a.username == username)
    {
        account.last_used = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
    }

    accounts_list.active_username = Some(username.to_string());
    save_accounts_list(&accounts_list)?;

    // También actualizar last_used en las credenciales
    #[cfg(target_os = "macos")]
    {
        let account_key = &hash_key(&format!("credentials_{}", username));

        if let Ok(password_data) = get_generic_password(KEYCHAIN_SERVICE, account_key) {
            if let Ok(encrypted) = String::from_utf8(password_data.to_vec()) {
                if let Ok(key) = derive_named_key(&format!("credentials:{username}")) {
                    if let Ok(decrypted) = decrypt_data(&encrypted, &key) {
                        if let Ok(mut creds) = serde_json::from_str::<Credentials>(&decrypted) {
                            creds.last_used = SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_secs() as i64;

                            if let Ok(json) = serde_json::to_string(&creds) {
                                if let Ok(encrypted_new) = encrypt_data(&json, &key) {
                                    let _ = set_generic_password(
                                        KEYCHAIN_SERVICE,
                                        account_key,
                                        encrypted_new.as_bytes(),
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// Agrega una nueva cuenta
pub fn add_account(
    username: &str,
    token: Option<String>,
    session: Option<String>,
    cookie_data: Option<String>,
    storage_data: Option<String>,
) -> Result<String, String> {
    let mut accounts_list = get_accounts_list()?;

    // Verificar si ya existe
    let existing_uuid = accounts_list
        .accounts
        .iter()
        .find(|a| a.username == username)
        .map(|a| a.uuid.clone());

    if let Some(uuid) = existing_uuid {
        // Actualizar credenciales existentes
        tracing::info!("Updating existing account: {}", username);

        // Actualizar last_used
        if let Some(account) = accounts_list
            .accounts
            .iter_mut()
            .find(|a| a.username == username)
        {
            account.last_used = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
        }

        save_accounts_list(&accounts_list)?;

        // Actualizar credenciales
        save_credentials(username, &uuid, token, session, cookie_data, storage_data)?;

        return Ok(uuid);
    }

    // Crear nueva cuenta
    let uuid = Uuid::new_v4().to_string();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let account_info = AccountInfo {
        username: username.to_string(),
        uuid: uuid.clone(),
        created_at: now,
        last_used: now,
        display_name: None,
        avatar_url: None,
    };

    accounts_list.accounts.push(account_info);

    // Si es la primera cuenta, hacerla activa
    if accounts_list.accounts.len() == 1 {
        accounts_list.active_username = Some(username.to_string());
    }

    save_accounts_list(&accounts_list)?;

    // Guardar credenciales
    save_credentials(username, &uuid, token, session, cookie_data, storage_data)?;

    tracing::info!("Added new account: {} (UUID: {})", username, uuid);

    Ok(uuid)
}

/// Guarda credenciales de una cuenta
fn save_credentials(
    username: &str,
    uuid: &str,
    token: Option<String>,
    session: Option<String>,
    cookie_data: Option<String>,
    storage_data: Option<String>,
) -> Result<(), String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let credentials = Credentials {
        username: username.to_string(),
        uuid: uuid.to_string(),
        token,
        session_data: session,
        cookie_data,
        storage_data,
        created_at: now,
        last_used: now,
    };

    #[cfg(target_os = "macos")]
    {
        let account = &hash_key(&format!("credentials_{}", username));

        let json = serde_json::to_string(&credentials)
            .map_err(|e| format!("Failed to serialize credentials: {}", e))?;

        let key = derive_named_key(&format!("credentials:{username}"))?;

        let encrypted = encrypt_data(&json, &key)?;

        set_generic_password(KEYCHAIN_SERVICE, account, encrypted.as_bytes())
            .map_err(|e| format!("Failed to save credentials: {}", e))?;

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Only macOS is supported".to_string())
    }
}

/// Elimina una cuenta
pub fn remove_account(username: &str) -> Result<(), String> {
    let mut accounts_list = get_accounts_list()?;

    // Buscar índice de la cuenta
    let index = accounts_list
        .accounts
        .iter()
        .position(|a| a.username == username)
        .ok_or(format!("Account '{}' not found", username))?;

    accounts_list.accounts.remove(index);

    // Si era la cuenta activa, limpiar
    if accounts_list.active_username.as_ref() == Some(&username.to_string()) {
        accounts_list.active_username = accounts_list.accounts.first().map(|a| a.username.clone());
    }

    save_accounts_list(&accounts_list)?;

    // Eliminar credenciales del Keychain
    #[cfg(target_os = "macos")]
    {
        let account = &hash_key(&format!("credentials_{}", username));

        let _ = delete_generic_password(KEYCHAIN_SERVICE, account);
    }

    tracing::info!("Removed account: {}", username);

    Ok(())
}

/// Migra credenciales de v0.3.0 a v0.4.0
pub fn migrate_legacy_credentials() -> Result<(), String> {
    // Verificar si ya hay cuentas (ya migrado)
    let accounts_list = get_accounts_list()?;
    if !accounts_list.accounts.is_empty() {
        tracing::info!("Already migrated to v0.4.0");
        return Ok(());
    }

    // Intentar detectar credenciales antiguas
    // En v0.3.0, las credenciales se guardaban como hash("credentials")
    #[cfg(target_os = "macos")]
    {
        let old_account = &hash_key("credentials");

        match get_generic_password(KEYCHAIN_SERVICE, old_account) {
            Ok(_password_data) => {
                tracing::info!("Found legacy credentials, migrating...");

                // Intentar descifrar con clave antigua (sin username específico)
                // Esto es complejo porque no sabemos el username original
                // Por ahora, crear cuenta genérica "imported"

                let username = "imported";
                let uuid = Uuid::new_v4().to_string();

                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as i64;

                let account_info = AccountInfo {
                    username: username.to_string(),
                    uuid: uuid.clone(),
                    created_at: now,
                    last_used: now,
                    display_name: Some("Cuenta Migrada".to_string()),
                    avatar_url: None,
                };

                let new_list = AccountsList {
                    accounts: vec![account_info],
                    active_username: Some(username.to_string()),
                };

                save_accounts_list(&new_list)?;

                tracing::info!("Migration completed: 1 account migrated");
                Ok(())
            }
            Err(_) => {
                tracing::info!("No legacy credentials found");
                Ok(())
            }
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_account_info_serialization() {
        let account = AccountInfo {
            username: "testuser".to_string(),
            uuid: Uuid::new_v4().to_string(),
            created_at: 1234567890,
            last_used: 1234567890,
            display_name: Some("Test User".to_string()),
            avatar_url: None,
        };

        let json = serde_json::to_string(&account).unwrap();
        let deserialized: AccountInfo = serde_json::from_str(&json).unwrap();

        assert_eq!(account.username, deserialized.username);
        assert_eq!(account.uuid, deserialized.uuid);
    }

    #[test]
    fn test_derive_master_key() {
        let key1 = derive_master_key().unwrap();
        let key2 = derive_master_key().unwrap();

        // La clave debe ser determinística
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);
    }

    #[test]
    fn test_account_credentials_serialization_preserves_snapshots() {
        let credentials = Credentials {
            username: "testuser".to_string(),
            uuid: Uuid::new_v4().to_string(),
            token: Some("token".to_string()),
            session_data: Some("{\"screen_name\":\"testuser\"}".to_string()),
            cookie_data: Some("auth_token=token".to_string()),
            storage_data: Some("{\"user\":\"serialized\"}".to_string()),
            created_at: 1234567890,
            last_used: 1234567891,
        };

        let json = serde_json::to_string(&credentials).unwrap();
        let deserialized: Credentials = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.username, credentials.username);
        assert_eq!(deserialized.uuid, credentials.uuid);
        assert_eq!(deserialized.cookie_data, credentials.cookie_data);
        assert_eq!(deserialized.storage_data, credentials.storage_data);
        assert_eq!(deserialized.session_data, credentials.session_data);
    }
}
