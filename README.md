# Dezhonger Content

A single repository for Dezhonger's independently addressed content sites:

- `knowledge.dezhonger.com`: bilingual technical knowledge, powered by VitePress.
- `guwen.dezhonger.com`: Chinese classical literature, powered by VitePress.
- `zmq.dezhonger.com` and `rby.dezhonger.com`: original illustrated theme pages.
- `math.dezhonger.com` and `algo.dezhonger.com`: subject indexes and future article entry points.

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

1. Add one Markdown file under `guwen/junior/` or `guwen/senior/`, grouped by `classical` and `poetry`.
2. Add its title and link to `guwen/.vitepress/config.mts`.
3. Run `npm run build:guwen`; the page and local full-text search index are generated automatically.

The four simple sites live under `sites/`. Each hostname keeps its own `index.html`, while all four share `sites/shared/base.css`.

## Deployment

The repository is deployed under `~/knowledge` with Docker Compose. Its single `knowledge` container joins the external `dezhonger-edge` network and selects a site from the incoming `Host` header. The public Nginx service in `dezhonger-service` terminates HTTPS and forwards the content domains to this container.
