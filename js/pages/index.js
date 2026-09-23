/* =========================================================
   ESPT Competizione — pages/index.js
   Clasificación. Solo orquesta: carga los datos y pinta cada
   sección por separado. Cada sección se importa con import()
   dinámico dentro de seccion(): si un módulo tiene hasta un
   error de sintaxis, falla ESA sección y las demás siguen.
   ========================================================= */

import { cargarDatos } from "../core/data.js";
import { seccion, pintarError } from "../core/ui.js";

async function init() {
  const zonaTabla = document.getElementById("zona-tabla");
  const totales = document.getElementById("tira-totales");
  const records = document.getElementById("highlights");
  const recuento = document.getElementById("recuento");

  let datos;
  try {
    datos = await cargarDatos();
  } catch (err) {
    // Sin datos no hay nada que pintar: un solo aviso y se vacía el resto.
    pintarError(zonaTabla, err);
    if (totales) totales.innerHTML = "";
    if (records) records.innerHTML = "";
    if (recuento) recuento.textContent = "Sin datos";
    return;
  }

  const { pilotos } = datos;

  // Las tres a la vez y cada una por su cuenta.
  seccion("totales de la liga", totales, async (el) => {
    const { renderTotales } = await import("../modulos/totales.js");
    renderTotales(el, pilotos);
  });

  seccion("récords y estadísticas destacadas", records, async (el) => {
    const { renderRecords } = await import("../modulos/records.js");
    renderRecords(el, pilotos);
  });

  seccion("clasificación", zonaTabla, async (el) => {
    const { montarTabla } = await import("../modulos/tabla.js");
    montarTabla(el, pilotos);
  }).then((ok) => {
    if (!ok && recuento) recuento.textContent = "Sin datos";
  });
}

init();
