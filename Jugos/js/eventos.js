const Bitacora = (() => {
  const KEY = 'frutiva_bitacora';
  const leer = () => { try { const datos = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(datos) ? datos : []; } catch (e) { return []; } };
  const avisar = () => window.dispatchEvent(new CustomEvent('frutiva:bitacora'));
  return {
    registrar(tipo, descripcion) {
      const l = leer();
      l.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), tipo, fecha: new Date().toISOString(), descripcion });
      try { localStorage.setItem(KEY, JSON.stringify(l.slice(-200))); } catch (e) {}
      avisar();
    },
    consultar(tipo) { return leer().filter(e => !tipo || e.tipo === tipo); },
    limpiar() { try { localStorage.removeItem(KEY); } catch (e) {} avisar(); }
  };
})();
