// Semana 2 - Fetch Lazy Loading y Bubbling
// Semana 3 - Desarrollo Agil y Smoke Testing
// Semana 3 - Cierre A11Y HTML5 y HMR
const AuditoriasFrutiva = (() => {
  let imagenActiva = null;
  const texto = (selector, valor) => {
    const salida = document.querySelector(selector);
    if (salida) salida.textContent = valor;
  };

  function abrirLightbox(imagen) {
    const visor = document.getElementById('lightbox-imagen');
    const foto = document.getElementById('lightbox-foto');
    const titulo = document.getElementById('lightbox-titulo');
    if (!visor || !foto || typeof visor.showModal !== 'function') return;
    imagenActiva = imagen;
    foto.src = imagen.currentSrc || imagen.src;
    foto.alt = imagen.alt || 'Imagen ampliada';
    titulo.textContent = imagen.alt || 'Imagen ampliada';
    visor.showModal();
    visor.querySelector('[data-lightbox-close]')?.focus();
  }

  function cerrarLightbox() {
    const visor = document.getElementById('lightbox-imagen');
    if (visor?.open) visor.close();
  }

  function auditarAccesibilidad() {
    const main = document.querySelector('main');
    const encabezados = [...document.querySelectorAll('main h1, main h2, main h3')];
    const saltos = [];
    let nivelPrevio = 0;
    encabezados.forEach(encabezado => {
      const nivel = Number(encabezado.tagName.slice(1));
      if (nivelPrevio && nivel > nivelPrevio + 1) saltos.push(`${encabezado.tagName}: ${encabezado.textContent.trim() || 'sin título'}`);
      nivelPrevio = nivel;
    });
    const imagenesSinAlt = document.querySelectorAll('img:not([alt])').length;
    const botonesSinNombre = [...document.querySelectorAll('button')].filter(boton =>
      !boton.hasAttribute('aria-label') && !boton.textContent.trim() && !boton.querySelector('img[alt]')
    ).length;
    const landmarks = document.querySelectorAll('header, nav, main, article, footer').length;
    const resumen = [
      `Zonas semánticas HTML5: ${landmarks}.`,
      `Encabezados en la vista: ${encabezados.length}${encabezados.some(h => h.tagName === 'H1') ? ', incluye H1' : ', falta H1'}.`,
      `Imágenes sin atributo alt: ${imagenesSinAlt}.`,
      `Botones sin nombre accesible: ${botonesSinNombre}.`,
      `Saltos de jerarquía: ${saltos.length}${saltos.length ? ' (' + saltos.join('; ') + ')' : ''}.`,
      main ? 'Vista principal: encontrada.' : 'Vista principal: falta <main>.'
    ];
    texto('#reporteA11Y', resumen.join(' '));
    if (typeof Bitacora !== 'undefined') Bitacora.registrar('accesibilidad', 'Auditoría semántica ejecutada');
  }

  function smokeTest() {
    const sinAlt = document.querySelectorAll('img:not([alt])').length;
    const enlacesVacios = document.querySelectorAll('a:not([href]), a[href=""], a[href="#"]').length;
    const ids = [...document.querySelectorAll('[id]')].map(elemento => elemento.id);
    const idsDuplicados = [...new Set(ids.filter((id, indice) => ids.indexOf(id) !== indice))];
    const botones = document.querySelectorAll('button').length;
    const errores = sinAlt + enlacesVacios + idsDuplicados.length;
    texto('#salidaAudit', `${errores ? 'Revisar' : 'Correcto'} · Botones: ${botones} · Imágenes sin alt: ${sinAlt} · Enlaces vacíos: ${enlacesVacios} · IDs duplicados: ${idsDuplicados.length}${idsDuplicados.length ? ' (' + idsDuplicados.join(', ') + ')' : ''}.`);
    if (typeof Bitacora !== 'undefined') Bitacora.registrar('smoke-test', `DOM revisado: ${errores} observaciones`);
  }

  function init() {
    const prepararImagenes = raiz => raiz?.querySelectorAll('img').forEach(imagen => {
      if (imagen.closest('#lightbox-imagen')) return;
      imagen.classList.add('img-ampliable');
      imagen.tabIndex = 0;
      imagen.setAttribute('role', 'button');
      imagen.setAttribute('aria-haspopup', 'dialog');
      imagen.setAttribute('aria-label', 'Ampliar imagen: ' + (imagen.alt || 'imagen'));
    });
    const contenido = document.getElementById('contenido');
    prepararImagenes(contenido);
    if (contenido) new MutationObserver(() => prepararImagenes(contenido)).observe(contenido, { childList: true, subtree: true });
    document.addEventListener('click', evento => {
      const objetivo = evento.target instanceof Element ? evento.target : null;
      if (!objetivo) return;
      const botonA11Y = objetivo.closest('#btnAuditarA11Y');
      if (botonA11Y) { auditarAccesibilidad(); return; }
      const botonSmoke = objetivo.closest('#btnSmokeTest');
      if (botonSmoke) { smokeTest(); return; }
      const cerrar = objetivo.closest('[data-lightbox-close]');
      if (cerrar) { cerrarLightbox(); return; }
      const imagen = objetivo.closest('#contenido img.img-ampliable');
      if (imagen) abrirLightbox(imagen);
      const visor = document.getElementById('lightbox-imagen');
      if (visor && objetivo === visor) cerrarLightbox();
    });
    document.addEventListener('keydown', evento => {
      if (evento.key !== 'Enter' && evento.key !== ' ') return;
      const imagen = evento.target instanceof Element ? evento.target.closest('#contenido img.img-ampliable') : null;
      if (!imagen) return;
      evento.preventDefault(); abrirLightbox(imagen);
    });
    document.getElementById('lightbox-imagen')?.addEventListener('close', () => {
      const foto = document.getElementById('lightbox-foto');
      if (foto) { foto.removeAttribute('src'); foto.alt = ''; }
      if (imagenActiva?.isConnected) imagenActiva.focus();
      imagenActiva = null;
    });
  }

  return { init, abrirLightbox, cerrarLightbox, auditarAccesibilidad, smokeTest };
})();

document.addEventListener('DOMContentLoaded', AuditoriasFrutiva.init, { once: true });
