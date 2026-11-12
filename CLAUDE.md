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
