# Dezhonger Content

A single repository for Dezhonger's independently addressed content sites:

- `knowledge.dezhonger.com`: bilingual technical knowledge, powered by VitePress.
- `puzzle.dezhonger.com`: personal puzzle library and mathematical problem notebook, powered by VitePress.
- `guwen.dezhonger.com`: Chinese classical literature, powered by VitePress.
- `zmq.dezhonger.com` and `rby.dezhonger.com`: original illustrated theme pages.
- `math.dezhonger.com` and `algo.dezhonger.com`: mathematics, algorithms, machine learning and LLM learning paths.
- `english.dezhonger.com`, `biology.dezhonger.com`, `geography.dezhonger.com`, `physics.dezhonger.com`, `chemistry.dezhonger.com` and `history.dezhonger.com`: junior/senior subject learning sites; science sites include competition paths and Chemistry includes an interactive periodic table.

## Local development

```bash
npm ci
npm run dev
```

The Knowledge dev server runs at `/`. Run `npm run dev:guwen` for the classical literature site or `npm run dev:puzzle` for the Puzzle Library.

## Build

```bash
npm run build
npm run build:guwen
npm run build:puzzle
# or build every site
npm run build:all
```

The generated VitePress sites are written to `docs/.vitepress/dist`, `guwen/.vitepress/dist`, and `puzzle/.vitepress/dist`.

## Add a puzzle

Puzzle and note content is intentionally static and versioned with the repository.

1. Add a Markdown page under `puzzle/puzzles/` or `puzzle/notes/`.
2. Add its structured metadata to `puzzle/.vitepress/theme/data/catalog.ts`.
3. Use the `puzzle` or `note` layout in frontmatter.
4. Run `npm run build:puzzle` and browse the archive, detail page, search, hints, solution, light mode, and dark mode.

## Add an article

1. Add the English Markdown source under `docs/<section>/<slug>.md`.
2. Add the matching Chinese source under `docs/zh/<section>/<slug>.md`.
3. Register both pages in `englishSidebar` and `chineseSidebar` in `docs/.vitepress/config.mts`.
4. Run `npm run build`, then preview the result with `npm run preview`.

Each article starts with VitePress frontmatter:

```markdown
---
title: Article title
description: A short description used by the page metadata and search index.
---

# Article title
```

The local search index is regenerated automatically during `npm run build`; no database or manual indexing step is required.

## Add a classical Chinese article

The textbook catalog and original texts are stored in `guwen/data/works.json`.

1. Edit the matching work in `guwen/data/works.json`.
2. Run `npm run build:guwen`; individual Markdown pages, book indexes, sidebars, and local full-text search are regenerated automatically.
3. Run `npm run sync:guwen` only when the complete textbook catalog needs to be refreshed, then review the generated diff before committing.

The static subject sites live under `sites/`. Each hostname keeps its generated `index.html` and independent topic pages. Run `npm run generate:subjects` after editing the curriculum sources.

- Mathematics is defined in `scripts/math-curriculum.mjs`: 7 paths, 31 chapters and 227 detailed topics.
- The other subjects use `scripts/subject-data.mjs` plus `scripts/subject-expansions.mjs`.
- Each subject has its own visual language. Shared files only provide navigation, accessibility and responsive foundations.
- Chemistry additionally loads `elements.js`; the checked-in element data was generated from PubChem's public periodic-table JSON with `npm run generate:elements`.
- English includes a static vocabulary review tool for CET-4, CET-6, IELTS, TOEFL, TEM-4 and TEM-8. Review progress stays in browser `localStorage` and does not use the server database.

The compact English vocabulary JSON is generated from the MIT-licensed [ECDICT](https://github.com/skywind3000/ECDICT) dataset. The repository contains the runtime subset and license, not the upstream 60 MB CSV. To refresh it:

```bash
npm run generate:vocabulary -- /path/to/ecdict.csv
```

CET-4, CET-6, IELTS and TOEFL use ECDICT's source tags. TEM-4 and TEM-8 are explicitly described in the UI as non-official review pools derived from licensed entries and corpus frequency.

## Deployment

The repository is deployed under `~/knowledge` with Docker Compose. Its single `knowledge` container joins the external `dezhonger-edge` network and selects a site from the incoming `Host` header. The public Nginx service in `dezhonger-service` terminates HTTPS and forwards the content domains to this container.
