/* =========================================================
   ESPT Competizione — modulos/records.js
   Récords y estadísticas destacadas (index.html).
   Para añadir un récord: una entrada más en calcularRecords().
   ========================================================= */

import { MIN_CARRERAS_POS_MEDIA } from "../core/config.js";
import { mejores, posicionMedia } from "../core/metricas.js";
import { urlPerfil, esc } from "../core/utils.js";

/** Calcula los récords. Sin DOM, para poder probarla aparte. */
export function calcularRecords(pilotos) {
  const activos = pilotos.filter((p) => p.carreras > 0);

  const titulos     = mejores(pilotos, (p) => p.titulos);
  const experiencia = mejores(pilotos, (p) => p.carreras);
  const sinGanar    = mejores(activos.filter((p) => p.victorias === 0), (p) => p.carreras);
  const sinPodio    = mejores(activos.filter((p) => p.podios === 0), (p) => p.carreras);
  const posMedia    = mejores(
    pilotos.filter((p) => p.carreras >= MIN_CARRERAS_POS_MEDIA),
    (p) => posicionMedia(p).valor,
    false
  );

  // ¿Alguno de los récords de posición media es estimado? Para marcarlo con *.
  const posEstimada = posMedia.pilotos.some((p) => posicionMedia(p).estimada);

  return [
    { etiqueta: "Más títulos", res: titulos, unidad: "títulos",
      vacioSi: (r) => !r.valor },
    { etiqueta: "Piloto más experimentado", res: experiencia, unidad: "carreras" },
    { etiqueta: "Más carreras sin ganar", res: sinGanar, unidad: "carreras sin victoria" },
    { etiqueta: "Más carreras sin subir al podio", res: sinPodio, unidad: "carreras sin podio" },
    { etiqueta: `Mejor posición media (mín. ${MIN_CARRERAS_POS_MEDIA} carreras)`,
      res: posMedia, unidad: "de media", dec: 2, sufijo: posEstimada ? "*" : "" }
  ];
}

function tarjeta(rec) {
  const { res } = rec;
  const vacio = !res.pilotos.length || (rec.vacioSi && rec.vacioSi(res));

  if (vacio) {
    return `
      <article class="highlight">
        <p class="highlight__etiqueta">${rec.etiqueta}</p>
        <p class="highlight__piloto highlight__piloto--vacio">Sin datos todavía</p>
      </article>`;
  }

  // Empate: todos los nombres separados por comas.
  const nombres = res.pilotos
    .map((p) => `<a href="${urlPerfil(p)}">${esc(p.nombre)}</a>`)
    .join(", ");

  const cifra = res.valor.toFixed(rec.dec || 0) + (rec.sufijo || "");

  return `
    <article class="highlight">
      <p class="highlight__etiqueta">${rec.etiqueta}</p>
      <p class="highlight__piloto">${nombres}</p>
      <p class="highlight__valor numeros">${cifra}
        <span class="highlight__unidad">${rec.unidad}</span>
      </p>
    </article>`;
}

export function renderRecords(contenedor, pilotos) {
  contenedor.innerHTML = calcularRecords(pilotos).map(tarjeta).join("");
}
