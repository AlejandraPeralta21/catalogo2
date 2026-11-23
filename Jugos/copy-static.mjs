import { cp, mkdir } from 'node:fs/promises';

const carpetas = ['img', 'css', 'js'];
const archivos = ['sw.js', 'manifest.webmanifest', 'offline.html', 'menu.html', 'promociones.html', 'nosotros.html', 'pedido.html'];
await mkdir('dist', { recursive: true });
for (const carpeta of carpetas) await cp(carpeta, `dist/${carpeta}`, { recursive: true, force: true });
for (const archivo of archivos) await cp(archivo, `dist/${archivo}`, { force: true });
console.log('Recursos estáticos y Service Worker copiados a dist/.');
