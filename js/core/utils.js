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
  String(txt ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const ratio = (a, b) => (b > 0 ? a / b : 0);

export const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);

export const fmtPct = (n) => `${n.toFixed(1)}%`;

export const fmtNum = (n, dec = 2) =>
  Number.isFinite(n) ? n.toFixed(dec).replace(/\.00$/, "") : "—";

export const getParam = (clave) => new URLSearchParams(location.search).get(clave);

export function buscarPiloto(pilotos, referencia) {
  if (!referencia) return null;
  const ref = normalizar(referencia);
  return pilotos.find((p) => normalizar(p.id) === ref || normalizar(p.nombre) === ref) || null;
}

export const urlPerfil = (p) => `perfil.html?piloto=${encodeURIComponent(p.nombre)}`;

export const urlH2H = (a, b) =>
  `cara-a-cara.html?a=${encodeURIComponent(a.nombre)}&b=${encodeURIComponent(b.nombre)}`;
