/* =========================================================
   ESPT Competizione — modulos/tabla.js
   Tabla de clasificación ordenable + buscador (index.html).
   Para añadir una columna: una entrada en COLUMNAS y su <td>
   en filaHTML().

   El orden y la búsqueda se guardan en la URL
   (index.html?q=mar&orden=victorias): así una vista concreta de
   la tabla se puede compartir con un enlace y sobrevive a recargar.

   Norma anti-Dani: si un piloto tiene algo anulado (campos
   *_anuladas en data.json), su cifra oficial de Victorias/Poles/VMR
   lleva un asterisco con tooltip explicando cuánto le anularon. La
   cifra en sí ya es la oficial (no incluye lo anulado); el asterisco
   es solo un aviso visual, no cambia el orden de la tabla.
   ========================================================= */

import { posicionMedia } from "../core/metricas.js";
import { normalizar, pct, fmtPct, fmtNum, urlPerfil, esc, getParam } from "../core/utils.js";

// "ayuda" es el nombre completo de una sigla: sale como tooltip de la cabecera.
const COLUMNAS = [
  { clave: "pos",       texto: "#",          tipo: "indice" },
  { clave: "nombre",    texto: "Piloto",     tipo: "texto",  get: (p) => p.nombre },
  { clave: "carreras",  texto: "Carreras",   tipo: "num",    get: (p) => p.carreras },
  { clave: "titulos",   texto: "Títulos",    tipo: "num",    get: (p) => p.titulos },
  { clave: "victorias", texto: "Victorias",  tipo: "num",    get: (p) => p.victorias },
  { clave: "podios",    texto: "Podios",     tipo: "num",    get: (p) => p.podios },
  { clave: "poles",     texto: "Poles",      tipo: "num",    get: (p) => p.poles },
  { clave: "vmr",       texto: "VMR",        tipo: "num",    get: (p) => p.vmr, ayuda: "Vueltas rápidas" },
  { clave: "dnf",       texto: "DNF",        tipo: "num",    get: (p) => p.dnf, ayuda: "Abandonos" },
  { clave: "dsq",       texto: "DSQ",        tipo: "num",    get: (p) => p.dsq, ayuda: "Descalificaciones" },
  { clave: "pctVict",   texto: "% Vict.",    tipo: "num",    get: (p) => pct(p.victorias, p.carreras), ayuda: "Porcentaje de victorias" },
  { clave: "pctPod",    texto: "% Podios",   tipo: "num",    get: (p) => pct(p.podios, p.carreras) },
  { clave: "pctPole",   texto: "% Poles",    tipo: "num",    get: (p) => pct(p.poles, p.carreras) },
  { clave: "posMedia",  texto: "Pos. media", tipo: "num",    get: (p) => posicionMedia(p).valor ?? Infinity, ayuda: "Posición media" }
];

const ORDEN_INICIAL = "carreras";

// Columnas en las que lo natural es empezar de menor a mayor.
const ASCENDENTE_DE_INICIO = new Set(["nombre", "posMedia"]);

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

/** Clase de una celda numérica: los ceros se apagan para que destaque el resto. */
const tono = (valor, clase = "") => (valor ? clase : "dato-cero");

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
      <td class="numeros ${tono(p.carreras, "dato-fuerte")}">${p.carreras}</td>
      <td class="numeros ${tono(p.titulos, "dato-titulos")}">${p.titulos}</td>
      <td class="numeros ${tono(p.victorias, "dato-fuerte")}">${conMarcaNorma(p.victorias, p.victorias_anuladas, "victoria")}</td>
      <td class="numeros ${tono(p.podios)}">${p.podios}</td>
      <td class="numeros ${tono(p.poles)}">${conMarcaNorma(p.poles, p.poles_anuladas, "pole")}</td>
      <td class="numeros ${tono(p.vmr)}">${conMarcaNorma(p.vmr, p.vmr_anuladas, "vuelta rápida")}</td>
      <td class="numeros ${tono(p.dnf)}">${p.dnf}</td>
      <td class="numeros ${tono(p.dsq)}">${p.dsq}</td>
      <td class="numeros ${tono(p.victorias)}">${fmtPct(pct(p.victorias, p.carreras))}</td>
      <td class="numeros ${tono(p.podios)}">${fmtPct(pct(p.podios, p.carreras))}</td>
      <td class="numeros ${tono(p.poles)}">${fmtPct(pct(p.poles, p.carreras))}</td>
      <td class="numeros">${pmTexto}</td>
    </tr>`;
}

/** Estado inicial leído de la URL; lo que no venga o no valga, por defecto. */
function estadoDesdeURL() {
  const clave = getParam("orden");
  const valida = COLUMNAS.some((c) => c.clave === clave && c.tipo !== "indice");
  const orden = valida ? clave : ORDEN_INICIAL;
  const dir = getParam("dir");
  return {
    clave: orden,
    asc: dir ? dir === "asc" : ASCENDENTE_DE_INICIO.has(orden),
    filtro: normalizar(getParam("q"))
  };
}

/** Refleja el estado en la URL sin recargar ni añadir entradas al historial. */
function guardarEnURL(estado, textoBusqueda) {
  const url = new URL(location.href);
  const poner = (clave, valor) => (valor ? url.searchParams.set(clave, valor) : url.searchParams.delete(clave));

  const porDefecto = estado.clave === ORDEN_INICIAL && !estado.asc;
  poner("q", textoBusqueda.trim());
  poner("orden", porDefecto ? "" : estado.clave);
  poner("dir", porDefecto || estado.asc === ASCENDENTE_DE_INICIO.has(estado.clave) ? "" : (estado.asc ? "asc" : "desc"));
  history.replaceState(null, "", url);
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
  const estado = estadoDesdeURL();

  function pintarCabecera() {
    // Cada cabecera es un <button> de verdad: se llega con el tabulador y se
    // activa con Intro o espacio sin tener que programar el teclado a mano.
    cabecera.innerHTML = COLUMNAS.map((c) => {
      if (c.tipo === "indice") {
        return `<th scope="col" data-clave="pos"><span aria-hidden="true">${c.texto}</span><span class="solo-lector">Posición</span></th>`;
      }
      const ayuda = c.ayuda ? ` title="${c.ayuda}"` : "";
      return `<th scope="col" data-clave="${c.clave}">
                <button class="orden" type="button"${ayuda}>${c.texto}<span class="flecha" aria-hidden="true"></span></button>
              </th>`;
    }).join("");

    cabecera.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-clave]");
      if (!th || !e.target.closest(".orden")) return;
      const clave = th.dataset.clave;
      if (estado.clave === clave) estado.asc = !estado.asc;
      else { estado.clave = clave; estado.asc = ASCENDENTE_DE_INICIO.has(clave); }
      pintarCuerpo();
      guardarEnURL(estado, buscador ? buscador.value : "");
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
      if (Number.isNaN(r)) r = 0;   // Infinity - Infinity: dos pilotos sin dato
      if (r === 0) return normalizar(a.nombre).localeCompare(normalizar(b.nombre));
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

    if (recuento) {
      recuento.textContent = filtrados.length === pilotos.length
        ? `${pilotos.length} pilotos`
        : `${filtrados.length} de ${pilotos.length} pilotos`;
    }

    if (!filtrados.length) {
      cuerpo.innerHTML = `<tr><td class="sin-resultados" colspan="${COLUMNAS.length}">
        Ningún piloto coincide con la búsqueda. Prueba con otro nombre o mote.</td></tr>`;
      return;
    }

    cuerpo.innerHTML = filtrados.map(filaHTML).join("");
  }

  pintarCabecera();

  if (buscador) {
    // Si la URL traía una búsqueda, el campo la muestra.
    const inicial = getParam("q");
    if (inicial) buscador.value = inicial;

    buscador.addEventListener("input", (e) => {
      estado.filtro = normalizar(e.target.value);
      pintarCuerpo();
      guardarEnURL(estado, e.target.value);
    });
  }

  pintarCuerpo();
}
