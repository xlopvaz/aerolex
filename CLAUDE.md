# AeroLex — reglas de trabajo del proyecto

Plataforma educativa aeronáutica bilingüe (ES/EN) publicada en GitHub Pages.
- Brief completo: `docs/00-master-prompt.md`
- Decisiones tomadas: `docs/01` a `docs/05`

Léelos antes de cambiar nada.

## Reglas

1. Trabajar por fases (`docs/04-hoja-de-ruta.md`). No empezar una fase sin la anterior funcional y con CI en verde.
2. No inventar contenido aeronáutico: cada dato técnico lleva `sources` y estado `review`. El contenido nuevo redactado con IA entra como `draft`.
3. Separar datos (`src/content/`), lógica (`src/lib/`) y presentación (`src/components/`, `src/styles/`). Nada de textos visibles fijados en el código: todo pasa por `src/i18n/` o `src/content/`.
4. Bilingüismo completo: todo campo de texto es `{ "es": …, "en": … }` y ambos idiomas son obligatorios.
5. El progreso del usuario se guarda por `id` de contenido, nunca por URL ni idioma.
6. No eliminar funcionalidades existentes; revisar dependencias antes de modificar.
7. Sin botones decorativos ni tarjetas vacías: lo que no funciona o no tiene contenido real no se publica.
8. No inventar APIs ni claves. Distinguir siempre datos en directo de ejemplos didácticos.
9. Herramientas: aviso "educativo, no operacional"; cálculos y parseos con tests unitarios.
10. Rutas internas siempre a través del helper que añade el `base` de GitHub Pages (`/aerolex`).
11. Accesibilidad WCAG 2.2 AA y respeto de `prefers-reduced-motion`.
12. Al crear un archivo, indicar su ruta y para qué sirve; al modificarlo, entregar el archivo completo actualizado.

## Comandos

```bash
npm run dev          # servidor local → http://localhost:4321/aerolex/
npm test             # tests unitarios (Vitest)
npm run build        # compila a dist/
npm run check:site   # revisa el sitio compilado (enlaces, hreflang, páginas vacías)
npm run e2e          # tests de extremo a extremo (Playwright; necesita el build)
```

## Añadir una página

1. Registrarla en `src/i18n/routes.js` (clave + slug ES/EN + dónde aparece en la navegación).
2. Crear su vista en `src/views/` y añadirla al mapa `VIEWS` de `src/pages/[lang]/[...slug].astro`.
3. Añadir sus textos en `src/i18n/ui/es.json` y `en.json`. El test de paridad falla si falta alguno.

## Añadir un término al diccionario

1. Crear `src/content/dictionary/<id>.json` (id en inglés, en minúsculas y con guiones) siguiendo el esquema de `src/content.config.ts`. Todos los textos van en ES y EN.
2. Cada entrada cita al menos una fuente de `src/content/sources/sources.json` (añadirla allí si es nueva) y entra con `review.status: "draft"`.
3. `definitionBasis: "official"` solo si se parafrasea una definición oficial; nunca copiar literalmente documentos con derechos (ICAO, IATA…).
4. `npm test` valida los campos, las categorías, los `related` y las fuentes.

## Añadir un curso o una lección

1. Curso: `src/content/courses/<id>.json` (itinerario de `src/content/paths/paths.json`, nivel, títulos ES/EN, objetivos, orden de lecciones, fuentes).
2. Lección: dos ficheros `src/content/lessons/<curso>/<nn>-<lección>.es.mdx` y `.en.mdx` con el mismo `lesson`, `quiz`, `terms` y `sources`.
3. Dentro de la lección se pueden usar `<Term id="…">`, `<MetarBreakdown parts={[…]}>` y `<Callout type="…" label="…">`. Los ejemplos inventados se marcan como didácticos.
4. Cuestionario: `src/content/quizzes/<id>.json` con preguntas bilingües, `answer` y `explanation`.

## Añadir una familia de aeronaves

1. `src/content/aircraft/<id>.json` siguiendo el esquema `aircraft` de `src/content.config.ts`.
2. Cada cifra sale de la documentación oficial citada en `sources` de esa variante (y la fuente también figura en las de la familia). Si la fuente no da un valor, se deja `null`: nunca se estima.
3. Las conversiones de unidades se hacen en pantalla (`src/lib/units/convert.js`), no en los datos.

## Flujo de trabajo

Un PR por bloque de trabajo. El workflow `CI & Deploy` debe estar en verde antes de fusionar; al fusionar en `main` se publica solo.
