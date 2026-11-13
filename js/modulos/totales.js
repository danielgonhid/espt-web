/* =========================================================
   ESPT Competizione — modulos/totales.js
   Tira de totales de la liga (index.html).
   ========================================================= */

export function renderTotales(contenedor, pilotos) {
  const suma = (k) => pilotos.reduce((acc, p) => acc + (p[k] || 0), 0);

  const datos = [
    [pilotos.length, "Pilotos en el histórico"],
    [suma("carreras"), "Participaciones"],
    [suma("victorias"), "Victorias"],
    [suma("poles"), "Poles"],
    [suma("titulos"), "Títulos repartidos"]
  ];

  contenedor.innerHTML = datos
    .map(([cifra, etiqueta]) => `
      <div class="dato">
        <span class="dato__cifra numeros">${cifra}</span>
        <span class="etiqueta">${etiqueta}</span>
      </div>`)
    .join("");
}
