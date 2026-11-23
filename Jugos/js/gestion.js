// Semana 2 - Reservas y validación de datos
// Semana 3 - Interfaces separadas por rol y aislamiento multi-tenant
const Gestion = (() => {
  const KEY = 'sesionSupabase_frutiva';
  let iniciado = false;
  let sesion = null;
  let pestana = 'pedidos';
  const esc = valor => String(valor ?? '');
  const proyectoActual = () => document.getElementById('staff-proyecto')?.value || 'frutiva_juices';
  const config = () => window.FRUTIVA_SUPABASE || {};
  const endpoint = (tabla, query = '') => `${config().url.replace(/\/$/, '')}/rest/v1/${tabla}${query}`;
  const endpointAuth = ruta => `${config().url.replace(/\/$/, '')}/auth/v1/${ruta}`;
  const cabeceras = token => ({ apikey: config().anonKey, Authorization: 'Bearer ' + (token || config().anonKey), 'Content-Type': 'application/json' });
  function aviso(mensaje, error = false) {
    const salida = document.getElementById('staff-mensaje');
    if (!salida) return;
    salida.textContent = mensaje;
    salida.classList.toggle('is-error', error);
  }
  function leerSesion() {
    try { sesion = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (error) { sesion = null; }
    return sesion;
  }
  function guardarSesion(valor) {
    sesion = valor;
    try { sessionStorage.setItem(KEY, JSON.stringify(valor)); return true; } catch (error) { return false; }
  }
  async function solicitud(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);
    if (!respuesta.ok) throw new Error('El servicio respondió con HTTP ' + respuesta.status + '.');
    if (respuesta.status === 204) return null;
    const texto = await respuesta.text();
    return texto ? JSON.parse(texto) : null;
  }
  function mostrarSesionActiva() {
    const acceso = document.getElementById('staff-login');
    const panel = document.getElementById('staff-panel');
    if (acceso) acceso.hidden = true;
    if (panel) panel.hidden = false;
    const rol = document.getElementById('staff-rol');
    if (rol) rol.textContent = (sesion.rol === 'admin' ? 'Administrador' : 'Encargado') + ' · ' + sesion.proyecto;
  }
  async function entrar(formulario) {
    if (!config().url || !config().anonKey) { aviso('Completa js/supabase-config.js y aplica schema.sql antes de iniciar sesión.', true); return; }
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    try {
      const datos = new FormData(formulario);
      const token = await solicitud(endpointAuth('token?grant_type=password'), {
        method: 'POST', headers: { apikey: config().anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(datos.get('correo')).trim(), password: String(datos.get('clave')) })
      });
      const proyecto = proyectoActual();
      const cuentas = await solicitud(endpoint('cuentas', `?select=user_id,proyecto,usuario,rol&user_id=eq.${encodeURIComponent(token.user.id)}&proyecto=eq.${encodeURIComponent(proyecto)}&limit=1`), { headers: cabeceras(token.access_token) });
      const cuenta = Array.isArray(cuentas) ? cuentas[0] : null;
      if (!cuenta || !['encargado', 'admin'].includes(cuenta.rol)) throw new Error('La cuenta no tiene permisos de gestión para este catálogo.');
      if (!guardarSesion({ access_token: token.access_token, refresh_token: token.refresh_token, user_id: token.user.id, correo: token.user.email, proyecto: cuenta.proyecto, usuario: cuenta.usuario, rol: cuenta.rol })) throw new Error('No se pudo mantener la sesión en esta pestaña.');
      mostrarSesionActiva();
      aviso('Acceso autorizado. Datos limitados a ' + cuenta.proyecto + '.');
      await cargarPestana(pestana);
      Bitacora.registrar('sesión', 'Ingreso de ' + cuenta.rol + ' al proyecto ' + cuenta.proyecto);
    } catch (error) { aviso(error.message || 'No se pudo iniciar sesión.', true); }
    finally { boton.disabled = false; }
  }
  function crearFila(etiquetas) {
    const fila = document.createElement('li'); fila.className = 'staff-row';
    Object.entries(etiquetas).forEach(([titulo, valor]) => {
      const campo = document.createElement('span'); campo.className = 'staff-row__field';
      const etiqueta = document.createElement('strong'); etiqueta.textContent = titulo + ': ';
      const dato = document.createElement('span'); dato.textContent = esc(valor);
      campo.append(etiqueta, dato); fila.append(campo);
    });
    return fila;
  }
  function renderLista(lista, filas, vacio) {
    const salida = document.getElementById('staff-lista');
    if (!salida) return;
    salida.replaceChildren();
    if (!filas?.length) { const fila = document.createElement('li'); fila.className = 'staff-empty'; fila.textContent = vacio; salida.append(fila); return; }
    filas.forEach(fila => salida.append(lista(fila)));
  }
  async function obtener(tabla, columnas = '*') {
    const filtro = `?select=${encodeURIComponent(columnas)}&proyecto=eq.${encodeURIComponent(sesion.proyecto)}&order=creado_en.desc&limit=50`;
    return solicitud(endpoint(tabla, filtro), { headers: cabeceras(sesion.access_token) });
  }
  async function cargarPestana(nombre) {
    if (!sesion) return;
    pestana = nombre;
    const titulo = document.getElementById('staff-titulo');
    if (titulo) titulo.textContent = ({ pedidos: 'Pedidos', reservas: 'Reservas', consultas: 'Consultas', productos_extra: 'Catálogo extra', promociones: 'Promoción express', actividad_clientes: 'Actividad de clientes' })[nombre] || 'Panel';
    const tabs = document.getElementById('staff-tabs');
    if (tabs) tabs.querySelectorAll('[data-staff-tab]').forEach(boton => { const activo = boton.dataset.staffTab === nombre; boton.hidden = boton.dataset.adminOnly === 'true' && sesion.rol !== 'admin'; boton.setAttribute('aria-pressed', String(activo)); });
    const formularioPromo = document.getElementById('staff-promo-form');
    if (formularioPromo) formularioPromo.hidden = nombre !== 'promociones';
    const formularioProducto = document.getElementById('staff-producto-form');
    if (formularioProducto) formularioProducto.hidden = nombre !== 'productos_extra';
    const lista = document.getElementById('staff-lista');
    if (lista) lista.hidden = ['promociones', 'productos_extra'].includes(nombre);
    if (['promociones', 'productos_extra'].includes(nombre)) return cargarFormularioGestion(nombre);
    try {
      const filas = await obtener(nombre);
      const resultado = Array.isArray(filas) ? filas : [];
      renderLista(fila => {
        if (nombre === 'pedidos') return crearFila({ Pedido: fila.id, Cliente: fila.cliente, Celular: fila.celular, Total: 'Bs ' + Number(fila.monto_total).toFixed(2), Estado: fila.estado, Fecha: new Date(fila.creado_en).toLocaleString() });
        if (nombre === 'reservas') return crearFila({ Reserva: fila.id, Cliente: fila.cliente, Detalle: fila.detalle_sala, Fecha: fila.fecha_reserva, Horario: fila.horario, Estado: fila.estado });
        if (nombre === 'consultas') return crearFila({ Consulta: fila.id, Cliente: fila.cliente, Mensaje: fila.mensaje, Estado: fila.estado });
        return crearFila({ Actividad: fila.accion, Detalle: fila.detalle, Fecha: new Date(fila.creado_en).toLocaleString() });
      }, resultado, 'No hay registros para este catálogo.');
      aviso('Registros cargados de ' + sesion.proyecto + '.');
    } catch (error) { aviso(error.message || 'No se pudieron cargar los registros.', true); }
  }
  async function cargarFormularioGestion(nombre) {
    try {
      if (nombre === 'promociones') {
        const filas = await solicitud(endpoint('promociones', `?select=*&proyecto=eq.${encodeURIComponent(sesion.proyecto)}&limit=1`), { headers: cabeceras(sesion.access_token) });
        const promo = Array.isArray(filas) ? filas[0] : null;
        const form = document.getElementById('staff-promo-form');
        if (promo && form) Object.entries({ titulo: promo.titulo, descripcion: promo.descripcion, precio: promo.precio, duracion_minutos: promo.duracion_minutos, expira_en: promo.expira_en?.slice(0, 16) }).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value ?? ''; });
      } else {
        const filas = await obtener('productos_extra');
        renderLista(fila => crearFila({ Producto: fila.nombre, Categoría: fila.categoria, Precio: 'Bs ' + Number(fila.precio).toFixed(2), Estado: fila.activo ? 'Activo' : 'Inactivo' }), filas, 'Aún no hay productos extra.');
        document.getElementById('staff-lista').hidden = false;
      }
      aviso('Datos cargados de ' + sesion.proyecto + '.');
    } catch (error) { aviso(error.message || 'No se pudieron cargar los datos.', true); }
  }
  async function guardarFormulario(formulario) {
    if (!sesion || sesion.rol !== 'encargado' && sesion.rol !== 'admin') return;
    const datos = new FormData(formulario);
    try {
      if (formulario.id === 'staff-promo-form') {
        const fila = { proyecto: sesion.proyecto, titulo: String(datos.get('titulo')).trim(), descripcion: String(datos.get('descripcion')).trim(), precio: Number(datos.get('precio')), duracion_minutos: Number(datos.get('duracion_minutos')), expira_en: new Date(datos.get('expira_en')).toISOString(), activa: true, actualizada_por: sesion.user_id, actualizada_en: new Date().toISOString() };
        await solicitud(endpoint('promociones', '?on_conflict=proyecto'), { method: 'POST', headers: { ...cabeceras(sesion.access_token), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(fila) });
      } else {
        const fila = { proyecto: sesion.proyecto, nombre: String(datos.get('nombre')).trim(), categoria: String(datos.get('categoria')).trim(), precio: Number(datos.get('precio')), imagen: String(datos.get('imagen')).trim() || null, activo: true };
        await solicitud(endpoint('productos_extra'), { method: 'POST', headers: { ...cabeceras(sesion.access_token), Prefer: 'return=minimal' }, body: JSON.stringify(fila) });
      }
      aviso('Cambios guardados para ' + sesion.proyecto + '.');
      formulario.reset();
      await cargarPestana(pestana);
    } catch (error) { aviso(error.message || 'No se pudieron guardar los cambios.', true); }
  }
  async function salir() {
    const anterior = sesion;
    try { if (anterior?.access_token && config().url) await fetch(endpointAuth('logout'), { method: 'POST', headers: cabeceras(anterior.access_token) }); } catch (error) {}
    try { sessionStorage.removeItem(KEY); } catch (error) {}
    sesion = null;
    const acceso = document.getElementById('staff-login'); if (acceso) acceso.hidden = false;
    const panel = document.getElementById('staff-panel'); if (panel) panel.hidden = true;
    const form = document.getElementById('staff-login'); form?.reset();
    aviso('Sesión cerrada.');
  }
  function init() {
    if (iniciado) return;
    iniciado = true;
    document.addEventListener('submit', evento => {
      if (evento.target.id === 'staff-login') { evento.preventDefault(); entrar(evento.target); }
      if (['staff-promo-form', 'staff-producto-form'].includes(evento.target.id)) { evento.preventDefault(); guardarFormulario(evento.target); }
    });
    document.addEventListener('click', evento => {
      const target = evento.target instanceof Element ? evento.target : null;
      const tab = target?.closest('[data-staff-tab]');
      if (tab) cargarPestana(tab.dataset.staffTab);
      if (target?.closest('#staff-cerrar-sesion')) salir();
      if (target?.closest('#staff-recargar')) cargarPestana(pestana);
    });
  }
  async function mostrar() {
    init();
    sesion = leerSesion();
    const configuracion = document.getElementById('staff-config-nota');
    if (configuracion) configuracion.hidden = !!(config().url && config().anonKey);
    if (!sesion) { document.getElementById('staff-login').hidden = false; document.getElementById('staff-panel').hidden = true; return; }
    mostrarSesionActiva();
    try {
      const cuentas = await solicitud(endpoint('cuentas', `?select=user_id,proyecto,usuario,rol&user_id=eq.${encodeURIComponent(sesion.user_id)}&proyecto=eq.${encodeURIComponent(sesion.proyecto)}&limit=1`), { headers: cabeceras(sesion.access_token) });
      if (!Array.isArray(cuentas) || !['encargado', 'admin'].includes(cuentas[0]?.rol)) throw new Error('Sesión vencida o rol revocado.');
      sesion.rol = cuentas[0].rol; mostrarSesionActiva(); await cargarPestana(pestana);
    } catch (error) { await salir(); aviso('Inicia sesión de nuevo para validar tu acceso.', true); }
  }
  return { init, mostrar, cargarPestana, salir };
})();
