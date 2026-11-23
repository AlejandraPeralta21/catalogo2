# FRUTIVA JUICES

SPA de demostración para una juguería, hecha con HTML, CSS, JavaScript y jQuery. `index.html` es la única entrada de la aplicación; las vistas cambian por hash sin recargar. La interfaz usa Flexbox/Grid para escritorio, móvil vertical y horizontal.

## Desarrollo y compilación

- Requiere Node.js 20.19+ o 22.12+.
- `npm install` instala Vite.
- `npm run dev` abre el servidor local de desarrollo en `http://127.0.0.1:5173` con HMR de Vite.
- `npm run build` genera la versión estática en `dist/`.
- `npm run preview` permite revisar la compilación local.
- La instalación PWA y el Service Worker requieren HTTPS o `localhost`; no funcionan con `file://`.

## Funciones incluidas

- SPA desde `index.html`, con inicio sin scroll y vistas de menú, promociones, nosotros y carrito.
- Menú con catálogo JSON asíncrono, respaldo local, búsqueda, filtros, favoritos, paginación y tarjetas accesibles.
- Imágenes con `loading="lazy"`, `alt` y visor lightbox con teclado, Escape y cierre por fondo. La imagen principal de portada carga con prioridad alta para cuidar LCP.
- Carrito con varias bebidas, tamaños, cantidades, cálculo de envío, validación y resumen. Los pedidos se guardan en el dispositivo.
- Tema oscuro, alto contraste, diseño adaptable, navegación por teclado, foco visible y control de movimiento reducido.
- PWA con manifest, orientación `any`, Service Worker, caché offline, instalación y estado de conexión.
- Auditoría semántica y Smoke Test del DOM desde «Nosotros».
- Sesión temporal por pestaña y cola FIFO offline por proyecto. La cola queda local y se sincroniza cuando una configuración válida de Supabase esté presente.
- Portal de personal en `#gestion`: login con Supabase Auth, selección de catálogo, vistas para encargado/admin, pedidos, reservas, consultas, promoción y catálogo extra. El acceso requiere Supabase configurado y usuarios creados con su rol en `cuentas`.

## Supabase seguro

La guía incluye un proyecto Supabase compartido y ejemplos con contraseñas en texto plano y permisos `anon` amplios. Este proyecto no aplica esas políticas. Se agregó `schema.sql` como base local con RLS por proyecto, sesiones de Supabase Auth y permisos mínimos; revísalo y adáptalo antes de ejecutarlo en una base remota.

Para habilitar sincronización, configura `window.FRUTIVA_SUPABASE` en `js/supabase-config.js` con una URL propia y una publishable/anon key. No uses una `service_role` key en el navegador. El esquema contempla los cuatro identificadores del manual y `frutiva_juices`; las vistas administrativas requieren además crear usuarios en Supabase Auth y asignar su proyecto y rol en `cuentas`.

## Archivos principales

- Catálogo: `js/productos.json` y `js/productos-fallback.js`.
- Vistas SPA: `js/spa-views.js`.
- Carrito y pedidos locales: `js/carrito.js`.
- PWA: `manifest.webmanifest`, `sw.js`, `js/pwa.js`.
- Auditorías y lightbox: `js/auditorias.js`.
- Sincronización y sesión: `js/sincronizacion.js`.
- Portal operativo por roles: `js/gestion.js` (`#gestion`).
- Configuración Supabase: `js/supabase-config.js`.
- Esquema SQL de referencia: `schema.sql`.

Los datos dinámicos se insertan como texto con `.text()` o `textContent`. No se renderiza HTML remoto; por ese motivo DOMPurify no se carga como dependencia innecesaria.
