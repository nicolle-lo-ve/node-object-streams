'use strict';

/**
 * index.js — Ejemplo básico de streams de objetos en Node.js
 * ---------------------------------------------------------------
 * Cadena de procesamiento:
 *   Readable (emite usuarios)
 *     → Transform (filtra activos y añade marca de tiempo)
 *       → Writable (imprime por consola)
 *
 * La clave está en la opción `objectMode: true`, que permite
 * que cada "chunk" sea un objeto JavaScript en lugar de un Buffer.
 * ---------------------------------------------------------------
 * Ejecutar:  node index.js   (o  npm start)
 */

const { Readable, Transform, Writable, pipeline } = require('node:stream');

/* ------------------------------------------------------------
   1. Datos de entrada (array de objetos)
   ------------------------------------------------------------ */
const users = [
  { id: 1, name: 'Alice',   active: true,  role: 'admin'  },
  { id: 2, name: 'Bob',     active: false, role: 'user'   },
  { id: 3, name: 'Charlie', active: true,  role: 'user'   },
  { id: 4, name: 'Diana',   active: true,  role: 'editor' },
  { id: 5, name: 'Eve',     active: false, role: 'user'   },
];

/* ------------------------------------------------------------
   2. Readable — Emite un objeto por cada usuario
   ------------------------------------------------------------
   `Readable.from(iterable)` convierte cualquier iterable
   (array, Set, async iterator…) en un Readable en modo objeto.
   ------------------------------------------------------------ */
const source = Readable.from(users);

/* ------------------------------------------------------------
   3. Transform — Filtra activos y enriquece el objeto
   ------------------------------------------------------------
   `objectMode: true` permite recibir/emitir objetos.
   - cb(null, obj)  → emite el objeto transformado
   - cb()           → descarta el chunk (no emite nada)
   - cb(error)      → propaga un error por el pipeline
   ------------------------------------------------------------ */
const filterActive = new Transform({
  objectMode: true,
  transform(user, _encoding, callback) {
    if (user.active) {
      callback(null, {
        ...user,
        processedAt: new Date().toISOString(),
      });
    } else {
      callback(); // descarta usuarios inactivos
    }
  },
});

/* ------------------------------------------------------------
   4. Writable — Consume los objetos finales
   ------------------------------------------------------------ */
const sink = new Writable({
  objectMode: true,
  write(user, _encoding, callback) {
    console.log('✅ Usuario activo:', user);
    callback(); // notifica que terminó de procesar este chunk
  },
});

/* ------------------------------------------------------------
   5. Conectar todo con pipeline (gestión robusta de errores)
   ------------------------------------------------------------
   `pipeline` destruye todos los streams si alguno falla,
   evitando fugas de memoria.
   ------------------------------------------------------------ */
pipeline(source, filterActive, sink, (error) => {
  if (error) {
    console.error('❌ Error en el pipeline:', error);
    process.exitCode = 1;
  } else {
    console.log('\n✔ Procesamiento completado.');
  }
});
