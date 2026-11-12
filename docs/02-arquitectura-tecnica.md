# 02 · Arquitectura técnica

> Estado: **aprobado (Fase 1)**. Stack elegido: Astro.

## 1. Elección de stack

El proyecto tiene tres rasgos que condicionan la arquitectura:

1. **Mucho contenido estático y bilingüe:** miles de términos, cientos de lecciones y fichas de aeronaves.
2. **Herramientas muy interactivas:** decodificador METAR/TAF, simulador ATC, cabina, quizzes.
3. **Hosting en GitHub Pages:** solo ficheros estáticos, sin servidor.

### Opción A — Astro + JavaScript/TypeScript (recomendada)

[Astro](https://astro.build) genera HTML estático en tiempo de compilación y solo envía JavaScript a los componentes que lo necesitan ("islas"). Despliega en GitHub Pages con su GitHub Action oficial.

| Ventaja real | Por qué importa en AeroLex |
|---|---|
| **Una página HTML por término, lección y aeronave** | Cada término (`/es/diccionario/qnh/`) es indexable por Google. Una "Wikipedia aeronáutica" necesita URL propias. |
| **i18n nativa** (`/es/…` y `/en/…`) | Las rutas, el `hreflang` y el selector ES/EN se generan solos. |
| **Content Collections con validación** | La compilación **falla** si a un término le falta la definición en español o la fuente. Así se garantiza el bilingüismo completo y el "no inventar". |
| **Rendimiento** | Las páginas de lectura cargan sin JS; el decodificador METAR solo carga su propio módulo. |
| **Escala** | Añadir 1 000 términos es añadir 1 000 ficheros JSON, sin tocar código. |
| **Componentes reutilizables** | Plantillas `.astro` para tarjetas, fichas, lecciones, etc. |

Las herramientas interactivas se escriben como **módulos ES puros** (`src/lib/metar/…`), sin depender de ningún framework, y se montan en la página como islas. Así son testeables por separado y reutilizables si algún día hay app móvil.

### Opción B — HTML/CSS/JS sin build (SPA con *hash routing*)

| A favor | En contra |
|---|---|
| Cero dependencias; se edita y se publica | Una sola página: los términos y las lecciones **no se indexan** bien en buscadores |
| Curva de aprendizaje mínima | Las traducciones se resuelven en el navegador (más lento con miles de entradas) |
| | Sin validación automática: un término sin traducción pasa desapercibido |
| | Con cientos de páginas, la navegación, el SEO y el rendimiento acaban exigiendo construir a mano lo que Astro ya trae |

### ¿Y React + Vite?

React aporta poco aquí: casi todo es contenido de lectura y las herramientas no necesitan un árbol de estado complejo. Si alguna isla concreta lo requiere (por ejemplo, el simulador ATC), Astro permite usar **Preact** solo en esa isla.

**✅ Decisión: Opción A (Astro).** Sigue siendo HTML5 + CSS3 + JavaScript ES6+ + JSON + LocalStorage, como pedías, pero con un paso de compilación que hace GitHub Actions automáticamente en cada `push`. No necesita ningún backend de pago.

## 2. Estructura del repositorio (Opción A)

Adaptación de la estructura que propusiste a las convenciones de Astro:

```
aerolex/
├── .github/workflows/
│   ├── deploy.yml            # build + tests + despliegue a GitHub Pages
│   └── content-check.yml     # valida datos, enlaces y traducciones en cada PR
├── docs/                     # documentación del proyecto (esta carpeta)
├── public/                   # se copia tal cual al sitio
│   ├── fonts/                # Inter, Space Grotesk, JetBrains Mono (autoalojadas)
│   ├── images/aircraft/      # fotos con licencia verificada
│   ├── icons/                # favicons, app icons
│   └── data/                 # índices JSON generados en build (autocompletado)
├── src/
│   ├── assets/
│   │   ├── brand/            # logotipo SVG
│   │   ├── icons/            # set aeronáutico propio (SVG)
│   │   └── illustrations/    # cabinas, aeropuertos, diagramas
│   ├── styles/
│   │   ├── tokens.css        # colores, tipografía, espaciado (fuente única de verdad)
│   │   ├── themes/           # dark.css, light.css
│   │   ├── base.css
│   │   └── components/       # un CSS por componente
│   ├── components/           # Card, Button, Tabs, Quiz, TermCard, AircraftSpec…
│   ├── layouts/              # BaseLayout, LessonLayout, ToolLayout, EntryLayout
│   ├── i18n/
│   │   ├── ui.es.json        # textos de interfaz ES
│   │   ├── ui.en.json        # textos de interfaz EN
│   │   ├── routes.json       # mapa de rutas localizadas (diccionario ↔ dictionary)
│   │   └── index.js          # t(), localizePath(), alternates()
│   ├── lib/                  # LÓGICA pura, sin DOM, 100 % testeable
│   │   ├── core/             # storage, events, progress, xp, streaks
│   │   ├── metar/            # tokenizer, parsers por grupo, validator, renderer
│   │   ├── taf/
│   │   ├── units/            # conversores
│   │   ├── atc/              # motor de escenarios y evaluación de readbacks
│   │   ├── quiz/             # motor de preguntas, repetición espaciada
│   │   └── search/           # índice de autocompletado del diccionario
│   ├── islands/              # componentes interactivos que montan lib/ en el DOM
│   ├── content/              # DATOS, separados del diseño y de la lógica
│   │   ├── dictionary/       # un JSON por término
│   │   ├── acronyms/
│   │   ├── aircraft/         # un JSON por familia, con variantes dentro
│   │   ├── lessons/          # Markdown/MDX por lección, carpeta por itinerario
│   │   ├── paths/            # definición de itinerarios (orden de módulos)
│   │   ├── quizzes/
│   │   ├── metar-samples/    # biblioteca de práctica (marcada como didáctica)
│   │   ├── taf-samples/
│   │   ├── atc-scenarios/
│   │   ├── cockpits/         # hotspots de cada cabina
│   │   ├── airports/         # subconjunto generado desde OurAirports
│   │   └── sources/          # bibliografía: cada fuente con ID único
│   ├── content.config.ts     # esquemas de validación de cada colección
│   └── pages/
│       ├── index.astro       # redirige a /es/ o /en/ según el navegador
│       └── [lang]/           # todas las páginas, generadas para es y en
├── tests/
│   ├── unit/                 # METAR, TAF, conversores, quiz, storage
│   ├── fixtures/             # METAR/TAF reales para tests
│   └── e2e/                  # Playwright: navegación, idioma, enlaces rotos
├── scripts/                  # importadores (OurAirports), validadores, generadores
├── astro.config.mjs
├── package.json
├── CLAUDE.md                 # reglas de trabajo del proyecto
└── README.md
```

**Implementado en la Fase 2 (diferencias con el esquema):**
- Las páginas se generan desde un registro único de rutas (`src/i18n/routes.js`) con una sola plantilla, `src/pages/[lang]/[...slug].astro`. Cada página tiene su vista en `src/views/`.
- Un único workflow (`deploy.yml`) hace las pruebas en cada PR y, además, publica al fusionar en `main`.
- `scripts/check-site.mjs` revisa el sitio compilado: enlaces internos, `hreflang`, `<main>` vacíos y textos de relleno.
- **Fase 3:** el diccionario usa Content Collections (`src/content.config.ts`) con esquemas Zod; `tests/unit/content.test.js` comprueba además las referencias cruzadas (`related`, `sources`). El índice de búsqueda se genera en la compilación en `/data/dictionary.json`. El modelo real de cada entrada está en el esquema; el ejemplo de §3.1 es orientativo.

**Separación estricta:**
- `content/` = datos
- `lib/` = lógica
- `components/` + `styles/` = presentación

Ningún texto visible se escribe a mano en un componente: todo viene de `i18n/` o de `content/`.

## 3. Modelo de datos

Cada colección tiene un **esquema** que se valida en compilación. Los campos bilingües son siempre objetos `{ "es": …, "en": … }` y ambos idiomas son **obligatorios**.

### 3.1 Término del diccionario — `src/content/dictionary/qnh.json`

```json
{
  "id": "qnh",
  "term": { "en": "QNH", "es": "QNH" },
  "fullForm": { "en": "Altimeter sub-scale setting to obtain elevation when on the ground", "es": "Reglaje de la subescala del altímetro para obtener la elevación estando en tierra" },
  "categories": ["meteorology", "flight-operations", "navigation"],
  "type": "abbreviation",
  "keepOriginal": true,
  "officialDefinition": {
    "en": "…",
    "es": "…",
    "source": "icao-doc-8400",
    "note": { "en": "Paraphrased. See source.", "es": "Parafraseado. Consultar la fuente." }
  },
  "simpleExplanation": { "en": "…", "es": "…" },
  "example": { "en": "ATC: \"Descend to altitude 5000 feet, QNH 1013.\"", "es": "…" },
  "pronunciation": { "en": "/ˌkjuː.enˈeɪtʃ/", "es": "kiu-en-eich" },
  "synonyms": [],
  "related": ["qfe", "qne", "altimeter", "transition-altitude"],
  "regionalNotes": { "en": "US uses inches of mercury (A2992); ICAO/Europe hPa (Q1013).", "es": "…" },
  "sources": ["icao-doc-8400", "faa-pcg"],
  "review": { "status": "draft", "reviewedBy": null, "date": null }
}
```

Puntos clave:
- **`officialDefinition` y `simpleExplanation` van separadas**, tal como pediste.
- **`keepOriginal`** indica que el término se usa en inglés también en español (QNH, METAR, MAYDAY…).
- **`review.status`** (`draft` → `reviewed` → `verified`): la interfaz muestra una insignia y solo `verified` aparece como "referencia".
- **`sources`** apunta a IDs de `content/sources/`, donde cada fuente tiene título, edición, URL y licencia.

### 3.2 Aeronave — `src/content/aircraft/a320-family.json` (estructura)

```
id, manufacturer, family, category (commercial|military|business|general-aviation)
history{es,en}, firstFlight, entryIntoService
variants[]: {
  id, name, firstFlight, entryIntoService,
  dimensions{ wingspan_m, length_m, height_m },
  engines[]: { manufacturer, model },
  cruiseSpeed{ mach | ktas }, range_nm, typicalSeating{ min, max }, maxSeating,
  sources[]      ← obligatorio por variante
}
funFacts[]{es,en, source}
images[]{ file, author, license, sourceUrl }
```

Las cifras se guardan **en unidades base** (m, nm, kt) y se convierten en pantalla. **Cada variante tiene sus propias cifras y fuentes**: nada de "un A320" genérico.

### 3.3 Lección — `src/content/lessons/pilot/principles-of-flight/01-four-forces.es.mdx` (+ `.en.mdx`)

Frontmatter: `id`, `path`, `module`, `order`, `level`, `objectives[]`, `duration`, `terms[]` (enlazan al diccionario), `quiz` (id), `sources[]`, `review`.

Las dos versiones comparten `id`, de modo que el progreso es independiente del idioma.

### 3.4 Pregunta de quiz — `src/content/quizzes/metar-basics.json`

```
id, category, level, type (mcq|true-false|fill|match|image|decode-metar|taf|atc-complete|flashcard),
prompt{es,en}, options[]{id, text{es,en}}, answer, explanation{es,en}, sources[], tags[]
```

## 4. Bilingüismo

- **Rutas:** `/es/…` y `/en/…`, con secciones traducidas (`/es/diccionario/` ↔ `/en/dictionary/`) definidas en `i18n/routes.json`.
- **Slugs:** cada entrada tiene un `id` estable. Por defecto el slug es el `id` en ambos idiomas; los términos que se traducen pueden tener slug propio en español.
- **Selector ES/EN:** lleva a la **página equivalente** del otro idioma (no a la portada), gracias a un mapa de alternativas generado en build. También se generan las etiquetas `hreflang`.
- **Idioma inicial (✅ decidido):** según el idioma del navegador; luego se recuerda la elección del usuario.
- **El progreso no se pierde:** todo el estado del usuario se guarda por `id` de contenido, nunca por URL ni idioma.
- **Diccionario siempre bilingüe:** la ficha de cada término muestra EN y ES juntos, sea cual sea el idioma de la interfaz.

## 5. Estado del usuario y gamificación

```
src/lib/core/
  storage.js      → interfaz StorageAdapter { get, set, remove, export, import }
  adapters/
    local.js      → LocalStorageAdapter (ahora)
    remote.js     → RemoteSyncAdapter (futuro: cuentas y sincronización)
  store.js        → estado único con schemaVersion + migraciones
  progress.js     → lecciones completadas, itinerarios
  xp.js / streaks.js / badges.js
  srs.js          → repetición espaciada de preguntas falladas y flashcards
```

- **Una única clave versionada** (`aerolex:v1`) con un objeto JSON y un sistema de migraciones, para no romper el progreso al evolucionar.
- **Exportar/importar progreso** (fichero JSON) desde el panel de usuario: copia de seguridad hasta que haya cuentas.
- **Eventos** (`lesson:completed`, `quiz:answered`…) desacoplan la gamificación del contenido.
- **Futuro:** las cuentas se añadirán implementando `RemoteSyncAdapter` (por ejemplo, con el plan gratuito de un BaaS) sin tocar el resto de la aplicación.

## 6. Búsqueda

| Necesidad | Solución |
|---|---|
| **Buscador global** (lecciones, aeronaves, términos) | [Pagefind](https://pagefind.app): índice estático generado en build, compatible con varios idiomas sin configuración, que solo descarga los fragmentos necesarios. |
| **Autocompletado del diccionario** (EN y ES a la vez, con y sin tildes) | Índice JSON compacto generado en build (`public/data/dictionary-index.json`) más un buscador ligero propio en `lib/search/`, con normalización de acentos y prefijos. |
| **Favoritos e historial** | LocalStorage, a través del `store`. |
| **Atajo** | `Ctrl/⌘ + K` abre el buscador desde cualquier página. |

## 7. Motor METAR / TAF

Es la pieza técnica más delicada; se construye como librería pura.

```
lib/metar/
  tokenize.js     → divide en grupos, conserva la posición de cada token
  grammar.js      → orden esperado de grupos (máquina de estados)
  groups/         → un parser por grupo: station, time, wind, visibility, rvr,
                    weather, clouds, temperature, pressure, recent, windshear,
                    trend (NOSIG/BECMG/TEMPO), remarks
  validate.js     → errores y avisos (formato, orden, grupos desconocidos)
  explain.js      → genera la explicación ES/EN de cada grupo (desde i18n)
  index.js        → decode(raw) → { tokens[], groups[], errors[], warnings[] }
```

- **Cada token** termina en uno de tres estados: `ok`, `unknown` o `invalid`. Lo desconocido se **muestra como desconocido**; nunca se adivina.
- **Diferencias ICAO / EE. UU.** soportadas y señaladas: visibilidad en m frente a SM (`9999` / `10SM`), presión en hPa frente a inHg (`Q1013` / `A2992`), `CLR`/`SKC`, sección `RMK`.
- **Visualizaciones:** rosa de vientos SVG (dirección, velocidad, rachas, variación), perfil de capas de nubes con altura y cobertura en octas, e indicadores de visibilidad, T/Td y QNH.
- **Tests** con una batería de METAR y TAF reales de distintas regiones, incluidos casos límite y mensajes mal formados.

## 8. METAR/TAF en directo: limitación importante de GitHub Pages

- **Fuente candidata:** la [Data API del Aviation Weather Center (NOAA/NWS)](https://aviationweather.gov/data/api/). Es gratuita, sin clave, con estaciones de todo el mundo y datos de dominio público estadounidense. Ejemplo: `https://aviationweather.gov/api/data/metar?ids=LEMD&format=json`.
- **Problema:** varios desarrolladores informan de que esa API **no envía la cabecera CORS**, así que un navegador no puede consultarla directamente desde `xlopvaz.github.io`. Lo comprobaremos al empezar la Fase 4, porque podría haber cambiado.

Alternativas, sin backend de pago:

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **A. Proxy mínimo en Cloudflare Workers (plan gratuito)** | Unas 30 líneas que reenvían la petición a AWC, añaden CORS y cachean unos minutos | Cualquier código ICAO, datos frescos | Requiere una cuenta gratuita de Cloudflare |
| **B. GitHub Action programada** | Cada X minutos descarga los METAR/TAF de una lista de aeropuertos y publica un JSON | Todo dentro de GitHub | Solo aeropuertos predefinidos; las ejecuciones programadas pueden retrasarse |
| **C. Solo biblioteca de práctica** | Mensajes reales archivados y marcados como didácticos | Cero dependencias | No hay datos en directo |

**✅ Decisión (12/11/2026): B + C, sin cuentas en servicios externos.**
- **C desde el primer día:** biblioteca de práctica (el modo sin conexión que pediste).
- **B en la Fase 4:** una GitHub Action programada descarga los METAR/TAF de una lista de aeropuertos (empezando por LEST, LEVX, LECO, LEMD, EGLL, LFPG, KJFK y ampliable en un JSON) y publica un fichero estático que la web lee.
- **Comportamiento en la web:**
  - Cada informe muestra su hora de emisión y la hora de la última descarga. Si los datos tienen más de 2 horas, se marcan como antiguos.
  - Para un código ICAO que no esté en la lista, el usuario puede **pegar el METAR/TAF** y se descodifica igual.
- **A (proxy en Cloudflare)** queda documentada por si en el futuro quieres consultar cualquier aeropuerto.

La interfaz marcará siempre de forma visible **🟢 LIVE · hora de emisión** o **📘 EJEMPLO DIDÁCTICO**, junto con el aviso *"No apto para uso operacional"*.

No se usarán APIs que requieran clave (CheckWX, AVWX…) sin tu decisión explícita, porque una clave en un sitio estático queda expuesta.

## 9. Otras dependencias externas

| Función | Solución | Nota |
|---|---|---|
| Buscador de códigos IATA/ICAO, Airport Explorer | Datos de [OurAirports](https://ourairports.com/data/) (dominio público), filtrados en build a aeropuertos con código ICAO/IATA | Sin garantía de exactitud: se indicará |
| Audio ATC | Web Speech API (`speechSynthesis`) para voz en inglés | Calidad de voz según el dispositivo |
| Práctica oral ATC | `SpeechRecognition` donde exista | Soporte limitado (sobre todo Chrome/Edge). Alternativa: respuesta escrita |
| Imágenes de aeronaves | Wikimedia Commons con atribución, o fotos cedidas | Nunca de webs de spotting sin permiso |
| Grabaciones ATC reales | **No** se usarán (derechos y legalidad); diálogos propios con TTS | |

## 10. Calidad, tests y CI

- **Vitest:** tests unitarios de `lib/` (METAR, TAF, conversores, quiz, storage, SRS).
- **Validación de contenido:** esquemas de Astro + script que comprueba que todo `related`, `terms` y `sources` apunta a IDs existentes.
- **Playwright:** pruebas e2e del selector de idioma, el tema, los buscadores, los quizzes, la persistencia y la vista móvil.
- **Comprobador de enlaces** sobre el sitio compilado (sin enlaces rotos, sin páginas vacías).
- **Lighthouse CI:** rendimiento, accesibilidad, SEO.
- **Regla:** un PR no se fusiona si falla cualquiera de estas comprobaciones. Así se cumple el "no romper nada anterior".

## 11. Despliegue en GitHub Pages

- URL inicial: `https://xlopvaz.github.io/aerolex/` → en `astro.config.mjs`: `site: 'https://xlopvaz.github.io'` y `base: '/aerolex'`.
- Todas las rutas internas se generan con un helper que añade el `base`, para que funcionen igual en local, en Pages y con un futuro dominio propio (`public/CNAME`).
- En *Settings → Pages* del repositorio hay que elegir **Source: GitHub Actions** (lo haremos juntos en la Fase 2).
- `404.html` propia y bilingüe.

## 12. Privacidad y avisos legales

- Sin cookies ni rastreadores por defecto, así que no hace falta banner de cookies. Si más adelante quieres analítica, se propondrá una opción respetuosa con la privacidad.
- El progreso vive solo en el navegador del usuario.
- Pie de página y páginas de herramientas con el aviso: *contenido educativo; no sustituye la formación reglada, el AFM/POH, el manual de operaciones del operador ni la documentación oficial vigente.*
