const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadEnginesModule() {
  const enginesPath = path.join(__dirname, '..', 'extension', 'engines.js');
  const source = fs.readFileSync(enginesPath, 'utf8');
  const context = {};

  vm.createContext(context);
  vm.runInContext(
    `${source}
globalThis.__ENGINES_EXPORTS__ = {
  SEARCH_ENGINES,
  DEFAULT_CONFIG,
  DEFAULT_SEARCH_ENGINE_ID,
  DOMAIN_DEFAULTS,
  VALID_AMAZON_DOMAINS,
  VALID_YOUTUBE_DOMAINS,
  STORAGE_KEY,
  IMAGE_SEARCH_INDICATORS,
  QUERY_PATTERNS,
  validateDomain,
  normalizeDefaultSearchEngine,
  buildSearchUrl,
  extractQuery,
  detectEngine,
  isImageSearch,
  safeDecodeURIComponent
};`,
    context,
    { filename: 'engines.js' }
  );

  return context.__ENGINES_EXPORTS__;
}

const engines = loadEnginesModule();

/* ============================================================================
 * REGISTRO DE MOTORES
 * ============================================================================ */

test('registry has expected engine count', () => {
  assert.equal(Object.keys(engines.SEARCH_ENGINES).length, 33);
});

test('default visibility map matches registry keys', () => {
  const engineKeys = Object.keys(engines.SEARCH_ENGINES).sort();
  const visibilityKeys = Object.keys(engines.DEFAULT_CONFIG).sort();
  assert.deepEqual(visibilityKeys, engineKeys);
});

test('every engine has required properties', () => {
  const requiredProps = [
    'id', 'buttonId', 'name', 'icon', 'color', 'searchUrl',
    'queryParam', 'detectionPattern', 'visibleByDefault',
    'showInContextMenu', 'hasCopyButton'
  ];

  for (const [id, engine] of Object.entries(engines.SEARCH_ENGINES)) {
    for (const prop of requiredProps) {
      assert.ok(
        prop in engine,
        `Engine "${id}" is missing property "${prop}"`
      );
    }
    assert.equal(engine.id, id, `Engine "${id}" has mismatched id`);
    assert.equal(
      engine.buttonId,
      id + 'Button',
      `Engine "${id}" has unexpected buttonId "${engine.buttonId}"`
    );
  }
});

test('engine ids do not overlap with buttonIds of other engines', () => {
  const engineIds = new Set(Object.keys(engines.SEARCH_ENGINES));
  const buttonIds = new Set(
    Object.values(engines.SEARCH_ENGINES).map(e => e.buttonId)
  );
  for (const id of engineIds) {
    assert.ok(!buttonIds.has(id), `Engine id "${id}" collides with a buttonId`);
  }
});

test('all searchUrl templates contain {query}', () => {
  for (const [id, engine] of Object.entries(engines.SEARCH_ENGINES)) {
    assert.ok(
      engine.searchUrl.includes('{query}'),
      `Engine "${id}" searchUrl missing {query}`
    );
  }
});

test('engines with usesDomain have {domain} in searchUrl', () => {
  for (const [id, engine] of Object.entries(engines.SEARCH_ENGINES)) {
    if (engine.usesDomain) {
      assert.ok(
        engine.searchUrl.includes('{domain}'),
        `Engine "${id}" has usesDomain but no {domain} in searchUrl`
      );
    }
  }
});

test('all searchUrls start with https://', () => {
  for (const [id, engine] of Object.entries(engines.SEARCH_ENGINES)) {
    assert.ok(
      engine.searchUrl.startsWith('https://'),
      `Engine "${id}" searchUrl does not use HTTPS`
    );
    if (engine.imageSearchUrl) {
      assert.ok(
        engine.imageSearchUrl.startsWith('https://'),
        `Engine "${id}" imageSearchUrl does not use HTTPS`
      );
    }
  }
});

test('Twitter is renamed to X (Twitter)', () => {
  assert.equal(engines.SEARCH_ENGINES.twitter.name, 'X (Twitter)');
  assert.ok(engines.SEARCH_ENGINES.twitter.searchUrl.includes('x.com'));
});

test('SearX is renamed to SearXNG', () => {
  assert.equal(engines.SEARCH_ENGINES.searx.name, 'SearXNG');
});

/* ============================================================================
 * normalizeDefaultSearchEngine
 * ============================================================================ */

test('normalizeDefaultSearchEngine supports engineId and legacy buttonId', () => {
  assert.equal(engines.normalizeDefaultSearchEngine('google'), 'google');
  assert.equal(engines.normalizeDefaultSearchEngine('googleButton'), 'google');
  assert.equal(engines.normalizeDefaultSearchEngine('nonexistent'), engines.DEFAULT_SEARCH_ENGINE_ID);
});

test('normalizeDefaultSearchEngine handles edge cases', () => {
  assert.equal(engines.normalizeDefaultSearchEngine(''), engines.DEFAULT_SEARCH_ENGINE_ID);
  assert.equal(engines.normalizeDefaultSearchEngine(null), engines.DEFAULT_SEARCH_ENGINE_ID);
  assert.equal(engines.normalizeDefaultSearchEngine(undefined), engines.DEFAULT_SEARCH_ENGINE_ID);
  assert.equal(engines.normalizeDefaultSearchEngine(42), engines.DEFAULT_SEARCH_ENGINE_ID);
  assert.equal(engines.normalizeDefaultSearchEngine({}), engines.DEFAULT_SEARCH_ENGINE_ID);
});

test('normalizeDefaultSearchEngine recognizes all engines by id', () => {
  for (const id of Object.keys(engines.SEARCH_ENGINES)) {
    assert.equal(engines.normalizeDefaultSearchEngine(id), id);
  }
});

test('normalizeDefaultSearchEngine recognizes all engines by buttonId', () => {
  for (const [id, engine] of Object.entries(engines.SEARCH_ENGINES)) {
    assert.equal(engines.normalizeDefaultSearchEngine(engine.buttonId), id);
  }
});

/* ============================================================================
 * buildSearchUrl
 * ============================================================================ */

test('buildSearchUrl validates configurable domains', () => {
  const amazonSafe = engines.buildSearchUrl('amazon', 'ssd 2tb', false, { amazonDomain: 'co.uk' });
  const amazonFallback = engines.buildSearchUrl('amazon', 'ssd 2tb', false, { amazonDomain: 'evil.com' });
  const youtubeSafe = engines.buildSearchUrl('youtube', 'lofi', false, { youtubeDomain: 'es' });
  const youtubeFallback = engines.buildSearchUrl('youtube', 'lofi', false, { youtubeDomain: 'attacker.tld' });

  assert.match(amazonSafe, /^https:\/\/www\.amazon\.co\.uk\/s\?k=ssd%202tb$/);
  assert.match(amazonFallback, /^https:\/\/www\.amazon\.es\/s\?k=ssd%202tb$/);
  assert.match(youtubeSafe, /^https:\/\/www\.youtube\.es\/results\?search_query=lofi$/);
  assert.match(youtubeFallback, /^https:\/\/www\.youtube\.com\/results\?search_query=lofi$/);
});

test('buildSearchUrl returns null for unknown engine', () => {
  assert.equal(engines.buildSearchUrl('nonexistent', 'test', false, {}), null);
});

test('buildSearchUrl encodes special characters', () => {
  const url = engines.buildSearchUrl('google', 'a&b=c<d>', false, {});
  assert.ok(url.includes('a%26b%3Dc%3Cd%3E'));
  assert.ok(!url.includes('&b='));
});

test('buildSearchUrl uses image URL when available and requested', () => {
  const imgUrl = engines.buildSearchUrl('google', 'cats', true, {});
  assert.ok(imgUrl.includes('tbm=isch'));

  const normalUrl = engines.buildSearchUrl('google', 'cats', false, {});
  assert.ok(!normalUrl.includes('tbm=isch'));
});

test('buildSearchUrl falls back to regular URL for engines without image search', () => {
  const url = engines.buildSearchUrl('amazon', 'shoes', true, { amazonDomain: 'com' });
  assert.ok(url.includes('amazon.com'));
  assert.ok(!url.includes('images'));
});

test('buildSearchUrl handles missing domainConfig gracefully', () => {
  const url = engines.buildSearchUrl('amazon', 'test', false, null);
  assert.ok(url.includes('amazon.es'), 'Should fallback to default domain');
});

test('buildSearchUrl works for all engines', () => {
  for (const id of Object.keys(engines.SEARCH_ENGINES)) {
    const config = { amazonDomain: 'com', youtubeDomain: 'com' };
    const url = engines.buildSearchUrl(id, 'test', false, config);
    assert.ok(url !== null, `Engine "${id}" returned null`);
    assert.ok(url.startsWith('https://'), `Engine "${id}" URL not HTTPS`);
    assert.ok(url.includes('test'), `Engine "${id}" URL missing query`);
  }
});

/* ============================================================================
 * extractQuery
 * ============================================================================ */

test('extractQuery handles malformed URI encodings safely', () => {
  const malformedUrl = 'https://www.google.com/search?q=%E0%A4%A';
  assert.doesNotThrow(() => engines.extractQuery(malformedUrl));
  assert.equal(engines.extractQuery(malformedUrl), null);
});

test('extractQuery extracts from Google', () => {
  assert.equal(engines.extractQuery('https://www.google.com/search?q=hello+world'), 'hello world');
});

test('extractQuery extracts from YouTube', () => {
  assert.equal(
    engines.extractQuery('https://www.youtube.com/results?search_query=music'),
    'music'
  );
});

test('extractQuery extracts from Amazon', () => {
  assert.equal(engines.extractQuery('https://www.amazon.es/s?k=laptop'), 'laptop');
});

test('extractQuery extracts from Wikipedia', () => {
  assert.equal(
    engines.extractQuery('https://es.wikipedia.org/wiki/Special:Search?search=python'),
    'python'
  );
});

test('extractQuery extracts from Spotify path-based URL', () => {
  assert.equal(
    engines.extractQuery('https://open.spotify.com/search/rock%20music'),
    'rock music'
  );
});

test('extractQuery extracts from Yandex', () => {
  assert.equal(engines.extractQuery('https://yandex.com/search/?text=hello'), 'hello');
});

test('extractQuery extracts from Baidu', () => {
  assert.equal(engines.extractQuery('https://www.baidu.com/s?wd=test'), 'test');
});

test('extractQuery extracts from eBay', () => {
  assert.equal(engines.extractQuery('https://www.ebay.com/sch/i.html?_nkw=phone'), 'phone');
});

test('extractQuery extracts from AliExpress', () => {
  assert.equal(
    engines.extractQuery('https://www.aliexpress.com/wholesale?SearchText=cable'),
    'cable'
  );
});

test('extractQuery extracts from LinkedIn', () => {
  assert.equal(
    engines.extractQuery('https://www.linkedin.com/search/results/all/?keywords=developer'),
    'developer'
  );
});

test('extractQuery returns null for non-search URL', () => {
  assert.equal(engines.extractQuery('https://www.example.com/'), null);
});

test('extractQuery returns null for empty query', () => {
  assert.equal(engines.extractQuery('https://www.google.com/search?q='), null);
});

test('extractQuery decodes URL-encoded characters', () => {
  assert.equal(
    engines.extractQuery('https://www.google.com/search?q=caf%C3%A9'),
    'café'
  );
});

/* ============================================================================
 * detectEngine
 * ============================================================================ */

test('detectEngine recognizes youtube localized result pages', () => {
  const url = 'https://www.youtube.es/results?search_query=musica';
  assert.equal(engines.detectEngine(url), 'youtube');
});

test('detectEngine recognizes Google', () => {
  assert.equal(engines.detectEngine('https://www.google.com/search?q=test'), 'google');
});

test('detectEngine recognizes Brave', () => {
  assert.equal(engines.detectEngine('https://search.brave.com/search?q=test'), 'brave');
});

test('detectEngine recognizes DuckDuckGo', () => {
  assert.equal(engines.detectEngine('https://duckduckgo.com/?q=test'), 'duckduckgo');
});

test('detectEngine recognizes Bing', () => {
  assert.equal(engines.detectEngine('https://www.bing.com/search?q=test'), 'bing');
});

test('detectEngine recognizes X (Twitter)', () => {
  assert.equal(engines.detectEngine('https://x.com/search?q=test'), 'twitter');
});

test('detectEngine returns null for non-search pages', () => {
  assert.equal(engines.detectEngine('https://www.example.com'), null);
});

test('detectEngine returns null for YouTube non-search pages', () => {
  assert.equal(engines.detectEngine('https://www.youtube.com/watch?v=abc'), null);
});

/* ============================================================================
 * isImageSearch
 * ============================================================================ */

test('isImageSearch detects Google Images', () => {
  assert.ok(engines.isImageSearch('https://www.google.com/search?q=cats&tbm=isch'));
});

test('isImageSearch detects Brave Images', () => {
  assert.ok(engines.isImageSearch('https://search.brave.com/images?q=cats'));
});

test('isImageSearch detects DuckDuckGo Images', () => {
  assert.ok(engines.isImageSearch('https://duckduckgo.com/?q=cats&iax=images&ia=images'));
});

test('isImageSearch returns false for regular search', () => {
  assert.ok(!engines.isImageSearch('https://www.google.com/search?q=cats'));
});

/* ============================================================================
 * validateDomain
 * ============================================================================ */

test('validateDomain accepts valid Amazon domains', () => {
  for (const domain of engines.VALID_AMAZON_DOMAINS) {
    assert.ok(engines.validateDomain('amazon', domain), `${domain} should be valid`);
  }
});

test('validateDomain accepts valid YouTube domains', () => {
  for (const domain of engines.VALID_YOUTUBE_DOMAINS) {
    assert.ok(engines.validateDomain('youtube', domain), `${domain} should be valid`);
  }
});

test('validateDomain rejects invalid domains', () => {
  assert.ok(!engines.validateDomain('amazon', 'evil.com'));
  assert.ok(!engines.validateDomain('youtube', 'attacker.tld'));
  assert.ok(!engines.validateDomain('amazon', ''));
  assert.ok(!engines.validateDomain('youtube', null));
});

test('validateDomain rejects unknown type', () => {
  assert.ok(!engines.validateDomain('google', 'com'));
  assert.ok(!engines.validateDomain('', 'es'));
});

/* ============================================================================
 * safeDecodeURIComponent
 * ============================================================================ */

test('safeDecodeURIComponent decodes valid strings', () => {
  assert.equal(engines.safeDecodeURIComponent('hello%20world'), 'hello world');
  assert.equal(engines.safeDecodeURIComponent('caf%C3%A9'), 'café');
});

test('safeDecodeURIComponent returns null for invalid encoding', () => {
  assert.equal(engines.safeDecodeURIComponent('%E0%A4%A'), null);
});

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

test('STORAGE_KEY is a non-empty string', () => {
  assert.ok(typeof engines.STORAGE_KEY === 'string');
  assert.ok(engines.STORAGE_KEY.length > 0);
});

test('DEFAULT_SEARCH_ENGINE_ID is a valid engine', () => {
  assert.ok(engines.SEARCH_ENGINES[engines.DEFAULT_SEARCH_ENGINE_ID]);
});

test('DOMAIN_DEFAULTS has entries for amazon and youtube', () => {
  assert.ok(engines.DOMAIN_DEFAULTS.amazon);
  assert.ok(engines.DOMAIN_DEFAULTS.youtube);
  assert.ok(engines.validateDomain('amazon', engines.DOMAIN_DEFAULTS.amazon));
  assert.ok(engines.validateDomain('youtube', engines.DOMAIN_DEFAULTS.youtube));
});

test('IMAGE_SEARCH_INDICATORS is a non-empty array', () => {
  assert.ok(Array.isArray(engines.IMAGE_SEARCH_INDICATORS));
  assert.ok(engines.IMAGE_SEARCH_INDICATORS.length > 0);
});

test('QUERY_PATTERNS is a non-empty array of regexes', () => {
  assert.ok(Array.isArray(engines.QUERY_PATTERNS));
  assert.ok(engines.QUERY_PATTERNS.length > 0);
  for (const pattern of engines.QUERY_PATTERNS) {
    assert.ok(typeof pattern.test === 'function', 'Each QUERY_PATTERN should be a RegExp-like object');
  }
});
