/* =========================================================
   ESPT Competizione — core/data.js
   Único punto de la web que lee data.json. Si algún día cambia
   el formato del JSON (por ejemplo, resultados carrera a carrera),
   la adaptación se hace aquí y el resto de la web no se entera.
   ========================================================= */

import { RUTA_DATOS } from "./config.js";

let cache = null;

export async function cargarDatos() {
  if (cache) return cache;

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
  cache = Array.isArray(json) ? { meta: {}, pilotos: json } : json;   // acepta las dos formas

  if (!Array.isArray(cache.pilotos)) {
    throw new Error(`${RUTA_DATOS} no tiene una lista "pilotos".`);
  }
  return cache;
}
