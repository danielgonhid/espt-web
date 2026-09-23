/* =========================================================
   ESPT Competizione — modulos/easter-eggs.js
   Solo el PINTADO. El contenido (lore de la liga) vive en
   data.json, bloque "easter_eggs", con el id del piloto como clave:

     "easter_eggs": {
       "paula": { "titulo": "…", "texto": "…" }
     }

   Para añadir uno nuevo no se toca JS: una entrada más en el JSON.
   ========================================================= */

import { esc } from "../core/utils.js";

/** HTML del easter egg del piloto, o "" si no tiene. */
export function htmlEasterEgg(piloto, easterEggs = {}) {
  const huevo = easterEggs[piloto.id];
  if (!huevo || !huevo.titulo) return "";
  return `
    <aside class="easter-egg" role="note">
      <p class="easter-egg__etiqueta">Easter egg</p>
      <p class="easter-egg__titulo">${esc(huevo.titulo)}</p>
      ${huevo.texto ? `<p class="easter-egg__texto">${esc(huevo.texto)}</p>` : ""}
    </aside>`;
}
