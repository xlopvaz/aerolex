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
