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

## FASE 3 — Contenido ✅

**Bloque 1 — Diccionario ✅ (12/11/2026)**
- [x] Colecciones validadas en compilación (`src/content.config.ts`): diccionario y registro de fuentes.
- [x] 73 entradas (33 abreviaturas, incluidas todas las del brief, y 40 términos), todas como `draft` con fuentes.
- [x] Página del diccionario: búsqueda EN/ES sin tildes, filtros por categoría (enlazables con `?cat=`), índice A–Z, favoritos y búsquedas recientes.
- [x] Una página por entrada en ES y EN: definición técnica separada de la explicación sencilla, ejemplo, pronunciación con audio (Web Speech API), sinónimos, relacionados, diferencias regionales y fuentes.
- [x] Página de abreviaturas y acrónimos con filtro.
- [x] Portada: buscador con autocompletado y término del día.
- [x] Ampliar hasta 150 términos y 100 acrónimos (13/11/2026). Progreso (13/11/2026): 29 acrónimos nuevos de navegación (ADF, NDB, GNSS, RNAV, RNP, PBN), meteorología y reglas (VMC, IMC, SIGMET, AIRMET), aproximación (MDA/MDH, DA/DH), espacio aéreo (FIR, CTR, TMA, ACC, AIP), pesos (MTOW, MLW, MZFW), operaciones (ETOPS, EFB) y sistemas (ELT, FDR, CVR, ADS-B, SELCAL, VHF, CAS): 134 entradas, 78 acrónimos. Segunda tanda: AGL, AMSL, MSA, TOGA, TOD, V1, VR, V2, NM, KT, PAPI, LVP, EICAS, ECAM, PFD, ND, FCU, MCP, ACARS, CPDLC, SSR, PF y PM: 157 entradas, 101 acrónimos (objetivo de acrónimos cumplido). Términos, primera tanda: guiñada, cabeceo, alabeo, piloto automático, transpondedor, engelamiento, deshielo, corriente en chorro, cumulonimbo, niebla, visibilidad, viento de cara y de cola, rodaje, puesto de estacionamiento, pasarela, señalero, hoja de carga, aeronavegabilidad, habilitación de tipo, amerizaje, despresurización, presurización, salida de emergencia, galley, turbofán, hélice e impacto con aves: 185 entradas, 84 términos. Segunda tanda (29): separación, guiado vectorial, torre, indicativo, aproximación frustrada, roger, wilco, afirmativo, punto de recorrido, marcación, derrota, declinación magnética, ortodrómica, velocidad respecto al suelo, trayectoria de planeo, localizador, punto de espera, incursión en pista, aeródromo, mantenimiento de línea, inspección exterior, directiva de aeronavegabilidad, control de seguridad, pasajero perturbador, planeador, código compartido, slot, sobreventa y escala: 214 entradas, 113 términos. Tercera tanda (37): estabilizadores vertical y horizontal, bordes de ataque y de salida, fly-by-wire, sistema hidráulico, inversor de empuje, vaciado de combustible, tubo pitot, indicador de actitud, radar meteorológico, centro de gravedad, diedro, flecha, ángulo de inclinación, plan de vuelo, aeródromo de alternativa, las fases despegue, ascenso, crucero, descenso, aproximación, recogida, toma de contacto y aterrizaje, carro de servicio, señal de cinturones, chaleco salvavidas, máscara de oxígeno, repostaje, catering, toma y despegue, circuito de tránsito, piloto al mando, licencia, combustible de reserva final y tren de morro: 251 entradas, 150 términos y 101 acrónimos (objetivo cumplido).

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
- [x] Boeing 767 (767-300ER, 767-400ER y 767-300F) y Boeing 777 (777-200ER, 777-200LR, 777-300ER y 777F) (13/11/2026), con los manuales de planificación aeroportuaria de Boeing (diciembre de 2024), las páginas actuales del 767 Freighter y del 777, y SKYbrary para las dimensiones y los motores de los 767 de pasajeros; 4 fotos por familia (winglets del 767, bogies de seis ruedas y cono de cola en «hoja» del 777). Las 15 familias del brief ya están en el Hangar. El 767-200/-200ER queda pendiente de una fuente que asigne los motores a cada versión.

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
- [ ] Módulos 3–17 de la Academia de pilotos (en curso: ver «Ampliación de las academias»).

**Bloque 7 — Academia de TCP, módulos 1–3 ✅ (13/11/2026)**
- [x] Módulo 1 *Introducción a la profesión de TCP*: función de la tripulación de cabina y número mínimo (ORO.CC.100), certificado de TCP según la parte CC y formación del operador, autoridad a bordo y comunicación con la cabina de vuelo.
- [x] Módulo 2 *Familiarización con la aeronave*: distribución de la cabina, puertas y salidas (armado/desarmado, regla de los 90 segundos) y equipo de emergencia.
- [x] Módulo 3 *Seguridad en cabina*: comprobaciones previas y cabina asegurada, información de seguridad a los pasajeros (AMC1 CAT.OP.MPA.170), asientos junto a salidas y turbulencia.
- [x] 9 lecciones ES/EN con el aviso «el manual del operador prevalece» y 42 preguntas con evaluación final por módulo.
- [x] Diccionario: 8 entradas nuevas (SCCM, CCA, rampa de evacuación, PBE, posición de impacto, demostración de seguridad, PSU y turbulencia): 105 entradas.
- [ ] Módulos 4–15 de la Academia de TCP (en curso: ver «Ampliación de las academias»).

**Bloque 8 — Fuentes y bibliografía ✅ (13/11/2026)**
- [x] Página global de fuentes (`/es/fuentes/`, `/en/sources/`): las 127 fuentes del registro agrupadas por tipo (norma, reglamento, AIP, manual, glosario, fabricante, página web), con editor, enlace, licencia y, desplegable, los contenidos que se apoyan en cada una (entradas del diccionario, lecciones, cursos, familias del Hangar, hitos de la cronología y códigos del glosario meteorológico) enlazados. Filtro por título o editor sin tildes y anclas por fuente (`#src-<id>`). Lógica en `src/lib/sources/bibliography.js` con 6 tests y e2e.

Objetivos mínimos de la fase cumplidos (13/11/2026). Quedan como ampliación continua los módulos 3+ de la Academia de pilotos, los módulos 4–15 de TCP, más términos y las versiones de aeronaves que aún no tienen fuente oficial comprobada.


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

## FASE 5 — Experiencia de usuario ✅

Panel de usuario, XP, metas diarias, rachas, insignias (*First Flight*, *METAR Master*, *ATC Communicator*…), estadísticas, favoritos, historial, revisión de errores, cabina interactiva (Airbus y Boeing por separado), diagramas de aeropuerto y optimización móvil.

**Progreso**
- [x] **Bloque 1 — XP, meta diaria, rachas e insignias (13/11/2026):** motor puro en `src/lib/gamification/engine.js` (eventos `lesson`, `course`, `quiz`, `practice`, `flashcard`): 50 XP por lección y 100 por curso la primera vez, 10 por pregunta acertada por primera vez, 2 por acierto en las prácticas (máx. 40 al día por práctica) y 1 por flashcard repasada (máx. 30 al día), así que repetir no infla los puntos. Meta diaria configurable (20/50/100/200 XP), racha por días locales con XP y 9 insignias (*Primer vuelo*, *Entusiasta de la aviación*, *Piloto en formación*, *TCP preparado*, *Maestro del METAR*, *Comunicador ATC*, *Experto en aeronaves*, *Una semana en vuelo* y *Maestro de la aviación*) con reglas que leen solo el estado guardado. Esquema del almacenamiento v3 con migración (lo ya completado recibe sus XP una vez, sin contar para la racha). Aviso emergente accesible al ganar XP o insignias y panel con XP, XP de hoy, rachas, lecciones y cursos, meta diaria, últimos 7 días, insignias con cómo conseguirlas, aciertos por práctica y actividad reciente. 17 tests unitarios y e2e.
- [x] **Bloque 2 — Repaso de errores e historial (13/11/2026):** página `/es/panel/repaso/` · `/en/dashboard/review/`, enlazada desde el panel con el número de preguntas pendientes. Lista las preguntas de los cuestionarios cuya última respuesta fue incorrecta (la más reciente primero) para responderlas otra vez con su explicación y enlace a la lección; al acertarla se guarda con el mismo id que en la lección y sale de la lista. Incluye acierto global en cuestionarios y el historial de lecciones completadas agrupado por días, con la nota del cuestionario. Selectores puros en `src/lib/review/review.js` con 4 tests y e2e.
- [x] **Bloque 5 — Cabina de vuelo interactiva (13/11/2026):** herramienta `/es/herramientas/cabina-de-vuelo/` con dos esquemas por zonas (panel superior, visera, panel de instrumentos y pedestal), uno del Airbus A320 y otro de Boeing (lo común al 737 y al 787, con sus diferencias). Cada elemento (11 en Airbus, 9 en Boeing) explica qué es, en qué se diferencia del otro fabricante, enlaza al diccionario y cita sus fuentes: informe de la Universidad de Michigan para la FAA sobre las cabinas del 737-500, 787, A320 y A350 (2024), presentación ICAO/Airbus sobre la filosofía de cabina, SKYbrary (ECAM, EICAS, EFIS, FCU, MCP, MCDU, autothrottle, leyes de control), AOPA y LibreTexts. Modo «¿Dónde está…?» que guarda aciertos como práctica. Datos en `src/content/cockpits/cockpits.json` (en borrador), lógica en `src/lib/cockpit/cockpit.js` con 5 tests y e2e. 7 entradas nuevas en el diccionario (MCDU, QRH, minipalanca, columna de mando, autothrottle, panel superior y visera).

Objetivos de la fase cumplidos (13/11/2026). La fase 6 (publicación de la v1.0) espera la decisión del propietario del proyecto.
- [x] **Bloque 3 — Diagramas de aeropuerto (13/11/2026):** herramienta `/es/herramientas/diagramas-de-aeropuerto/` con las pistas de 4362 aeropuertos (6149 pistas abiertas con coordenadas de OurAirports, dominio público, generadas con `scripts/build-runways.mjs` y servidas en 26 ficheros por inicial del código IATA que se descargan solo al buscar). Dibujo SVG a escala con el norte arriba, designadores en cada cabecera sin solaparse, flecha de norte y escala; tabla con longitud y anchura (m y ft), superficie y rumbo verdadero calculado; explicación de cómo se numeran las pistas (Anexo 14 de la OACI) con un ejemplo del propio aeropuerto y enlaces al diccionario; enlace desde el buscador de aeropuertos. Aviso de que no es una carta de aeródromo. Geometría en `src/lib/airports/runways.js` con 8 tests y e2e.
- [x] **Bloque 4 — Optimización móvil (13/11/2026):** revisión automática de las 681 páginas a 360 px de ancho: ninguna se desplaza en horizontal. Corregidos los textos ocultos para lectores de pantalla dentro de tablas con desplazamiento (ensanchaban la página del Hangar y del comparador), las rejillas y `fieldset` que no podían encogerse (lecciones de descodificación completa, buscador y diagramas, 404, guía de estilo) y los objetivos táctiles de menos de 24 px (pie, acrónimos, fuentes). Nueva prueba e2e móvil que lo vigila en 14 páginas representativas. Lighthouse móvil: 100 en rendimiento, accesibilidad, buenas prácticas y SEO en inicio, lección, diagramas y panel.

**Apuntes de la Academia (13/11/2026, a petición del propietario)**
- [x] Nuevo apartado `/es/academia/apuntes/` · `/en/academy/notes/`, enlazado desde la Academia y desde cada curso: para cada uno de los 8 cursos, la idea clave y de 3 a 5 puntos principales de cada una de sus 41 lecciones, en español e inglés, sin cuestionarios. Cada lección enlaza a la completa y a sus términos del diccionario; las fuentes son las de las lecciones. Versión para imprimir o guardar en PDF. Datos en `src/content/notes/` (colección `notes`, en borrador), con tests que exigen una entrada por lección en el orden del curso, y e2e.

**Ampliación de las academias (13/11/2026, a petición del propietario)**

Objetivo: cubrir todos los módulos del brief (§6 y §7) con un nivel más alto (examen teórico de piloto, preguntas tipo ATPL; situaciones prácticas y diálogos en TCP), cada uno con sus apuntes. Un PR por bloque.

- [x] **Bloque A — Pilotos, módulos 3–5:** *Conocimiento general de la aeronave* (estructura y fatiga con cargas de la Parte 25, tren y frenos con antideslizante y freno automático, motores de pistón y hélices, turbinas de gas con N1/N2/EGT/EPR y sus fallos, operación de reactores con temperatura supuesta frente a derrateo), *Sistemas de la aeronave* (hidráulico, eléctrico, combustible, neumática y presurización, hielo y lluvia, incendios y oxígeno) e *Instrumentos de vuelo* (pitot-estático y obstrucciones, velocidades, altimetría con cálculos de error, giróscopos, brújula, cabina digital con TAWS y TCAS). 17 lecciones ES/EN, 114 preguntas, apuntes de cada lección y 18 entradas nuevas en el diccionario (12 términos y 6 siglas: aire sangrado, RAT, IDG, EGT, índice de derivación, antideslizante, freno automático, válvula de descarga, altitud de cabina, toma estática, VSI, brújula magnética, giróscopo, AHRS, ADC, EFIS, hélice de velocidad constante y pérdida del compresor). Fuentes: PHAK, AFH e Instrument Flying Handbook de la FAA, manual de técnicos de mantenimiento (célula y motor), 14 CFR Parte 25 y § 1.1, AC 25-13 y AC 120-60, PANS-OPS, SKYbrary, AOPA y la norma CAN/CGSB-3.23 del combustible.
- [ ] Bloque B — TCP, módulos 4–6 (procedimientos de emergencia, primeros auxilios, seguridad de la aviación).
- [ ] Bloques siguientes — Pilotos, módulos 6–17; TCP, módulos 7–15.

## FASE 6 — Publicación 🚧

Auditoría completa (enlaces, JS, accesibilidad, responsive), SEO (sitemap, datos estructurados `DefinedTerm` para el diccionario, Open Graph por página), rendimiento, dominio propio opcional y versión 1.0.

**Progreso**
- [x] **Bloque 1 — SEO (13/11/2026):** `sitemap.xml` con las 696 páginas y sus alternativas hreflang, generado tras cada build a partir de lo que declara cada página (`scripts/build-sitemap.mjs`); datos estructurados schema.org en JSON-LD: `DefinedTerm` en cada entrada del diccionario (con la expansión de los acrónimos como `alternateName`), `DefinedTermSet` en el diccionario, `Course` en los cursos, `WebSite` en la portada y `BreadcrumbList` en todas las páginas con migas; Open Graph completo con imagen de 1200×630 por idioma (`scripts/og-image.mjs`, `npm run og:image`) y la foto principal en cada familia del Hangar, `og:locale:alternate` y tarjeta grande de Twitter/X. `check:site` comprueba ahora que cada página tenga `og:image` existente, que el JSON-LD sea válido y que el sitemap solo liste páginas que existen. Nota: en un sitio de proyecto de GitHub Pages no se puede publicar `robots.txt` en la raíz del dominio; el sitemap se puede enviar a los buscadores cuando haya cuenta de Search Console (fuera de alcance por ahora).
- [x] **Bloque 2 — Auditoría (13/11/2026):** axe-core (reglas WCAG 2.2 A/AA) sobre 187 páginas, una de cada plantilla y todas las que no son entradas del diccionario, en tema oscuro y claro, sin errores de JavaScript en consola. Único problema encontrado y corregido: zonas con desplazamiento horizontal sin acceso por teclado (tablas del Hangar, comparador, acrónimos, buscadores, decodificadores, glosario, panel y lecciones); ahora son regiones enfocables con nombre accesible, y los códigos METAR/TAF de cuestionarios y lecciones se parten en líneas en vez de desplazarse. Nueva prueba e2e `a11y.spec.js` con 19 páginas representativas en los dos temas. Enlaces internos e imágenes ya los vigila `check:site`; móvil, la prueba de 360 px de la fase 5; Lighthouse: 97–100 en rendimiento y 100 en accesibilidad, buenas prácticas y SEO en las páginas medidas.
- [ ] ~~Versión 1.0~~: descartada por ahora por decisión del propietario (13/11/2026). El sitio sigue en GitHub Pages sin lanzamiento formal ni etiqueta de versión; el trabajo continúa con la ampliación de las academias.

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
