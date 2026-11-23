const Pwa = {
  iniciado: false,
  prompt: null,
  boton: null,
  toast(mensaje) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = mensaje; el.classList.add('is-show');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => el.classList.remove('is-show'), 3600);
  },
  actualizarRed() {
    const estado = document.getElementById('estado-red');
    if (!estado) return;
    const conectado = navigator.onLine;
    estado.classList.toggle('is-offline', !conectado);
    estado.querySelector('span').textContent = conectado ? 'En línea' : 'Sin conexión';
    estado.title = conectado ? 'Conexión disponible' : 'Modo sin conexión: datos guardados en este dispositivo';
  },
  async init() {
    if (this.iniciado) return;
    this.iniciado = true;
    this.boton = document.getElementById('btnInstalarPWA');
    this.actualizarRed();
    window.addEventListener('online', () => { this.actualizarRed(); this.toast('Conexión restablecida.'); if (typeof Bitacora !== 'undefined') Bitacora.registrar('red', 'Conexión restablecida'); });
    window.addEventListener('offline', () => { this.actualizarRed(); this.toast('Modo sin conexión. La app y los pedidos locales siguen disponibles.'); if (typeof Bitacora !== 'undefined') Bitacora.registrar('red', 'Modo sin conexión activado'); });
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault(); this.prompt = event;
      if (this.boton) this.boton.hidden = false;
    });
    window.addEventListener('appinstalled', () => {
      this.prompt = null; if (this.boton) this.boton.hidden = true;
      this.toast('Frutiva Juices se instaló correctamente.');
      if (typeof Bitacora !== 'undefined') Bitacora.registrar('pwa', 'Aplicación instalada');
    });
    if (this.boton) this.boton.addEventListener('click', async () => {
      if (!this.prompt) {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
        if (ios) this.toast('En Safari, toca Compartir y elige “Añadir a pantalla de inicio”.');
        return;
      }
      this.prompt.prompt();
      const resultado = await this.prompt.userChoice;
      if (resultado.outcome === 'accepted') {
        if (typeof Bitacora !== 'undefined') Bitacora.registrar('pwa', 'Instalación aceptada');
        this.boton.hidden = true;
      }
      this.prompt = null;
    });
    if (!('serviceWorker' in navigator)) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
    if (ios && this.boton) this.boton.hidden = false;
    if (!['https:', 'http:'].includes(location.protocol) || (location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(location.hostname))) {
      const estado = document.getElementById('estado-red');
      if (estado) estado.title = 'Para instalar la PWA, abre el sitio por HTTPS o desde localhost.';
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      let controlador = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (controlador) location.reload();
        controlador = true;
      });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            this.toast('Frutiva se actualizó; la nueva versión ya está lista.');
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    } catch (error) {
      console.error('No se pudo registrar el Service Worker:', error);
    }
  }
};
document.addEventListener('error', event => {
  const imagen = event.target;
  if (!(imagen instanceof HTMLImageElement) || !imagen.dataset.fallback || imagen.dataset.fallbackUsed) return;
  imagen.dataset.fallbackUsed = 'true';
  imagen.src = imagen.dataset.fallback;
}, true);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Pwa.init(), { once: true });
else Pwa.init();
