// Semana 2 - Arquitectura PWA Offline y Cola FIFO
// Semana 3 - Backend Supabase aislado por proyecto
const PROYECTO_ACTUAL = 'frutiva_juices';
const ProyectosCatalogo = Object.freeze({
  quimfa: 'catalogo_quimfa', educan: 'catalogo_educan',
  snoopy: 'catalogo_snoopy', allin: 'catalogo_allin', frutiva: PROYECTO_ACTUAL
});

const Sincronizacion = (() => {
  const KEY = 'colaSincronizacion_' + PROYECTO_ACTUAL;
  const SESSION_KEY = 'sesionActiva_' + PROYECTO_ACTUAL;
  let enviando = false;
  const config = () => window.FRUTIVA_SUPABASE || {};
  const leer = () => {
    try {
      const datos = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(datos) ? datos : [];
    } catch (error) { return []; }
  };
  const guardar = cola => {
    try { localStorage.setItem(KEY, JSON.stringify(cola.slice(-100))); return true; }
    catch (error) { return false; }
  };
  const configurado = () => {
    const { url, anonKey } = config();
    return typeof url === 'string' && /^https:\/\//.test(url) && typeof anonKey === 'string' && anonKey.length > 20;
  };
  async function sincronizar() {
    if (enviando || !navigator.onLine || !configurado()) return;
    enviando = true;
    try {
      let cola = leer();
      while (cola.length) {
        const actual = cola[0];
        const { url, anonKey } = config();
        const respuesta = await fetch(url.replace(/\/$/, '') + '/rest/v1/' + encodeURIComponent(actual.tabla), {
          method: 'POST',
          headers: { apikey: anonKey, Authorization: 'Bearer ' + anonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(actual.payload)
        });
        if (!respuesta.ok) {
          if (respuesta.status >= 400 && respuesta.status < 500) {
            actual.error = 'HTTP ' + respuesta.status;
            cola[0] = actual;
            guardar(cola);
          }
          break;
        }
        cola.shift();
        guardar(cola);
      }
      if (!cola.length && typeof Bitacora !== 'undefined') Bitacora.registrar('sincronización', 'Cola offline sincronizada');
    } catch (error) {
      // Se conserva el primer elemento; el siguiente evento online lo vuelve a intentar.
    } finally { enviando = false; }
  }
  return {
    init() {
      try {
        if (!sessionStorage.getItem(SESSION_KEY)) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ inicio: new Date().toISOString() }));
      } catch (error) {}
      window.addEventListener('online', sincronizar);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar(); });
      sincronizar();
    },
    encolar(tabla, payload) {
      const cola = leer();
      cola.push({ id: (crypto.randomUUID?.() || Date.now().toString(36)), tabla, payload, creadoEn: new Date().toISOString() });
      if (!guardar(cola)) return false;
      sincronizar();
      return true;
    },
    pendientes() { return leer().length; },
    sincronizar,
    proyecto: PROYECTO_ACTUAL,
    proyectos: ProyectosCatalogo
  };
})();
