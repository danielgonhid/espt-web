# ESPT Competizione — estadísticas históricas

Web estática (MPA) en HTML5 + CSS3 + Vanilla JS con módulos ES. Gráficos con Chart.js 4 desde CDN.
Todos los datos salen de `data/data.json`. No hay ni un dato de piloto escrito en el HTML.

## Estructura

```
/
├── index.html               Clasificación
├── perfil.html              Ficha individual  (?piloto=Marc)
├── cara-a-cara.html         Comparador H2H    (?a=Marc&b=Dani)
├── data/
│   └── data.json            64 pilotos, generado desde estadisticas_liga(1).csv
├── css/
│   ├── tokens.css           Colores, fuente, tamaños, espaciado. ÚNICO sitio con valores
│   ├── base.css             Reset, estructura de página, avisos
│   ├── layout.css           Cabecera, logo, navegación, pie
│   ├── components.css       Piezas compartidas: controles, botones, tarjetas
│   └── pages/               Estilos que solo usa una página
│       ├── index.css
│       ├── perfil.css
│       └── cara-a-cara.css
└── js/
    ├── core/                Compartido por todas las páginas
    │   ├── config.js        Constantes ajustables y enlaces del menú
    │   ├── data.js          Único punto que lee data.json
    │   ├── utils.js         Formato, URL, búsqueda (sin DOM)
    │   ├── metricas.js      Estadística de la liga (sin DOM)
    │   ├── ui.js            seccion(), avisos de error, selects
    │   └── layout.js        Pinta cabecera y pie en las tres páginas
    ├── charts.js            Único fichero que toca Chart.js
    ├── modulos/             Secciones que se cargan bajo demanda
    │   ├── totales.js
    │   ├── records.js
    │   ├── tabla.js
    │   └── easter-eggs.js
    └── pages/               Un orquestador por página
        ├── index.js
        ├── perfil.js
        └── cara-a-cara.js
```

## Qué toco para cambiar…

| Quiero cambiar…                              | Archivo                    |
|----------------------------------------------|----------------------------|
| Un color, la fuente, un tamaño               | `css/tokens.css` (gráficos incluidos) |
| El logo o el menú                            | `js/core/layout.js`, `js/core/config.js` |
| Añadir una página al menú                    | `ENLACES_NAV` en `js/core/config.js` |
| Mínimos de carreras, estimación de pos. media | `js/core/config.js`       |
| Un récord de la portada                      | `js/modulos/records.js`    |
| Una columna de la tabla                      | `js/modulos/tabla.js`      |
| Una métrica del cara a cara                  | `METRICAS_H2H` en `js/pages/cara-a-cara.js` |
| Un easter egg                                | bloque `easter_eggs` de `data/data.json` (clave = id del piloto) |
| El formato del JSON                          | `js/core/data.js` (el resto no se entera) |

Los colores derivados (brillos, fondos translúcidos, hover de filas) se calculan con
`color-mix()` a partir del color base. Cambias `--c-rojo` y todas sus variantes cambian solas.
`charts.js` lee los tokens con `getComputedStyle` al dibujar, así que tampoco hay que tocarlo.

## Si algo se rompe, se rompe solo eso

Tres capas de aislamiento:

1. **Un script por página.** Un error en `cara-a-cara.js` no afecta a la clasificación ni al perfil.
2. **La cabecera va aparte.** `layout.js` se carga con su propio `<script type="module">`:
   aunque el script de la página falle, el logo y el menú salen y se puede navegar.
3. **Cada sección pasa por `seccion()`** (`js/core/ui.js`). Si lanza un error, esa caja se
   sustituye por un aviso y el resto de la página sigue. Los módulos de `js/modulos/` y
   `charts.js` se cargan con `import()` dinámico dentro de `seccion()`, así que ni siquiera
   un error de **sintaxis** en uno de ellos tumba la página.

El límite: `js/core/` lo comparten todas las páginas. Si se rompe `data.js` o `utils.js`,
se caen las tres. Por eso `core` es pequeño y conviene tocarlo solo en la rama `dev`.

Comprobado en Chrome rompiendo a propósito `records.js` (la tabla sigue), `charts.js`
(las cifras del perfil siguen), `cara-a-cara.js` (la cabecera sigue) y con el CDN de
Chart.js caído (sale un aviso en el hueco del gráfico).

## Seguridad: esc() en todo dato del JSON

Las plantillas usan `innerHTML`. Todo texto que venga de `data.json` (nombres, motes,
easter eggs…) pasa por `esc()` de `js/core/utils.js`, que convierte `< > & " '` en
entidades HTML. Hoy el JSON lo editamos nosotros, pero si los resultados llegan del
servidor de Assetto Corsa, los nombres son los de Steam y cualquiera podría llamarse
`<img src=x onerror=...>`. Probado: un piloto con ese nombre sale como texto.

Regla al añadir código: dato del JSON dentro de una plantilla HTML → `${esc(dato)}`.
No se usa en `textContent`, `document.title` ni en los gráficos (ahí saldría `&amp;`).

## Arrancar en local

No abras los HTML con doble clic. Con `file://` el navegador bloquea tanto `fetch()` como
los módulos ES, y la web se queda vacía.

Usa **Live Server** en VS Code: clic derecho sobre `index.html` → *Open with Live Server*.

## Flujo de trabajo con Git

- `main` = producción. Lo que hay aquí es lo que se publica.
- `dev` = pruebas. Todo cambio se hace aquí primero.

```
git switch dev
# ...cambios, probar con Live Server...
git add -A
git commit -m "Descripción del cambio"
git push

# Cuando esté probado:
git switch main
git merge dev
git push
```

## La fuente

Accelerator W01 se carga por CDN desde el `@import` de la primera línea de `css/tokens.css`.
Sin conexión, o si el CDN cae, la web usa el `sans-serif` del sistema.

## Notas de los datos

- Los podios incluyen las victorias.
- Los porcentajes se calculan sobre `carreras`; con 0 carreras dan 0, nunca `NaN`.
- La posición media es estimada (marcada con `*`) mientras el JSON traiga `posicion_media: null`.
