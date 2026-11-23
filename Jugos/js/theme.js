const Tema = {
  KEY: 'frutiva_tema',
  iniciado: false,
  inicial() {
    try {
      const guardado = localStorage.getItem(this.KEY);
      if (guardado === 'light' || guardado === 'dark') return guardado;
    } catch (error) {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  aplicar(tema) {
    const oscuro = tema === 'dark';
    document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
    document.querySelectorAll('.js-theme').forEach(boton => {
      boton.setAttribute('aria-pressed', String(oscuro));
      boton.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    });
    document.querySelectorAll('.js-theme-label').forEach(etiqueta => {
      etiqueta.textContent = oscuro ? 'Modo claro' : 'Modo oscuro';
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#1b1715' : '#2e1c18');
  },
  init() {
    if (this.iniciado) return;
    this.iniciado = true;
    this.aplicar(this.inicial());
    document.addEventListener('click', event => {
      const objetivo = event.target instanceof Element ? event.target : null;
      if (!objetivo?.closest('.js-theme')) return;
      const tema = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      this.aplicar(tema);
      try { localStorage.setItem(this.KEY, tema); } catch (error) {}
      window.Bitacora?.registrar('tema', 'Tema cambiado a ' + tema);
    });
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Tema.init(), { once: true });
else Tema.init();
