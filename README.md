# ✈️ AeroLex

**Learn the language of the sky.**

🌐 **Website:** [xlopvaz.github.io/aerolex](https://xlopvaz.github.io/aerolex/)

AeroLex is a fully bilingual (English / Spanish) interactive learning platform for aviation. It brings together an aviation academy, a professional technical dictionary, an aircraft encyclopedia and a lab of hands-on tools (METAR/TAF decoders, ATC phraseology trainer, unit converters and more).

It's built for student pilots, pilots, cabin crew, aviation professionals, AvGeeks and anyone curious about how aviation works.

> ⚠️ AeroLex is an educational project. It does not replace approved training, aircraft flight manuals, operator manuals or current official documentation.

## Project status

| Phase | Status |
|---|---|
| 1 · Planning | ✅ Done |
| 2 · Design & foundation | ✅ Done |
| 3 · Content | ✅ Done: dictionary (150 terms, 101 abbreviations), academy (METAR, TAF, aviation fundamentals, pilot and cabin crew modules), Hangar (15 families with photos) and global sources page; content keeps growing |
| 4 · Tools | ✅ Done: METAR/TAF decoders, practice, live METAR/TAF, unit converter, airport finder, ATC phraseology trainer, aircraft game, flashcards, weather glossary and aviation timeline |
| 5 · User experience | 🚧 In progress: XP, daily goal, streaks, badges, learning statistics, mistake review, study history, airport diagrams and mobile pass live |
| 6 · Launch | ⏳ Planned |

## Documentation

The project documentation is written in Spanish.

| Document | Contents |
|---|---|
| [01 · Brand identity](docs/01-identidad-de-marca.md) | Name, concept, tagline, logo, colour palette, typography, iconography |
| [02 · Technical architecture](docs/02-arquitectura-tecnica.md) | Stack, folder structure, data model, i18n, search, METAR engine, deployment |
| [03 · Navigation & UX](docs/03-navegacion-y-ux.md) | Sitemap, menus, homepage, components |
| [04 · Roadmap](docs/04-hoja-de-ruta.md) | Phases, deliverables, definition of done, decisions |
| [05 · Sources & reliability](docs/05-fuentes-y-fiabilidad.md) | Source hierarchy, copyright, review workflow |

## Tech stack

[Astro](https://astro.build) (static site) · HTML5 · CSS3 · JavaScript ES6+ · JSON · LocalStorage · Vitest · Playwright · GitHub Actions → **GitHub Pages**

## Development

```bash
npm install
npm run dev          # http://localhost:4321/aerolex/
npm test             # unit tests
npm run build        # build to dist/
npm run check:site   # links, hreflang and empty-page checks on the build
npm run e2e          # end-to-end tests (after building)
```

Every pull request runs all checks; merging into `main` deploys to GitHub Pages automatically.

## License

To be defined: one licence for the code (e.g. MIT) and another for the content (e.g. CC BY-SA 4.0).
