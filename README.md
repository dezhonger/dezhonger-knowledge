# Dezhonger Content

A single repository for Dezhonger's independently addressed content sites:

- `knowledge.dezhonger.com`: bilingual technical knowledge, powered by VitePress.
- `puzzle.dezhonger.com` has moved to the separate `puzzle-library` repository (Cloudflare Pages); do not add puzzle content here.
- `guwen.dezhonger.com`: Chinese classical literature, powered by VitePress.
- `zmq.dezhonger.com` and `rby.dezhonger.com`: original illustrated theme pages.
- `math.dezhonger.com` and `algo.dezhonger.com`: mathematics, algorithms, machine learning and LLM learning paths.
- `english.dezhonger.com`: a content-first English learning site with vocabulary, layered grammar, practical expressions, device speech and local search.
- `biology.dezhonger.com`, `geography.dezhonger.com`, `physics.dezhonger.com` and `chemistry.dezhonger.com`: junior/senior subject learning sites; science sites include competition paths and Chemistry includes an interactive periodic table.
- `history.dezhonger.com`: HISTORY ATLAS, an independent sourced history exploration site with a parallel timeline and polity, person and event pages.

## Local development

```bash
npm ci
npm run dev
```

The Knowledge dev server runs at `/`. Run `npm run dev:guwen` for the classical literature site.

## Build

The history atlas has an independent static source under `content/history/` and
generator under `scripts/history/`. It owns `sites/history/index.html` and
everything under `/explore/`, including the year explorer, JSON index, and
sourced detail pages. The shared subject generator does not generate history.
The history generator removes stale course pages and assets from earlier local
builds before writing Atlas pages. The content Nginx has a history-only server
block, so removed paths return real 404 responses after the next deployment.

```bash
npm run validate:history
npm run test:history
npm run generate:history
```

Open the site through a local static HTTP server (for example,
`python3 -m http.server 8000 --directory sites/history`) at
`http://localhost:8000/`; the time explorer is `/explore/`. The full image
build copies the builder output.
The year explorer initially shows 1000 CE; the `year` query parameter selects
another year in the 960–1279 study window. Source records and review decisions
are maintained separately from Markdown articles and page templates.

```bash
npm run build
npm run build:guwen
# or build every site
npm run build:all
```

The generated VitePress sites are written to `docs/.vitepress/dist` and `guwen/.vitepress/dist`.

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
date: 2026-09-01
---

# Article title
```

The local search index is regenerated automatically during `npm run build`; no database or manual indexing step is required.

## RSS feeds

Knowledge publishes separate English and Chinese RSS 2.0 feeds:

- `https://knowledge.dezhonger.com/feed.xml`
- `https://knowledge.dezhonger.com/zh/feed.xml`

The feeds include every non-index Markdown page under the Knowledge article sections. Each entry contains its title, description, permanent URL, and original publication date. Set `feed: false` in a page's frontmatter only when a leaf page should be excluded intentionally. Knowledge builds regenerate the feeds automatically.

## Add a classical Chinese article

The textbook catalog and original texts are stored in `guwen/data/works.json`.

1. Edit the matching work in `guwen/data/works.json`.
2. Run `npm run build:guwen`; individual Markdown pages, book indexes, sidebars, and local full-text search are regenerated automatically.
3. `guwen/data/curriculum.json` records the 23 reference textbooks and their checked work IDs. Update it when a textbook edition changes, and use `additionalBooks` when one work appears in several volumes.
4. Run `npm run validate:guwen` and `npm run test:guwen`; after building, run `npm run validate:guwen -- --built` to verify every original paragraph in the rendered pages.
5. `npm run sync:guwen` supplements newly discovered entries from the external collections. Existing editorial corrections, excerpts, book assignments and permanent links are preserved. Review new entries against the publisher's textbook before adding them to the checked curriculum.

The static subject sites live under `sites/`. Each hostname keeps its generated `index.html` and independent topic pages. Run `npm run generate:subjects` after editing the curriculum sources.

- Mathematics is defined in `scripts/math-curriculum.mjs`: 7 paths, 31 chapters and 227 detailed topics.
- The other subjects use `scripts/subject-data.mjs` plus `scripts/subject-expansions.mjs`.
- Each subject has its own visual language. Shared files only provide navigation, accessibility and responsive foundations.
- Chemistry additionally loads `elements.js`; the checked-in element data was generated from PubChem's public periodic-table JSON with `npm run generate:elements`.

## 算法知识库

`algo.dezhonger.com` 已迁移到独立仓库 [dezhonger/algo-wiki](https://github.com/dezhonger/algo-wiki)（Astro + Starlight，部署在 Cloudflare Pages），本仓库不再生成或部署算法站。`scripts/subject-data.mjs` 中的 `algo` 数据只保留给其他学科站的导航使用。

## English learning site

English remains a generated HTML / native JavaScript / CSS site. Its single sources of truth are under `content/english/`: alphabetic JSONL word shards and non-duplicated editorial JSON entries, JSON expressions, Markdown grammar topics with depth layers, and a shared taxonomy. See [the Chinese content authoring guide](content/english/README.md).

```bash
npm run dev:english       # generate and preview at http://127.0.0.1:5176
npm run build:english     # source/schema checks, generation and output validation
npm run test:english      # content, search, speech, pagination and local HTTP tests
npm run preview:english  # preview the existing generated output
```

`generate:subjects` delegates English to `scripts/generate-english.mjs`; it cannot overwrite the site with the retired review UI. The generator validates a temporary output directory before replacing `sites/english/`. CSS and modules use content-hashed assets. Search and practice JSON use stable schema-versioned URLs under `/data/`, revalidated on load; known old data URLs remain readable for cached clients. The homepage contains only the three main categories. Main content is rendered in HTML; speech and search use browser capabilities.

The site contains 13,827 unique words, including eight complete source wordlists and expanded everyday, people, nature, society, public safety and sports topics, 6 grammar topics with 14 depth layers, and 38 expressions. Sports is a top-level browsing topic with badminton and basketball sections. Random practice draws 1–500 unique words from one level, hides Chinese meanings until requested, and paginates large sessions. It uses independent English Learning branding and has no links to other content domains. Source versions, licenses and coverage are documented under `content/english/`. No account or persistent progress system is included.

English has dedicated Nginx rules for real 404s, a generated XML sitemap and robots.txt. Docker copies English from the builder stage, so source changes reach the actual image. `sites/english/` is generated and excluded from Git and Docker input; the image always builds it from source. Large dictionary assets use gzip. `test:english` tests those Nginx rules when a local nginx executable is available; otherwise that single test is explicitly skipped.

## Deployment

The repository is deployed under `~/knowledge` with Docker Compose. Its single `knowledge` container joins the external `dezhonger-edge` network and selects a site from the incoming `Host` header. The public Nginx service in `dezhonger-service` terminates HTTPS and forwards the content domains to this container.

### ZMQ 家庭博客

`sites/zmq/` 提供博客首页、`/articles/` 列表、`/article/?id=...` 阅读页与 `/admin/` 写作后台。页面通过同源 `/api/blog/` 使用 `dezhonger-service` 的文章和私有媒体接口。受密码保护的正文和媒体不写入静态页面、搜索索引、RSS 或浏览器持久缓存。管理员账号、访问密码保护、上传限制和备份方式见 Service 仓库 README 的“家庭博客”。

博客页面使用原生 HTML、CSS 和 JavaScript，不需要生成学科内容。正式镜像优先从当前主分支使用根目录 `Dockerfile` 完整构建。仅更新博客页面且需要保留其他站点运行版本时，可以使用 `deploy/zmq.Dockerfile`：将当前运行的内容镜像标记为回滚镜像，再用 `KNOWLEDGE_BASE` 指定该标签，构建仅覆盖 `sites/zmq/` 的增量镜像。新主机或完整重建仍使用根目录 Dockerfile。
