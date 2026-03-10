/**
 * X - Cliente no oficial de X (Twitter) para macOS
 * Copyright © 2024 686f6c61
 *
 * @author 686f6c61 (https://github.com/686f6c61)
 * @repository https://github.com/686f6c61/Xcom-mac-silicon
 * @description Frontend local de fallback. La app principal carga X.com
 * directamente en el WebView nativo; este script solo mantiene utilidades
 * del shell local.
 */

/**
 * Inicializa event listeners para el diálogo de ayuda.
 *
 * @listens DOMContentLoaded
 * @description
 * Configura listeners para:
 * - Botón de cierre de ayuda (cierra modal)
 * - Click fuera del modal (cierra modal)
 * - Tecla Escape (cierra modal si está abierto)
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const helpDialog = document.getElementById('helpDialog');
    const closeHelp = document.getElementById('closeHelp');

    if (!helpDialog || !closeHelp) {
      console.error('Error: No se encontraron elementos del diálogo');
      return;
    }

    /**
     * Cierra el diálogo modal de ayuda.
     * @listens click - closeHelp button
     */
    closeHelp.addEventListener('click', () => {
      try {
        helpDialog.close();
      } catch (error) {
        console.error('Error cerrando diálogo de ayuda:', error);
      }
    });

    /**
     * Cierra el modal si se hace click fuera de él (en el backdrop).
     * @listens click - helpDialog backdrop
     */
    helpDialog.addEventListener('click', (e) => {
      if (e.target === helpDialog) {
        try {
          helpDialog.close();
        } catch (error) {
          console.error('Error cerrando diálogo:', error);
        }
      }
    });

    /**
     * Cierra el modal con la tecla Escape.
     * @listens keydown - window
     */
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && helpDialog.open) {
        try {
          helpDialog.close();
        } catch (error) {
          console.error('Error cerrando diálogo con Escape:', error);
        }
      }
    });

  } catch (error) {
    console.error('Error fatal en inicialización:', error);
  }
});
