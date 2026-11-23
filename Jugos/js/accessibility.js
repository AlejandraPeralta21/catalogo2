const Accesibilidad = (() => {
  const KEY = 'frutiva_alto_contraste';
  const leer = () => { try { return localStorage.getItem(KEY) === 'true'; } catch (e) { return false; } };
  const aplicar = activo => {
    document.documentElement.setAttribute('data-contrast', activo ? 'high' : 'normal');
    document.querySelectorAll('.js-contrast').forEach(boton => {
      boton.setAttribute('aria-pressed', String(activo));
      boton.setAttribute('aria-label', activo ? 'Desactivar alto contraste' : 'Activar alto contraste');
      boton.title = activo ? 'Desactivar alto contraste' : 'Activar alto contraste';
    });
  };
  let iniciado = false;
  return {
    init() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.jQuery) $.fx.off = true;
      aplicar(leer());
      if (iniciado) return;
      iniciado = true;
      document.addEventListener('click', event => {
        const boton = event.target.closest('.js-contrast');
        if (!boton) return;
        const activo = document.documentElement.getAttribute('data-contrast') !== 'high';
        aplicar(activo);
        try { localStorage.setItem(KEY, String(activo)); } catch (e) {}
        if (typeof Bitacora !== 'undefined') Bitacora.registrar('accesibilidad', 'Alto contraste ' + (activo ? 'activado' : 'desactivado'));
      });
    }
  };
})();
Accesibilidad.init();

