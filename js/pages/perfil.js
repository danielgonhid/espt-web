/* =========================================================
   ESPT Competizione — pages/perfil.js
   Ficha individual. Estado desde la URL: perfil.html?piloto=Marc
   Pinta un esqueleto y rellena cada bloque con seccion(): si
   falla el gráfico o el easter egg, las cifras siguen saliendo.

   Sin piloto en la URL (es adonde lleva "Perfiles" en el menú)
   se pinta el directorio: la lista de todos los pilotos.
   ========================================================= */

import { cargarDatos } from "../core/data.js";
import { seccion, pintarError, rellenarSelect } from "../core/ui.js";
import { getParam, buscarPiloto, urlPerfil, pct, fmtPct, fmtNum, plural, esc, normalizar } from "../core/utils.js";
import { posicionMedia, mejorResultado, peorResultado, maximos } from "../core/metricas.js";

/* ---------- Bloques de la ficha ---------- */

function renderIdentidad(el, piloto) {
  // Resumen en una línea: los títulos (si tiene) van destacados en oro.
  const partes = [];
  if (piloto.titulos) partes.push(`<strong>${plural(piloto.titulos, "título", "títulos")}</strong>`);
  partes.push(plural(piloto.carreras, "carrera", "carreras"));
  if (piloto.victorias) partes.push(plural(piloto.victorias, "victoria", "victorias"));

  el.innerHTML = `
    <div class="identidad">
      <h1 class="identidad__nombre">${esc(piloto.nombre)}</h1>
      ${piloto.mote ? `<p class="identidad__mote">${esc(piloto.mote)}</p>` : ""}
      <p class="identidad__resumen numeros">${partes.join(" · ")}</p>
    </div>`;
}

/** Una cifra con su rótulo. `extra`: { clase, barra } (barra = porcentaje 0-100). */
function ficha(cifra, etiqueta, extra = {}) {
  const barra = Number.isFinite(extra.barra)
    ? `<span class="dato__barra" style="--p:${extra.barra.toFixed(1)}" aria-hidden="true"></span>`
    : "";
  return `
    <div class="dato">
      <span class="dato__cifra numeros ${extra.clase || ""}">${cifra}</span>
      <span class="etiqueta">${etiqueta}</span>
      ${barra}
    </div>`;
}

function renderFichas(el, piloto, pmTexto) {
  const cero = (v) => (v ? "" : "dato__cifra--cero");
  const pctVict = pct(piloto.victorias, piloto.carreras);
  const pctPodio = pct(piloto.podios, piloto.carreras);

  el.innerHTML = `
    <section class="grupo-datos" aria-labelledby="titulo-palmares">
      <h2 class="titulo-seccion" id="titulo-palmares">Palmarés</h2>
      <div class="rejilla-datos">
        ${ficha(piloto.carreras, "Carreras", { clase: cero(piloto.carreras) })}
        ${ficha(piloto.titulos, "Títulos", { clase: piloto.titulos ? "dato__cifra--oro" : "dato__cifra--cero" })}
        ${ficha(piloto.victorias, "Victorias", { clase: cero(piloto.victorias) })}
        ${ficha(piloto.podios, "Podios", { clase: cero(piloto.podios) })}
        ${ficha(piloto.poles, "Poles", { clase: cero(piloto.poles) })}
        ${ficha(piloto.vmr, "Vueltas rápidas", { clase: cero(piloto.vmr) })}
      </div>
    </section>

    <section class="grupo-datos" aria-labelledby="titulo-ratios">
      <h2 class="titulo-seccion" id="titulo-ratios">Ratios e incidencias</h2>
      <div class="rejilla-datos">
        ${ficha(fmtPct(pctVict), "Ratio de victoria", { barra: pctVict })}
        ${ficha(fmtPct(pctPodio), "Ratio de podio", { barra: pctPodio })}
        ${ficha(pmTexto, "Posición media")}
        ${ficha(piloto.dnf, "Abandonos (DNF)", { clase: cero(piloto.dnf) })}
        ${ficha(piloto.dsq, "Descalificaciones (DSQ)", { clase: cero(piloto.dsq) })}
        ${ficha(piloto.dns, "No salió (DNS)", { clase: cero(piloto.dns) })}
      </div>
    </section>`;
}

function renderResultados(el, piloto) {
  el.innerHTML = `
    <h2 class="tarjeta__titulo">Mejor y peor resultado</h2>
    <dl class="resultados">
      <dt class="etiqueta">Mejor</dt><dd>${esc(mejorResultado(piloto))}</dd>
      <dt class="etiqueta">Peor</dt><dd>${esc(peorResultado(piloto))}</dd>
    </dl>`;
}

function renderQPE(el, piloto) {
  if (!piloto.hasQPE) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <div class="qpe">
      <p class="qpe__titulo etiqueta">QPE gracias a</p>
      <p class="qpe__gente">${esc(piloto.qpeThanksTo || "Sin especificar")}</p>
    </div>`;
}

async function renderRadar(el, piloto, pilotos, pmEstimada) {
  // role="img" + aria-label: un lector de pantalla anuncia el gráfico como una imagen descrita.
  el.innerHTML = `
    <h2 class="tarjeta__titulo">Perfil de rendimiento</h2>
    <div class="lienzo-envoltorio">
      <canvas id="grafico-hexagono" role="img"
              aria-label="Gráfico de seis ejes que compara a ${esc(piloto.nombre)} con el mejor registro de la liga"></canvas>
    </div>
    <p class="nota">
      Cada eje va de 0 a 100 y compara a ${esc(piloto.nombre)} con el mejor
      registro de la liga. En fiabilidad y posición media, más lejos del centro
      es mejor.
      ${pmEstimada ? "La posición media es una estimación: los datos de origen no traen esa columna." : ""}
    </p>`;

  // El canvas ya está en el DOM: solo ahora se carga el módulo y se dibuja.
  const { radarPiloto } = await import("../charts.js");
  await radarPiloto("grafico-hexagono", piloto, maximos(pilotos));
}

/* ---------- Directorio (sin piloto elegido) ---------- */

function renderDirectorio(zona, pilotos, aviso = "") {
  const orden = [...pilotos].sort((a, b) =>
    b.carreras - a.carreras || normalizar(a.nombre).localeCompare(normalizar(b.nombre)));

  const elementos = orden.map((p) => {
    const titulos = p.titulos
      ? `<span class="directorio__titulos">${plural(p.titulos, "título", "títulos")}</span> · `
      : "";
    return `
      <li>
        <a class="directorio__enlace" href="${urlPerfil(p)}">
          <span class="directorio__nombre">${esc(p.nombre)}</span>
          <span class="directorio__cifra numeros">${titulos}${plural(p.carreras, "carrera", "carreras")}</span>
        </a>
      </li>`;
  }).join("");

  zona.innerHTML = `
    ${aviso}
    <h1 class="titulo-vista">Perfiles de piloto</h1>
    <p class="subtitulo-vista">
      ${plural(pilotos.length, "piloto ha corrido", "pilotos han corrido")} en la liga.
      Elige uno para ver su ficha.
    </p>
    <ul class="directorio">${elementos}</ul>`;
}

/* ---------- Arranque ---------- */

async function init() {
  const zona = document.getElementById("zona-perfil");
  const selector = document.getElementById("selector-piloto");
  const enlaceComparar = document.getElementById("enlace-comparar");

  let datos;
  try {
    datos = await cargarDatos();
  } catch (err) {
    pintarError(zona, err);
    return;
  }

  const { pilotos } = datos;
  const referencia = getParam("piloto");
  const piloto = buscarPiloto(pilotos, referencia);

  // El contenedor es el .campo y no el <select>: un aviso dentro de un select no se ve.
  seccion("selector de piloto", selector?.closest(".campo"), () => {
    rellenarSelect(selector, pilotos, piloto);
    selector.addEventListener("change", (e) => {
      const elegido = pilotos.find((p) => p.id === e.target.value);
      if (elegido) location.href = urlPerfil(elegido);
    });
  });

  if (!piloto) {
    // Con un nombre en la URL que no existe se avisa; sin nombre, solo el directorio.
    const aviso = referencia
      ? `<div class="aviso aviso--seccion" role="alert" style="margin-bottom: var(--e-4)">
           <p><strong>No hay ningún piloto llamado «${esc(referencia)}».</strong></p>
           <p>Búscalo en la lista de abajo.</p>
         </div>`
      : "";
    seccion("directorio de pilotos", zona, (el) => renderDirectorio(el, pilotos, aviso));
    return;
  }

  document.title = `${piloto.nombre} — ESPT Competizione`;

  if (enlaceComparar) {
    enlaceComparar.href = `cara-a-cara.html?a=${encodeURIComponent(piloto.nombre)}`;
    enlaceComparar.classList.remove("oculto");
  }

  const pm = posicionMedia(piloto);
  const pmTexto = pm.valor === null ? "—" : `${fmtNum(pm.valor)}${pm.estimada ? "*" : ""}`;

  // Esqueleto: cada hueco es una sección independiente.
  zona.innerHTML = `
    <div id="p-identidad"></div>
    <div id="p-easter"></div>
    <div id="p-norma"></div>
    <div class="rejilla-perfil">
      <div>
        <div id="p-fichas"></div>
        <section class="tarjeta tarjeta--separada" id="p-resultados"></section>
        <div id="p-qpe"></div>
      </div>
      <section class="tarjeta" id="p-radar"></section>
    </div>`;

  const $ = (id) => document.getElementById(id);

  seccion("identidad del piloto", $("p-identidad"), (el) => renderIdentidad(el, piloto));

  seccion("easter egg", $("p-easter"), async (el) => {
    const { htmlEasterEgg } = await import("../modulos/easter-eggs.js");
    el.innerHTML = htmlEasterEgg(piloto, datos.easter_eggs);
  });

  // Norma anti-Dani: la sección se pinta vacía sola si el piloto no tiene
  // nada anulado (htmlNormaAntiDani devuelve "" en ese caso).
  seccion("norma anti-Dani", $("p-norma"), async (el) => {
    const { htmlNormaAntiDani } = await import("../modulos/norma-antidani.js");
    el.innerHTML = htmlNormaAntiDani(piloto);
  });

  seccion("cifras del piloto", $("p-fichas"), (el) => renderFichas(el, piloto, pmTexto));
  seccion("mejor y peor resultado", $("p-resultados"), (el) => renderResultados(el, piloto));
  seccion("QPE", $("p-qpe"), (el) => renderQPE(el, piloto));
  seccion("gráfico de rendimiento", $("p-radar"), (el) => renderRadar(el, piloto, pilotos, pm.estimada));
}

init();
