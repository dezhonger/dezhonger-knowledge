# Dezhonger Content

A single repository for Dezhonger's independently addressed content sites:

- `knowledge.dezhonger.com`: bilingual technical knowledge, powered by VitePress.
- `guwen.dezhonger.com`: Chinese classical literature, powered by VitePress.
- `zmq.dezhonger.com` and `rby.dezhonger.com`: original illustrated theme pages.
- `math.dezhonger.com` and `algo.dezhonger.com`: mathematics, algorithms, machine learning and LLM learning paths.
- `english.dezhonger.com`, `biology.dezhonger.com`, `geography.dezhonger.com`, `physics.dezhonger.com`, `chemistry.dezhonger.com` and `history.dezhonger.com`: junior/senior subject learning sites; science sites include competition paths and Chemistry includes an interactive periodic table.

## Local development

```bash
npm ci
npm run dev
```

The Knowledge dev server runs at `/`. Run `npm run dev:guwen` for the classical literature site.

## Build

```bash
npm run build
npm run build:guwen
# or build both
npm run build:all
```

The generated sites are written to `docs/.vitepress/dist` and `guwen/.vitepress/dist`.

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

The static subject sites live under `sites/`. Each hostname keeps its generated `index.html`; the source curriculum map is in `scripts/subject-data.mjs`. Run `npm run generate:subjects` after editing the map. All subject pages share `sites/shared/subject.css` and `subject.js`; Chemistry additionally loads `elements.js`. The checked-in element data was generated from PubChem's public periodic-table JSON with `npm run generate:elements`.

## Deployment

The repository is deployed under `~/knowledge` with Docker Compose. Its single `knowledge` container joins the external `dezhonger-edge` network and selects a site from the incoming `Host` header. The public Nginx service in `dezhonger-service` terminates HTTPS and forwards the content domains to this container.
