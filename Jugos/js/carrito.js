const Carrito = {
  KEY: 'frutiva_carrito',
  ENVIO: 8,
  vista: `<section class="sec cart-section" id="pedido" aria-labelledby="cart-title">
    <header class="cart-heading"><span class="menu-eyebrow">TU SELECCIÓN FRUTIVA</span><h1 id="cart-title">Tu carrito</h1><p>Revisa tus bebidas, elige tamaño y cantidad, y confirma tu pedido.</p></header>
    <div id="cart-success" class="cart-success" role="status" hidden><span aria-hidden="true">✓</span><div><strong>Pedido confirmado</strong><p>Quedó guardado en este dispositivo.</p></div><a class="text-link" href="menu.html">Seguir comprando</a></div>
    <div id="carrito-vacio" class="cart-empty" hidden><span class="cart-empty__icon" aria-hidden="true">🛒</span><h2>Tu carrito está vacío</h2><p>Agrega tus jugos y smoothies favoritos para empezar.</p><a class="btn" href="menu.html">Explorar bebidas</a></div>
    <div id="carrito-layout" class="cart-layout" hidden>
      <section class="cart-list-panel" aria-labelledby="cart-list-title"><div class="cart-panel-heading"><h2 id="cart-list-title">Tus bebidas</h2><span id="cart-items-count"></span></div><ul id="cart-items" class="cart-items"></ul><a class="text-link" href="menu.html">← Seguir explorando</a></section>
      <aside class="cart-checkout-panel" aria-labelledby="cart-checkout-title"><h2 id="cart-checkout-title">Datos para tu pedido</h2><p class="note">El pedido se guarda en este dispositivo; si Supabase está configurado, se sincronizará cuando haya conexión.</p>
        <form id="cart-checkout-form" class="cart-checkout-form">
          <label>Nombre completo<input name="nombre" type="text" autocomplete="name" minlength="3" required></label>
          <div class="cart-form-row"><label>Celular<input name="celular" type="tel" inputmode="numeric" autocomplete="tel-national" pattern="[0-9]{8}" maxlength="8" placeholder="8 dígitos" required></label><label>Correo<input name="correo" type="email" autocomplete="email" required></label></div>
          <fieldset class="cart-delivery"><legend>¿Cómo recibes tu pedido?</legend><label class="check"><input type="radio" name="entrega" value="tienda" checked required> Recoger en tienda · Gratis</label><label class="check"><input type="radio" name="entrega" value="domicilio" required> Envío a domicilio · Bs 8</label></fieldset>
          <label id="cart-address-field" hidden>Dirección de entrega<input id="cart-address" name="direccion" type="text" autocomplete="street-address" minlength="5"></label>
          <label>Observaciones<textarea name="observaciones" rows="2" maxlength="250" placeholder="Indicaciones para tu pedido"></textarea></label>
          <div class="cart-totals"><p><span>Subtotal</span><strong id="cart-subtotal">Bs 0.00</strong></p><p><span>Entrega</span><strong id="cart-delivery-fee">Gratis</strong></p><p class="cart-grand-total"><span>Total</span><strong id="cart-total">Bs 0.00</strong></p></div>
          <button class="btn cart-confirm" type="submit">Confirmar pedido</button>
        </form>
      </aside>
    </div>
  </section>`,
  init() {
    if (this.iniciado) { this.actualizarInsignia(); return; }
    this.iniciado = true;
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const agregar = target.closest('.js-agregar-carrito');
      if (agregar) { this.agregar(Number(agregar.dataset.id)); return; }
      const accion = target.closest('[data-cart-action]');
      if (!accion) return;
      const id = Number(accion.dataset.id);
      if (accion.dataset.cartAction === 'sumar') this.cambiarCantidad(id, 1);
      if (accion.dataset.cartAction === 'restar') this.cambiarCantidad(id, -1);
      if (accion.dataset.cartAction === 'quitar') this.quitar(id);
    });
    document.addEventListener('change', event => {
      const target = event.target;
      if (target.matches('.cart-size')) this.cambiarTamano(Number(target.dataset.id), target.value);
      if (target.matches('#cart-checkout-form [name="entrega"]')) this.actualizar();
      if (target.matches('.cart-quantity')) this.fijarCantidad(Number(target.dataset.id), Number(target.value));
    });
    document.addEventListener('submit', event => {
      if (event.target.id !== 'cart-checkout-form') return;
      event.preventDefault(); this.confirmar(event.target);
    });
    this.actualizarInsignia();
  },
  leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(this.KEY));
      return Array.isArray(datos) ? datos.filter(item => PRODUCTOS.some(p => p.id === Number(item.id))) : [];
    } catch (error) { return []; }
  },
  guardar(items) {
    try { localStorage.setItem(this.KEY, JSON.stringify(items)); return true; }
    catch (error) { this.mensaje('No se pudo guardar el carrito en este dispositivo.'); return false; }
  },
  agregar(id) {
    const producto = PRODUCTOS.find(item => item.id === id);
    if (!producto) return;
    const items = this.leer(), existente = items.find(item => Number(item.id) === id);
    if (existente) existente.cantidad = Math.min(20, Number(existente.cantidad || 1) + 1);
    else items.push({ id, cantidad: 1, tamano: 'mediano' });
    if (!this.guardar(items)) return;
    this.actualizar();
    this.mensaje(existente ? producto.nombre + ' · cantidad actualizada' : producto.nombre + ' añadido al carrito');
    Bitacora.registrar('carrito', (existente ? 'Cantidad aumentada: ' : 'Añadido: ') + producto.nombre);
    if (typeof Spa === 'undefined') location.href = 'index.html#pedido';
  },
  cambiarCantidad(id, delta) {
    const items = this.leer(), item = items.find(row => Number(row.id) === id);
    if (!item) return;
    item.cantidad = Math.max(1, Math.min(20, Number(item.cantidad || 1) + delta));
    if (this.guardar(items)) this.actualizar();
  },
  fijarCantidad(id, cantidad) {
    if (!Number.isFinite(cantidad)) return;
    const items = this.leer(), item = items.find(row => Number(row.id) === id);
    if (!item) return;
    item.cantidad = Math.max(1, Math.min(20, cantidad));
    if (this.guardar(items)) this.actualizar();
  },
  cambiarTamano(id, tamano) {
    if (!['pequeno', 'mediano', 'grande'].includes(tamano)) return;
    const items = this.leer(), item = items.find(row => Number(row.id) === id);
    if (!item) return;
    item.tamano = tamano;
    if (this.guardar(items)) this.actualizar();
  },
  quitar(id) {
    const items = this.leer().filter(item => Number(item.id) !== id);
    if (this.guardar(items)) { this.actualizar(); Bitacora.registrar('carrito', 'Producto quitado del carrito'); }
  },
  precio(producto, tamano) {
    const multiplicador = { pequeno: 1, mediano: 1.25, grande: 1.5 }[tamano] || 1;
    return Math.round(producto.precio * multiplicador * 100) / 100;
  },
  actualizarInsignia() {
    const total = this.leer().reduce((suma, item) => suma + Number(item.cantidad || 0), 0);
    document.querySelectorAll('.cart-count').forEach(badge => {
      badge.textContent = String(total);
      badge.hidden = total === 0;
    });
    document.querySelectorAll('.js-cart-link').forEach(link => link.setAttribute('aria-label', total ? 'Abrir carrito, ' + total + (total === 1 ? ' bebida' : ' bebidas') : 'Abrir carrito vacío'));
  },
  actualizar() {
    this.actualizarInsignia();
    if (typeof Spa !== 'undefined' && Spa.actual === 'pedido') this.render();
  },
  render() {
    const lista = document.getElementById('cart-items');
    if (!lista) return;
    const formulario = document.getElementById('cart-checkout-form');
    const valoresFormulario = formulario ? new FormData(formulario) : null;
    const items = this.leer(), vacio = document.getElementById('carrito-vacio'), layout = document.getElementById('carrito-layout');
    lista.replaceChildren();
    vacio.hidden = items.length > 0;
    layout.hidden = items.length === 0;
    const confirmacion = document.getElementById('cart-success');
    if (items.length && confirmacion) confirmacion.hidden = true;
    const selectTamano = (id, actual) => {
      const select = document.createElement('select');
      select.className = 'cart-size'; select.dataset.id = String(id); select.setAttribute('aria-label', 'Tamaño de la bebida');
      [['pequeno','Pequeño · 350 ml'],['mediano','Mediano · 500 ml'],['grande','Grande · 700 ml']].forEach(([valor, label]) => {
        const opcion = document.createElement('option'); opcion.value = valor; opcion.textContent = label; opcion.selected = valor === actual; select.append(opcion);
      });
      return select;
    };
    items.forEach(item => {
      const producto = PRODUCTOS.find(p => p.id === Number(item.id));
      if (!producto) return;
      const li = document.createElement('li'); li.className = 'cart-item';
      const imagen = document.createElement('img'); imagen.className = 'cart-item__image'; imagen.src = producto.imagen; imagen.alt = producto.nombre; imagen.loading = 'lazy'; imagen.decoding = 'async'; imagen.dataset.fallback = 'img/productos/p' + producto.id + '.svg';
      const detalle = document.createElement('div'); detalle.className = 'cart-item__detail';
      const titulo = document.createElement('h3'); titulo.textContent = producto.nombre;
      const precio = document.createElement('p'); precio.className = 'cart-item__unit'; precio.textContent = 'Bs ' + this.precio(producto, item.tamano).toFixed(2) + ' c/u';
      const tamano = selectTamano(producto.id, item.tamano);
      const controles = document.createElement('div'); controles.className = 'cart-quantity-control';
      const menos = document.createElement('button'); menos.type = 'button'; menos.dataset.cartAction = 'restar'; menos.dataset.id = producto.id; menos.setAttribute('aria-label', 'Quitar una unidad de ' + producto.nombre); menos.textContent = '−';
      const cantidad = document.createElement('input'); cantidad.type = 'number'; cantidad.className = 'cart-quantity'; cantidad.dataset.id = producto.id; cantidad.min = '1'; cantidad.max = '20'; cantidad.value = String(item.cantidad); cantidad.setAttribute('aria-label', 'Cantidad de ' + producto.nombre);
      const mas = document.createElement('button'); mas.type = 'button'; mas.dataset.cartAction = 'sumar'; mas.dataset.id = producto.id; mas.setAttribute('aria-label', 'Añadir una unidad de ' + producto.nombre); mas.textContent = '+';
      controles.append(menos, cantidad, mas);
      const quitar = document.createElement('button'); quitar.type = 'button'; quitar.className = 'cart-remove'; quitar.dataset.cartAction = 'quitar'; quitar.dataset.id = producto.id; quitar.textContent = 'Quitar';
      detalle.append(titulo, precio, tamano, controles, quitar);
      const total = document.createElement('strong'); total.className = 'cart-item__total'; total.textContent = 'Bs ' + (this.precio(producto, item.tamano) * item.cantidad).toFixed(2);
      li.append(imagen, detalle, total); lista.append(li);
    });
    if (formulario && valoresFormulario) {
      formulario.querySelectorAll('[name]').forEach(campo => {
        if (campo.type === 'radio') campo.checked = valoresFormulario.getAll(campo.name).includes(campo.value);
        else if (valoresFormulario.has(campo.name)) campo.value = valoresFormulario.get(campo.name);
      });
    }
    const conteo = items.reduce((suma, item) => suma + Number(item.cantidad), 0);
    const subtotal = items.reduce((suma, item) => suma + this.precio(PRODUCTOS.find(p => p.id === Number(item.id)), item.tamano) * Number(item.cantidad), 0);
    const entrega = document.querySelector('#cart-checkout-form [name="entrega"]:checked')?.value || 'tienda';
    const envio = entrega === 'domicilio' ? this.ENVIO : 0;
    document.getElementById('cart-items-count').textContent = conteo + (conteo === 1 ? ' bebida' : ' bebidas');
    document.getElementById('cart-subtotal').textContent = 'Bs ' + subtotal.toFixed(2);
    document.getElementById('cart-delivery-fee').textContent = envio ? 'Bs ' + envio.toFixed(2) : 'Gratis';
    document.getElementById('cart-total').textContent = 'Bs ' + (subtotal + envio).toFixed(2);
    document.getElementById('cart-address-field').hidden = entrega !== 'domicilio';
    const direccion = document.getElementById('cart-address');
    if (direccion) direccion.required = entrega === 'domicilio';
  },
  confirmar(formulario) {
    const items = this.leer();
    if (!items.length) { this.mensaje('Agrega al menos una bebida antes de confirmar.'); return; }
    if (!formulario.reportValidity()) return;
    const datos = new FormData(formulario), entrega = datos.get('entrega');
    const detalle = items.map(item => {
      const producto = PRODUCTOS.find(p => p.id === Number(item.id));
      const precioUnitario = this.precio(producto, item.tamano);
      return { productoId: producto.id, producto: producto.nombre, tamano: item.tamano, cantidad: Number(item.cantidad), precioUnitario, subtotal: precioUnitario * Number(item.cantidad) };
    });
    const subtotal = detalle.reduce((suma, item) => suma + item.subtotal, 0), envio = entrega === 'domicilio' ? this.ENVIO : 0;
    const pedido = {
      id: 'FJ-' + Date.now().toString(36).toUpperCase(), fecha: new Date().toISOString(),
      cliente: String(datos.get('nombre')).trim(), celular: String(datos.get('celular')).trim(), correo: String(datos.get('correo')).trim(),
      productos: detalle, entrega, direccion: String(datos.get('direccion') || '').trim(), observaciones: String(datos.get('observaciones') || '').trim(),
      subtotal, envio, total: subtotal + envio, estado: 'guardado-localmente', conexion: navigator.onLine ? 'online' : 'offline'
    };
    try {
      const guardados = JSON.parse(localStorage.getItem('frutiva_pedidos'));
      localStorage.setItem('frutiva_pedidos', JSON.stringify([...(Array.isArray(guardados) ? guardados.slice(-99) : []), pedido]));
      Sincronizacion.encolar('pedidos', {
        proyecto: PROYECTO_ACTUAL, cliente: pedido.cliente, celular: pedido.celular, correo: pedido.correo,
        modalidad: pedido.entrega, direccion: pedido.direccion, forma_pago: 'contra_entrega', monto_total: pedido.total, items: detalle
      });
      localStorage.removeItem(this.KEY);
    } catch (error) { this.mensaje('No se pudo guardar el pedido. Revisa el espacio disponible en este dispositivo.'); return; }
    Bitacora.registrar('pedido', 'Pedido de ' + detalle.length + ' productos confirmado ' + pedido.id);
    formulario.reset();
    const exito = document.getElementById('cart-success');
    exito.querySelector('strong').textContent = 'Pedido ' + pedido.id + ' confirmado';
    exito.hidden = false;
    this.actualizar();
    this.mensaje('Pedido guardado en este dispositivo.');
    exito.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
  mensaje(texto) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = texto; toast.classList.add('is-show');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => toast.classList.remove('is-show'), 3800);
  }
};
