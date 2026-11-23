// Semana 3 - Cierre A11Y HTML5 y HMR
// Vite conserva la ruta, tema y scroll durante el reemplazo de este módulo en desarrollo.
if (import.meta.hot) {
  import.meta.hot.accept();
  const previo = import.meta.hot.data || {};
  if (previo.hash && location.hash !== previo.hash) history.replaceState(history.state, '', previo.hash);
  if (previo.tema) document.documentElement.setAttribute('data-theme', previo.tema);
  if (Number.isFinite(previo.scrollY)) requestAnimationFrame(() => window.scrollTo(0, previo.scrollY));
  import.meta.hot.dispose(datos => {
    datos.hash = location.hash;
    datos.tema = document.documentElement.getAttribute('data-theme');
    datos.scrollY = window.scrollY;
  });
}
