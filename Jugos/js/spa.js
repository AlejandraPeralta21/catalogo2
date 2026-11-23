const Spa = {
  iniciado: false,
  inicio: null,
  actual: 'inicio',
  archivos: { 'index.html': 'inicio', 'menu.html': 'menu', 'promociones.html': 'promociones', 'nosotros.html': 'nosotros', 'pedido.html': 'pedido', 'gestion.html': 'gestion' },

  leerRuta() {
    const valor = location.hash.slice(1);
    if (!valor) return { ruta: 'inicio', params: new URLSearchParams(), buscar: false };
    const separador = valor.indexOf('?');
    const ruta = separador < 0 ? valor : valor.slice(0, separador);
    const query = separador < 0 ? '' : valor.slice(separador + 1);
    if (ruta === 'q') return { ruta: 'menu', params: new URLSearchParams(), buscar: true };
    return { ruta: this.archivos[ruta] || (['inicio', 'menu', 'promociones', 'nosotros', 'pedido', 'gestion'].includes(ruta) ? ruta : 'inicio'), params: new URLSearchParams(query), buscar: false };
  },

  destino(enlace) {
    const href = enlace.getAttribute('href') || '';
    if (enlace.id === 'btn-buscar') return { ruta: 'menu', params: new URLSearchParams(), buscar: true };
    if (href === '#q' || href.endsWith('#q')) return { ruta: 'menu', params: new URLSearchParams(), buscar: true };
    if (href.startsWith('#')) {
      const [hashRuta, hashQuery = ''] = href.slice(1).split('?');
      if (['inicio', 'menu', 'promociones', 'nosotros', 'pedido', 'gestion'].includes(hashRuta)) return { ruta: hashRuta, params: new URLSearchParams(hashQuery), buscar: false };
      return null;
    }
    let url;
    try { url = new URL(href, location.href); } catch (error) { return null; }
    if (url.origin !== location.origin) return null;
    const archivo = url.pathname.split('/').pop();
    const ruta = this.archivos[archivo];
    if (!ruta) return null;
    return { ruta, params: url.searchParams, buscar: url.hash === '#q' };
  },

  init() {
    if (this.iniciado) return;
    this.iniciado = true;
    const main = document.getElementById('contenido');
    const footer = document.getElementById('contacto');
    if (!main || !footer) return;
    this.inicio = { main: main.innerHTML, footer: footer.outerHTML, title: document.title };
    document.addEventListener('click', event => {
      const enlace = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!enlace) return;
      const destino = this.destino(enlace);
      if (!destino) return;
      event.preventDefault();
      this.navegar(destino.ruta, destino.params, { buscar: destino.buscar });
    });
    window.addEventListener('popstate', () => {
      const estado = this.leerRuta();
      this.mostrar(estado.ruta, estado.params, { buscar: estado.buscar, historial: false });
    });
    const estado = this.leerRuta();
    this.mostrar(estado.ruta, estado.params, { historial: false, buscar: estado.buscar });
  },

  navegar(ruta, params = new URLSearchParams(), opciones = {}) {
    const consulta = params instanceof URLSearchParams ? params.toString() : String(params || '').replace(/^\?/, '');
    const hash = '#' + ruta + (consulta ? '?' + consulta : '');
    if (location.hash !== hash) history.pushState({ ruta }, '', hash);
    return this.mostrar(ruta, new URLSearchParams(consulta), opciones);
  },

  async mostrar(ruta, params = new URLSearchParams(), opciones = {}) {
    const vista = ruta === 'inicio' ? this.inicio : window.FRUTIVA_VISTAS?.[ruta];
    if (!vista) return;
    if (this.actual === 'pedido' && ruta !== 'pedido') document.body.classList.remove('no-scroll');
    Menu.cerrar();
    const main = document.getElementById('contenido');
    main.innerHTML = ruta === 'pedido' ? Carrito.vista : vista.main;
    const footerActual = document.getElementById('contacto');
    if (footerActual && vista.footer) footerActual.outerHTML = vista.footer;
    document.body.classList.toggle('home-page', ruta === 'inicio');
    document.body.classList.toggle('staff-view', ruta === 'gestion');
    document.title = ruta === 'pedido' ? 'Carrito | Frutiva Juices' : vista.title;
    this.actual = ruta;
    this.marcarNavegacion(ruta);
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (ruta === 'menu') {
      Catalogo.init();
      Catalogo.render();
      if (!CATALOGO_CARGADO) document.getElementById('catalogo-error')?.removeAttribute('hidden');
    }
    if (ruta === 'pedido') Carrito.render();
    if (ruta === 'nosotros') Main.initBitacora();
    if (ruta === 'gestion') Gestion.mostrar();
    if (ruta !== 'inicio') Bitacora.registrar('navegación', 'Vista abierta: ' + vista.title.split('|')[0].trim());

    if (opciones.buscar) {
      requestAnimationFrame(() => {
        const busqueda = document.getElementById('q');
        busqueda?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        busqueda?.focus();
      });
    }
  },

  marcarNavegacion(ruta) {
    document.querySelectorAll('.topnav a, .drawer__nav a, .bnav__link').forEach(enlace => {
      const destino = this.destino(enlace);
      const activo = destino?.ruta === ruta;
      enlace.classList.toggle('is-active', !!activo);
      if (activo) enlace.setAttribute('aria-current', 'page');
      else enlace.removeAttribute('aria-current');
    });
  }
};
