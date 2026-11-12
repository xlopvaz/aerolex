# 03 · Navegación y experiencia de usuario

> Estado: **propuesta de Fase 1**.

## 1. Mapa del sitio

Rutas mostradas como `ES` | `EN`. Todas existen en ambos idiomas.

```
/es/                                  | /en/
├── academia/                         | academy/
│   ├── [itinerario]/                 |   [path]/            (10 itinerarios)
│   │   └── [modulo]/[leccion]/       |     [module]/[lesson]/
├── pilotos/                          | pilots/              (17 módulos, preguntas tipo ATPL)
├── tcp/                              | cabin-crew/          (15 módulos + entrevistas)
├── meteorologia/                     | meteorology/
│   ├── metar/                        |   metar/             (curso METAR & SPECI)
│   ├── taf/                          |   taf/
│   ├── practica/                     |   practice/          (4 niveles)
│   └── en-directo/                   |   live/
├── diccionario/                      | dictionary/
│   ├── [termino]/                    |   [term]/
│   ├── acronimos/                    |   acronyms/
│   └── categoria/[cat]/              |   category/[cat]/
├── radio-atc/                        | atc-radio/
│   ├── alfabeto/  fraseologia/       |   alphabet/ phraseology/
│   └── simulador/                    |   simulator/
├── hangar/                           | hangar/              (enciclopedia de aeronaves)
│   ├── [fabricante]/[familia]/       |   [manufacturer]/[family]/
│   └── comparador/                   |   compare/
├── cabina/                           | flight-deck/         (cabina interactiva)
├── operaciones-aeropuerto/           | airport-operations/
├── spotter/                          | spotter/             (zona AvGeek)
├── historia/                         | history/
├── ingles-aeronautico/               | aviation-english/
├── retos/                            | challenges/          (quizzes y flashcards)
├── laboratorio/                      | lab/                 (18 herramientas)
│   ├── metar-decoder/ taf-decoder/   |
│   ├── conversor/ codigos/ …         |   converter/ codes/ …
├── panel/                            | dashboard/           (progreso, insignias, favoritos)
├── fuentes/                          | sources/             (bibliografía global)
└── acerca-de/ aviso-legal/           | about/ legal/
```

## 2. Navegación global

**Barra superior (escritorio):**

```
[▲ AeroLex]  Academia ▾  Diccionario  Meteo ▾  Radio ATC  Hangar  Laboratorio ▾  Spotter
                                        [🔍 Buscar…  ⌘K]  [ES|EN]  [◐]  [👤 Panel · 🔥3 · 240 XP]
```

- **Academia ▾** abre un *mega-menú* con los 10 itinerarios agrupados: *Empezar* · *Profesional* · *Especialidades*.
- **Meteo ▾:** Curso METAR · Curso TAF · Práctica · En directo · Decodificador.
- **Laboratorio ▾:** las 18 herramientas, con las más usadas destacadas.

**Móvil:**
- Barra inferior tipo app: `Inicio · Aprender · Diccionario · Lab · Yo`.
- Barra superior reducida: logo + buscar + ES/EN + menú.

**En cada página:**
- Migas de pan (*breadcrumbs*).
- En lecciones: índice lateral, barra de progreso del itinerario y botones *Anterior / Siguiente*.
- En fichas: términos relacionados enlazados y fuentes al pie.

## 3. Página de inicio (los 10 bloques que pediste)

| # | Bloque | Contenido | Componente |
|---|---|---|---|
| 1 | **Hero** | Ilustración propia (aproximación nocturna a pista con luces), eslogan, CTA *Empieza a aprender* / *Decodifica un METAR* | `Hero` |
| 2 | **Qué es AeroLex** | 3 pilares: Aprende · Consulta · Practica | `FeatureTrio` |
| 3 | **Áreas de aprendizaje** | Rejilla de tarjetas: Pilotos, TCP, Meteo, ATC, Hangar, Aeropuerto, Inglés, AvGeek | `AreaCard` |
| 4 | **Buscador de términos** | Campo grande con autocompletado EN/ES y "término del día" | `DictionarySearch` |
| 5 | **METAR Decoder exprés** | Campo con un ejemplo precargado; descodifica en línea y enlaza a la herramienta completa | `MetarQuick` |
| 6 | **Cursos destacados** | Tarjetas *boarding pass* (nivel, duración, progreso) | `CourseCard` |
| 7 | **Retos** | Reto diario, racha y acceso a quizzes | `DailyChallenge` |
| 8 | **Hangar** | Carrusel de familias de aeronaves con datos clave | `AircraftCarousel` |
| 9 | **Laboratorio** | Accesos a herramientas (conversor, códigos, comparador…) | `ToolGrid` |
| 10 | **Tus estadísticas** | Panel tipo FIDS: XP, racha, lecciones, insignias. Sin datos: invitación a empezar | `StatsBoard` |

**Regla de contenido:** ningún bloque se publica con tarjetas vacías. Si un área aún no tiene contenido real, no aparece en la portada; se añade cuando se publique.

## 4. Biblioteca de componentes (Fase 2)

| Grupo | Componentes |
|---|---|
| **Base** | Button, IconButton, Link, Badge, Tag, Tooltip, Kbd |
| **Estructura** | Card, Tabs, Accordion, Modal, Drawer, Breadcrumbs, Pagination, EmptyState |
| **Formularios** | Input, Search, Select, Toggle, SegmentedControl (ES/EN, tema, unidades) |
| **Aprendizaje** | ProgressBar (senda de planeo), LessonNav, ObjectiveList, Callout (`info`, `tip`, `caution`, `warning`, `regional-diff`, `official-procedure`), TermChip (al pasar el ratón muestra la definición) |
| **Entradas** | TermCard, AcronymRow, AircraftSpecTable, VariantTabs, SourceList, ReviewBadge |
| **Evaluación** | QuizQuestion (todos los tipos), Flashcard, ResultSummary |
| **Datos** | StatTile, FIDSBoard, WindRose, CloudLayers |

## 5. Principios UX

1. **De cero a profesional:** cada itinerario empieza sin dar nada por sabido; los términos técnicos se explican la primera vez que aparecen (TermChip).
2. **Inglés como idioma de trabajo:** en la interfaz ES, los términos estándar se muestran en inglés con su equivalencia (*"flaps (flaps de borde de salida)"*).
3. **Aprendizaje activo:** cada lección termina con práctica; los fallos alimentan la repetición espaciada.
4. **Rigor visible:** insignia de revisión y fuentes en cada entrada; callouts diferenciados para *diferencias EASA/FAA* y *"consulta el procedimiento del operador"*.
5. **Accesibilidad WCAG 2.2 AA:** navegación completa con teclado, foco visible, `aria-live` en correcciones de quiz, textos alternativos, contraste verificado y `prefers-reduced-motion`.
6. **Rendimiento:** páginas de lectura sin JS; objetivo Lighthouse ≥ 90 en todas las categorías.
