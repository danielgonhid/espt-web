/* =========================================================
   ESPT Competizione — core/layout.js
   Pinta la cabecera (logo + navegación) y el pie en las tres
   páginas. Así el logo y el menú existen en UN solo sitio.

   Se carga con su propio <script type="module"> en cada HTML,
   separado del script de la página: si el JS de una página se
   rompe, la cabecera sigue saliendo y se puede navegar.
   ========================================================= */

import { ENLACES_NAV } from "./config.js";

/**
 * Nombre de la página actual sin extensión.
 * Cloudflare Pages sirve /perfil.html como /perfil y /index.html como /,
 * así que se comparan nombres sin ".html" para que funcione en local y online.
 */
function paginaActual() {
  const archivo = location.pathname.split("/").pop() || "index";
  return archivo.replace(/\.html$/, "");
}

function pintarCabecera() {
  const cabecera = document.getElementById("cabecera");
  if (!cabecera) return;

  const actual = paginaActual();
  const enlaces = ENLACES_NAV.map(({ href, texto }) => {
    const activa = href.replace(/\.html$/, "") === actual ? ' aria-current="page"' : "";
    return `<a class="nav__enlace" href="${href}"${activa}>${texto}</a>`;
  }).join("");

  cabecera.innerHTML = `
    <div class="contenedor cabecera__fila">
      <a class="logo" href="index.html" aria-label="ESPT Competizione, inicio">
        <span class="logo__espt">ESPT</span><span class="logo__competizione">Competizione</span>
      </a>
      <nav class="nav" aria-label="Secciones">${enlaces}</nav>
    </div>`;
}

function pintarPie() {
  const pie = document.getElementById("pie");
  if (!pie) return;
  pie.innerHTML = `<div class="contenedor">ESPT Competizione · datos servidos desde data.json</div>`;
}

pintarCabecera();
pintarPie();
