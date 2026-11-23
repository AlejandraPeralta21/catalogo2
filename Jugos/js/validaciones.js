const Validaciones = {
  reglas: {
    nombre: v => v.trim().length >= 3 ? '' : 'Escribe tu nombre completo (mínimo 3 caracteres).',
    celular: v => /^\d{8}$/.test(v) ? '' : 'El celular debe tener exactamente 8 dígitos.',
    correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.',
    producto: v => v ? '' : 'Elige un producto.',
    tamano: v => v ? '' : 'Elige un tamaño.',
    cantidad: v => /^\d+$/.test(v) && +v >= 1 && +v <= 20 ? '' : 'Ingresa un número entero entre 1 y 20.',
    entrega: v => v ? '' : 'Elige cómo quieres recibir tu pedido.',
    direccion: (v, c) => c.entrega === 'domicilio' && v.trim().length < 5 ? 'Escribe la dirección de entrega.' : '',
    obs: v => v.length > 250 ? 'Máximo 250 caracteres.' : ''
  },
  campo(k, v, ctx) { return this.reglas[k](v, ctx); },
  todo(vals) { const e = {}; Object.keys(this.reglas).forEach(k => { const m = this.campo(k, vals[k], vals); if (m) e[k] = m; }); return e; }
};
