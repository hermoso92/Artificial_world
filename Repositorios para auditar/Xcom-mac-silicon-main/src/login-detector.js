/**
 * X - Cliente no oficial de X (Twitter) para macOS
 * Copyright © 2024 686f6c61
 *
 * Author: 686f6c61 (https://github.com/686f6c61)
 * Repository: https://github.com/686f6c61/Xcom-mac-silicon
 *
 * Detector automático de login en X.com
 * Este script se inyecta directamente en la página remota cargada en el WebView
 * para detectar nuevos logins y guardarlos automáticamente en el sistema de
 * multicuenta.
 */

(function() {
    'use strict';

    const TAURI_INVOKE = window.__TAURI__?.core?.invoke;
    if (!TAURI_INVOKE) {
        console.error('[Login Detector] Tauri not available');
        return;
    }

    let lastUsername = null;

    /**
     * Extrae el username del usuario actualmente logueado
     * Intenta múltiples estrategias para máxima compatibilidad
     */
    function extractCurrentUsername() {
        try {
            // Estrategia 1: localStorage 'user'
            const userDataStr = localStorage.getItem('user');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData.screen_name) {
                    console.log('[Login Detector] Username found in localStorage:', userData.screen_name);
                    return userData.screen_name;
                }
            }

            // Estrategia 2: Botón de cambio de cuenta en sidebar
            const avatarLink = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
            if (avatarLink && avatarLink.href) {
                const match = avatarLink.href.match(/\/([^\/]+)$/);
                if (match && match[1]) {
                    console.log('[Login Detector] Username found in DOM:', match[1]);
                    return match[1];
                }
            }

            // Estrategia 3: Link del perfil en el menú
            const profileLink = document.querySelector('a[href*="/"][data-testid="AppTabBar_Profile_Link"]');
            if (profileLink && profileLink.href) {
                const match = profileLink.href.match(/\/([^\/]+)$/);
                if (match && match[1]) {
                    console.log('[Login Detector] Username found in profile link:', match[1]);
                    return match[1];
                }
            }
        } catch (e) {
            console.error('[Login Detector] Failed to extract username:', e);
        }
        return null;
    }

    /**
     * Extrae el token de autenticación de las cookies
     */
    function extractAuthToken() {
        try {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'auth_token') {
                    console.log('[Login Detector] Auth token found');
                    return value;
                }
            }
        } catch (e) {
            console.error('[Login Detector] Failed to extract token:', e);
        }
        return null;
    }

    /**
     * Captura las cookies accesibles desde JavaScript para intentar restaurar
     * la sesión al cambiar de cuenta.
     */
    function extractCookieSnapshot() {
        try {
            return document.cookie || null;
        } catch (e) {
            console.error('[Login Detector] Failed to capture cookie snapshot:', e);
        }
        return null;
    }

    /**
     * Captura una snapshot serializable de localStorage.
     */
    function extractStorageSnapshot() {
        try {
            const entries = {};
            for (let index = 0; index < localStorage.length; index += 1) {
                const key = localStorage.key(index);
                if (!key) {
                    continue;
                }

                entries[key] = localStorage.getItem(key);
            }

            return JSON.stringify(entries);
        } catch (e) {
            console.error('[Login Detector] Failed to capture storage snapshot:', e);
        }
        return null;
    }

    /**
     * Verifica si hay un nuevo login y guarda la cuenta
     */
    async function checkForLogin() {
        const currentUsername = extractCurrentUsername();

        // Si encontramos un username y es diferente del último detectado
        if (currentUsername && currentUsername !== lastUsername) {
            console.log('[Login Detector] New login detected:', currentUsername);
            lastUsername = currentUsername;

            try {
                const token = extractAuthToken();
                const sessionData = localStorage.getItem('user') || null;
                const cookieData = extractCookieSnapshot();
                const storageData = extractStorageSnapshot();

                // Guardar cuenta usando comando Tauri
                const uuid = await TAURI_INVOKE('save_account_credentials', {
                    username: currentUsername,
                    token: token,
                    sessionData: sessionData,
                    cookieData: cookieData,
                    storageData: storageData
                });

                console.log('[Login Detector] Account saved successfully:', currentUsername, 'UUID:', uuid);

                await TAURI_INVOKE('rebuild_accounts_menu');

            } catch (error) {
                console.error('[Login Detector] Failed to save account:', error);
            }
        }
    }

    /**
     * Inicia el monitoreo de login
     */
    function startMonitoring() {
        console.log('[Login Detector] Started monitoring for login events');

        // Check inicial
        checkForLogin();

        // Check periódico cada 3 segundos
        setInterval(checkForLogin, 3000);

        // Escuchar cambios en localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'user') {
                console.log('[Login Detector] localStorage change detected');
                checkForLogin();
            }
        });

        // Escuchar navegación (single-page app)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                console.log('[Login Detector] Navigation detected:', url);
                setTimeout(checkForLogin, 500); // Delay para que cargue el DOM
            }
        }).observe(document, { subtree: true, childList: true });
    }

    // Solo ejecutar en x.com o twitter.com
    const hostname = window.location.hostname;
    if (hostname === 'x.com' || hostname === 'twitter.com') {
        // Esperar a que cargue el DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startMonitoring);
        } else {
            startMonitoring();
        }
    } else {
        console.log('[Login Detector] Not on X.com, skipping');
    }
})();
