# Dezhonger Knowledge

A bilingual, Markdown-first technical knowledge site for backend systems, computer science, and AI engineering.

## Local development

```bash
npm ci
npm run dev
```

The site uses the `/knowledge/` base path in development and production.

## Build

```bash
npm run build
```

The generated site is written to `docs/.vitepress/dist`.

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

## Deployment

The repository is deployed independently under `~/knowledge` with Docker Compose. Its `knowledge` container joins the external `dezhonger-edge` network. The public Nginx service in `dezhonger-service` proxies `/knowledge/` to that container.
