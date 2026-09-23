/* =========================================================
   ESPT Competizione — modulos/norma-antidani.js
   Aviso de la norma anti-Dani en la ficha del piloto (perfil.html).
   Solo se pinta si el piloto tiene algo anulado; para el resto de
   pilotos la función devuelve "" y la sección desaparece sin dejar
   hueco (igual que easter-eggs.js).

   Los campos que lee vienen de data.json:
     victorias_anuladas, poles_anuladas, vmr_anuladas
   Si un día otro piloto además de Dani cae bajo la norma, esto
   funciona igual sin tocar código: solo hay que rellenar sus campos
   en el JSON.
   ========================================================= */

import { esc } from "../core/utils.js";

function frase(cantidad, singular, plural) {
  if (!cantidad) return null;
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** HTML del aviso, o "" si el piloto no tiene nada anulado. */
export function htmlNormaAntiDani(piloto) {
  const v = piloto.victorias_anuladas || 0;
  const p = piloto.poles_anuladas || 0;
  const vm = piloto.vmr_anuladas || 0;

  if (!v && !p && !vm) return "";

  const partes = [
    frase(v, "victoria", "victorias"),
    frase(p, "pole", "poles"),
    frase(vm, "vuelta rápida", "vueltas rápidas")
  ].filter(Boolean).join(", ");

  return `
    <aside class="norma-antidani" role="note">
      <p class="norma-antidani__etiqueta">Norma anti-Dani</p>
      <p class="norma-antidani__texto">
        Desde la Season 8, ${esc(piloto.nombre)} sigue sumando victorias,
        poles y vueltas rápidas en pista —de hecho ya lleva ${partes}—
        pero no cuentan para el campeonato en el que compite: técnicamente,
        no son válidas. A partir de ahora corre solo por el placer de
        ganar… o por <strong>Jane Doe</strong>, que ya es lo único que
        le queda.
      </p>
    </aside>`;
}
