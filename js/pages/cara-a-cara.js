/* =========================================================
   ESPT Competizione — pages/cara-a-cara.js
   Comparador H2H. Estado desde la URL: cara-a-cara.html?a=Marc&b=Dani
   Tres secciones independientes: tabla comparativa, gráfico y
   duelo más igualado. Si una falla, las otras siguen.
   ========================================================= */

import { MIN_CARRERAS_H2H } from "../core/config.js";
import { cargarDatos } from "../core/data.js";
import { seccion, pintarError, rellenarSelect } from "../core/ui.js";
import { getParam, buscarPiloto, urlPerfil, urlH2H, pct, esc } from "../core/utils.js";
import { posicionMedia, maximos, parMasIgualado } from "../core/metricas.js";

const METRICAS_H2H = [
  { etiqueta: "Carreras",        get: (p) => p.carreras,                   mayorMejor: true,  dec: 0 },
  { etiqueta: "Títulos",         get: (p) => p.titulos,                    mayorMejor: true,  dec: 0 },
  { etiqueta: "Victorias",       get: (p) => p.victorias,                  mayorMejor: true,  dec: 0 },
  { etiqueta: "Podios",          get: (p) => p.podios,                     mayorMejor: true,  dec: 0 },
  { etiqueta: "Poles",           get: (p) => p.poles,                      mayorMejor: true,  dec: 0 },
  { etiqueta: "Vueltas rápidas", get: (p) => p.vmr,                        mayorMejor: true,  dec: 0 },
  { etiqueta: "DNF",             get: (p) => p.dnf,                        mayorMejor: false, dec: 0 },
  { etiqueta: "DSQ",             get: (p) => p.dsq,                        mayorMejor: false, dec: 0 },
  { etiqueta: "% Victorias",     get: (p) => pct(p.victorias, p.carreras), mayorMejor: true,  dec: 1, sufijo: "%" },
  { etiqueta: "% Podios",        get: (p) => pct(p.podios, p.carreras),    mayorMejor: true,  dec: 1, sufijo: "%" },
  { etiqueta: "% Poles",         get: (p) => pct(p.poles, p.carreras),     mayorMejor: true,  dec: 1, sufijo: "%" },
  { etiqueta: "Posición media",  get: (p) => posicionMedia(p).valor,       mayorMejor: false, dec: 2 }
];

/* ---------- Bloques ---------- */

function filaMetrica(m, a, b) {
  const va = m.get(a), vb = m.get(b);
  // Si a alguno le falta el dato no se declara ganador: se muestra —
  const comparable = Number.isFinite(va) && Number.isFinite(vb);
  const iguales = comparable && Math.abs(va - vb) < 1e-9;
  const ganaA = comparable && !iguales && (m.mayorMejor ? va > vb : va < vb);
  const ganaB = comparable && !iguales && !ganaA;
  const clase = (gana) => (gana ? "h2h-gana" : iguales ? "h2h-empate" : "");
  const fmt = (v) => (Number.isFinite(v) ? `${v.toFixed(m.dec)}${m.sufijo || ""}` : "—");
  return `
    <tr>
      <td class="numeros ${clase(ganaA)}">${fmt(va)}</td>
      <th scope="row">${m.etiqueta}</th>
      <td class="numeros ${clase(ganaB)}">${fmt(vb)}</td>
    </tr>`;
}

async function renderComparativa(zona, a, b, pilotos) {
  if (!a || !b) {
    zona.innerHTML = `<p class="cargando">Elige dos pilotos para comparar.</p>`;
    return;
  }
  if (a.id === b.id) {
    zona.innerHTML = `<div class="aviso">Has elegido al mismo piloto en los dos lados.
      Cambia uno para ver la comparativa.</div>`;
    return;
  }

  zona.innerHTML = `
    <div class="h2h-cabeceras">
      <h2 class="h2h-nombre"><a href="${urlPerfil(a)}">${esc(a.nombre)}</a></h2>
      <span class="h2h-vs">vs</span>
      <h2 class="h2h-nombre h2h-nombre--b"><a href="${urlPerfil(b)}">${esc(b.nombre)}</a></h2>
    </div>

    <div class="tarjeta">
      <table class="h2h-tabla">
        <caption class="h2h-leyenda">
          En verde, quién gana cada métrica. En DNF, DSQ y posición media gana el número más bajo.
        </caption>
        <tbody>${METRICAS_H2H.map((m) => filaMetrica(m, a, b)).join("")}</tbody>
      </table>
    </div>

    <div class="tarjeta tarjeta--separada" id="h2h-radar"></div>`;

  // El gráfico es su propia sección: si falla, la tabla de arriba se queda.
  await seccion("gráfico comparativo", document.getElementById("h2h-radar"), async (el) => {
    el.innerHTML = `
      <h2 class="tarjeta__titulo">Comparativa visual</h2>
      <div class="lienzo-envoltorio">
        <canvas id="grafico-h2h" height="420" aria-label="Comparativa de ${esc(a.nombre)} y ${esc(b.nombre)}"></canvas>
      </div>`;
    const { radarComparativo } = await import("../charts.js");
    await radarComparativo("grafico-h2h", a, b, maximos(pilotos));
  });
}

function renderIgualado(el, pilotos) {
  const par = parMasIgualado(pilotos);
  if (!par) {
    el.innerHTML = `<p class="cargando">No hay pilotos suficientes con
      ${MIN_CARRERAS_H2H} carreras o más para calcularlo.</p>`;
    return;
  }
  el.innerHTML = `
    <p class="igualado__frase">
      El Cara a Cara más igualado de la liga es
      <strong>${esc(par.a.nombre)}</strong> vs <strong>${esc(par.b.nombre)}</strong>.
    </p>
    <p class="nota">
      Distancia entre sus perfiles: ${par.distancia.toFixed(4)} (0 sería idéntico).
      Se comparan ratios de victoria, podio, pole y vuelta rápida más el volumen
      de carreras, entre los pilotos con al menos ${MIN_CARRERAS_H2H} participaciones.
      <a href="${urlH2H(par.a, par.b)}">Ver este duelo</a>
    </p>`;
}

/* ---------- Arranque ---------- */

async function init() {
  const zona = document.getElementById("zona-h2h");
  const zonaIgualado = document.getElementById("zona-igualado");
  const selA = document.getElementById("piloto-a");
  const selB = document.getElementById("piloto-b");

  let datos;
  try {
    datos = await cargarDatos();
  } catch (err) {
    pintarError(zona, err);
    if (zonaIgualado) zonaIgualado.innerHTML = "";
    return;
  }

  const { pilotos } = datos;

  const comparar = () => {
    const a = pilotos.find((p) => p.id === selA.value);
    const b = pilotos.find((p) => p.id === selB.value);
    return seccion("comparativa", zona, (el) => renderComparativa(el, a, b, pilotos));
  };

  // El contenedor es .controles y no los <select>: un aviso dentro de un select no se ve.
  const selectoresOk = await seccion("selectores de piloto", selA?.closest(".controles"), () => {
    // Estado inicial desde la URL; si no viene, los dos primeros de la lista.
    const inicialA = buscarPiloto(pilotos, getParam("a")) || pilotos[0];
    const inicialB = buscarPiloto(pilotos, getParam("b")) || pilotos[1];
    rellenarSelect(selA, pilotos, inicialA);
    rellenarSelect(selB, pilotos, inicialB);
    selA.addEventListener("change", comparar);
    selB.addEventListener("change", comparar);
  });

  if (selectoresOk) comparar();
  else zona.innerHTML = "";

  seccion("duelo más igualado", zonaIgualado, (el) => renderIgualado(el, pilotos));
}

init();
