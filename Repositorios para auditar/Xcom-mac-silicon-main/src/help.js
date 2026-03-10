/**
 * X - Cliente no oficial de X (Twitter) para macOS
 * Copyright © 2024 686f6c61
 *
 * @author 686f6c61 (https://github.com/686f6c61)
 * @repository https://github.com/686f6c61/Xcom-mac-silicon
 * @description Help page script - Verifica actualizaciones desde GitHub Releases API
 * y compara versiones semánticas para notificar al usuario.
 */

const GITHUB_REPO = '686f6c61/Xcom-mac-silicon';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CURRENT_VERSION = '0.6.0';

/**
 * Verifica si hay actualizaciones disponibles consultando GitHub Releases API.
 *
 * @async
 * @function checkUpdates
 * @returns {Promise<void>}
 * @throws {Error} Si falla la conexión con GitHub o el parsing de la respuesta
 *
 * @description
 * Realiza un fetch a la API de GitHub, compara versiones semánticas y actualiza
 * el elemento DOM #updateStatus con el resultado. Si hay una nueva versión,
 * muestra un enlace a la página de releases.
 */
async function checkUpdates() {
  const statusEl = document.getElementById('updateStatus');
  statusEl.textContent = 'Verificando actualizaciones...';
  statusEl.style.color = '#71767b';

  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) throw new Error('No se pudo conectar con GitHub');

    const release = await response.json();
    const latestVersion = release.tag_name.replace('v', '');

    console.log('Current version:', CURRENT_VERSION);
    console.log('Latest version:', latestVersion);

    if (isNewerVersion(CURRENT_VERSION, latestVersion)) {
      statusEl.innerHTML = `
        <span style="color: #00ba7c;">✨ Nueva versión disponible: v${latestVersion}</span><br>
        <a href="${release.html_url}" target="_blank" style="color: #1d9bf0;">Descargar desde GitHub</a>
      `;
    } else {
      statusEl.textContent = 'Estás usando la última versión';
      statusEl.style.color = '#00ba7c';
    }
  } catch (error) {
    console.error('Error checking updates:', error);
    statusEl.textContent = 'Error al verificar actualizaciones. Por favor, intenta más tarde.';
    statusEl.style.color = '#f4212e';
  }
}

/**
 * Compara dos versiones semánticas (formato x.y.z).
 *
 * @function isNewerVersion
 * @param {string} current - Versión actual (ej: "0.6.0")
 * @param {string} latest - Versión más reciente (ej: "0.7.0")
 * @returns {boolean} true si latest > current, false en caso contrario
 *
 * @example
 * isNewerVersion("0.6.0", "0.7.0") // returns true
 * isNewerVersion("1.0.0", "0.9.0") // returns false
 */
function isNewerVersion(current, latest) {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return true;
    if (latestParts[i] < currentParts[i]) return false;
  }

  return false;
}

// Auto-ejecutar verificación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  checkUpdates();
});
