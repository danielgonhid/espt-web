/* =========================================================
   ESPT Competizione — pages/perfil.js
   Ficha individual. Estado desde la URL: perfil.html?piloto=Marc
   Pinta un esqueleto y rellena cada bloque con seccion(): si
   falla el gráfico o el easter egg, las cifras siguen saliendo.
   ========================================================= */

import { cargarDatos } from "../core/data.js";
import { seccion, pintarError, rellenarSelect } from "../core/ui.js";
import { getParam, buscarPiloto, urlPerfil, pct, fmtPct, fmtNum, esc } from "../core/utils.js";
import { posicionMedia, mejorResultado, peorResultado, maximos } from "../core/metricas.js";

/* ---------- Bloques ---------- */

function renderIdentidad(el, piloto) {
  el.innerHTML = `
    <div class="identidad">
      <h1 class="identidad__nombre">${esc(piloto.nombre)}</h1>
      ${piloto.mote ? `<p class="identidad__mote">${esc(piloto.mote)}</p>` : ""}
      <span class="etiqueta-campeonato">Campeonato ${esc(piloto.tipo_campeonato)}</span>
    </div>`;
}

function renderFichas(el, piloto, pmTexto) {
  const fichas = [
    [piloto.carreras, "Carreras"],
    [piloto.titulos, "Títulos"],
    [piloto.victorias, "Victorias"],
    [piloto.podios, "Podios"],
    [piloto.poles, "Poles"],
    [piloto.vmr, "Vueltas rápidas"],
    [piloto.dnf, "DNF"],
    [piloto.dsq, "DSQ"],
    [piloto.dns, "DNS"],
    [fmtPct(pct(piloto.victorias, piloto.carreras)), "Ratio de victoria"],
    [fmtPct(pct(piloto.podios, piloto.carreras)), "Ratio de podio"],
    [pmTexto, "Posición media"]
  ];

  el.innerHTML = `
    <div class="rejilla-datos">
      ${fichas.map(([cifra, etiqueta]) => `
        <div class="dato">
          <span class="dato__cifra numeros">${cifra}</span>
          <span class="dato__etiqueta">${etiqueta}</span>
        </div>`).join("")}
    </div>`;
}

function renderResultados(el, piloto) {
  el.innerHTML = `
    <h2 class="tarjeta__titulo">Mejor y peor resultado</h2>
    <p class="resultado"><span class="dato__etiqueta">Mejor</span>${esc(mejorResultado(piloto))}</p>
    <p class="resultado"><span class="dato__etiqueta">Peor</span>${esc(peorResultado(piloto))}</p>`;
}

function renderQPE(el, piloto) {
  if (!piloto.hasQPE) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <div class="qpe">
      <p class="qpe__titulo">QPE gracias a:</p>
      <p class="qpe__gente">${esc(piloto.qpeThanksTo || "Sin especificar")}</p>
    </div>`;
}

async function renderRadar(el, piloto, pilotos, pmEstimada) {
  el.innerHTML = `
    <h2 class="tarjeta__titulo">Perfil de rendimiento</h2>
    <div class="lienzo-envoltorio">
      <canvas id="grafico-hexagono" height="380" aria-label="Gráfico hexagonal de ${esc(piloto.nombre)}"></canvas>
    </div>
    <p class="nota">
      Cada vértice va de 0 a 100 comparando a ${esc(piloto.nombre)} con el mejor
      registro de la liga. DNF y posición media están invertidos: más lejos
      del centro es mejor.
      ${pmEstimada ? "El asterisco marca la posición media estimada; el CSV original no trae esa columna." : ""}
    </p>`;

  // El canvas ya está en el DOM: solo ahora se carga el módulo y se dibuja.
  const { radarPiloto } = await import("../charts.js");
  await radarPiloto("grafico-hexagono", piloto, maximos(pilotos));
}

/* ---------- Arranque ---------- */

async function init() {
  const zona = document.getElementById("zona-perfil");
  const selector = document.getElementById("selector-piloto");

  let datos;
  try {
    datos = await cargarDatos();
  } catch (err) {
    pintarError(zona, err);
    return;
  }

  const { pilotos } = datos;
  const piloto = buscarPiloto(pilotos, getParam("piloto"));

  // El contenedor es el .campo y no el <select>: un aviso dentro de un select no se ve.
  seccion("selector de piloto", selector?.closest(".campo"), () => {
    rellenarSelect(selector, pilotos, piloto);
    selector.addEventListener("change", (e) => {
      const elegido = pilotos.find((p) => p.id === e.target.value);
      if (elegido) location.href = urlPerfil(elegido);
    });
  });

  if (!piloto) {
    zona.innerHTML = `
      <div class="aviso">
        <p><strong>No hay ningún piloto seleccionado.</strong></p>
        <p>Usa el desplegable de arriba o entra desde la clasificación.
           La URL debe llevar el parámetro, por ejemplo
           <code>perfil.html?piloto=Marc</code>.</p>
      </div>`;
    return;
  }

  document.title = `${piloto.nombre} — ESPT Competizione`;

  const pm = posicionMedia(piloto);
  const pmTexto = pm.valor === null ? "—" : `${fmtNum(pm.valor)}${pm.estimada ? "*" : ""}`;

  // Esqueleto: cada hueco es una sección independiente.
  zona.innerHTML = `
    <div id="p-identidad"></div>
    <div id="p-easter"></div>
    <div class="rejilla-perfil">
      <div>
        <div id="p-fichas"></div>
        <div class="tarjeta tarjeta--separada" id="p-resultados"></div>
        <div id="p-qpe"></div>
      </div>
      <div class="tarjeta" id="p-radar"></div>
    </div>`;

  const $ = (id) => document.getElementById(id);

  seccion("identidad del piloto", $("p-identidad"), (el) => renderIdentidad(el, piloto));

  seccion("easter egg", $("p-easter"), async (el) => {
    const { htmlEasterEgg } = await import("../modulos/easter-eggs.js");
    el.innerHTML = htmlEasterEgg(piloto, datos.easter_eggs);
  });

  seccion("cifras del piloto", $("p-fichas"), (el) => renderFichas(el, piloto, pmTexto));
  seccion("mejor y peor resultado", $("p-resultados"), (el) => renderResultados(el, piloto));
  seccion("QPE", $("p-qpe"), (el) => renderQPE(el, piloto));
  seccion("gráfico de rendimiento", $("p-radar"), (el) => renderRadar(el, piloto, pilotos, pm.estimada));
}

init();
