/**
 * ============================================================================
 * background.js - Service Worker (Manifest V3)
 * ============================================================================
 *
 * Este archivo se ejecuta como service worker de la extension. Su unica
 * responsabilidad es gestionar los menus contextuales (clic derecho) para
 * buscar texto seleccionado en cualquier motor de busqueda.
 *
 * Ciclo de vida del service worker:
 *   - onInstalled: Se ejecuta al instalar/actualizar la extension
 *   - onStartup: Se ejecuta al iniciar Chrome
 *   - El service worker puede terminar en cualquier momento cuando esta inactivo
 *   - Por eso se recrea el estado (menus + config) en ambos eventos
 *
 * Seguridad:
 *   - importScripts() carga solo archivos locales empaquetados en la extension
 *   - Los dominios de Amazon/YouTube se validan contra whitelists de engines.js
 *   - La configuracion se parsea con try/catch para manejar datos corruptos
 *   - No se ejecuta codigo dinamico ni se cargan scripts remotos
 *
 * Permisos necesarios (manifest.json):
 *   - contextMenus: Para crear el menu "Buscar con..."
 *   - storage: Para leer la configuracion del usuario
 *   - activeTab: No se usa aqui, solo en popup.js
 *
 * @file        background.js
 * @author      @686f6c61
 * @license     MIT
 * ============================================================================
 */

/* Carga el registro centralizado de motores (SEARCH_ENGINES, buildSearchUrl, etc.) */
importScripts('engines.js');

/**
 * Configuracion en memoria del service worker.
 * Se carga desde chrome.storage.local en cada inicio.
 * Se usa para dominios configurables y accion rapida de menu contextual.
 */
let config = {
  amazonDomain: DOMAIN_DEFAULTS.amazon,
  youtubeDomain: DOMAIN_DEFAULTS.youtube,
  defaultSearchEngine: DEFAULT_SEARCH_ENGINE_ID
};

const CONTEXT_MENU_DEFAULT_ID = 'search_default';
const CONTEXT_MENU_SEPARATOR_ID = 'search_separator';
const CONTEXT_MENU_GROUP_ID = 'searchEngineConverter';
const CONTEXT_MENU_ENGINE_PREFIX = 'engine_';

/* --- Eventos del ciclo de vida del service worker --- */

/** Al instalar o actualizar la extension: recrear menus y cargar config */
chrome.runtime.onInstalled.addListener(() => {
  loadConfig(createContextMenus);
});

/** Al iniciar Chrome: recrear menus y cargar config (el SW pudo haber muerto) */
chrome.runtime.onStartup.addListener(() => {
  loadConfig(createContextMenus);
});

/* --- Funciones principales --- */

/**
 * Carga la configuracion guardada del usuario desde chrome.storage.local.
 * Valida los dominios contra las whitelists de engines.js para evitar
 * que datos corruptos o manipulados generen URLs a dominios no autorizados.
 */
function loadConfig(onComplete) {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    if (data[STORAGE_KEY]) {
      try {
        const savedConfig = JSON.parse(data[STORAGE_KEY]);
        const nextConfig = { ...config };

        if (validateDomain('amazon', savedConfig.amazonDomain)) {
          nextConfig.amazonDomain = savedConfig.amazonDomain;
        }

        if (validateDomain('youtube', savedConfig.youtubeDomain)) {
          nextConfig.youtubeDomain = savedConfig.youtubeDomain;
        }

        nextConfig.defaultSearchEngine = normalizeDefaultSearchEngine(savedConfig.defaultSearchEngine);
        config = nextConfig;
      } catch (_) {
        /* JSON corrupto en storage: se mantienen los valores por defecto */
      }
    }

    if (typeof onComplete === 'function') {
      onComplete();
    }
  });
}

function getDefaultEngineId() {
  return normalizeDefaultSearchEngine(config.defaultSearchEngine);
}

/**
 * Crea el arbol de menus contextuales.
 * Genera un submenu "Buscar '%s' con..." con un hijo por cada motor que
 * tenga showInContextMenu: true en SEARCH_ENGINES.
 *
 * Se llama removeAll() primero para evitar duplicados al recrear.
 */
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    const defaultEngineId = getDefaultEngineId();
    const defaultEngine = SEARCH_ENGINES[defaultEngineId] || SEARCH_ENGINES[DEFAULT_SEARCH_ENGINE_ID];

    /* Accion rapida: usa el motor predeterminado del usuario */
    chrome.contextMenus.create({
      id: CONTEXT_MENU_DEFAULT_ID,
      title: `Buscar "%s" en ${defaultEngine.name}`,
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: CONTEXT_MENU_SEPARATOR_ID,
      type: 'separator',
      contexts: ['selection']
    });

    /* Menu padre: submenu con todos los motores habilitados para contexto */
    chrome.contextMenus.create({
      id: CONTEXT_MENU_GROUP_ID,
      title: 'Buscar "%s" con...',
      contexts: ['selection']
    });

    /* Submenus: uno por cada motor con showInContextMenu habilitado */
    const menuEngines = Object.values(SEARCH_ENGINES)
      .filter(engine => engine.showInContextMenu);

    menuEngines.forEach(engine => {
      chrome.contextMenus.create({
        id: `${CONTEXT_MENU_ENGINE_PREFIX}${engine.id}`,
        parentId: CONTEXT_MENU_GROUP_ID,
        title: engine.name,
        contexts: ['selection']
      });
    });
  });
}

/* --- Listener de clicks en el menu contextual --- */

/**
 * Cuando el usuario selecciona un motor del menu contextual:
 *   1. Detecta si clico accion rapida (motor por defecto) o submenu (engine_<id>)
 *   2. Construye la URL con buildSearchUrl() de engines.js
 *   3. Abre una nueva pestana con la busqueda
 */
chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.selectionText || typeof info.menuItemId !== 'string') {
    return;
  }

  const query = info.selectionText.trim();
  if (!query) {
    return;
  }

  let engineId = null;

  if (info.menuItemId === CONTEXT_MENU_DEFAULT_ID) {
    engineId = getDefaultEngineId();
  } else if (info.menuItemId.startsWith(CONTEXT_MENU_ENGINE_PREFIX)) {
    engineId = info.menuItemId.slice(CONTEXT_MENU_ENGINE_PREFIX.length);
  }

  if (!engineId) {
    return;
  }

  const url = buildSearchUrl(engineId, query, false, config);

  if (url) {
    chrome.tabs.create({ url: url });
  }
});

/* Refrescar config/menus al cambiar preferencias en popup */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEY]) {
    return;
  }

  loadConfig(createContextMenus);
});

/* --- Inicializacion inmediata --- */
/* Necesario porque el SW puede despertarse por un evento contextMenu
   sin que se dispare onInstalled ni onStartup */
loadConfig(createContextMenus);
