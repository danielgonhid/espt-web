# ESPT Competizione — Web de estadísticas

Web de estadísticas históricas de **ESPT Competizione**, una liga privada de simracing en
Assetto Corsa. Reúne los datos de los 64 pilotos que han pasado por la liga y permite
consultarlos, ver la ficha de cada uno y enfrentarlos entre sí.

**Stack:** HTML5 · CSS3 (variables nativas) · JavaScript ES6+ con módulos nativos · Chart.js.
Sin frameworks, sin backend y sin paso de compilación.

> Demo: *pendiente de despliegue en Cloudflare Pages*

## Qué hace

- **Clasificación histórica.** Tabla de todos los pilotos, ordenable por cualquier columna
  y con buscador. Incluye totales de la liga y una sección de récords (más títulos, más
  experiencia, mejor posición media…) calculados al vuelo, con soporte para empates.
- **Perfil de piloto.** Ficha individual con sus cifras, ratios y un gráfico hexagonal que
  compara su rendimiento con el mejor registro de la liga en seis ejes.
- **Cara a cara.** Comparador de dos pilotos métrica a métrica, con el ganador de cada una
  resaltado y los dos perfiles superpuestos en el gráfico. También calcula el duelo más
  igualado de la liga: la pareja de pilotos cuyos perfiles estadísticos están más cerca
  (distancia euclídea sobre cinco ratios normalizados).

La navegación entre páginas pasa el estado por la URL (`perfil.html?piloto=Marc`,
`cara-a-cara.html?a=Marc&b=Dani`), así que cualquier vista se puede compartir con un enlace.

## Decisiones técnicas

**Web estática con datos dinámicos.** Todo sale de un único `data/data.json`; el HTML no
lleva ni un dato escrito. Para actualizar la liga basta con cambiar ese archivo y hacer
push: el hosting redespliega solo. Una liga que actualiza resultados una vez por semana no
necesita servidor ni base de datos.

**Diseño en un solo archivo.** Colores, tipografía, tamaños y espaciados están definidos
como variables en `css/tokens.css`. Los tonos derivados (brillos, fondos translúcidos) se
calculan con `color-mix()` a partir del color base, y los gráficos leen esas mismas
variables en tiempo de ejecución. Cambiar el color de la liga es cambiar una línea.

**Los fallos no se propagan.** Cada página carga solo su propio módulo, la cabecera va en
un módulo aparte y cada sección se pinta aislada: si una lanza un error (incluso de
sintaxis, porque se cargan con `import()` dinámico), se sustituye por un aviso y el resto
de la página sigue funcionando.

**Datos tratados como no fiables.** Todo texto del JSON se escapa antes de insertarse en
el HTML. Hoy el JSON lo editamos nosotros, pero si en el futuro los resultados se importan
del servidor de juego, los nombres de piloto los elige cada jugador.

**Gráficos sin fugas.** Antes de dibujar, se destruye la instancia previa de Chart.js en
ese canvas y se espera a que el canvas sea visible, para evitar gráficos duplicados o de
tamaño cero.

## Estructura

```
/
├── index.html               Clasificación
├── perfil.html              Ficha individual
├── cara-a-cara.html         Comparador
├── data/data.json           Fuente única de datos
├── css/
│   ├── tokens.css           Colores, fuente, tamaños, espaciado
│   ├── base.css             Reset y estructura común
│   ├── layout.css           Cabecera y pie
│   ├── components.css       Piezas compartidas
│   └── pages/               Estilos exclusivos de cada página
└── js/
    ├── core/                Carga de datos, métricas, utilidades, layout
    ├── charts.js            Único fichero que toca Chart.js
    ├── modulos/             Secciones que se cargan bajo demanda
    └── pages/               Un orquestador por página
```

## Qué toco para cambiar…

| Quiero cambiar…                          | Archivo |
|------------------------------------------|---------|
| Un color, la fuente, un tamaño           | `css/tokens.css` (gráficos incluidos) |
| El logo o el menú                        | `js/core/layout.js`, `ENLACES_NAV` en `js/core/config.js` |
| Mínimos de carreras y otras constantes   | `js/core/config.js` |
| Un récord de la portada                  | `js/modulos/records.js` |
| Una columna de la tabla                  | `js/modulos/tabla.js` |
| Una métrica del cara a cara              | `METRICAS_H2H` en `js/pages/cara-a-cara.js` |
| Un easter egg                            | bloque `easter_eggs` de `data/data.json` (clave = id del piloto) |
| El formato del JSON                      | `js/core/data.js` (el resto de la web no se entera) |

Regla al añadir código: todo dato del JSON que vaya dentro de una plantilla HTML se
escribe como `${esc(dato)}`. En `textContent`, `document.title` o gráficos no se usa.

## Ejecutar en local

No abras los HTML con doble clic: con `file://` el navegador bloquea `fetch()` y los
módulos ES, y la web se queda vacía. Sírvela por HTTP, por ejemplo con la extensión
**Live Server** de VS Code (clic derecho sobre `index.html` → *Open with Live Server*).

## Flujo de trabajo

- `main`: producción. Es lo que se publica.
- `dev`: desarrollo. Todo cambio se prueba aquí antes de pasar a `main`.

## Notas de los datos

- Los datos históricos vienen de la hoja de estadísticas de la liga, convertida a JSON.
- Los podios incluyen las victorias.
- La posición media se estima (y se marca con `*`) mientras el origen no traiga esa columna.
- La tipografía Accelerator W01 se carga por CDN; sin conexión se usa la sans-serif del sistema.

## Autoría

Proyecto de **Daniel González Hidalgo** ([@danielgonhid](https://github.com/danielgonhid)),
estudiante de ASIR. Desarrollado con asistencia de IA; los requisitos, la arquitectura, la
revisión del código y el despliegue son míos.
