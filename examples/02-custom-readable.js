'use strict';

/**
 * examples/02-custom-readable.js
 * ---------------------------------------------------------------
 * Demuestra cómo crear un Readable personalizado implementando
 * el método `_read()`, y cómo el backpressure se gestiona
 * automáticamente cuando el consumidor es más lento.
 *
 * Ejecutar:  npm run custom
 */

const { Readable, Writable, pipeline } = require('node:stream');

/* ------------------------------------------------------------
   1. Readable personalizado: genera cuadrados 1², 2², 3², …
   ------------------------------------------------------------
   Cada vez que el consumidor está listo para más datos,
   Node llama a `_read()`. Ahí empujamos un objeto con
   `this.push(obj)`. Cuando terminamos, `this.push(null)`.
   ------------------------------------------------------------ */
class SquaresStream extends Readable {
  constructor(max, options = {}) {
    super({ ...options, objectMode: true });
    this._max = max;
    this._current = 0;
  }

  _read() {
    if (this._current >= this._max) {
      this.push(null); // señal de fin de stream (EOF)
      return;
    }
    this._current += 1;
    this.push({
      index: this._current,
      square: this._current ** 2,
      generatedAt: Date.now(),
    });
  }
}

/* ------------------------------------------------------------
   2. Writable lento (200 ms por chunk) para forzar backpressure
   ------------------------------------------------------------
   `highWaterMark: 1` significa que el buffer interno del
   Writable solo acepta 1 objeto antes de pedir al Readable
   que se pause. La tubería se autorregula.
   ------------------------------------------------------------ */
const slowPrinter = new Writable({
  objectMode: true,
  highWaterMark: 1,
  write(chunk, _encoding, callback) {
    console.log(
      `[${String(chunk.index).padStart(2, '0')}]` +
      ` ${chunk.index}² = ${String(chunk.square).padStart(4, ' ')}`
    );
    setTimeout(callback, 200); // simula trabajo lento
  },
});

/* ------------------------------------------------------------
   3. Ejecutar
   ------------------------------------------------------------ */
console.log('Generando 10 cuadrados con un consumidor lento…\n');

pipeline(new SquaresStream(10), slowPrinter, (error) => {
  if (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  } else {
    console.log('\n✔ Secuencia completada.');
  }
});
