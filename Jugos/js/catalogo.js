const Catalogo = {
  est: { cat: '', sub: '', q: '', precio: '', orden: 'pop', pop: false, fav: false },
  pagina: 1, porPagina: 8, iniciado: false,
  norm: s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  favoritos() { try { const ids = JSON.parse(localStorage.getItem('frutiva_favoritos')); return Array.isArray(ids) ? ids.map(Number) : []; } catch (e) { return []; } },
  filtrar() {
    const e = this.est, q = this.norm(e.q.trim());
    const l = PRODUCTOS.filter(p => {
      if (e.cat && p.cat !== e.cat) return false;
      if (e.sub && p.sub !== e.sub) return false;
      if (e.pop && p.pop < 4) return false;
      if (e.fav && !this.favoritos().includes(p.id)) return false;
      if (e.precio) { const [a, b] = e.precio.split('-').map(Number); if (p.precio < a || p.precio > b) return false; }
      if (q && !this.norm([p.nombre, p.ing, CATEGORIAS[p.cat].nombre, p.sub].join(' ')).includes(q)) return false;
      return true;
    });
    const o = { alfa: (a, b) => a.nombre.localeCompare(b.nombre), asc: (a, b) => a.precio - b.precio, desc: (a, b) => b.precio - a.precio, pop: (a, b) => b.pop - a.pop };
    return l.sort(o[e.orden]);
  },
  tarjeta(p, i) {
    const $c = $('<article class="card">');
    const $img = $('<img class="card__img" width="320" height="240" loading="lazy" decoding="async">').attr({ src: p.imagen, alt: 'Foto de ' + p.nombre, 'data-fallback': 'img/productos/p' + p.id + '.svg' });
    const $media = $('<div class="card__media">').append($img);
    if (p.pop >= 4) $media.append($('<span class="card__badge">').text(p.pop === 5 ? 'Favorito' : 'Popular'));
    const esFavorito = this.favoritos().includes(p.id);
    $media.append($('<button type="button" class="favorite-btn js-favorito">').attr({ 'data-id': p.id, 'aria-pressed': esFavorito, 'aria-label': (esFavorito ? 'Quitar de' : 'Añadir a') + ' favoritos: ' + p.nombre }).toggleClass('is-favorite', esFavorito).text(esFavorito ? '♥' : '♡'));
    $c.append($media);
    const $b = $('<div class="card__body">');
    $b.append($('<span class="card__cat">').text(CATEGORIAS[p.cat].nombre + ' · ' + p.sub));
    $b.append($('<h3 class="card__title">').text(p.nombre), $('<p class="card__desc">').text(p.desc));
    $b.append($('<div class="card__foot">').append($('<strong class="card__price">').text('Desde Bs ' + p.precio),
      $('<button type="button" class="btn btn--sm js-agregar-carrito">').attr('data-id', p.id).attr('aria-label', 'Agregar al carrito: ' + p.nombre).text('Agregar')));
    return $c.append($b);
  },
  render() {
    const l = this.filtrar(), $g = $('#grid').empty();
    const paginas = Math.max(1, Math.ceil(l.length / this.porPagina));
    this.pagina = Math.min(this.pagina, paginas);
    l.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina).forEach((p, i) => $g.append(this.tarjeta(p, i)));
    const $pag = $('#paginacion').empty().prop('hidden', paginas < 2);
    if (paginas > 1) {
      $pag.append($('<button type="button" class="page-btn">').prop('disabled', this.pagina === 1).attr('data-page', this.pagina - 1).text('← Anterior'));
      $pag.append($('<span class="page-count" aria-live="polite">').text('Página ' + this.pagina + ' de ' + paginas));
      $pag.append($('<button type="button" class="page-btn">').prop('disabled', this.pagina === paginas).attr('data-page', this.pagina + 1).text('Siguiente →'));
    }
    $('#catalogo-error').prop('hidden', CATALOGO_CARGADO);
    $('#vacio').prop('hidden', l.length > 0 || !CATALOGO_CARGADO);
    $('#conteo').text(l.length + (l.length === 1 ? ' bebida' : ' bebidas'));
    $('.cat').each(function () {
      const key = $(this).data('cat'), active = key === Catalogo.est.cat;
      const total = PRODUCTOS.filter(p => p.cat === key).length;
      $(this).toggleClass('is-active', active).attr('aria-pressed', active).find('.cat__count').text(total + (total === 1 ? ' bebida' : ' bebidas'));
    });
    const c = CATEGORIAS[this.est.cat], $s = $('#subcats'), estabaOculto = $s.prop('hidden');
    $s.empty();
    if (c) {
      $s.append($('<button type="button" class="chip js-sub">').toggleClass('is-active', !this.est.sub).attr({ 'data-sub': '', 'aria-pressed': !this.est.sub }).text('Todas'));
      c.subs.forEach(s => $s.append($('<button type="button" class="chip js-sub">').toggleClass('is-active', this.est.sub === s).attr({ 'data-sub': s, 'aria-pressed': this.est.sub === s }).text(s)));
    }
    if (c) {
      $s.prop('hidden', false);
      if (estabaOculto) $s.stop(true, true).hide().slideDown(220);
    } else if (!estabaOculto) {
      $s.stop(true, true).slideUp(180, () => $s.prop('hidden', true).removeAttr('style'));
    } else $s.prop('hidden', true);
    $('#f-cat').val(this.est.cat);
  },
  init() {
    if (!$('#grid').length) return;
    if ($('#f-cat option').length <= 1) $('#f-cat').append(Object.keys(CATEGORIAS).map(k => $('<option>').val(k).text(CATEGORIAS[k].nombre)));
    $('#q').val(this.est.q); $('#f-precio').val(this.est.precio); $('#f-orden').val(this.est.orden);
    $('#f-pop').prop('checked', this.est.pop); $('#f-fav').prop('checked', this.est.fav);
    $('#q').off('.frutivaCatalogo').on('input.frutivaCatalogo', function () { Catalogo.est.q = this.value; Catalogo.pagina = 1; Catalogo.render(); clearTimeout(Catalogo.busquedaTimer); Catalogo.busquedaTimer = setTimeout(() => this.value.trim() && Bitacora.registrar('busqueda', 'Búsqueda realizada'), 800); });
    $('#f-cat').off('.frutivaCatalogo').on('change.frutivaCatalogo', function () { Catalogo.est.cat = this.value; Catalogo.est.sub = ''; Catalogo.pagina = 1; Catalogo.render(); });
    $('#f-precio').off('.frutivaCatalogo').on('change.frutivaCatalogo', function () { Catalogo.est.precio = this.value; Catalogo.pagina = 1; Catalogo.render(); });
    $('#f-orden').off('.frutivaCatalogo').on('change.frutivaCatalogo', function () { Catalogo.est.orden = this.value; Catalogo.pagina = 1; Catalogo.render(); });
    $('#f-pop').off('.frutivaCatalogo').on('change.frutivaCatalogo', function () { Catalogo.est.pop = this.checked; Catalogo.pagina = 1; Catalogo.render(); });
    $('#f-fav').off('.frutivaCatalogo').on('change.frutivaCatalogo', function () { Catalogo.est.fav = this.checked; Catalogo.pagina = 1; Catalogo.render(); });
    $('#vacio-limpiar').off('.frutivaCatalogo').on('click.frutivaCatalogo', () => $('#limpiar').trigger('click'));
    $('#limpiar').off('.frutivaCatalogo').on('click.frutivaCatalogo', () => { this.est = { cat: '', sub: '', q: '', precio: '', orden: 'pop', pop: false, fav: false }; this.pagina = 1; $('#q').val(''); $('#f-precio').val(''); $('#f-orden').val('pop'); $('#f-pop, #f-fav').prop('checked', false); this.render(); });
    if (!this.iniciado) {
      this.iniciado = true;
      $(document).on('click.frutivaCatalogo', '.cat', function () {
        const k = $(this).data('cat'); Catalogo.est.cat = Catalogo.est.cat === k ? '' : k; Catalogo.est.sub = '';
        Catalogo.pagina = 1; Bitacora.registrar('categoria', 'Categoría: ' + (CATEGORIAS[k] ? CATEGORIAS[k].nombre : 'todas')); Catalogo.render();
      });
      $(document).on('click.frutivaCatalogo', '.js-sub', function () { Catalogo.est.sub = $(this).data('sub'); Catalogo.pagina = 1; Bitacora.registrar('subcategoria', 'Subcategoría: ' + (Catalogo.est.sub || 'todas')); Catalogo.render(); });
      $(document).on('click.frutivaCatalogo', '.page-btn', function () { Catalogo.pagina = +$(this).data('page'); Catalogo.render(); $('#menu')[0]?.scrollIntoView({ behavior: 'smooth' }); $('.page-btn').first().trigger('focus'); });
      $(document).on('click.frutivaCatalogo', '.js-favorito', function () {
        const id = +$(this).data('id'), ids = Catalogo.favoritos(), guardar = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
        try { localStorage.setItem('frutiva_favoritos', JSON.stringify(guardar)); } catch (e) {}
        const p = PRODUCTOS.find(x => x.id === id);
        Bitacora.registrar('favorito', (guardar.includes(id) ? 'Añadido a' : 'Quitado de') + ' favoritos: ' + p.nombre); Catalogo.render();
      });
      $(document).on('click.frutivaCatalogo', '.js-pedir', function () {
        const p = PRODUCTOS.find(x => x.id === +$(this).data('id'));
        Bitacora.registrar('producto', 'Producto seleccionado: ' + p.nombre);
        if (typeof Spa !== 'undefined') Spa.navegar('pedido', new URLSearchParams({ producto: p.id }));
        else window.location.href = 'pedido.html?producto=' + encodeURIComponent(p.id);
      });
    }
    this.render();
  }
};
