/**
 * ============================================================================
 * engines.js - Registro centralizado de motores de busqueda
 * ============================================================================
 *
 * FUENTE UNICA DE VERDAD (Single Source of Truth) para toda la extension.
 * Este archivo define todos los motores de busqueda soportados y las funciones
 * compartidas entre popup.js y background.js (service worker).
 *
 * Arquitectura:
 *   - popup.html carga este archivo via <script src="engines.js">
 *   - background.js lo carga via importScripts('engines.js')
 *   - Ambos consumen las mismas constantes y funciones, evitando duplicacion
 *
 * Seguridad:
 *   - Ninguna URL se construye con datos sin codificar (se usa encodeURIComponent)
 *   - Los dominios de Amazon/YouTube se validan contra whitelists cerradas
 *   - No se ejecuta codigo remoto ni se accede a APIs externas
 *
 * Para anadir un nuevo motor de busqueda:
 *   1. Anadir entrada en SEARCH_ENGINES con todas las propiedades requeridas
 *   2. Si usa query param no estandar, anadir regex en QUERY_PATTERNS
 *   3. No hace falta tocar popup.js ni background.js (se genera todo dinamico)
 *
 * @file        engines.js
 * @author      @686f6c61
 * @license     MIT
 * ============================================================================
 */

/** Clave usada en chrome.storage.local para persistir la configuracion del usuario */
const STORAGE_KEY = 'searchEngineConverterConfig';

/** Dominios permitidos para Amazon (whitelist cerrada para evitar inyeccion de dominios) */
const VALID_AMAZON_DOMAINS = ['es', 'com', 'co.uk', 'de', 'fr', 'it'];

/** Dominios permitidos para YouTube */
const VALID_YOUTUBE_DOMAINS = ['com', 'es'];

/** Motor por defecto para acciones de menu contextual y configuracion inicial */
const DEFAULT_SEARCH_ENGINE_ID = 'google';

/** Dominios por defecto para cada motor con dominio configurable */
const DOMAIN_DEFAULTS = {
  amazon: 'es',
  youtube: 'com'
};

/**
 * Registro de motores de busqueda.
 *
 * Esquema de cada motor:
 * @property {string}  id                - Identificador unico interno (ej: 'google')
 * @property {string}  buttonId          - ID del elemento DOM del boton (ej: 'googleButton')
 * @property {string}  name              - Nombre para mostrar en la interfaz
 * @property {string}  icon              - Clase CSS de Font Awesome para el icono
 * @property {string}  color             - Color hexadecimal del icono
 * @property {string}  searchUrl         - Template de URL con {query} y opcionalmente {domain}
 * @property {string|null} imageSearchUrl - Template para busqueda de imagenes (null si no soporta)
 * @property {string|null} queryParam    - Parametro GET que contiene la busqueda (null si usa path)
 * @property {string}  detectionPattern  - Subcadena para detectar este motor en una URL
 * @property {boolean} visibleByDefault  - Si el boton aparece visible al instalar la extension
 * @property {boolean} showInContextMenu - Si aparece en el menu contextual (clic derecho)
 * @property {boolean} hasCopyButton     - Si muestra boton para copiar la URL convertida
 * @property {string}  [usesDomain]      - (Opcional) 'amazon' o 'youtube' para dominio configurable
 */
const SEARCH_ENGINES = {
  google: {
    id: 'google',
    buttonId: 'googleButton',
    name: 'Google',
    icon: 'fab fa-google',
    color: '#4285F4',
    searchUrl: 'https://www.google.com/search?q={query}',
    imageSearchUrl: 'https://www.google.com/search?q={query}&tbm=isch',
    queryParam: 'q',
    detectionPattern: 'google.com/search',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: true
  },
  brave: {
    id: 'brave',
    buttonId: 'braveButton',
    name: 'Brave',
    icon: 'fas fa-shield-alt',
    color: '#FB542B',
    searchUrl: 'https://search.brave.com/search?q={query}',
    imageSearchUrl: 'https://search.brave.com/images?q={query}',
    queryParam: 'q',
    detectionPattern: 'search.brave.com',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: false
  },
  duckduckgo: {
    id: 'duckduckgo',
    buttonId: 'duckduckgoButton',
    name: 'DuckDuckGo',
    icon: 'fab fa-d-and-d',
    color: '#DE5833',
    searchUrl: 'https://duckduckgo.com/?q={query}',
    imageSearchUrl: 'https://duckduckgo.com/?q={query}&iax=images&ia=images',
    queryParam: 'q',
    detectionPattern: 'duckduckgo.com',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: true
  },
  bing: {
    id: 'bing',
    buttonId: 'bingButton',
    name: 'Bing',
    icon: 'fab fa-microsoft',
    color: '#008373',
    searchUrl: 'https://www.bing.com/search?q={query}',
    imageSearchUrl: 'https://www.bing.com/images/search?q={query}',
    queryParam: 'q',
    detectionPattern: 'bing.com',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: true
  },
  amazon: {
    id: 'amazon',
    buttonId: 'amazonButton',
    name: 'Amazon',
    icon: 'fab fa-amazon',
    color: '#FF9900',
    searchUrl: 'https://www.amazon.{domain}/s?k={query}',
    imageSearchUrl: null,
    queryParam: 'k',
    detectionPattern: 'amazon.',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: false,
    usesDomain: 'amazon'
  },
  youtube: {
    id: 'youtube',
    buttonId: 'youtubeButton',
    name: 'YouTube',
    icon: 'fab fa-youtube',
    color: '#FF0000',
    searchUrl: 'https://www.youtube.{domain}/results?search_query={query}',
    imageSearchUrl: null,
    queryParam: 'search_query',
    detectionPattern: 'youtube.',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: false,
    usesDomain: 'youtube'
  },
  wikipedia: {
    id: 'wikipedia',
    buttonId: 'wikipediaButton',
    name: 'Wikipedia',
    icon: 'fab fa-wikipedia-w',
    color: '#636466',
    searchUrl: 'https://es.wikipedia.org/wiki/Special:Search?search={query}',
    imageSearchUrl: null,
    queryParam: 'search',
    detectionPattern: 'wikipedia.org',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: false
  },
  twitter: {
    id: 'twitter',
    buttonId: 'twitterButton',
    name: 'X (Twitter)',
    icon: 'fab fa-twitter',
    color: '#000000',
    searchUrl: 'https://x.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'x.com/search',
    visibleByDefault: true,
    showInContextMenu: true,
    hasCopyButton: false
  },
  github: {
    id: 'github',
    buttonId: 'githubButton',
    name: 'GitHub',
    icon: 'fab fa-github',
    color: '#333333',
    searchUrl: 'https://github.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'github.com/search',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  },
  gitlab: {
    id: 'gitlab',
    buttonId: 'gitlabButton',
    name: 'GitLab',
    icon: 'fab fa-gitlab',
    color: '#FC6D26',
    searchUrl: 'https://gitlab.com/search?search={query}',
    imageSearchUrl: null,
    queryParam: 'search',
    detectionPattern: 'gitlab.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  stackoverflow: {
    id: 'stackoverflow',
    buttonId: 'stackoverflowButton',
    name: 'Stack Overflow',
    icon: 'fab fa-stack-overflow',
    color: '#F58025',
    searchUrl: 'https://stackoverflow.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'stackoverflow.com/search',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  },
  reddit: {
    id: 'reddit',
    buttonId: 'redditButton',
    name: 'Reddit',
    icon: 'fab fa-reddit',
    color: '#FF4500',
    searchUrl: 'https://www.reddit.com/search/?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'reddit.com/search',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  },
  pinterest: {
    id: 'pinterest',
    buttonId: 'pinterestButton',
    name: 'Pinterest',
    icon: 'fab fa-pinterest',
    color: '#E60023',
    searchUrl: 'https://www.pinterest.com/search/pins/?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'pinterest.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  startpage: {
    id: 'startpage',
    buttonId: 'startpageButton',
    name: 'Startpage',
    icon: 'fas fa-search',
    color: '#5B7FDE',
    searchUrl: 'https://www.startpage.com/do/search?q={query}',
    imageSearchUrl: 'https://www.startpage.com/sp/search?cat=images&q={query}',
    queryParam: 'q',
    detectionPattern: 'startpage.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  ecosia: {
    id: 'ecosia',
    buttonId: 'ecosiaButton',
    name: 'Ecosia',
    icon: 'fas fa-tree',
    color: '#4CAF50',
    searchUrl: 'https://www.ecosia.org/search?q={query}',
    imageSearchUrl: 'https://www.ecosia.org/images?q={query}',
    queryParam: 'q',
    detectionPattern: 'ecosia.org',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  qwant: {
    id: 'qwant',
    buttonId: 'qwantButton',
    name: 'Qwant',
    icon: 'fas fa-search',
    color: '#5C97FF',
    searchUrl: 'https://www.qwant.com/?q={query}',
    imageSearchUrl: 'https://www.qwant.com/?q={query}&t=images',
    queryParam: 'q',
    detectionPattern: 'qwant.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  yandex: {
    id: 'yandex',
    buttonId: 'yandexButton',
    name: 'Yandex',
    icon: 'fas fa-search',
    color: '#FF0000',
    searchUrl: 'https://yandex.com/search/?text={query}',
    imageSearchUrl: 'https://yandex.com/images/search?text={query}',
    queryParam: 'text',
    detectionPattern: 'yandex.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  baidu: {
    id: 'baidu',
    buttonId: 'baiduButton',
    name: 'Baidu',
    icon: 'fas fa-search',
    color: '#2319DC',
    searchUrl: 'https://www.baidu.com/s?wd={query}',
    imageSearchUrl: 'https://image.baidu.com/search/index?tn=baiduimage&word={query}',
    queryParam: 'wd',
    detectionPattern: 'baidu.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  ebay: {
    id: 'ebay',
    buttonId: 'ebayButton',
    name: 'eBay',
    icon: 'fas fa-shopping-cart',
    color: '#0064D2',
    searchUrl: 'https://www.ebay.com/sch/i.html?_nkw={query}',
    imageSearchUrl: null,
    queryParam: '_nkw',
    detectionPattern: 'ebay.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  aliexpress: {
    id: 'aliexpress',
    buttonId: 'aliexpressButton',
    name: 'AliExpress',
    icon: 'fas fa-shopping-bag',
    color: '#FF6900',
    searchUrl: 'https://www.aliexpress.com/wholesale?SearchText={query}',
    imageSearchUrl: null,
    queryParam: 'SearchText',
    detectionPattern: 'aliexpress.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  etsy: {
    id: 'etsy',
    buttonId: 'etsyButton',
    name: 'Etsy',
    icon: 'fas fa-store',
    color: '#F45800',
    searchUrl: 'https://www.etsy.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'etsy.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  scholar: {
    id: 'scholar',
    buttonId: 'scholarButton',
    name: 'Google Scholar',
    icon: 'fas fa-graduation-cap',
    color: '#4285F4',
    searchUrl: 'https://scholar.google.com/scholar?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'scholar.google.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  archive: {
    id: 'archive',
    buttonId: 'archiveButton',
    name: 'Internet Archive',
    icon: 'fas fa-archive',
    color: '#000000',
    searchUrl: 'https://archive.org/search?query={query}',
    imageSearchUrl: null,
    queryParam: 'query',
    detectionPattern: 'archive.org/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  wolframalpha: {
    id: 'wolframalpha',
    buttonId: 'wolframalphaButton',
    name: 'Wolfram Alpha',
    icon: 'fas fa-calculator',
    color: '#DD1100',
    searchUrl: 'https://www.wolframalpha.com/input?i={query}',
    imageSearchUrl: null,
    queryParam: 'i',
    detectionPattern: 'wolframalpha.com',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  spotify: {
    id: 'spotify',
    buttonId: 'spotifyButton',
    name: 'Spotify',
    icon: 'fab fa-spotify',
    color: '#1DB954',
    searchUrl: 'https://open.spotify.com/search/{query}',
    imageSearchUrl: null,
    queryParam: null,
    detectionPattern: 'open.spotify.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  soundcloud: {
    id: 'soundcloud',
    buttonId: 'soundcloudButton',
    name: 'SoundCloud',
    icon: 'fab fa-soundcloud',
    color: '#FF3300',
    searchUrl: 'https://soundcloud.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'soundcloud.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  vimeo: {
    id: 'vimeo',
    buttonId: 'vimeoButton',
    name: 'Vimeo',
    icon: 'fab fa-vimeo',
    color: '#162221',
    searchUrl: 'https://vimeo.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'vimeo.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  linkedin: {
    id: 'linkedin',
    buttonId: 'linkedinButton',
    name: 'LinkedIn',
    icon: 'fab fa-linkedin',
    color: '#0077B5',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords={query}',
    imageSearchUrl: null,
    queryParam: 'keywords',
    detectionPattern: 'linkedin.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  tiktok: {
    id: 'tiktok',
    buttonId: 'tiktokButton',
    name: 'TikTok',
    icon: 'fab fa-tiktok',
    color: '#000000',
    searchUrl: 'https://www.tiktok.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'tiktok.com/search',
    visibleByDefault: false,
    showInContextMenu: false,
    hasCopyButton: false
  },
  perplexity: {
    id: 'perplexity',
    buttonId: 'perplexityButton',
    name: 'Perplexity',
    icon: 'fas fa-brain',
    color: '#20808D',
    searchUrl: 'https://www.perplexity.ai/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'perplexity.ai',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  },
  kagi: {
    id: 'kagi',
    buttonId: 'kagiButton',
    name: 'Kagi',
    icon: 'fas fa-search',
    color: '#FF6A00',
    searchUrl: 'https://kagi.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'kagi.com/search',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  },
  searx: {
    id: 'searx',
    buttonId: 'searxButton',
    name: 'SearXNG',
    icon: 'fas fa-search',
    color: '#3050FF',
    searchUrl: 'https://searx.be/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'searx.be',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  },
  you: {
    id: 'you',
    buttonId: 'youButton',
    name: 'You.com',
    icon: 'fas fa-search',
    color: '#00B8D9',
    searchUrl: 'https://you.com/search?q={query}',
    imageSearchUrl: null,
    queryParam: 'q',
    detectionPattern: 'you.com/search',
    visibleByDefault: false,
    showInContextMenu: true,
    hasCopyButton: false
  }
};

/**
 * Indicadores de busqueda de imagenes.
 * Si alguno de estos fragmentos aparece en la URL, se considera que el usuario
 * estaba buscando imagenes y se intenta convertir a la busqueda de imagenes
 * del motor de destino (si lo soporta).
 */
const IMAGE_SEARCH_INDICATORS = ['tbm=isch', '/images', 'iax=images', 'images/search'];

/**
 * Patrones regex para extraer el termino de busqueda de una URL.
 * Cada regex captura el valor del query parameter correspondiente.
 * Ordenados de mas comun a menos comun para optimizar la deteccion.
 *
 * Cobertura:
 *   q           -> Google, Bing, DuckDuckGo, Reddit, GitHub, Ecosia, Qwant, etc.
 *   search_query -> YouTube
 *   k           -> Amazon
 *   search      -> Wikipedia, GitLab
 *   text        -> Yandex
 *   wd          -> Baidu
 *   _nkw        -> eBay
 *   SearchText  -> AliExpress
 *   query       -> Internet Archive
 *   i           -> Wolfram Alpha
 *   keywords    -> LinkedIn
 *
 * Nota: Spotify usa path en vez de query param, se maneja aparte en extractQuery().
 */
const QUERY_PATTERNS = [
  /[?&]q=([^&]+)/,
  /[?&]search_query=([^&]+)/,
  /[?&]k=([^&]+)/,
  /[?&]search=([^&]+)/,
  /[?&]text=([^&]+)/,
  /[?&]wd=([^&]+)/,
  /[?&]_nkw=([^&]+)/,
  /[?&]SearchText=([^&]+)/,
  /[?&]query=([^&]+)/,
  /[?&]i=([^&]+)/,
  /[?&]keywords=([^&]+)/
];

/**
 * Mapa de visibilidad por defecto, generado automaticamente desde SEARCH_ENGINES.
 * Se usa como valor inicial de configState.visibleEngines en popup.js.
 * Ejemplo: { google: true, brave: true, github: false, ... }
 */
const DEFAULT_CONFIG = Object.fromEntries(
  Object.entries(SEARCH_ENGINES).map(([id, engine]) => [id, engine.visibleByDefault])
);

/**
 * Normaliza un valor de motor por defecto guardado en storage.
 * Soporta formato nuevo (engineId) y legado (buttonId).
 *
 * @param {string} value - engineId o buttonId
 * @returns {string} engineId valido
 */
function normalizeDefaultSearchEngine(value) {
  if (typeof value !== 'string' || !value) {
    return DEFAULT_SEARCH_ENGINE_ID;
  }

  if (SEARCH_ENGINES[value]) {
    return value;
  }

  for (const [id, engine] of Object.entries(SEARCH_ENGINES)) {
    if (engine.buttonId === value) {
      return id;
    }
  }

  return DEFAULT_SEARCH_ENGINE_ID;
}

/* ============================================================================
 * FUNCIONES COMPARTIDAS (usadas por popup.js y background.js)
 * ============================================================================ */

/**
 * Construye la URL de busqueda para un motor dado.
 *
 * @param {string} engineId      - ID del motor (clave de SEARCH_ENGINES)
 * @param {string} query         - Termino de busqueda del usuario (texto plano)
 * @param {boolean} isImageSearch - true si se debe usar la URL de imagenes
 * @param {Object} domainConfig  - Objeto con amazonDomain, youtubeDomain, etc.
 * @returns {string|null} URL completa o null si el motor no existe
 *
 * Seguridad: el query se codifica con encodeURIComponent() antes de insertarlo
 * en el template, previniendo inyeccion de parametros en la URL.
 */
function buildSearchUrl(engineId, query, isImageSearch, domainConfig) {
  const engine = SEARCH_ENGINES[engineId];
  if (!engine) return null;

  const encodedQuery = encodeURIComponent(query);
  let template;

  if (isImageSearch && engine.imageSearchUrl) {
    template = engine.imageSearchUrl;
  } else {
    template = engine.searchUrl;
  }

  let url = template.replace('{query}', encodedQuery);

  /* Motores con dominio configurable (Amazon, YouTube, etc.) */
  if (engine.usesDomain) {
    const domainConfigKey = engine.usesDomain + 'Domain';
    const requestedDomain = domainConfig && typeof domainConfig[domainConfigKey] === 'string'
      ? domainConfig[domainConfigKey]
      : '';
    const fallbackDomain = DOMAIN_DEFAULTS[engine.usesDomain] || '';
    const safeDomain = validateDomain(engine.usesDomain, requestedDomain)
      ? requestedDomain
      : fallbackDomain;

    if (safeDomain) {
      url = url.replace('{domain}', safeDomain);
    }
  }

  return url;
}

/**
 * Decodifica un componente URI de forma segura.
 * Si el valor esta corrupto o mal codificado, devuelve null.
 *
 * @param {string} value - valor codificado
 * @returns {string|null}
 */
function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (_) {
    return null;
  }
}

/**
 * Extrae el termino de busqueda de una URL de motor de busqueda.
 *
 * @param {string} url - URL completa de la pagina activa
 * @returns {string|null} Termino de busqueda decodificado o null si no se detecta
 *
 * Proceso:
 *   1. Primero comprueba si es Spotify (usa path, no query params)
 *   2. Luego itera QUERY_PATTERNS probando cada regex
 *   3. Los '+' se reemplazan por espacios antes de decodificar
 */
function extractQuery(url) {
  /* Caso especial: Spotify usa path en vez de query param (/search/<termino>) */
  const spotifyMatch = url.match(/open\.spotify\.com\/search\/(.+)/);
  if (spotifyMatch) {
    return safeDecodeURIComponent(spotifyMatch[1]);
  }

  for (const pattern of QUERY_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const decodedQuery = safeDecodeURIComponent(match[1].replace(/\+/g, ' '));
      if (decodedQuery !== null) {
        return decodedQuery;
      }
    }
  }
  return null;
}

/**
 * Detecta que motor de busqueda corresponde a una URL.
 *
 * @param {string} url - URL completa de la pagina activa
 * @returns {string|null} ID del motor detectado o null si no coincide ninguno
 *
 * Compara la URL contra el detectionPattern de cada motor en SEARCH_ENGINES.
 * El orden de iteracion importa: si hay patrones que se solapan (ej: 'google.com'
 * vs 'scholar.google.com'), el mas especifico debe aparecer primero en el objeto.
 */
function detectEngine(url) {
  for (const [id, engine] of Object.entries(SEARCH_ENGINES)) {
    if (id === 'youtube') {
      if (/https?:\/\/(?:www\.)?youtube\.[^/]+\/results(?:[/?#]|$)/.test(url)) {
        return id;
      }
      continue;
    }

    if (url.includes(engine.detectionPattern)) {
      return id;
    }
  }
  return null;
}

/**
 * Comprueba si una URL corresponde a una busqueda de imagenes.
 *
 * @param {string} url - URL completa
 * @returns {boolean} true si contiene algun indicador de busqueda de imagenes
 */
function isImageSearch(url) {
  return IMAGE_SEARCH_INDICATORS.some(indicator => url.includes(indicator));
}

/**
 * Valida un dominio contra la whitelist correspondiente.
 * Se usa en background.js para sanitizar la configuracion leida de storage.
 *
 * @param {string} type  - Tipo de dominio: 'amazon' o 'youtube'
 * @param {string} value - Valor del dominio a validar (ej: 'es', 'com', 'co.uk')
 * @returns {boolean} true si el dominio esta en la whitelist
 */
function validateDomain(type, value) {
  if (type === 'amazon') {
    return VALID_AMAZON_DOMAINS.includes(value);
  }
  if (type === 'youtube') {
    return VALID_YOUTUBE_DOMAINS.includes(value);
  }
  return false;
}
