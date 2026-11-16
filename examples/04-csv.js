'use strict';

/**
 * examples/04-csv.js
 * ---------------------------------------------------------------
 * Ejemplo práctico: lee un archivo CSV línea a línea, convierte
 * cada línea en un objeto JavaScript, filtra los usuarios activos
 * y los imprime por consola.
 *
 * Cadena:
 *   fs.ReadStream (strings)
 *     → readline (líneas)
 *       → Readable.from() (stream)
 *         → Transform: parsea CSV → objeto
 *           → Transform: filtra activos
 *             → Writable: imprime
 *
 * Ejecutar:  npm run csv
 */

const { createReadStream } = require('node:fs');
const { Transform, Writable, Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const readline = require('node:readline');
const path = require('node:path');

const CSV_PATH = path.join(__dirname, '..', 'data', 'users.csv');

/* ------------------------------------------------------------
   1. Transform: línea CSV → objeto
   ------------------------------------------------------------
   La cabecera se salta con un flag en el primer chunk.
   ------------------------------------------------------------ */
let isFirstLine = true;

const parseCsvLine = new Transform({
  objectMode: true,
  transform(line, _encoding, callback) {
    // Saltar cabecera
    if (isFirstLine) {
      isFirstLine = false;
      return callback();
    }
    // Saltar líneas vacías
    if (!line.trim()) {
      return callback();
    }

    const [id, name, age, active] = line.split(',');
    callback(null, {
      id: Number(id),
      name,
      age: Number(age),
      active: active === 'true',
    });
  },
});

/* ------------------------------------------------------------
   2. Transform: filtra solo activos
   ------------------------------------------------------------ */
const filterActive = new Transform({
  objectMode: true,
  transform(user, _encoding, callback) {
    if (user.active) callback(null, user);
    else callback();
  },
});

/* ------------------------------------------------------------
   3. Writable: imprime
   ------------------------------------------------------------ */
const printer = new Writable({
  objectMode: true,
  write(user, _encoding, callback) {
    console.log(`✅ ${user.name} (${user.age} años)`);
    callback();
  },
});

/* ------------------------------------------------------------
   4. Ejecutar
   ------------------------------------------------------------ */
(async () => {
  try {
    // fs.ReadStream → readline.createInterface
    const fileStream = createReadStream(CSV_PATH, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // maneja \r\n de Windows correctamente
    });

    console.log(`Leyendo ${path.basename(CSV_PATH)}…\n`);

    await pipeline(
      // readline es un async iterator → lo convertimos en Readable
      Readable.from(rl),
      parseCsvLine,
      filterActive,
      printer
    );

    console.log('\n✔ Archivo procesado correctamente.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  }
})();
