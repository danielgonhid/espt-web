/* =========================================================
   ESPT Competizione — core/metricas.js
   Lógica estadística de la liga: posición media, máximos,
   récords y duelo más igualado. Sin DOM: solo recibe pilotos
   y devuelve números, así que se puede probar en aislado.
   ========================================================= */

import { MIN_CARRERAS_H2H, POS_MEDIA_RESTO } from "./config.js";
import { ratio } from "./utils.js";

/* ---------- Posición media ---------- */

/**
 * Posición media ESTIMADA. Solo entra en juego si posicion_media es null.
 * El CSV de origen no trae esa columna; en cuanto la rellenes en data.json
 * esta función deja de usarse para ese piloto. Los valores estimados se
 * marcan con * en la interfaz.
 */
export function estimarPosicionMedia(p) {
  if (!p.carreras) return null;
  const pVict = ratio(p.victorias, p.carreras);
  const pPodioSinVict = ratio(Math.max(0, p.podios - p.victorias), p.carreras);
  const pResto = Math.max(0, 1 - pVict - pPodioSinVict);
  return 1 * pVict + 2.5 * pPodioSinVict + POS_MEDIA_RESTO * pResto;
}

// Devuelve { valor, estimada } para no mentir en la interfaz.
export function posicionMedia(p) {
  if (typeof p.posicion_media === "number") return { valor: p.posicion_media, estimada: false };
  return { valor: estimarPosicionMedia(p), estimada: true };
}

/* ---------- Mejor / peor resultado ---------- */

export function mejorResultado(p) {
  if (p.mejor_resultado) return p.mejor_resultado;
  if (p.victorias > 0) return "1º";
  if (p.podios > 0) return "Podio (sin detalle de posición)";
  if (p.carreras > 0) return "Ningún podio registrado";
  return "Sin carreras disputadas";
}

export function peorResultado(p) {
  if (p.peor_resultado) return p.peor_resultado;
  if (p.dns > 0) return `No tomó la salida en ${p.dns} carrera(s)`;
  if (p.dsq > 0) return `Descalificado en ${p.dsq} carrera(s)`;
  return "Sin detalle carrera a carrera";
}

/* ---------- Máximos de la liga ---------- */

// Los gráficos y las barras normalizan contra esto.
export function maximos(pilotos) {
  const m = { carreras: 0, victorias: 0, podios: 0, poles: 0, vmr: 0, dnf: 0, titulos: 0 };
  for (const p of pilotos) {
    for (const k of Object.keys(m)) m[k] = Math.max(m[k], p[k] || 0);
  }
  const posiciones = pilotos
    .map((p) => posicionMedia(p).valor)
    .filter((v) => typeof v === "number");
  m.posMejor = posiciones.length ? Math.min(...posiciones) : 1;
  m.posPeor = posiciones.length ? Math.max(...posiciones) : 20;
  return m;
}

/* ---------- Récords (con empates) ---------- */

/**
 * Recorre la lista con un solo reduce y devuelve { valor, pilotos }.
 * Guarda TODOS los pilotos que empatan en el mejor valor, no solo el primero.
 * mayorMejor=false invierte el criterio (posición media: gana el bajo).
 */
export function mejores(lista, valorDe, mayorMejor = true) {
  return lista.reduce((acc, piloto) => {
    const valor = valorDe(piloto);
    if (valor === null || !Number.isFinite(valor)) return acc;
    if (!acc.pilotos.length) return { valor, pilotos: [piloto] };
    if (mayorMejor ? valor > acc.valor : valor < acc.valor) return { valor, pilotos: [piloto] };
    if (Math.abs(valor - acc.valor) < 1e-9) acc.pilotos.push(piloto);
    return acc;
  }, { valor: null, pilotos: [] });
}

/* ---------- Cara a cara más igualado ---------- */

/**
 * Vector normalizado de 5 dimensiones (todo 0-1) para medir "parecido".
 * Se usan ratios y no totales para que un piloto con 200 carreras pueda
 * parecerse a uno con 40, y se añade el volumen de carreras como una
 * dimensión más para no emparejar a un veterano con un debutante.
 */
export function vectorPiloto(p, max) {
  return [
    ratio(p.victorias, p.carreras),
    ratio(p.podios, p.carreras),
    ratio(p.poles, p.carreras),
    ratio(p.vmr, p.carreras),
    ratio(p.carreras, max.carreras)
  ];
}

export function parMasIgualado(pilotos) {
  const elegibles = pilotos.filter((p) => p.carreras >= MIN_CARRERAS_H2H);
  if (elegibles.length < 2) return null;

  const max = maximos(elegibles);
  const vectores = elegibles.map((p) => vectorPiloto(p, max));
  let mejor = null;

  for (let i = 0; i < elegibles.length; i++) {
    for (let j = i + 1; j < elegibles.length; j++) {
      let suma = 0;
      for (let k = 0; k < vectores[i].length; k++) {
        const d = vectores[i][k] - vectores[j][k];
        suma += d * d;
      }
      const distancia = Math.sqrt(suma);
      if (!mejor || distancia < mejor.distancia) {
        mejor = { a: elegibles[i], b: elegibles[j], distancia };
      }
    }
  }
  return mejor;
}
