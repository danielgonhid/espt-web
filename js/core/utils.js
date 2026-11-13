/* =========================================================
   ESPT Competizione — core/utils.js
   Utilidades puras: formato, URL y búsqueda. Ni DOM ni lógica
   de la liga, así que no puede romper nada visual.
   ========================================================= */

/**
 * Escapa un texto para meterlo en HTML con innerHTML sin que se interprete.
 * Obligatorio en TODO dato que venga de data.json: si algún día los nombres
 * llegan de los resultados del servidor de AC (nombres de Steam), cualquiera
 * podría llamarse <img src=x onerror=...>. Solo para plantillas HTML: en
 * textContent, document.title o gráficos NO se usa (saldría "&amp;").
 */
const ENTIDADES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (txt) => String(txt ?? "").replace(/[&<>"']/g, (c) => ENTIDADES[c]);

// Quita acentos y pasa a minúsculas: "Raúl" y "raul" deben casar.
export const normalizar = (txt) =>
  String(txt ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const ratio = (a, b) => (b > 0 ? a / b : 0);

export const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);

/* ---------- Formato de cifras ----------
   Con Intl y en español: coma decimal ("18,3 %", "4,27") en vez del punto
   que da toFixed(). Un formateador por nº de decimales, creado una sola vez. */
const formateadores = new Map();
function formateador(dec) {
  if (!formateadores.has(dec)) {
    formateadores.set(dec, new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
      useGrouping: false
    }));
  }
  return formateadores.get(dec);
}

export const fmtNum = (n, dec = 2) => (Number.isFinite(n) ? formateador(dec).format(n) : "—");

//   es un espacio que no parte línea: la cifra y su "%" van siempre juntos.
export const fmtPct = (n) => `${fmtNum(n, 1)} %`;

/** "2026-09-23" -> "23 de septiembre de 2026". Si la fecha no vale, devuelve "". */
export function fmtFecha(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(fecha);
}

/** plural(1, "carrera", "carreras") -> "1 carrera"; con 2 -> "2 carreras". */
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/* ---------- URL ---------- */

export const getParam = (clave) => new URLSearchParams(location.search).get(clave);

export function buscarPiloto(pilotos, referencia) {
  if (!referencia) return null;
  const ref = normalizar(referencia);
  return pilotos.find((p) => normalizar(p.id) === ref || normalizar(p.nombre) === ref) || null;
}

export const urlPerfil = (p) => `perfil.html?piloto=${encodeURIComponent(p.nombre)}`;

export const urlH2H = (a, b) =>
  `cara-a-cara.html?a=${encodeURIComponent(a.nombre)}&b=${encodeURIComponent(b.nombre)}`;
