# 01 · Identidad de marca

> Estado: **propuesta de Fase 1** — pendiente de aprobación.

## 1. Nombre

El repositorio ya se llama `aerolex`, así que lo he tratado como candidato principal, pero lo he comparado con alternativas reales.

| Nombre | Lectura internacional | Qué transmite | A favor | En contra |
|---|---|---|---|---|
| **AeroLex** ⭐ | "É-ro-lex" / "Á-e-ro-lex" | *Lex* = léxico, lenguaje → "el lenguaje del cielo" | Corto, bilingüe, encaja con el diccionario y con la academia. Permite submarcas. | *Lex* también sugiere "ley"; existe un bufete de derecho aeronáutico llamado **Aerlex** (nombre parecido). |
| **AeroCodex** | Igual en ES/EN | Códice: el libro que lo reúne todo | Transmite enciclopedia y referencia | Más largo; menos "app" |
| **Aerodex** | Igual en ES/EN | Índice / catálogo (estilo *Rolodex*) | Muy memorable; ideal para la enciclopedia de aeronaves | Puede sonar a catálogo más que a academia |
| **Contrail** | "Cón-treil" | Estela de condensación: la huella que deja el vuelo | Evocador, muy AvGeek | Palabra común; difícil de posicionar en buscadores |
| **Vectora** | Igual en ES/EN | *Vectors* de ATC: guía hacia el destino | Elegante, tecnológico | No dice "aviación" a primera vista |
| **SkyLexicon** | "Skai-lé-xi-con" | Diccionario del cielo | Muy descriptivo | Largo y menos marca |

**Recomendación: mantener AeroLex.** Funciona en ambos idiomas, ya está en el repositorio y su significado ("el léxico del aire") sirve tanto para el diccionario como para la academia, las herramientas o la comunidad AvGeek. La parte "ley" no es un problema si el eslogan y el logotipo hablan de *lenguaje* y *aprendizaje*.

**Antes de fijarlo públicamente:** comprobar marcas en EUIPO, OEPM y USPTO, y la disponibilidad de dominios (`aerolex.app`, `aerolex.academy`, `aerolex.org`…). No he verificado nada de esto.

### Arquitectura de submarcas

Una marca madre y áreas con nombre propio, todas bajo el mismo sistema visual:

| Submarca | Área | ES |
|---|---|---|
| **AeroLex Academy** | Itinerarios y cursos | Academia |
| **AeroLex Dictionary** | Diccionario + acrónimos | Diccionario |
| **AeroLex Wx** | Meteorología, METAR/TAF | Meteorología |
| **AeroLex Radio** | ATC y fraseología | Radio y ATC |
| **AeroLex Hangar** | Enciclopedia de aeronaves y comparador | Hangar |
| **AeroLex Flight Deck** | Cabina interactiva | Cabina de vuelo |
| **AeroLex Lab** | Herramientas y calculadoras | Laboratorio |
| **AeroLex Spotter** | Zona AvGeek | Spotter |

## 2. Concepto de marca

**Idea central:** la aviación tiene su propio idioma (de la fraseología a los METAR o los acrónimos), y AeroLex enseña a hablarlo y a entenderlo, desde el primer vuelo hasta la cabina de vuelo.

- **Personalidad:** precisa como un instructor, cercana como un compañero de promoción, apasionada como un spotter.
- **Tono:** claro, riguroso y sin condescendencia. Usamos los términos originales en inglés cuando son estándar y explicamos qué significan.
- **Promesa:** "Si está en AeroLex, tiene una fuente". Cada dato técnico lleva su referencia.

## 3. Eslogan (inglés)

- **Principal:** **"Learn the language of the sky."**
- Alternativas:
  - "From first flight to flight deck."
  - "Every term. Every level. Every flight."
  - "Decode aviation."

Versión ES de apoyo (no sustituye al eslogan principal): *"Aprende el idioma del cielo."*

## 4. Logotipo (propuesta)

- **Símbolo:** una "A" construida como una **pista en perspectiva**: dos bordes convergentes con un eje central discontinuo que hace de travesaño. Sobre el vértice, un pequeño *chevron* que recuerda la **senda de planeo** del ILS. Lectura doble: la letra A y "aproximación a la pista".
- **Logotipo tipográfico:** `AeroLex` en Space Grotesk Medium, con la **"x" final** dibujada como un **cruce de pistas** (dos trazos con distinto ángulo).
- **Versiones:** horizontal (símbolo + texto), apilada, solo símbolo (favicon, app icon) y monocroma.
- **Reglas:** espacio de respeto igual a la altura de la "e"; tamaño mínimo de 24 px para el símbolo.
- Se entregará como **SVG propio** en la Fase 2 (`assets/brand/`). Sin imágenes de terceros.

## 5. Identidad visual

**Inspiración:** pantallas de cabina modernas (PFD/ND), paneles de información aeroportuarios (FIDS) y cartas aeronáuticas, con la limpieza de Notion y la cercanía de Duolingo.

- Fondo oscuro "cielo nocturno" como modo estrella; modo claro tipo "carta aeronáutica" (papel claro, líneas finas).
- Los **colores semánticos imitan la filosofía de color de cabina**: rojo = aviso, ámbar = precaución, verde = normal, cian = seleccionable, magenta = objetivo o ruta activa. Esto ayuda al alumno a interiorizar la convención. *Nota: las convenciones exactas varían según el fabricante; en el contenido no se presentarán como universales.*
- Retícula de 8 px, esquinas de 12 px en tarjetas y de 8 px en controles, sombras suaves en modo claro y bordes luminosos en modo oscuro.
- Textura sutil de **líneas de rumbo / rosa de los vientos** en fondos del hero y de las cabeceras de sección.

## 6. Paleta cromática

Todos los pares texto/fondo se han comprobado con la fórmula de contraste WCAG 2.x (≥ 4,5:1 = AA para texto normal).

### Base

| Token | Modo oscuro | Modo claro | Uso |
|---|---|---|---|
| `--bg` | `#0A1628` Night Flight | `#F6F8FC` Chart Paper | Fondo |
| `--surface` | `#111F38` | `#FFFFFF` | Tarjetas |
| `--text` | `#E8EEF8` (15,6:1) | `#0F1B2D` (16,3:1) | Texto principal |
| `--text-muted` | `#9AA8C0` (6,8:1) | `#55617A` (6,2:1) | Texto secundario |
| `--primary` | `#5B9BFF` (6,5:1) | `#1F6FEB` (4,6:1) | Marca, enlaces, botones |

### Semánticos (filosofía de cabina)

| Token | Oscuro | Claro | Significado |
|---|---|---|---|
| `--cyan` | `#22D3EE` (10,0:1) | `#0E7490` (5,4:1) | Interactivo / seleccionable |
| `--magenta` | `#E25CF0` (6,1:1) | `#A21CAF` (6,3:1) | Objetivo, ruta, progreso activo |
| `--green` | `#34D399` (9,4:1) | `#047857` (5,5:1) | Correcto / normal |
| `--amber` | `#F5A524` (8,9:1) | `#B45309` (5,0:1) | Precaución / repasar |
| `--red` | `#FF5C5C` (6,0:1) | `#C62828` (5,6:1) | Error / aviso |

**Accesibilidad:** el color nunca es el único indicador. Cada estado lleva también un icono y un texto, algo importante, por ejemplo, para las categorías de vuelo VFR/MVFR/IFR/LIFR del decodificador METAR.

## 7. Tipografías

Todas con licencia **SIL Open Font License** y **alojadas en el propio sitio** (sin llamadas a Google Fonts, para evitar transferir IP de visitantes a terceros, algo relevante con el RGPD).

| Rol | Fuente | Uso |
|---|---|---|
| Display / títulos | **Space Grotesk** | Hero, títulos, logotipo |
| Texto e interfaz | **Inter** | Lecciones, menús, formularios |
| Datos y códigos | **JetBrains Mono** | METAR, TAF, frecuencias, acrónimos, valores de instrumentos |

Escala tipográfica fluida (`clamp()`), base de 16 px y altura de línea de 1,6 para lectura larga.

## 8. Iconografía

- **Interfaz general:** [Lucide](https://lucide.dev) (licencia ISC), con trazo de 1,75 px.
- **Set aeronáutico propio** (SVG, mismo trazo y retícula de 24 px): aeronave vista superior, pista, manga de viento, rosa de vientos, nube por cobertura (FEW/SCT/BKN/OVC), torre de control, auriculares ATC, carta, altímetro, ILS, TCP, puerta de embarque, push-back, deshielo.
- Los iconos de cobertura de nubes siguen la idea de los **octas**, de modo que sean didácticos además de decorativos.

## 9. Estilo gráfico

- **Ilustraciones:** vectoriales de línea fina con rellenos planos, estilo "esquema técnico amable". Siempre originales.
- **Fotografía:** solo con licencia libre verificada (Wikimedia Commons con atribución, o fotos propias o cedidas por escrito). Cada imagen guarda autor, licencia y URL de origen en sus datos.
- **Animación:** microinteracciones de 150–250 ms; nada esencial depende de la animación y se respeta `prefers-reduced-motion`.
- **Componentes firma:**
  - *Tarjeta "boarding pass"* para cursos (origen → destino = nivel inicial → nivel final).
  - *Panel tipo FIDS* para estadísticas y logros.
  - *Barra de progreso tipo senda de planeo* para el avance de los itinerarios.
