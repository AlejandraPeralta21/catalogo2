const Menu = {
  iniciado: false,
  abrir() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    if (!drawer || !overlay) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    document.querySelectorAll('.burger').forEach(boton => {
      boton.classList.add('is-open');
      boton.setAttribute('aria-expanded', 'true');
      boton.setAttribute('aria-label', 'Cerrar menú');
    });
    document.body.classList.add('no-scroll');
    document.querySelector('.drawer__close')?.focus();
    window.Bitacora?.registrar('menu', 'Menú abierto');
  },
  cerrar(devolverFoco = false) {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    if (!drawer || !overlay) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-open');
    document.querySelectorAll('.burger').forEach(boton => {
      boton.classList.remove('is-open');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
    });
    document.body.classList.remove('no-scroll');
    if (devolverFoco) document.querySelector('.burger')?.focus();
  },
  init() {
    if (this.iniciado) return;
    this.iniciado = true;
    document.addEventListener('click', event => {
      const objetivo = event.target instanceof Element ? event.target : null;
      if (!objetivo) return;
      if (objetivo.closest('.burger')) {
        if (document.getElementById('drawer')?.classList.contains('is-open')) this.cerrar(true);
        else this.abrir();
        return;
      }
      if (objetivo.closest('#overlay, .drawer__close')) { this.cerrar(true); return; }
      if (objetivo.closest('#drawer a')) this.cerrar();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.getElementById('drawer')?.classList.contains('is-open')) this.cerrar(true);
    });
  }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Menu.init(), { once: true });
else Menu.init();
