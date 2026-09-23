/* =========================================================
   ESPT Competizione — charts.js
   Único fichero que toca Chart.js. Reglas que no se saltan:
   1) antes de crear un gráfico se destruye la instancia previa,
   2) no se instancia nada sobre un canvas que no esté visible
      en el DOM (si no, Chart.js calcula un tamaño de 0 y el
      gráfico sale en blanco o deformado),
   3) colores y fuente se leen de css/tokens.css en tiempo de
      ejecución: no hay ni un color ni una fuente escritos aquí.

   Chart.js llega como variable global desde el <script> del CDN
   que va antes de los módulos en perfil.html y cara-a-cara.html.
   ========================================================= */

import { posicionMedia } from "./core/metricas.js";

const instancias = new Map();   // id de canvas -> instancia de Chart

/* ---------- Tokens de diseño leídos del CSS ---------- */

const token = (variable) =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

// Funciones y no constantes: se leen en el momento de dibujar.
const TEMA = {
  rojo:   () => token("--c-rojo"),
  verde:  () => token("--c-verde"),
  texto:  () => token("--c-texto"),
  texto2: () => token("--c-texto-2"),
  linea:  () => token("--c-linea"),
  fondo:  () => token("--c-asfalto-alto"),
  pista:  () => token("--c-pista"),
  fuente: () => token("--f-base") || "sans-serif"
};

/**
 * Añade transparencia a cualquier color CSS válido (hex, rgb(), nombre…).
 * Truco: se pinta un píxel en un canvas de apoyo y se leen sus RGB, así que
 * no depende de que el token esté escrito en hexadecimal.
 */
let lienzoApoyo = null;
function conAlpha(color, alpha) {
  lienzoApoyo ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  lienzoApoyo.clearRect(0, 0, 1, 1);
  lienzoApoyo.fillStyle = "#000";
  lienzoApoyo.fillStyle = color;   // si el color no es válido, se queda en negro
  lienzoApoyo.fillRect(0, 0, 1, 1);
  const [r, g, b] = lienzoApoyo.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------- Guardas ---------- */

/** ¿Está Chart.js cargado? Si el CDN falla, se lanza un error que recoge seccion(). */
function exigirChartJs() {
  if (typeof Chart === "undefined") {
    throw new Error("Chart.js no está cargado. Revisa el <script> del CDN en el HTML.");
  }
  // La fuente global se fija una vez y la heredan ejes, leyenda y tooltip.
  Chart.defaults.font.family = TEMA.fuente();
}

/** Destruye cualquier gráfico anterior en ese canvas, venga de donde venga. */
function destruirPrevio(canvas) {
  const mia = instancias.get(canvas.id);
  if (mia) { mia.destroy(); instancias.delete(canvas.id); }

  // Chart.js 3+ también sabe qué instancia hay en un canvas:
  // cubre el caso de un gráfico creado fuera de este módulo.
  const ajena = Chart.getChart?.(canvas);
  if (ajena) ajena.destroy();
}

/** ¿Está el canvas realmente pintable? En el DOM, con tamaño y sin display:none. */
function esVisible(canvas) {
  if (!canvas || !canvas.isConnected) return false;
  if (canvas.offsetParent === null && getComputedStyle(canvas).position !== "fixed") return false;
  const r = canvas.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/**
 * Espera a que el canvas sea visible y entonces dibuja.
 * Reintenta frame a frame y se rinde tras unos intentos para no dejar
 * un bucle vivo consumiendo CPU. Devuelve una promesa: si fn() lanza un
 * error, la promesa lo rechaza y seccion() lo convierte en un aviso.
 */
function cuandoVisible(canvas, fn, intentos = 20) {
  return new Promise((resolve, reject) => {
    const intentar = (quedan) => {
      if (esVisible(canvas)) {
        try { fn(); resolve(true); } catch (err) { reject(err); }
        return;
      }
      if (quedan <= 0) {
        console.warn(`[ESPTCharts] El canvas #${canvas.id} nunca llegó a ser visible.`);
        resolve(false);
        return;
      }
      requestAnimationFrame(() => intentar(quedan - 1));
    };
    intentar(intentos);
  });
}

function obtenerCanvas(idCanvas) {
  const canvas = document.getElementById(idCanvas);
  if (!canvas) throw new Error(`No existe el canvas #${idCanvas}.`);
  return canvas;
}

/* ---------- Normalización a escala 0-100 ---------- */

const escala = (valor, maximo) => (maximo > 0 ? Math.max(0, Math.min(100, (valor / maximo) * 100)) : 0);

/** Posición media: menos es mejor, así que se invierte contra el rango de la liga. */
function escalaPosicion(piloto, max) {
  const { valor } = posicionMedia(piloto);
  if (valor === null) return 0;
  const rango = max.posPeor - max.posMejor;
  if (rango <= 0) return 100;
  return Math.max(0, Math.min(100, ((max.posPeor - valor) / rango) * 100));
}

/** DNF: menos es mejor. Si nadie tiene DNF registrados, todos van al 100. */
const escalaDNF = (piloto, max) =>
  max.dnf > 0 ? Math.max(0, 100 - (piloto.dnf / max.dnf) * 100) : 100;

export const EJES = ["Participación", "Posición media", "Fiabilidad (DNF)", "Poles", "Podios", "Victorias"];

export function valoresRadar(piloto, max) {
  return [
    escala(piloto.carreras, max.carreras),
    escalaPosicion(piloto, max),
    escalaDNF(piloto, max),
    escala(piloto.poles, max.poles),
    escala(piloto.podios, max.podios),
    escala(piloto.victorias, max.victorias)
  ];
}

/* ---------- Configuración común del radar ---------- */
function opcionesRadar(numPilotos) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 450 },
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: { color: TEMA.linea() },
        grid: { color: TEMA.linea() },
        pointLabels: { color: TEMA.texto(), font: { size: 13 } },
        ticks: {
          display: true,
          stepSize: 25,
          color: TEMA.texto2(),
          backdropColor: "transparent",
          font: { size: 10 }
        }
      }
    },
    plugins: {
      legend: {
        display: numPilotos > 1,
        labels: { color: TEMA.texto() }
      },
      tooltip: {
        backgroundColor: TEMA.fondo(),
        borderColor: TEMA.linea(),
        borderWidth: 1,
        titleColor: TEMA.texto(),
        bodyColor: TEMA.texto2(),
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(0)} / 100`
        }
      }
    }
  };
}

function datasetPiloto(piloto, max, color, relleno, extra = {}) {
  return {
    label: piloto.nombre,
    data: valoresRadar(piloto, max),
    backgroundColor: conAlpha(color, relleno),
    borderColor: color,
    borderWidth: 2,
    pointBackgroundColor: color,
    ...extra
  };
}

function dibujar(canvas, config) {
  destruirPrevio(canvas);   // por si algo se coló mientras esperábamos
  instancias.set(canvas.id, new Chart(canvas.getContext("2d"), config));
}

/* ---------- API ---------- */

/** Hexágono de un solo piloto (perfil.html). */
export function radarPiloto(idCanvas, piloto, max) {
  exigirChartJs();
  const canvas = obtenerCanvas(idCanvas);
  destruirPrevio(canvas);

  return cuandoVisible(canvas, () => {
    dibujar(canvas, {
      type: "radar",
      data: {
        labels: EJES,
        datasets: [datasetPiloto(piloto, max, TEMA.rojo(), 0.22, {
          pointBorderColor: TEMA.pista(),
          pointRadius: 4,
          pointHoverRadius: 6
        })]
      },
      options: opcionesRadar(1)
    });
  });
}

/** Hexágono con dos pilotos superpuestos (cara-a-cara.html). */
export function radarComparativo(idCanvas, a, b, max) {
  exigirChartJs();
  const canvas = obtenerCanvas(idCanvas);
  destruirPrevio(canvas);

  return cuandoVisible(canvas, () => {
    dibujar(canvas, {
      type: "radar",
      data: {
        labels: EJES,
        datasets: [
          datasetPiloto(a, max, TEMA.rojo(), 0.18, { pointRadius: 3 }),
          datasetPiloto(b, max, TEMA.verde(), 0.14, { pointRadius: 3 })
        ]
      },
      options: opcionesRadar(2)
    });
  });
}

/** Limpieza manual, por si algún día montas navegación sin recarga. */
export function destruirTodos() {
  instancias.forEach((c) => c.destroy());
  instancias.clear();
}
