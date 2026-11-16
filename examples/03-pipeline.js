'use strict';

/**
 * examples/03-pipeline.js
 * ---------------------------------------------------------------
 * Versión moderna usando `stream/promises`:
 * el pipeline se puede manejar con async/await en lugar de callbacks.
 *
 * También muestra cómo generar objetos de forma asíncrona
 * con un `async function*`.
 *
 * Ejecutar:  npm run pipeline
 */

const { Readable, Transform, Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

/* ------------------------------------------------------------
   1. Generador asíncrono: simula una fuente de datos remota
   ------------------------------------------------------------
   Cada `yield` produce un objeto. `Readable.from` lo convierte
   automáticamente en un stream en modo objeto.
   ------------------------------------------------------------ */
async function* userGenerator() {
  const names = ['Ana', 'Luis', 'Marta', 'Carlos', 'Elena'];
  for (let i = 0; i < names.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // simula latencia
    yield {
      id: i + 1,
      name: names[i],
      score: Math.random() * 100,
    };
  }
}

/* ------------------------------------------------------------
   2. Transform: asigna una calificación según la nota
   ------------------------------------------------------------ */
const gradeAssigner = new Transform({
  objectMode: true,
  transform(user, _encoding, callback) {
    const grade = user.score >= 70 ? 'Aprobado' : 'Suspenso';
    callback(null, {
      ...user,
      score: user.score.toFixed(2),
      grade,
    });
  },
});

/* ------------------------------------------------------------
   3. Writable: imprime una línea formateada
   ------------------------------------------------------------ */
const tablePrinter = new Writable({
  objectMode: true,
  write(user, _encoding, callback) {
    console.log(
      `${user.name.padEnd(8)} → nota ${user.score.padStart(6)}  (${user.grade})`
    );
    callback();
  },
});

/* ------------------------------------------------------------
   4. Ejecutar con async/await
   ------------------------------------------------------------ */
(async () => {
  console.log('Procesando usuarios…\n');
  try {
    await pipeline(
      Readable.from(userGenerator()),
      gradeAssigner,
      tablePrinter
    );
    console.log('\n✔ Pipeline completado sin errores.');
  } catch (error) {
    console.error('\n❌ Error en el pipeline:', error);
    process.exitCode = 1;
  }
})();
