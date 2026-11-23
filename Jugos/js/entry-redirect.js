(() => {
  const rutas = { 'menu.html': 'menu', 'promociones.html': 'promociones', 'nosotros.html': 'nosotros', 'pedido.html': 'pedido' };
  const pagina = location.pathname.split('/').pop().toLowerCase();
  const ruta = rutas[pagina];
  if (!ruta) return;
  const query = new URLSearchParams(location.search).toString();
  location.replace('./index.html#' + ruta + (query ? '?' + query : ''));
})();
