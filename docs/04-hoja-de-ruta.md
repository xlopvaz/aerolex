# 04 · Hoja de ruta

> Regla del proyecto: **no se avanza de fase sin dejar la anterior funcional** (todas las comprobaciones de CI en verde).

Cada fase se entrega mediante *pull requests* pequeños y revisables. Las cifras de contenido son objetivos mínimos **verificados**, no textos de relleno.

---

## FASE 1 — Planificación ✅ (este PR)

- [x] Análisis del proyecto completo
- [x] Propuesta de nombres y recomendación → [01-identidad-de-marca.md](01-identidad-de-marca.md)
- [x] Identidad visual: concepto, eslogan, logotipo, paleta (con contraste comprobado), tipografías, iconografía
- [x] Arquitectura técnica y modelo de datos → [02-arquitectura-tecnica.md](02-arquitectura-tecnica.md)
- [x] Navegación, mapa del sitio y página de inicio → [03-navegacion-y-ux.md](03-navegacion-y-ux.md)
- [x] Política de fuentes y fiabilidad → [05-fuentes-y-fiabilidad.md](05-fuentes-y-fiabilidad.md)
- [x] Decisiones cerradas (ver final de este documento)

## FASE 2 — Diseño y esqueleto ✅

- [x] Proyecto Astro, GitHub Action de despliegue (`.github/workflows/deploy.yml`) → la web se publica sola al fusionar en `main`.
- [x] `tokens.css` y temas claro/oscuro: recuerda la preferencia y respeta `prefers-color-scheme`, sin parpadeo al cargar.
- [x] Logotipo y favicon SVG propios; iconos Lucide incrustados en la compilación.
- [x] Sistema i18n: rutas `/es/` y `/en/` con slugs traducidos, selector ES/EN que lleva a la página equivalente, `hreflang`, redirección inicial según el navegador.
- [x] Layouts y biblioteca de componentes base, con página de muestra (`/es/guia-de-estilo/`, `/en/styleguide/`).
- [x] Cabecera, barra inferior móvil, pie con aviso educativo, 404 bilingüe. *El mega-menú se añadirá en la Fase 3, cuando existan las secciones que debe listar (no se publican menús vacíos).*
- [x] `store` con LocalStorageAdapter (con respaldo en memoria), migraciones, sincronización entre pestañas y exportar/importar/borrar desde el panel.
- [x] Portada con bloques de contenido real: hero, tres pilares, plan de vuelo (estado real del proyecto) y política de fuentes.
- [x] CI: Vitest (21 tests), comprobador del sitio compilado (enlaces, hreflang, páginas vacías) y Playwright (idioma, tema, panel, componentes, 404, móvil).
- [x] Lighthouse: 100 en rendimiento, accesibilidad, buenas prácticas y SEO en las páginas medidas (12/11/2026).

**Hecho cuando:** se publica en `xlopvaz.github.io/aerolex/`, el cambio de idioma y de tema funciona en todas las páginas, no hay enlaces rotos y Lighthouse da ≥ 90.

## FASE 3 — Contenido 🚧

**Bloque 1 — Diccionario ✅ (12/11/2026)**
- [x] Colecciones validadas en compilación (`src/content.config.ts`): diccionario y registro de fuentes.
- [x] 73 entradas (33 abreviaturas, incluidas todas las del brief, y 40 términos), todas como `draft` con fuentes.
- [x] Página del diccionario: búsqueda EN/ES sin tildes, filtros por categoría (enlazables con `?cat=`), índice A–Z, favoritos y búsquedas recientes.
- [x] Una página por entrada en ES y EN: definición técnica separada de la explicación sencilla, ejemplo, pronunciación con audio (Web Speech API), sinónimos, relacionados, diferencias regionales y fuentes.
- [x] Página de abreviaturas y acrónimos con filtro.
- [x] Portada: buscador con autocompletado y término del día.
- [ ] Ampliar hasta 150 términos y 100 acrónimos.

**Bloque 2 — Academia y curso METAR y SPECI ✅ (13/11/2026)**
- [x] Colecciones de itinerarios, cursos, lecciones (MDX, una por idioma) y cuestionarios, validadas en compilación.
- [x] Academia: solo muestra los itinerarios con contenido; página de curso con objetivos, lecciones y progreso; página de lección con índice, términos clave enlazados al diccionario, cuestionario y navegación.
- [x] Cuestionarios con corrección inmediata, explicación, puntuación, historial de respuestas y repetición de las falladas.
- [x] Progreso por ID (compartido entre idiomas), visible en el curso, la academia y el panel.
- [x] Curso METAR y SPECI: 9 lecciones ES/EN, 34 preguntas y evaluación final; ejemplos didácticos marcados como tales.

**Bloque 3 — Academia TAF ✅ (13/11/2026)**
- [x] Curso TAF (nivel Elementary): 6 lecciones ES/EN (qué es un TAF, cabecera y validez, condiciones previstas, FM/BECMG/TEMPO, PROB/TX/TN/NSW y decodificación completa con línea temporal), 23 preguntas y evaluación final.
- [x] Diccionario: nuevas entradas BECMG, TEMPO y NOSIG (77 entradas).

**Bloque 4 — Hangar ✅ (13/11/2026)**
- [x] Colección de aeronaves validada: cada variante tiene sus propias cifras y fuentes; lo que la fuente no publica queda en blanco (—), nunca estimado.
- [x] Familia A320neo (A319neo, A320neo, A321neo, A321LR, A321XLR) con datos de Airbus *Facts & Figures* (nov. 2025) y sus fichas web.
- [x] Familia Boeing 737 (737-700, -800, -900, 737-7, -8, -9, -10) con las fichas técnicas de Boeing y las certificaciones de la FAA de 2026.
- [x] Página del Hangar, página por familia (historia, tabla de variantes, hitos, curiosidades y fuentes) y comparador de 2–3 variantes con unidades métricas/imperiales y URL compartible.
- [x] Familia A350 (A350-900, A350-900ULR, A350-1000, A350F) con Airbus *A350 Facts & Figures* (ene. 2026) y familia Boeing 787 (787-8, -9, -10) con la ficha técnica de Boeing.
- [x] Hito «entrada en servicio» y filas vacías ocultas en las tablas de comparación.
- [x] Familias A220 (A220-100 y -300) y A330 (A330-200, -300, -800 y -900) con las cifras de los Facts & Figures de Airbus de enero y febrero de 2026 (13/11/2026). Donde la fuente no da un valor claro (plazas máximas pendientes de certificación o ilegibles, fechas solo con el año) se deja vacío y se explica en la nota.
- [x] A380 con las cifras de los Facts & Figures de Airbus de enero y febrero de 2022 (fin de producción) y los hitos de entrega y entrada en servicio (13/11/2026).
- [x] Fotografías reales en el Hangar (13/11/2026): 22 fotos con licencia libre de Wikimedia Commons (3–4 por familia), elegidas y revisadas una a una para aprender a reconocer cada avión (perfil, morro, puntas del ala, motores, vista desde abajo), con pie «En qué fijarte» ES/EN, autor y licencia. Las descarga `scripts/photos/fetch-commons.mjs` en GitHub Actions (solo licencias CC0, dominio público, CC BY y CC BY-SA) y se publican reducidas a 1280 y 640 px. Sustituyen a las siluetas genéricas.
- [x] ATR 42-600 y ATR 72-600 (13/11/2026), con las cifras de las páginas y fichas oficiales de ATR, altura y motores según SKYbrary y EASA/FlightGlobal (PW127M y PW127XT-M), y 4 fotos (incluida una de Air Nostrum en Melilla). A330: plazas máximas del -300 (440) y del -800 (406) completadas con las páginas de Airbus.
- [x] Embraer E-Jets E2 (E175-E2, E190-E2, E195-E2) (13/11/2026), con el manual de planificación aeroportuaria de Embraer (dimensiones, motores, plazas máximas) y sus fichas técnicas (alcance, configuraciones, MTOW), y 3 fotos.
- [x] Boeing 777X (777-8, 777-9, 777-8 Freighter) (13/11/2026), con la página actual de Boeing (alcances actualizados) y sus notas de prensa, y 4 fotos (incluida la punta del ala plegable).
- [x] A340 (A340-300, con la página histórica de Airbus) y Boeing 747 (747-8 Intercontinental y 747-8F, con el manual de planificación aeroportuaria de Boeing de enero de 2026) (13/11/2026), con 3 y 4 fotos. Las demás versiones del A340 y del 747 quedan pendientes de fuentes oficiales comprobadas.
- [x] A340-600 (página histórica de Airbus) y Boeing 757-200/-300 (manual de planificación aeroportuaria de Boeing, dic. 2024; dimensiones pendientes porque el manual solo las da en planos), con 4 fotos del 757 (13/11/2026).
- [ ] Resto de familias del brief (767 y los 777 anteriores), con sus fotos.

**Bloque 5 — Introducción a la aviación ✅ (13/11/2026)**
- [x] Curso *Fundamentos de la aviación* (nivel Beginner), primero del itinerario «Introducción a la aviación»: 7 lecciones ES/EN (qué es una aeronave, las cuatro fuerzas, ejes y mandos, fases del vuelo, el aeropuerto, quién dicta las normas, códigos y lenguaje), 32 preguntas y evaluación final.
- [x] Fuentes nuevas: Anexo 7, Docs 7910, 8585 y 8643 de la OACI, taxonomía de fases de vuelo CICTT, historia de la OACI, EASA, FAA, RD 184/2008 (AESA) y buscador de códigos de IATA.
- [x] Diccionario: 10 entradas nuevas (aeronave, empenaje, perfil aerodinámico, compensación, alfabeto fonético, OACI, IATA, EASA, FAA y AESA): 87 entradas.
- [x] `<MetarBreakdown kind="summary">` para resúmenes de contenido real, sin la etiqueta de «ejemplo didáctico».
- [ ] Más cursos del itinerario (historia de la aviación, carreras profesionales, el pasajero y el avión).

**Bloque 6 — Academia de pilotos, módulos 1–2 ✅ (13/11/2026)**
- [x] Módulo 1 *Principios de vuelo* (Intermediate): atmósfera tipo y altitud de densidad, ecuación de la sustentación y velocidades, tipos de resistencia, estabilidad y centro de gravedad, virajes y factor de carga.
- [x] Módulo 2 *Aerodinámica* (Intermediate): geometría del ala, dispositivos hipersustentadores, capa límite, pérdida y efecto suelo, vuelo a alta velocidad y estela turbulenta.
- [x] 10 lecciones ES/EN y 48 preguntas tipo ATPL con evaluación final en cada módulo.
- [x] Diccionario: 10 entradas nuevas (ISA, altitud de densidad, IAS, TAS, factor de carga, resistencia inducida, alargamiento, efecto suelo, estela turbulenta y número de Mach): 97 entradas.
- [x] Orden de los cursos dentro de cada itinerario (`order` en el curso).
- [ ] Módulos 3–17 de la Academia de pilotos.

**Bloque 7 — Academia de TCP, módulos 1–3 ✅ (13/11/2026)**
- [x] Módulo 1 *Introducción a la profesión de TCP*: función de la tripulación de cabina y número mínimo (ORO.CC.100), certificado de TCP según la parte CC y formación del operador, autoridad a bordo y comunicación con la cabina de vuelo.
- [x] Módulo 2 *Familiarización con la aeronave*: distribución de la cabina, puertas y salidas (armado/desarmado, regla de los 90 segundos) y equipo de emergencia.
- [x] Módulo 3 *Seguridad en cabina*: comprobaciones previas y cabina asegurada, información de seguridad a los pasajeros (AMC1 CAT.OP.MPA.170), asientos junto a salidas y turbulencia.
- [x] 9 lecciones ES/EN con el aviso «el manual del operador prevalece» y 42 preguntas con evaluación final por módulo.
- [x] Diccionario: 8 entradas nuevas (SCCM, CCA, rampa de evacuación, PBE, posición de impacto, demostración de seguridad, PSU y turbulencia): 105 entradas.
- [ ] Módulos 4–15 de la Academia de TCP.


| Bloque | Objetivo mínimo de la fase |
|---|---|
| Diccionario | 150 términos completos y 100 acrónimos (incluidos todos los de tu lista), con fuente; buscador con autocompletado, filtros, favoritos e historial |
| Introduction to Aviation | Itinerario completo (Beginner) |
| Pilot Academy | Módulos 1–2 (Principles of Flight, Aerodynamics) con quizzes |
| Cabin Crew Academy | Módulos 1–3 con aviso de "el manual del operador prevalece" |
| Meteorología | Fundamentos y curso METAR & SPECI completo |
| Hangar | Las 15 familias de tu lista, con variantes y fuentes |
| Fuentes | Página de bibliografía global |

El contenido se sigue ampliando de forma continua después de esta fase.

## FASE 4 — Herramientas

1. **METAR Decoder** completo (grupos, errores, visualizaciones, ES/EN) con batería de tests.
2. **TAF Decoder** (FM, BECMG, TEMPO, PROB30/40, TX/TN, línea temporal visual).
3. **METAR & TAF Practice** en 4 niveles.
4. **Live METAR/TAF:** GitHub Action programada que publica JSON de una lista de aeropuertos configurable, con indicador de antigüedad y opción de pegar un mensaje.
5. **Conversor de unidades** (kt↔km/h↔mph, ft↔m, nm↔km, lb↔kg, °C↔°F↔K, hPa↔inHg).
6. **Buscador IATA/ICAO y Airport Explorer** (OurAirports).
7. **ATC Phraseology Trainer y simulador** (rol piloto/controlador, evaluación de readback, TTS).
8. **Aircraft Comparison e Identification Game.**
9. **Motor de quizzes, flashcards y generador de quizzes.**
10. **Weather Glossary, Acronym Dictionary y Aviation Timeline.**

**Progreso**
- [x] **Bloque 1 — Decodificador METAR (13/11/2026):** librería pura `src/lib/metar/` (tokenizador con posiciones, parsers por grupo, máquina de estados con avisos de orden, grupos desconocidos o imposibles señalados sin adivinar, formatos OACI y EE. UU., tendencias y RMK), explicaciones ES/EN desde `src/i18n`, rosa de vientos, perfil de nubes y techo, enlace compartible (`?m=`), ejemplos didácticos en `src/content/samples/metar.json`, 37 tests unitarios y e2e. Nueva sección «Herramientas» que solo lista las herramientas que existen.
- [x] **Bloque 2 — Decodificador TAF (13/11/2026):** `src/lib/taf/` (cabecera, validez, FM/BECMG/TEMPO/PROB30-40, TX/TN, NSW/NSC, cambio de mes), línea temporal SVG, «¿qué se espera a las HH?» aplicando las reglas de FM, BECMG y TEMPO/PROB, avisos (validez fuera de 6–30 h, BECMG de más de 4 h, cambios fuera de la validez, PROB distinto de 30/40), ejemplos didácticos de la Academia TAF, 14 tests unitarios y e2e.
- [x] **Bloque 3 — Práctica METAR y TAF (13/11/2026):** 4 niveles (identificar el grupo, leer el valor, METAR completo, TAF) con preguntas generadas al momento por `src/lib/practice/` a partir de 16 METAR y 6 TAF didácticos y los decodificadores, así que la respuesta correcta siempre coincide con lo que explican; resultados guardados por ID en `store.practice` (esquema v2 con migración); tests que generan 200 preguntas por nivel e idioma.
- [x] **Bloque 4 — Conversor de unidades (13/11/2026):** velocidad, distancia, altitud, masa, presión, volumen de combustible y temperatura, con definiciones exactas en `src/lib/units/converter.js`, coma decimal en español y 18 tests (incluido el viaje de ida y vuelta de todas las parejas).
- [x] **Bloque 5 — METAR/TAF en directo (13/11/2026):** comprobado que la API del Aviation Weather Center no admite CORS, así que se aplica la decisión B: `scripts/fetch-live-weather.mjs` descarga los METAR y TAF de `src/content/live/stations.json` (sin clave ni cuentas) antes de cada despliegue y cada 30 minutos con el workflow programado `live-weather.yml`; la página marca cada informe como «En directo» o «Antiguo (más de 2 h)», muestra un resumen descodificado y enlaza a los decodificadores con la etiqueta de directo. Si la descarga falla, la web sigue publicándose y lo indica.
- [x] **Bloque 6 — Buscador de aeropuertos (13/11/2026):** 5334 aeropuertos con código IATA (grandes, medianos y pequeños con vuelos regulares) generados con `scripts/build-airports.mjs` a partir de OurAirports (dominio público, datos del 13/11/2026); búsqueda por IATA, OACI, nombre o ciudad sin tildes; región OACI por la primera letra, elevación, coordenadas y enlace a OpenStreetMap; datos cargados solo al buscar.
- [x] **Bloque 7 — Entrenador de fraseología ATC (13/11/2026):** dos escenarios didácticos (salida de LEST y llegada a LEMD, con indicativo, SID y frecuencias ficticios), papel de piloto (colación comprobada elemento a elemento por `src/lib/atc/readback.js`, que entiende palabras y cifras: «flight level eight zero» = «FL80») y papel de controlador (detectar la colación errónea), audio con Web Speech API cuando el navegador lo admite, regla de colación de SERA.8015(e) y PANS-ATM, 22 tests.
- [x] **Bloque 8 — ¿Qué avión es? (13/11/2026):** juego de identificación y comparación generado solo con las cifras con fuente del Hangar (`src/lib/aircraft/game.js`): rondas de pistas con una única respuesta posible y rondas de «¿cuál es mayor?» con valores conocidos y distintos; el comparador de variantes del Hangar ya existía. Modo «Por la foto» (13/11/2026): una foto real del Hangar y cuatro familias a elegir; al responder se muestra en qué fijarse para reconocerlo (`photoRound`, con tests).
- [x] **Bloque 9 — Flashcards (13/11/2026):** tarjetas con todo el diccionario, por categoría o con los favoritos, en ambos sentidos EN↔ES, con repetición espaciada de tipo Leitner (`src/lib/srs/leitner.js`: 1, 3, 7, 16 y 35 días) guardada por ID en `store.srs`, atajos de teclado y 5 tests. El motor de cuestionarios ya existía en la academia y en la práctica METAR/TAF.
- [x] **Bloque 10 — Glosario meteorológico y cronología (13/11/2026):** 70 códigos de METAR y TAF en `src/content/weather/codes.json` (tipos de informe, modificadores, intensidad, descriptores, fenómenos, nubes, presión, tendencias y cambios), con fuentes (OMM n.º 306, Anexo 3 de la OACI y AIM de la FAA) y estado borrador; buscador sin tildes y explicador de grupos (`src/lib/weather/glossary.js`, que reutiliza el parser del decodificador METAR: «+TSRA» → fuerte + tormenta + lluvia) con enlace compartible (`?q=`). Cronología de 18 hitos (de 1783 a 2007) en `src/content/timeline/events.json`, cada uno con fuentes, fecha con la precisión que dan las fuentes (día, mes o año), enlaces al diccionario y filtro por tema. El diccionario de acrónimos ya existía. 18 tests unitarios de librerías y de contenido, e2e y Lighthouse 100.

Fase 4 completa: las 18 herramientas del brief (§17) están disponibles en el Laboratorio o en el diccionario y el Hangar.

**Hecho cuando:** cada herramienta tiene tests unitarios de sus cálculos o de su parseo, el aviso "educativo, no operacional" y funciona sin conexión cuando es posible.

## FASE 5 — Experiencia de usuario

Panel de usuario, XP, metas diarias, rachas, insignias (*First Flight*, *METAR Master*, *ATC Communicator*…), estadísticas, favoritos, historial, revisión de errores, cabina interactiva (Airbus y Boeing por separado), diagramas de aeropuerto y optimización móvil.

## FASE 6 — Publicación

Auditoría completa (enlaces, JS, accesibilidad, responsive), SEO (sitemap, datos estructurados `DefinedTerm` para el diccionario, Open Graph por página), rendimiento, dominio propio opcional y versión 1.0.

## Después de la 1.0

Cuentas y sincronización (`RemoteSyncAdapter`), PWA instalable con modo sin conexión, contribuciones de la comunidad con revisión, y más itinerarios, términos y aeronaves.

---

## Decisiones de la Fase 1 (12/11/2026)

| # | Tema | Decisión |
|---|---|---|
| 1 | Nombre | **AeroLex** (pendiente comprobar marcas y dominios antes del lanzamiento público) |
| 2 | Stack | **Astro** + JS/JSON, compilado y desplegado con GitHub Actions |
| 3 | Idioma inicial | **Según el idioma del navegador**; luego se recuerda la elección del usuario |
| 4 | METAR en directo | **Solo GitHub, sin cuentas externas:** Action programada + biblioteca de práctica (ver `02` §8) |
