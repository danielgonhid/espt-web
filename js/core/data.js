/* =========================================================
   ESPT Competizione — core/data.js
   Único punto de la web que lee data.json. Si algún día cambia
   el formato del JSON (por ejemplo, resultados carrera a carrera),
   la adaptación se hace aquí y el resto de la web no se entera.
   ========================================================= */

import { RUTA_DATOS } from "./config.js";

// Se guarda la PROMESA, no el resultado: la cabecera y la página piden los
// datos casi a la vez y así comparten una sola descarga en vez de hacer dos.
let promesa = null;

async function descargar() {
  if (location.protocol === "file:") {
    throw new Error(
      "Estás abriendo la web con doble clic (file://). El navegador no deja " +
      "leer data.json ni cargar módulos así. Ábrela con Live Server o cualquier servidor local."
    );
  }

  // no-store: tras subir un data.json nuevo, nadie ve la versión antigua en caché.
  const res = await fetch(RUTA_DATOS, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo leer ${RUTA_DATOS} (HTTP ${res.status}).`);

  const json = await res.json();
  const datos = Array.isArray(json) ? { meta: {}, pilotos: json } : json;   // acepta las dos formas

  if (!Array.isArray(datos.pilotos)) {
    throw new Error(`${RUTA_DATOS} no tiene una lista "pilotos".`);
  }
  return datos;
}

export function cargarDatos() {
  promesa ??= descargar().catch((err) => {
    promesa = null;   // si falló, el siguiente intento vuelve a descargar
    throw err;
  });
  return promesa;
}
