/* =========================================================
   ESPT Competizione — pages/cara-a-cara.js
   Comparador H2H. Estado desde la URL: cara-a-cara.html?a=Marc&b=Dani
   Tres secciones independientes: tabla comparativa, gráfico y
   duelo más igualado. Si una falla, las otras siguen.

   Al cambiar un piloto en los desplegables la URL se actualiza
   sola, así que lo que se ve siempre se puede compartir copiando
   la dirección.
   ========================================================= */

import { MIN_CARRERAS_H2H } from "../core/config.js";
import { cargarDatos } from "../core/data.js";
import { seccion, pintarError, rellenarSelect } from "../core/ui.js";
import { getParam, buscarPiloto, urlPerfil, urlH2H, pct, fmtNum, plural, esc } from "../core/utils.js";
import { posicionMedia, maximos, parMasIgualado } from "../core/metricas.js";

const TITULO_PAGINA = "Cara a cara — ESPT Competizione";

const METRICAS_H2H = [
  { etiqueta: "Carreras",        get: (p) => p.carreras,                   mayorMejor: true,  dec: 0 },
  { etiqueta: "Títulos",         get: (p) => p.titulos,                    mayorMejor: true,  dec: 0 },
  { etiqueta: "Victorias",       get: (p) => p.victorias,                  mayorMejor: true,  dec: 0 },
  { etiqueta: "Podios",          get: (p) => p.podios,                     mayorMejor: true,  dec: 0 },
  { etiqueta: "Poles",           get: (p) => p.poles,                      mayorMejor: true,  dec: 0 },
  { etiqueta: "Vueltas rápidas", get: (p) => p.vmr,                        mayorMejor: true,  dec: 0 },
  { etiqueta: "DNF",             get: (p) => p.dnf,                        mayorMejor: false, dec: 0 },
  { etiqueta: "DSQ",             get: (p) => p.dsq,                        mayorMejor: false, dec: 0 },
  { etiqueta: "% Victorias",     get: (p) => pct(p.victorias, p.carreras), mayorMejor: true,  dec: 1, sufijo: " %" },
  { etiqueta: "% Podios",        get: (p) => pct(p.podios, p.carreras),    mayorMejor: true,  dec: 1, sufijo: " %" },
  { etiqueta: "% Poles",         get: (p) => pct(p.poles, p.carreras),     mayorMejor: true,  dec: 1, sufijo: " %" },
  { etiqueta: "Posición media",  get: (p) => posicionMedia(p).valor,       mayorMejor: false, dec: 2 }
];

/* ---------- Bloques ---------- */

/**
 * Compara una métrica. Devuelve el HTML de la fila y quién la gana
 * ("a", "b", "empate" o null si a alguno le falta el dato).
 */
function compararMetrica(m, a, b) {
  const va = m.get(a), vb = m.get(b);
  // Si a alguno le falta el dato no se declara ganador: se muestra —
  const comparable = Number.isFinite(va) && Number.isFinite(vb);
  const iguales = comparable && Math.abs(va - vb) < 1e-9;
  const ganaA = comparable && !iguales && (m.mayorMejor ? va > vb : va < vb);
  const ganaB = comparable && !iguales && !ganaA;
  const resultado = !comparable ? null : iguales ? "empate" : ganaA ? "a" : "b";

  // Largo de cada barra: la del ganador va entera y la del otro, en proporción.
  // Donde gana la cifra más baja (DNF, posición media) la proporción se invierte,
  // para que la barra más larga sea siempre la de quien gana la métrica.
  const alto = comparable ? Math.max(va, vb) : 0;
  const bajo = comparable ? Math.min(va, vb) : 0;
  const proporcion = (v) => {
    if (!comparable) return 0;
    if (iguales) return 1;
    const p = m.mayorMejor ? v / alto : (v > 0 ? bajo / v : 1);
    return Math.max(0, Math.min(1, p)).toFixed(3);
  };

  const fmt = (v) => (Number.isFinite(v) ? `${fmtNum(v, m.dec)}${m.sufijo || ""}` : "—");
  const celda = (v, lado, gana) => `
      <td class="h2h-valor h2h-valor--${lado} numeros ${gana ? "h2h-gana" : iguales ? "h2h-empate" : ""}" style="--p:${proporcion(v)}">
        <span class="h2h-barra" aria-hidden="true"></span>${fmt(v)}${gana ? '<span class="solo-lector"> (gana)</span>' : ""}
      </td>`;

  const html = `
    <tr>${celda(va, "a", ganaA)}
      <th class="etiqueta" scope="row">${m.etiqueta}</th>${celda(vb, "b", ganaB)}
    </tr>`;

  return { html, resultado };
}

async function renderComparativa(zona, a, b, pilotos) {
  if (!a || !b) {
    zona.innerHTML = `<p class="cargando">Elige dos pilotos para compararlos.</p>`;
    return;
  }
  if (a.id === b.id) {
    zona.innerHTML = `<div class="aviso aviso--seccion">Has elegido a ${esc(a.nombre)} en los dos lados.
      Cambia uno de los dos para ver la comparativa.</div>`;
    return;
  }

  const filas = METRICAS_H2H.map((m) => compararMetrica(m, a, b));
  const cuenta = (r) => filas.filter((f) => f.resultado === r).length;
  const ganaA = cuenta("a"), ganaB = cuenta("b"), empates = cuenta("empate");

  zona.innerHTML = `
    <div class="duelo">
      <div class="duelo__piloto duelo__piloto--a">
        <h2 class="duelo__nombre"><a href="${urlPerfil(a)}">${esc(a.nombre)}</a></h2>
      </div>
      <p class="duelo__marcador">
        <span class="duelo__cifras numeros" aria-hidden="true">
          <span class="a">${ganaA}</span><span class="guion">–</span><span class="b">${ganaB}</span>
        </span>
        <span class="etiqueta" aria-hidden="true">métricas ganadas</span>
        <span class="solo-lector">
          ${esc(a.nombre)} gana ${plural(ganaA, "métrica", "métricas")} y
          ${esc(b.nombre)}, ${ganaB}. ${plural(empates, "empate", "empates")}.
        </span>
      </p>
      <div class="duelo__piloto duelo__piloto--b">
        <h2 class="duelo__nombre"><a href="${urlPerfil(b)}">${esc(b.nombre)}</a></h2>
      </div>
    </div>

    <div class="tarjeta">
      <table class="h2h-tabla">
        <caption class="h2h-leyenda">
          La cifra en blanco gana la métrica. En DNF, DSQ y posición media gana la más baja.
        </caption>
        <thead class="solo-lector">
          <tr>
            <th scope="col">${esc(a.nombre)}</th>
            <th scope="col">Métrica</th>
            <th scope="col">${esc(b.nombre)}</th>
          </tr>
        </thead>
        <tbody>${filas.map((f) => f.html).join("")}</tbody>
      </table>
    </div>

    <section class="tarjeta tarjeta--separada" id="h2h-radar"></section>`;

  // El gráfico es su propia sección: si falla, la tabla de arriba se queda.
  await seccion("gráfico comparativo", document.getElementById("h2h-radar"), async (el) => {
    el.innerHTML = `
      <h2 class="tarjeta__titulo">Perfil comparado</h2>
      <div class="lienzo-envoltorio">
        <canvas id="grafico-h2h" role="img"
                aria-label="Gráfico de seis ejes con los perfiles de ${esc(a.nombre)} y ${esc(b.nombre)} superpuestos"></canvas>
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
    <h2 class="tarjeta__titulo">El duelo más igualado</h2>
    <p class="igualado__frase">
      <strong>${esc(par.a.nombre)}</strong> y <strong>${esc(par.b.nombre)}</strong>
      son los dos pilotos con las cifras más parecidas de toda la liga.
    </p>
    <a class="boton" href="${urlH2H(par.a, par.b)}">Ver el duelo ${esc(par.a.nombre)} – ${esc(par.b.nombre)}</a>
    <p class="nota">
      Distancia entre sus perfiles: ${fmtNum(par.distancia, 4)} (0 sería idéntico).
      Se comparan los ratios de victoria, podio, pole y vuelta rápida más el volumen
      de carreras, entre los pilotos con al menos ${MIN_CARRERAS_H2H} participaciones.
    </p>`;
}

/* ---------- Arranque ---------- */

async function init() {
  const zona = document.getElementById("zona-h2h");
  const zonaIgualado = document.getElementById("zona-igualado");
  const selA = document.getElementById("piloto-a");
  const selB = document.getElementById("piloto-b");
  const botonIntercambiar = document.getElementById("intercambiar");

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

    // La URL y el título de la pestaña siguen a lo que hay en pantalla.
    if (a && b) {
      history.replaceState(null, "", urlH2H(a, b));
      document.title = `${a.nombre} vs ${b.nombre} — ESPT Competizione`;
    } else {
      document.title = TITULO_PAGINA;
    }

    return seccion("comparativa", zona, (el) => renderComparativa(el, a, b, pilotos));
  };

  // El contenedor es .controles y no los <select>: un aviso dentro de un select no se ve.
  const selectoresOk = await seccion("selectores de piloto", selA?.closest(".controles"), () => {
    // Estado inicial desde la URL. Si falta alguno, se rellena con el primer
    // piloto de la lista que no sea el del otro lado (así nunca sale repetido).
    const pedidoA = buscarPiloto(pilotos, getParam("a"));
    const pedidoB = buscarPiloto(pilotos, getParam("b"));
    const inicialA = pedidoA || pilotos.find((p) => p.id !== pedidoB?.id);
    const inicialB = pedidoB || pilotos.find((p) => p.id !== inicialA?.id);

    rellenarSelect(selA, pilotos, inicialA);
    rellenarSelect(selB, pilotos, inicialB);
    selA.addEventListener("change", comparar);
    selB.addEventListener("change", comparar);

    botonIntercambiar?.addEventListener("click", () => {
      [selA.value, selB.value] = [selB.value, selA.value];
      comparar();
    });
  });

  if (selectoresOk) comparar();
  else zona.innerHTML = "";

  seccion("duelo más igualado", zonaIgualado, (el) => renderIgualado(el, pilotos));
}

init();
