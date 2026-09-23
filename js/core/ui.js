/* =========================================================
   ESPT Competizione — core/ui.js
   Helpers de DOM compartidos por las páginas.

   La pieza importante es seccion(): cada bloque de cada página
   se pinta a través de ella. Si ese bloque lanza un error, se
   sustituye por un aviso y el resto de la página sigue viva.
   ========================================================= */

import { esc } from "./utils.js";

/**
 * Pinta una sección aislada del resto.
 * @param {string}   nombre      Nombre legible, sale en el aviso y en la consola.
 * @param {Element}  contenedor  Donde se pinta la sección (y el aviso si falla).
 * @param {Function} fn          Recibe el contenedor. Puede ser async.
 * @returns {Promise<boolean>}   true si se pintó bien, false si falló.
 */
export async function seccion(nombre, contenedor, fn) {
  if (!contenedor) {
    console.warn(`[ESPT] No existe el contenedor de la sección "${nombre}". Revisa el HTML.`);
    return false;
  }
  try {
    await fn(contenedor);
    return true;
  } catch (err) {
    console.error(`[ESPT] La sección "${nombre}" ha fallado:`, err);
    contenedor.innerHTML = `
      <div class="aviso aviso--seccion" role="alert">
        <p><strong>No se pudo mostrar: ${nombre}.</strong></p>
        <p>El resto de la página funciona. Detalle del error en la consola (F12).</p>
      </div>`;
    return false;
  }
}

/** Error de carga de datos: afecta a toda la página, así que es más explícito. */
export function pintarError(contenedor, err) {
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="aviso" role="alert">
      <p><strong>No se pudieron cargar los datos.</strong></p>
      <p>${esc(err.message)}</p>
      <p>Recuerda: la web necesita servirse por HTTP.
         En VS Code, clic derecho sobre el HTML y
         <code>Open with Live Server</code>.</p>
    </div>`;
}

export function rellenarSelect(select, pilotos, seleccionado) {
  select.innerHTML =
    `<option value="">Elige piloto…</option>` +
    pilotos
      .map((p) => {
        const etiqueta = p.mote ? `${p.nombre} · ${p.mote}` : p.nombre;
        const sel = seleccionado && seleccionado.id === p.id ? " selected" : "";
        return `<option value="${esc(p.id)}"${sel}>${esc(etiqueta)} (${p.carreras})</option>`;
      })
      .join("");
}
