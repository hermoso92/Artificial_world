/**
 * ============================================================================
 * Search Engine Converter v2.1.0 - Popup Controller
 * ============================================================================
 *
 * @file        popup.js
 * @description Controlador principal del popup. Genera todo el HTML dinamico
 *              desde el registro centralizado engines.js y gestiona la interfaz,
 *              deteccion de busquedas, conversion entre motores, configuracion
 *              y todas las interacciones del usuario.
 *
 * @author      @686f6c61
 * @repository  https://github.com/686f6c61/chrome-search-engine-converter
 * @license     MIT License
 * @version     2.1.0
 * @date        2025-01-18
 *
 * @requires    engines.js - Registro centralizado (SEARCH_ENGINES, buildSearchUrl,
 *              extractQuery, detectEngine, isImageSearch, STORAGE_KEY)
 * @requires    chrome.tabs - Para deteccion de URL actual y apertura de pestanas
 * @requires    chrome.storage - Para persistencia de configuracion
 * @requires    Sortable.js - Para drag-and-drop en orden de botones
 *
 * ============================================================================
 */

/* ============================================================================
 * ESTADO Y CONFIGURACION GLOBAL
 * ============================================================================ */

/**
 * Estado de configuracion del popup. Se inicializa con valores por defecto
 * y se sobreescribe con los datos guardados en chrome.storage.local.
 *
 * @property {string}  amazonDomain       - Dominio de Amazon ('es', 'com', etc.)
 * @property {string}  youtubeDomain      - Dominio de YouTube ('com', 'es')
 * @property {string}  defaultSearchEngine - engineId del motor por defecto
 * @property {Array}   buttonOrder        - Orden personalizado de botones (buttonIds)
 * @property {Object}  visibleEngines     - Mapa {engineId: boolean} de visibilidad
 */
/* Constantes de tiempos (ms) */
const PULSE_DURATION = 2000;
const COPY_FEEDBACK_DURATION = 2000;
const NOTIFICATION_DISPLAY_DURATION = 3000;
const NOTIFICATION_FADE_DURATION = 300;
const DEBOUNCE_SAVE_DELAY = 300;

/** Timer para debounce de saveConfiguration */
let _saveDebounceTimer = null;

let configState = {
  amazonDomain: DOMAIN_DEFAULTS.amazon,
  youtubeDomain: DOMAIN_DEFAULTS.youtube,
  defaultSearchEngine: DEFAULT_SEARCH_ENGINE_ID,
  buttonOrder: [],
  visibleEngines: { ...DEFAULT_CONFIG }
};

/* ============================================================================
 * INICIALIZACION DEL POPUP
 * ============================================================================
 * Orden de inicializacion (importa):
 *   1. Renderizar HTML dinamico (botones, checkboxes, selects)
 *   2. Cargar configuracion guardada (sobreescribe valores por defecto)
 *   3. Registrar event listeners (sobre los elementos ya renderizados)
 *   4. Aplicar visibilidad y orden (con la config ya cargada)
 *   5. Detectar pagina actual (habilita/deshabilita botones)
 * ============================================================================ */

document.addEventListener('DOMContentLoaded', async function() {
  /* Paso 1: Generar HTML dinamico desde SEARCH_ENGINES */
  renderEngineButtons();
  renderVisibilityCheckboxes();
  renderDefaultEngineOptions();

  /* Paso 2: Cargar config guardada (await porque es asincrono con chrome.storage) */
  await loadConfiguration();

  /* Paso 3: Registrar eventos sobre los elementos ya existentes */
  setupEventListeners();
  setupQuickSearch();
  setupModeToggle();
  setupCopyButtons();
  setupKeyboardShortcuts();

  /* Paso 4: Aplicar la configuracion cargada a la interfaz */
  updateEngineButtonVisibility();
  initializeButtonOrdering();

  /* Paso 5: Detectar si la pestana activa es un motor de busqueda */
  checkCurrentPage();
});

/* ============================================================================
 * GENERACION DINAMICA DE HTML
 * ============================================================================ */

/**
 * Genera los botones de motores de busqueda en el contenedor .search-buttons
 * Itera SEARCH_ENGINES y crea un boton por cada motor con su icono y color.
 */
function renderEngineButtons() {
  const container = document.querySelector('.search-buttons');
  if (!container) return;

  Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
    const button = document.createElement('button');
    button.id = engine.buttonId;
    button.className = 'search-button engine-button';
    button.style.display = engine.visibleByDefault ? '' : 'none';

    const icon = document.createElement('i');
    icon.className = engine.icon;
    icon.style.color = engine.color;
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    button.appendChild(document.createTextNode(' ' + engine.name));
    button.setAttribute('aria-label', 'Buscar en ' + engine.name);

    if (engine.hasCopyButton) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-button';
      copyBtn.setAttribute('data-engine', engine.id);
      copyBtn.setAttribute('aria-label', 'Copiar URL de ' + engine.name);
      const copyIcon = document.createElement('i');
      copyIcon.className = 'fas fa-copy';
      copyIcon.setAttribute('aria-hidden', 'true');
      copyBtn.appendChild(copyIcon);
      button.appendChild(copyBtn);
    }

    container.appendChild(button);
  });
}

/**
 * Genera los checkboxes de visibilidad en el contenedor #visibilityCheckboxes.
 * Cada checkbox controla si un motor aparece en el popup.
 */
function renderVisibilityCheckboxes() {
  const container = document.getElementById('visibilityCheckboxes');
  if (!container) return;

  Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
    const label = document.createElement('label');
    label.style.cssText = 'display: flex; align-items: center; font-size: 13px;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'visible' + id.charAt(0).toUpperCase() + id.slice(1);
    checkbox.style.marginRight = '6px';
    checkbox.checked = engine.visibleByDefault;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + engine.name));
    container.appendChild(label);
  });
}

/**
 * Genera las opciones del select #defaultSearchEngine desde SEARCH_ENGINES.
 */
function renderDefaultEngineOptions() {
  const select = document.getElementById('defaultSearchEngine');
  if (!select) return;

  Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = engine.name;
    select.appendChild(option);
  });
}

/* ============================================================================
 * GESTION DE INTERFAZ DE USUARIO
 * ============================================================================ */

/**
 * Actualiza el mensaje de estado en el header del popup.
 * Construye el contenido con APIs DOM seguras (icono + texto).
 *
 * @param {string} message - Mensaje a mostrar (texto plano, sin HTML externo)
 * @param {string} [type='info'] - Tipo: 'info', 'success', 'error', 'warning'
 */
function updateStatus(message, type = 'info') {
  const statusElement = document.getElementById('status');
  const statusContainer = document.querySelector('.status-container');

  statusElement.classList.remove('success', 'error', 'warning');
  statusContainer.classList.remove('pulse');

  const icons = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle'
  };
  const icon = icons[type] || icons.info;

  if (type !== 'info') {
    statusElement.classList.add(type);
  }

  statusElement.textContent = '';
  const iconEl = document.createElement('i');
  iconEl.className = 'fas ' + icon;
  iconEl.setAttribute('aria-hidden', 'true');
  statusElement.appendChild(iconEl);
  statusElement.appendChild(document.createTextNode(' ' + message));

  if (type !== 'info') {
    statusContainer.classList.add('pulse');
    setTimeout(() => statusContainer.classList.remove('pulse'), PULSE_DURATION);
  }
}

/**
 * Muestra una notificacion temporal en la esquina superior derecha.
 *
 * @param {string} message - Mensaje a mostrar
 * @param {string} [type='info'] - Tipo: 'info', 'success', 'error'
 */
function showNotification(message, type = 'info') {
  let container = document.getElementById('notification-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = 'notification ' + type;
  notification.setAttribute('role', 'alert');
  notification.style.cssText =
    'background: ' + (type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3') + ';' +
    'color: white; padding: 12px 20px; border-radius: 4px; margin-bottom: 10px;' +
    'box-shadow: 0 2px 5px rgba(0,0,0,0.2); opacity: 0; transition: opacity 0.3s;';
  notification.textContent = message;

  container.appendChild(notification);
  setTimeout(() => notification.style.opacity = '1', 10);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        container.removeChild(notification);
      }
    }, NOTIFICATION_FADE_DURATION);
  }, NOTIFICATION_DISPLAY_DURATION);
}

/* ============================================================================
 * CONFIGURACION: CARGA Y GUARDADO
 * ============================================================================
 * La configuracion se persiste en chrome.storage.local como JSON serializado
 * bajo la clave STORAGE_KEY (definida en engines.js).
 *
 * Flujo: loadConfiguration() -> JSON.parse -> applyConfigToUI()
 *        saveConfiguration() -> JSON.stringify -> chrome.storage.local.set
 * ============================================================================ */

/**
 * Carga la configuracion del usuario desde chrome.storage.local.
 * Es asincrona porque chrome.storage usa callbacks; se envuelve en una Promise
 * para poder usar await en la inicializacion.
 *
 * Si la configuracion esta corrupta (JSON invalido), se ignora silenciosamente
 * y se mantienen los valores por defecto.
 *
 * @returns {Promise<void>}
 */
async function loadConfiguration() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }

    try {
      chrome.storage.local.get(STORAGE_KEY, function(data) {
        if (chrome.runtime.lastError) {
          resolve();
          return;
        }

        if (data[STORAGE_KEY]) {
          try {
            const savedConfig = JSON.parse(data[STORAGE_KEY]);
            applySavedConfiguration(savedConfig);
          } catch (_) {
            // Configuracion corrupta, se usa la por defecto
          }
        }

        applyConfigToUI();
        resolve();
      });
    } catch (_) {
      resolve();
    }
  });
}

function sanitizeVisibleEngines(visibleEngines) {
  const safeVisibleEngines = { ...DEFAULT_CONFIG };

  if (!visibleEngines || typeof visibleEngines !== 'object') {
    return safeVisibleEngines;
  }

  Object.keys(safeVisibleEngines).forEach((engineId) => {
    if (typeof visibleEngines[engineId] === 'boolean') {
      safeVisibleEngines[engineId] = visibleEngines[engineId];
    }
  });

  return safeVisibleEngines;
}

function sanitizeButtonOrder(buttonOrder) {
  if (!Array.isArray(buttonOrder)) {
    return [];
  }

  const validButtonIds = new Set(
    Object.values(SEARCH_ENGINES).map(engine => engine.buttonId)
  );
  const safeOrder = [];

  buttonOrder.forEach((buttonId) => {
    if (
      typeof buttonId === 'string' &&
      validButtonIds.has(buttonId) &&
      !safeOrder.includes(buttonId)
    ) {
      safeOrder.push(buttonId);
    }
  });

  return safeOrder;
}

function applySavedConfiguration(savedConfig) {
  if (!savedConfig || typeof savedConfig !== 'object') {
    return;
  }

  if (validateDomain('amazon', savedConfig.amazonDomain)) {
    configState.amazonDomain = savedConfig.amazonDomain;
  }

  if (validateDomain('youtube', savedConfig.youtubeDomain)) {
    configState.youtubeDomain = savedConfig.youtubeDomain;
  }

  configState.defaultSearchEngine = normalizeDefaultSearchEngine(savedConfig.defaultSearchEngine);
  configState.visibleEngines = sanitizeVisibleEngines(savedConfig.visibleEngines);
  configState.buttonOrder = sanitizeButtonOrder(savedConfig.buttonOrder);
}

/**
 * Aplica los valores de configState a los elementos del DOM:
 * selects de dominio, motor por defecto y checkboxes de visibilidad.
 */
function applyConfigToUI() {
  const amazonDomainSelect = document.getElementById('amazonDomain');
  if (amazonDomainSelect) {
    amazonDomainSelect.value = configState.amazonDomain || 'es';
  }

  const youtubeDomainSelect = document.getElementById('youtubeDomain');
  if (youtubeDomainSelect) {
    youtubeDomainSelect.value = configState.youtubeDomain || 'com';
  }

  const defaultSearchEngineSelect = document.getElementById('defaultSearchEngine');
  if (defaultSearchEngineSelect) {
    defaultSearchEngineSelect.value = configState.defaultSearchEngine || DEFAULT_SEARCH_ENGINE_ID;
  }

  Object.keys(configState.visibleEngines).forEach(engine => {
    const checkbox = document.getElementById('visible' + engine.charAt(0).toUpperCase() + engine.slice(1));
    if (checkbox) {
      checkbox.checked = configState.visibleEngines[engine];
    }
  });
}

/**
 * Guarda configState completo en chrome.storage.local.
 * Se llama cada vez que el usuario modifica cualquier opcion.
 */
function saveConfiguration() {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(() => {
    try {
      chrome.storage.local.set({
        [STORAGE_KEY]: JSON.stringify(configState)
      });
    } catch (_) {
      // Error al guardar
    }
  }, DEBOUNCE_SAVE_DELAY);
}

/* ============================================================================
 * EVENT LISTENERS
 * ============================================================================
 * Todos los listeners se registran sobre elementos ya existentes en el DOM.
 * Los botones de motor se crean dinamicamente en renderEngineButtons(), por lo
 * que setupEventListeners() se llama DESPUES del renderizado.
 * Los copy buttons usan delegacion de eventos (ver setupCopyButtons()).
 * ============================================================================ */

/**
 * Registra todos los event listeners de la interfaz:
 *   - Click en cada boton de motor -> handleEngineConversion()
 *   - Toggle del panel de configuracion
 *   - Cambios en selects de dominio
 *   - Cambios en checkboxes de visibilidad
 *   - Boton guardar
 */
function setupEventListeners() {
  // Botones de motores: generar desde SEARCH_ENGINES
  Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
    const button = document.getElementById(engine.buttonId);
    if (button) {
      button.addEventListener('click', () => handleEngineConversion(id));
    }
  });

  // Toggle del panel de configuracion
  const configToggleButton = document.getElementById('configToggleButton');
  const configPanel = document.getElementById('configPanel');

  if (configToggleButton && configPanel) {
    configToggleButton.addEventListener('click', function() {
      configPanel.classList.toggle('visible');
      const isOpen = configPanel.classList.contains('visible');
      configToggleButton.setAttribute('aria-expanded', String(isOpen));
      configToggleButton.textContent = '';
      const icon = document.createElement('i');
      icon.setAttribute('aria-hidden', 'true');
      if (isOpen) {
        icon.className = 'fas fa-times';
        configToggleButton.appendChild(icon);
        configToggleButton.appendChild(document.createTextNode(' Cerrar'));
      } else {
        icon.className = 'fas fa-cog';
        configToggleButton.appendChild(icon);
        configToggleButton.appendChild(document.createTextNode(' Configuración'));
      }
    });
  }

  // Selectores de dominio
  const amazonDomain = document.getElementById('amazonDomain');
  if (amazonDomain) {
    amazonDomain.addEventListener('change', function() {
      configState.amazonDomain = validateDomain('amazon', this.value) ? this.value : 'es';
      saveConfiguration();
    });
  }

  const youtubeDomain = document.getElementById('youtubeDomain');
  if (youtubeDomain) {
    youtubeDomain.addEventListener('change', function() {
      configState.youtubeDomain = validateDomain('youtube', this.value) ? this.value : 'com';
      saveConfiguration();
    });
  }

  const defaultSearchEngine = document.getElementById('defaultSearchEngine');
  if (defaultSearchEngine) {
    defaultSearchEngine.addEventListener('change', function() {
      configState.defaultSearchEngine = normalizeDefaultSearchEngine(this.value);
      saveConfiguration();
    });
  }

  // Checkboxes de visibilidad
  Object.keys(configState.visibleEngines).forEach(engine => {
    const checkbox = document.getElementById('visible' + engine.charAt(0).toUpperCase() + engine.slice(1));
    if (checkbox) {
      checkbox.addEventListener('change', function() {
        configState.visibleEngines[engine] = checkbox.checked;
        updateEngineButtonVisibility();
        updateOrderList();
        updateQuickSearchEngines();
        saveConfiguration();
      });
    }
  });

  // Boton guardar
  const saveButton = document.getElementById('saveConfigButton');
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      saveConfiguration();
      showNotification('Configuración guardada', 'success');
    });
  }
}

/* ============================================================================
 * CONVERSION DE BUSQUEDAS
 * ============================================================================ */

/**
 * Maneja la conversion de busqueda al motor de destino seleccionado.
 * Usa extractQuery(), isImageSearch() y buildSearchUrl() de engines.js.
 *
 * @param {string} targetEngine - ID del motor de destino
 */
function handleEngineConversion(targetEngine) {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    updateStatus('Error: Chrome API no disponible', 'error');
    return;
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (chrome.runtime.lastError) {
      updateStatus('Error al obtener pestaña activa', 'error');
      return;
    }

    if (!tabs || tabs.length === 0) {
      updateStatus('No se encontró pestaña activa', 'error');
      return;
    }

    const activeTab = tabs[0];
    const currentUrl = activeTab.url;

    const imgSearch = isImageSearch(currentUrl);
    let query = extractQuery(currentUrl);

    if (!query) {
      updateStatus('No se detectó ninguna búsqueda', 'error');
      return;
    }

    const targetUrl = buildSearchUrl(targetEngine, query, imgSearch, configState);

    if (targetUrl) {
      chrome.tabs.create({ url: targetUrl });
      window.close();
    } else {
      updateStatus('Motor no soportado', 'error');
    }
  });
}

/* ============================================================================
 * DETECCION DE PAGINA ACTUAL
 * ============================================================================ */

/**
 * Detecta si la pestana activa es una pagina de busqueda.
 * Si lo es, habilita los botones de conversion y muestra el motor detectado.
 * Si no, deshabilita los botones y muestra un aviso.
 *
 * Usa detectEngine() e isImageSearch() de engines.js.
 */
function checkCurrentPage() {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    updateStatus('Modo de prueba - API no disponible', 'warning');
    return;
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (chrome.runtime.lastError) return;

    if (!tabs || tabs.length === 0) {
      updateStatus('No se encontró pestaña activa', 'warning');
      return;
    }

    const activeTab = tabs[0];
    const url = activeTab.url || '';

    const engineId = detectEngine(url);
    if (engineId) {
      const engine = SEARCH_ENGINES[engineId];
      const imgSearch = isImageSearch(url);
      let statusMessage = 'Motor detectado: ' + engine.name;
      if (imgSearch) statusMessage += ' (Imágenes)';
      updateStatus(statusMessage, 'success');

      document.querySelectorAll('.engine-button').forEach(btn => {
        btn.disabled = false;
      });
    } else {
      updateStatus('No es una página de búsqueda compatible', 'warning');
      document.querySelectorAll('.engine-button').forEach(btn => {
        btn.disabled = true;
      });
    }
  });
}

/* ============================================================================
 * VISIBILIDAD Y ORDEN DE BOTONES
 * ============================================================================ */

/**
 * Muestra u oculta cada boton de motor segun configState.visibleEngines.
 * Despues aplica el orden personalizado si existe.
 */
function updateEngineButtonVisibility() {
  Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
    const button = document.getElementById(engine.buttonId);
    if (button) {
      button.style.display = configState.visibleEngines[id] ? '' : 'none';
    }
  });

  applyButtonOrder();
}

/**
 * Inicializa el drag-and-drop de botones usando SortableJS.
 * Permite al usuario reordenar los botones arrastrando en la lista de config.
 * El nuevo orden se guarda automaticamente en configState y chrome.storage.
 */
function initializeButtonOrdering() {
  const orderList = document.getElementById('buttonOrderList');
  if (!orderList || typeof Sortable === 'undefined') return;

  updateOrderList();

  Sortable.create(orderList, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: function() {
      const newOrder = Array.from(orderList.children).map(li => li.getAttribute('data-id'));
      configState.buttonOrder = newOrder;
      saveConfiguration();
      applyButtonOrder();
    }
  });
}

/**
 * Actualiza la lista de orden de botones.
 * Los items se construyen con createElement/textContent para evitar sinks HTML.
 */
function updateOrderList() {
  const orderList = document.getElementById('buttonOrderList');
  if (!orderList) return;

  // Limpiar lista existente
  while (orderList.firstChild) {
    orderList.removeChild(orderList.firstChild);
  }

  const orderedVisibleEngineIds = getVisibleEngineIdsInOrder();

  orderedVisibleEngineIds.forEach(id => {
    const engine = SEARCH_ENGINES[id];
    if (!engine) return;

    const li = document.createElement('li');
    li.setAttribute('data-id', engine.buttonId);
    li.className = 'button-order-item';

    const gripIcon = document.createElement('i');
    gripIcon.className = 'fas fa-grip-lines';
    gripIcon.setAttribute('aria-hidden', 'true');
    li.appendChild(gripIcon);
    li.appendChild(document.createTextNode(' '));

    const engineIcon = document.createElement('i');
    engineIcon.className = engine.icon;
    engineIcon.style.color = engine.color;
    engineIcon.setAttribute('aria-hidden', 'true');
    li.appendChild(engineIcon);
    li.appendChild(document.createTextNode(' ' + engine.name));

    orderList.appendChild(li);
  });
}

function getVisibleEngineIdsInOrder() {
  const buttonIdToEngineId = new Map(
    Object.entries(SEARCH_ENGINES).map(([id, engine]) => [engine.buttonId, id])
  );

  const orderedVisibleEngineIds = [];
  const addedEngineIds = new Set();

  configState.buttonOrder.forEach((buttonId) => {
    const engineId = buttonIdToEngineId.get(buttonId);
    if (engineId && configState.visibleEngines[engineId] && !addedEngineIds.has(engineId)) {
      orderedVisibleEngineIds.push(engineId);
      addedEngineIds.add(engineId);
    }
  });

  Object.keys(configState.visibleEngines).forEach((engineId) => {
    if (configState.visibleEngines[engineId] && !addedEngineIds.has(engineId)) {
      orderedVisibleEngineIds.push(engineId);
      addedEngineIds.add(engineId);
    }
  });

  return orderedVisibleEngineIds;
}

/**
 * Reordena los botones en el DOM segun configState.buttonOrder.
 * Usa appendChild() que mueve el elemento existente (no lo clona).
 */
function applyButtonOrder() {
  const searchButtons = document.querySelector('.search-buttons');
  if (!searchButtons) return;

  const orderedButtons = [];
  const appendedButtonIds = new Set();

  configState.buttonOrder.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button && button.style.display !== 'none') {
      orderedButtons.push(button);
      appendedButtonIds.add(buttonId);
    }
  });

  Object.values(SEARCH_ENGINES).forEach((engine) => {
    const button = document.getElementById(engine.buttonId);
    if (button && button.style.display !== 'none' && !appendedButtonIds.has(engine.buttonId)) {
      orderedButtons.push(button);
      appendedButtonIds.add(engine.buttonId);
    }
  });

  orderedButtons.forEach(button => {
    searchButtons.appendChild(button);
  });
}

/* ============================================================================
 * BUSQUEDA RAPIDA Y MODOS
 * ============================================================================
 * La extension tiene dos modos:
 *   1. Convertir: Detecta la busqueda actual y la convierte a otro motor
 *   2. Buscar: Permite escribir un termino y buscarlo directamente
 * Se alternan con los botones "Convertir" / "Buscar" (mode toggle).
 * ============================================================================ */

/**
 * Configura el campo de busqueda rapida: input, boton limpiar y tecla Enter.
 * Tambien puebla el select de motores con los motores visibles.
 */
function setupQuickSearch() {
  const searchInput = document.getElementById('quickSearchInput');
  const clearButton = document.getElementById('clearSearchButton');
  const engineSelect = document.getElementById('quickSearchEngine');

  if (!searchInput) return;

  searchInput.addEventListener('input', function() {
    clearButton.style.display = searchInput.value ? 'block' : 'none';
  });

  if (clearButton) {
    clearButton.addEventListener('click', function() {
      searchInput.value = '';
      clearButton.style.display = 'none';
      searchInput.focus();
    });
  }

  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      performQuickSearch(searchInput.value.trim(), engineSelect.value);
    }
  });

  updateQuickSearchEngines();
}

/**
 * Actualiza el select de motores de busqueda rapida.
 * Solo muestra los motores que el usuario tiene habilitados (visibles).
 * Si no hay ninguno visible, muestra Google como opcion de respaldo.
 */
function updateQuickSearchEngines() {
  const select = document.getElementById('quickSearchEngine');
  if (!select) return;

  // Limpiar opciones existentes
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
    if (configState.visibleEngines[id]) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = engine.name;
      select.appendChild(option);
    }
  });

  if (select.options.length === 0) {
    const option = document.createElement('option');
    option.value = 'google';
    option.textContent = 'Google (predeterminado)';
    select.appendChild(option);
  }
}

/**
 * Ejecuta una busqueda directa: construye la URL y abre una nueva pestana.
 * Si chrome.tabs no esta disponible (testing), usa window.open como respaldo.
 *
 * @param {string} query  - Termino de busqueda
 * @param {string} engine - ID del motor seleccionado
 */
function performQuickSearch(query, engine) {
  const url = buildSearchUrl(engine, query, false, configState);
  if (!url) {
    showNotification('Motor de búsqueda no válido', 'error');
    return;
  }

  if (typeof chrome === 'undefined' || !chrome.tabs) {
    window.open(url, '_blank');
    return;
  }

  try {
    chrome.tabs.create({ url: url }, function() {
      if (chrome.runtime.lastError) {
        window.open(url, '_blank');
      } else {
        window.close();
      }
    });
  } catch (_) {
    window.open(url, '_blank');
  }
}

/**
 * Configura el toggle entre modo "Convertir" y modo "Buscar".
 * En modo Convertir se muestra el status y se detecta la pagina actual.
 * En modo Buscar se muestra el input de busqueda rapida.
 */
function setupModeToggle() {
  const convertButton = document.getElementById('convertModeButton');
  const searchButton = document.getElementById('searchModeButton');
  const quickSearchContainer = document.querySelector('.quick-search-container');
  const statusContainer = document.querySelector('.status-container');

  if (!convertButton || !searchButton) return;

  convertButton.addEventListener('click', function() {
    convertButton.classList.add('active');
    searchButton.classList.remove('active');
    quickSearchContainer.classList.remove('visible');
    statusContainer.style.display = 'block';
    checkCurrentPage();
  });

  searchButton.addEventListener('click', function() {
    searchButton.classList.add('active');
    convertButton.classList.remove('active');
    quickSearchContainer.classList.add('visible');
    statusContainer.style.display = 'none';

    setTimeout(() => {
      document.getElementById('quickSearchInput').focus();
    }, 100);
  });
}

/* ============================================================================
 * COPY BUTTONS (DELEGACION DE EVENTOS)
 * ============================================================================
 * Los botones de copiar se crean dinamicamente dentro de los botones de motor.
 * En vez de registrar un listener por cada boton, se usa delegacion de eventos:
 * un unico listener en el contenedor .search-buttons que detecta clicks en
 * elementos con clase .copy-button usando e.target.closest().
 * ============================================================================ */

/**
 * Registra un unico listener delegado para todos los botones de copiar.
 * Cuando se hace click en un .copy-button, copia la URL convertida al portapapeles.
 */
function setupCopyButtons() {
  const container = document.querySelector('.search-buttons');
  if (!container) return;

  container.addEventListener('click', function(e) {
    const copyBtn = e.target.closest('.copy-button');
    if (!copyBtn) return;

    e.stopPropagation();
    const engine = copyBtn.getAttribute('data-engine');
    copyConvertedUrl(engine, copyBtn);
  });
}

/**
 * Copia al portapapeles la URL de la busqueda actual convertida al motor indicado.
 * Muestra feedback visual (icono check) y una notificacion temporal.
 *
 * @param {string}      targetEngine - ID del motor de destino
 * @param {HTMLElement}  button      - Elemento del boton de copiar (para feedback visual)
 */
function copyConvertedUrl(targetEngine, button) {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    showNotification('Chrome API no disponible', 'error');
    return;
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      showNotification('Error al obtener pestaña activa', 'error');
      return;
    }

    const activeTab = tabs[0];
    const currentUrl = activeTab.url;

    const query = extractQuery(currentUrl);
    if (!query) {
      showNotification('No se detectó ninguna búsqueda', 'error');
      return;
    }

    const imgSearch = isImageSearch(currentUrl);
    const targetUrl = buildSearchUrl(targetEngine, query, imgSearch, configState);

    if (targetUrl) {
      navigator.clipboard.writeText(targetUrl).then(() => {
        button.classList.add('copied');
        button.textContent = '';
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check';
        checkIcon.setAttribute('aria-hidden', 'true');
        button.appendChild(checkIcon);

        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = '';
          const copyIcon = document.createElement('i');
          copyIcon.className = 'fas fa-copy';
          copyIcon.setAttribute('aria-hidden', 'true');
          button.appendChild(copyIcon);
        }, COPY_FEEDBACK_DURATION);

        showNotification('URL copiada al portapapeles', 'success');
      }).catch(() => {
        showNotification('Error al copiar URL', 'error');
      });
    }
  });
}

/* ============================================================================
 * ATAJOS DE TECLADO
 * ============================================================================ */

/**
 * Registra atajos de teclado:
 * - Alt + 1-9: Convierte al motor en esa posicion
 * - Ctrl + K: Activa modo busqueda
 * - ESC: Cierra el popup
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        const visibleButtons = Array.from(document.querySelectorAll('.engine-button'))
          .filter(btn => btn.style.display !== 'none');

        if (visibleButtons[num - 1]) {
          visibleButtons[num - 1].click();
        }
      }
    }

    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchModeButton').click();
    }

    if (e.key === 'Escape') {
      window.close();
    }
  });
}
