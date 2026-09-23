/* =========================================================
   ESPT Competizione — core/config.js
   Todas las constantes ajustables de la web, en un solo sitio.
   ========================================================= */

// Ruta del JSON, relativa a los HTML.
export const RUTA_DATOS = "data/data.json";

// Nº mínimo de carreras para entrar en el cálculo del "cara a cara más
// igualado". Con 1 o 2 carreras todos empatan a cero y el resultado sería
// basura estadística.
export const MIN_CARRERAS_H2H = 15;

// Posición media supuesta cuando un piloto termina fuera del podio.
// Solo se usa en la ESTIMACIÓN, nunca pisa un dato real del JSON.
export const POS_MEDIA_RESTO = 9;

// Mínimo de carreras para entrar en el récord de mejor posición media.
// Sin este filtro ganaría cualquiera que haya corrido una vez y quedado bien.
export const MIN_CARRERAS_POS_MEDIA = 10;

// Navegación: se pinta igual en las tres páginas desde core/layout.js.
// Para añadir una página nueva basta con una línea aquí.
export const ENLACES_NAV = [
  { href: "index.html",       texto: "Clasificación" },
  { href: "perfil.html",      texto: "Perfiles" },
  { href: "cara-a-cara.html", texto: "Cara a cara" }
];
