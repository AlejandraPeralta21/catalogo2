const Formulario = {
  MULT: { pequeno: 1, mediano: 1.25, grande: 1.5 }, ENVIO: 8, enviando: false, iniciado: false, timer: null,
  vals() {
    return { nombre: $('#f-nombre').val(), celular: $('#f-celular').val(), correo: $('#f-correo').val(), producto: $('#f-producto').val(),
      tamano: $('#f-tamano').val(), cantidad: $('#f-cantidad').val(), entrega: $('input[name=entrega]:checked').val() || '',
      direccion: $('#f-direccion').val(), obs: $('#f-obs').val() };
  },
  calcular(v) {
    const p = PRODUCTOS.find(x => x.id === +v.producto), m = this.MULT[v.tamano], n = +v.cantidad;
    if (!p || !m || !(n >= 1 && n <= 20)) return null;
    const unit = Math.round(p.precio * m * 100) / 100, sub = unit * n, env = v.entrega === 'domicilio' ? this.ENVIO : 0;
    return { p, unit, sub, env, total: sub + env };
  },
  marcar(k, msg) { const $f = $('[data-field=' + k + ']'); $f.toggleClass('is-invalid', !!msg); $f.find('.err').text(msg || ''); $f.find('[data-key]').attr('aria-invalid', !!msg); },
  validarCampo(k) { const v = this.vals(), m = Validaciones.campo(k, v[k], v); this.marcar(k, m); return m; },
  total() { const r = this.calcular(this.vals()); $('#total').text(r ? 'Bs ' + r.total.toFixed(2) : 'Bs 0.00'); },
  init(productoSeleccionado = null) {
    if (!$('#pedido-form').length) return;
    $('#f-producto').append(PRODUCTOS.map(p => $('<option>').val(p.id).text(p.nombre + ' — Bs ' + p.precio)));
    const productoElegido = productoSeleccionado || new URLSearchParams(window.location.search).get('producto');
    if (productoElegido && PRODUCTOS.some(p => String(p.id) === productoElegido)) $('#f-producto').val(productoElegido).trigger('change');
    const $f = $('#pedido-form');
    this.iniciado = false;
    $f.off('.frutivaFormulario');
    $f.on('focusin.frutivaFormulario', () => { if (!this.iniciado) { this.iniciado = true; Bitacora.registrar('formulario', 'Formulario iniciado'); } });
    $f.on('input.frutivaFormulario change.frutivaFormulario blur.frutivaFormulario', '[data-key]', e => {
      const k = $(e.target).data('key'); if (k === 'obs') $('#obs-count').text($('#f-obs').val().length + '/250');
      this.validarCampo(k); if (k === 'entrega') this.validarCampo('direccion'); this.total();
    });
    $f.on('change.frutivaFormulario', 'select, input[type=radio]', e => {
      const campo = e.target.dataset.key;
      if (!['producto', 'tamano', 'cantidad', 'entrega'].includes(campo)) return;
      let valor = e.target.value;
      if (campo === 'producto') valor = PRODUCTOS.find(p => String(p.id) === valor)?.nombre || 'sin seleccionar';
      if (campo === 'tamano') valor = e.target.selectedOptions[0]?.textContent || valor;
      if (campo === 'entrega') valor = valor === 'domicilio' ? 'A domicilio' : 'Recoger en tienda';
      Bitacora.registrar('selección', campo + ': ' + valor);
    });
    $f.on('change.frutivaFormulario', 'input[name=entrega]', () => { const d = this.vals().entrega === 'domicilio'; $('[data-field=direccion]').prop('hidden', !d); this.total(); });
    $f.on('submit.frutivaFormulario', e => {
      e.preventDefault(); const v = this.vals(), er = Validaciones.todo(v);
      Object.keys(Validaciones.reglas).forEach(k => this.marcar(k, er[k]));
      if (Object.keys(er).length) { Bitacora.registrar('error', 'Errores de validación: ' + Object.keys(er).length); $f.find('.is-invalid [data-key]').first().focus(); return; }
      this.resumen(v);
    });
    $('#editar').off('.frutivaFormulario').on('click.frutivaFormulario', () => this.cerrarModal());
    $('#confirmar').off('.frutivaFormulario').on('click.frutivaFormulario', () => this.confirmar());
    $(document).off('keydown.frutivaFormulario').on('keydown.frutivaFormulario', e => { if (e.key === 'Escape') this.cerrarModal(); });
    this.total();
  },
  resumen(v) {
    const r = this.calcular(v), t = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };
    const f = { 'r-nombre': v.nombre.trim(), 'r-producto': r.p.nombre, 'r-tamano': t[v.tamano], 'r-cantidad': v.cantidad, 'r-unit': 'Bs ' + r.unit.toFixed(2),
      'r-sub': 'Bs ' + r.sub.toFixed(2), 'r-env': 'Bs ' + r.env.toFixed(2), 'r-total': 'Bs ' + r.total.toFixed(2) };
    Object.keys(f).forEach(id => $('#' + id).text(f[id]));
    $('#modal').stop(true, true).prop('hidden', false).addClass('is-open').hide().fadeIn(180);
    $('#editar').focus(); $('body').addClass('no-scroll');
    clearInterval(this.timer);
    let restante = 30;
    $('#modal-temporizador').text('00:30');
    this.timer = setInterval(() => {
      restante -= 1;
      $('#modal-temporizador').text('00:' + String(Math.max(0, restante)).padStart(2, '0'));
      if (restante <= 0) {
        clearInterval(this.timer); this.timer = null; this.cerrarModal();
        $('#toast').text('La revisión venció. Puedes volver a revisar tu pedido cuando quieras.').addClass('is-show');
        setTimeout(() => $('#toast').removeClass('is-show'), 4500);
      }
    }, 1000);
  },
  cerrarModal() {
    clearInterval(this.timer); this.timer = null;
    $('#modal').stop(true, true).fadeOut(180, function () { $(this).prop('hidden', true).removeAttr('style').removeClass('is-open'); });
    $('body').removeClass('no-scroll');
  },
  confirmar() {
    if (this.enviando) return; const v = this.vals(), er = Validaciones.todo(v);
    if (Object.keys(er).length) { this.cerrarModal(); return; }
    this.enviando = true; $('#confirmar').prop('disabled', true);
    const r = this.calcular(v), id = 'FJ-' + Date.now().toString(36).toUpperCase();
    try {
      const datos = JSON.parse(localStorage.getItem('frutiva_pedidos'));
      const l = (Array.isArray(datos) ? datos : []).slice(-99);
      l.push({ id, fecha: new Date().toISOString(), cliente: v.nombre.trim(), celular: v.celular, correo: v.correo, productoId: r.p.id, producto: r.p.nombre,
        tamano: v.tamano, cantidad: +v.cantidad, entrega: v.entrega, direccion: v.direccion.trim(), obs: v.obs.trim(), total: r.total,
        estado: 'guardado-localmente', conexion: navigator.onLine ? 'online' : 'offline' });
      localStorage.setItem('frutiva_pedidos', JSON.stringify(l));
    } catch (e) {
      this.enviando = false; $('#confirmar').prop('disabled', false); this.cerrarModal();
      $('#toast').text('No se pudo guardar el pedido en este dispositivo. Libera espacio e inténtalo otra vez.').addClass('is-show');
      setTimeout(() => $('#toast').removeClass('is-show'), 4500); return;
    }
    Bitacora.registrar('pedido', 'Pedido confirmado ' + id);
    this.cerrarModal(); $('#pedido-form')[0].reset(); $('[data-field=direccion]').prop('hidden', true); $('#obs-count').text('0/250'); this.total();
    $('#toast').text('¡Pedido ' + id + ' guardado en este dispositivo!').addClass('is-show'); setTimeout(() => $('#toast').removeClass('is-show'), 4500);
    setTimeout(() => { this.enviando = false; $('#confirmar').prop('disabled', false); }, 800);
  }
};
