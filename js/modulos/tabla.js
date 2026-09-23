/* =========================================================
   ESPT Competizione — modulos/tabla.js
   Tabla de clasificación ordenable + buscador (index.html).
   Para añadir una columna: una entrada en COLUMNAS y su <td>
   en filaHTML().

   Norma anti-Dani: si un piloto tiene algo anulado (campos
   *_anuladas en data.json), su cifra oficial de Victorias/Poles/VMR
   lleva un asterisco con tooltip explicando cuánto le anularon. La
   cifra en sí ya es la oficial (no incluye lo anulado); el asterisco
   es solo un aviso visual, no cambia el orden de la tabla.
   ========================================================= */

import { posicionMedia } from "../core/metricas.js";
import { normalizar, pct, fmtPct, fmtNum, urlPerfil, esc } from "../core/utils.js";

const COLUMNAS = [
  { clave: "pos",       texto: "#",          tipo: "indice" },
  { clave: "nombre",    texto: "Piloto",     tipo: "texto",  get: (p) => p.nombre },
  { clave: "carreras",  texto: "Carreras",   tipo: "num",    get: (p) => p.carreras },
  { clave: "titulos",   texto: "Títulos",    tipo: "num",    get: (p) => p.titulos },
  { clave: "victorias", texto: "Victorias",  tipo: "num",    get: (p) => p.victorias },
  { clave: "podios",    texto: "Podios",     tipo: "num",    get: (p) => p.podios },
  { clave: "poles",     texto: "Poles",      tipo: "num",    get: (p) => p.poles },
  { clave: "vmr",       texto: "VMR",        tipo: "num",    get: (p) => p.vmr },
  { clave: "dnf",       texto: "DNF",        tipo: "num",    get: (p) => p.dnf },
  { clave: "dsq",       texto: "DSQ",        tipo: "num",    get: (p) => p.dsq },
  { clave: "pctVict",   texto: "% Vict.",    tipo: "num",    get: (p) => pct(p.victorias, p.carreras) },
  { clave: "pctPod",    texto: "% Podios",   tipo: "num",    get: (p) => pct(p.podios, p.carreras) },
  { clave: "pctPole",   texto: "% Poles",    tipo: "num",    get: (p) => pct(p.poles, p.carreras) },
  { clave: "posMedia",  texto: "Pos. media", tipo: "num",    get: (p) => posicionMedia(p).valor ?? Infinity }
];

/**
 * Cifra oficial + asterisco con tooltip si el piloto tiene algo
 * anulado por la norma anti-Dani en ese campo. `anulados` es el
 * número de victorias/poles/vmr que no cuentan; `etiqueta` es el
 * texto del tooltip en singular (se pluraliza solo).
 */
function conMarcaNorma(valorOficial, anulados, etiqueta) {
  if (!anulados) return String(valorOficial);
  const texto = `${anulados} ${etiqueta}${anulados === 1 ? "" : "s"} anulada${anulados === 1 ? "" : "s"} por la norma anti-Dani`;
  return `${valorOficial}<span class="marca-norma" title="${esc(texto)}" aria-label="${esc(texto)}">*</span>`;
}

function filaHTML(p, i) {
  const pm = posicionMedia(p);
  const pmTexto = pm.valor === null ? "—" : `${fmtNum(pm.valor)}${pm.estimada ? "*" : ""}`;
  return `
    <tr>
      <td class="celda-pos numeros">${i + 1}</td>
      <td class="celda-piloto">
        <a href="${urlPerfil(p)}">${esc(p.nombre)}</a>
        ${p.mote ? `<span class="mote">${esc(p.mote)}</span>` : ""}
      </td>
      <td class="numeros dato-fuerte">${p.carreras}</td>
      <td class="numeros ${p.titulos ? "dato-titulos" : ""}">${p.titulos}</td>
      <td class="numeros dato-fuerte">${conMarcaNorma(p.victorias, p.victorias_anuladas, "victoria")}</td>
      <td class="numeros">${p.podios}</td>
      <td class="numeros">${conMarcaNorma(p.poles, p.poles_anuladas, "pole")}</td>
      <td class="numeros">${conMarcaNorma(p.vmr, p.vmr_anuladas, "vuelta rápida")}</td>
      <td class="numeros">${p.dnf}</td>
      <td class="numeros">${p.dsq}</td>
      <td class="numeros">${fmtPct(pct(p.victorias, p.carreras))}</td>
      <td class="numeros">${fmtPct(pct(p.podios, p.carreras))}</td>
      <td class="numeros">${fmtPct(pct(p.poles, p.carreras))}</td>
      <td class="numeros">${pmTexto}</td>
    </tr>`;
}

/**
 * Monta la tabla dentro de `zona` (que ya trae el <table> en el HTML).
 * El buscador y el recuento están fuera de la zona; si faltan, la tabla
 * funciona igual sin ellos.
 */
export function montarTabla(zona, pilotos) {
  const cabecera = zona.querySelector("#cabecera-tabla");
  const cuerpo = zona.querySelector("#cuerpo-tabla");
  if (!cabecera || !cuerpo) throw new Error("Falta #cabecera-tabla o #cuerpo-tabla en el HTML.");

  const buscador = document.getElementById("buscador");
  const recuento = document.getElementById("recuento");
  const estado = { clave: "carreras", asc: false, filtro: "" };

  function pintarCabecera() {
    cabecera.innerHTML = COLUMNAS.map((c) => {
      if (c.tipo === "indice") return `<th scope="col" data-clave="pos">${c.texto}</th>`;
      return `<th scope="col" data-clave="${c.clave}" tabindex="0">
                ${c.texto}<span class="flecha"></span>
              </th>`;
    }).join("");

    cabecera.querySelectorAll("th[data-clave]").forEach((th) => {
      const clave = th.dataset.clave;
      if (clave === "pos") return;
      const activar = () => {
        if (estado.clave === clave) estado.asc = !estado.asc;
        else { estado.clave = clave; estado.asc = clave === "nombre" || clave === "posMedia"; }
        pintarCuerpo();
      };
      th.addEventListener("click", activar);
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activar(); }
      });
    });
  }

  function pintarCuerpo() {
    const col = COLUMNAS.find((c) => c.clave === estado.clave) || COLUMNAS[2];

    const filtrados = pilotos.filter((p) => {
      if (!estado.filtro) return true;
      return normalizar(p.nombre).includes(estado.filtro) ||
             normalizar(p.mote).includes(estado.filtro);
    });

    filtrados.sort((a, b) => {
      let r;
      if (col.tipo === "texto") r = normalizar(col.get(a)).localeCompare(normalizar(col.get(b)));
      else r = col.get(a) - col.get(b);
      if (r === 0) r = normalizar(a.nombre).localeCompare(normalizar(b.nombre));
      return estado.asc ? r : -r;
    });

    // Indicadores de orden
    cabecera.querySelectorAll("th").forEach((th) => {
      const flecha = th.querySelector(".flecha");
      if (!flecha) return;
      if (th.dataset.clave === estado.clave) {
        th.setAttribute("aria-sort", estado.asc ? "ascending" : "descending");
        flecha.textContent = estado.asc ? "▲" : "▼";
      } else {
        th.removeAttribute("aria-sort");
        flecha.textContent = "";
      }
    });

    if (recuento) recuento.textContent = `${filtrados.length} de ${pilotos.length} pilotos`;

    if (!filtrados.length) {
      cuerpo.innerHTML = `<tr><td class="sin-resultados" colspan="${COLUMNAS.length}">
        Ningún piloto coincide con la búsqueda. Prueba con otro nombre o mote.</td></tr>`;
      return;
    }

    cuerpo.innerHTML = filtrados.map(filaHTML).join("");
  }

  pintarCabecera();
  pintarCuerpo();

  if (buscador) {
    buscador.addEventListener("input", (e) => {
      estado.filtro = normalizar(e.target.value);
      pintarCuerpo();
    });
  }
}
