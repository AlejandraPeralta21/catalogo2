const Main = {
  ir(h) { const $t = $(h); if ($t.length) $('html,body').animate({ scrollTop: $t.offset().top - 70 }, 400); },
  async init() {
    // Los controles globales se activan inmediatamente; no esperan a la carga del catálogo.
    Tema.init(); Menu.init();
    if (typeof Accesibilidad !== 'undefined') Accesibilidad.init();
    if (typeof Pwa !== 'undefined') Pwa.init();
    if (typeof Sincronizacion !== 'undefined') Sincronizacion.init();
    if (typeof Carrito !== 'undefined') Carrito.init();
    if (typeof Spa !== 'undefined') Spa.init();
    else {
      if ($('#grid').length) { Catalogo.init(); Catalogo.render(); }
      if ($('#pedido-form').length) { Formulario.init(); Formulario.total(); }
      this.initBitacora();
      if (!CATALOGO_CARGADO) $('#catalogo-error').prop('hidden', false);
      const actual = document.title.split('|')[0].trim();
      Bitacora.registrar('visita', 'Página visitada: ' + actual);
      $('#btn-buscar').on('click', e => { e.preventDefault(); if ($('#q').length) this.ir('#q'); else window.location.href = 'menu.html#q'; });
    }
  },
  initBitacora() {
    const actualizar = () => {
      const lista = document.getElementById('bitacora-lista');
      const total = document.getElementById('bitacora-total');
      if (!lista) return;
      const registros = Bitacora.consultar().slice(-20).reverse();
      lista.replaceChildren();
      if (total) total.textContent = registros.length + (registros.length === 1 ? ' registro reciente' : ' registros recientes');
      if (!registros.length) {
        const vacio = document.createElement('li'); vacio.className = 'event-log__empty'; vacio.textContent = 'Aún no hay actividad registrada.'; lista.append(vacio); return;
      }
      registros.forEach(registro => {
        const fila = document.createElement('li');
        const meta = document.createElement('span'); meta.className = 'event-log__meta';
        const fecha = new Date(registro.fecha);
        meta.textContent = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + registro.tipo;
        const detalle = document.createElement('span'); detalle.className = 'event-log__detail'; detalle.textContent = registro.descripcion;
        fila.append(meta, detalle); lista.append(fila);
      });
    };
    actualizar();
    this.actualizarBitacora = actualizar;
    if (!this.bitacoraVinculada) {
      window.addEventListener('frutiva:bitacora', () => this.actualizarBitacora?.());
      this.bitacoraVinculada = true;
    }
    $('#limpiar-bitacora').off('click.frutiva').on('click.frutiva', () => { Bitacora.limpiar(); actualizar(); });
  }
};
$(function () { Main.init(); });

