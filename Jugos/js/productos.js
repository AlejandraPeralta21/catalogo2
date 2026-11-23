let CATEGORIAS = {};
let PRODUCTOS = [];
let CATALOGO_CARGADO = false;

function asignarCatalogo(datos) {
  if (!datos || !datos.categorias || !Array.isArray(datos.productos)) {
    throw new Error('El catálogo no tiene el formato esperado.');
  }
  CATEGORIAS = datos.categorias;
  PRODUCTOS = datos.productos;
  CATALOGO_CARGADO = PRODUCTOS.length > 0;
  return CATALOGO_CARGADO;
}

// La vista inicial no espera a la red: renderiza las bebidas locales inmediatamente.
if (window.FRUTIVA_CATALOGO_RESPALDO) asignarCatalogo(window.FRUTIVA_CATALOGO_RESPALDO);

const PRODUCTOS_CARGA = (location.protocol === 'file:'
  ? Promise.reject(new Error('Catálogo local: usando datos incluidos.'))
  : fetch('./js/productos.json').then(respuesta => {
    if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo (' + respuesta.status + ').');
    return respuesta.json();
  })
).then(asignarCatalogo).catch(error => {
  const respaldo = window.FRUTIVA_CATALOGO_RESPALDO;
  if (respaldo) {
    console.info('Frutiva: catálogo local cargado (' + respaldo.productos.length + ' bebidas).');
    return asignarCatalogo(respaldo);
  }
  console.error('Error al cargar el catálogo de Frutiva:', error);
  return false;
});
