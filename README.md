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

1. Add the English Markdown page under `puzzle/puzzles/` or `puzzle/notes/`.
2. Add the matching Chinese Markdown page under `puzzle/zh/puzzles/` or `puzzle/zh/notes/`.
3. Add English and Chinese structured metadata to `puzzle/.vitepress/theme/data/catalog.ts`.
4. Use the `puzzle` or `note` layout in frontmatter, include the original publication `date`, and keep the same slug in both languages.
5. Run `npm run build:puzzle` and browse both locales, the timeline, search, hints, solution, light mode, and dark mode.

Standard collection pages use the shared `CollectionDetail` component. The component filters and sorts the full collection before paginating the result at 10 puzzles per page. Changing the category or number order returns the collection to page 1, while later pages keep their position in the `page` URL query parameter.

### RoseCode 题库

RoseCode 使用独立的列表、阅读页、样式和生成脚本。570 道题按原始 `np` 编号，英文入口为 `/collections/rosecode`，中文入口为 `/zh/collections/rosecode`；每页 10 题，支持题号与双语标题搜索。`q` 和 `page` 保存在链接中，题目页可以返回原列表位置。

分页提供首页、末页、上一页、下一页，以及当前页前后各两页的数字按钮；首尾页保留，较大的间隔用省略号表示。也可以输入页码，按 Enter 或点击“跳转”。输入必须是当前搜索结果页数范围内的正整数，无效输入会提示修正；更改搜索条件回到第一页。手机上导航按钮与数字页码分行显示。

- `content/rosecode/source.json` 保存英文原题、编号映射及清理后的正文；`zh.json` 是可直接维护的中文译文，绑定英文题面的校验和。
- `content/rosecode/resources.json` 记录资源来源和检查结果，本站文件在 `puzzle/public/rosecode/resources/`。资源缺失会在题目中说明；原题程序保留为代码，隐藏文字提示默认折叠。
- 原图、背景图、表格配色和编码数据均属于题目资料。保留原始文件字节，避免破坏附带数据的 BMP 等谜面；不运行原站程序。
- 页面在构建时生成完整正文，站内切换读取本站静态数据；访客不需要连接 RoseCode 或翻译服务。归档题目不进入文章 RSS。

```bash
# 从存档导入英文题面和资源，复用已检查的资源；不会覆盖中文译文
npm run sync:rosecode

# 仅使用本地内容重新生成题目索引，不联网
npm run generate:rosecode

# 校验题目、译文版本、公式、代码、资源和编号
npm run validate:rosecode
npm run build:puzzle
npm run validate:rosecode -- --built
```

英文题面更新后，需要核对并更新对应译文及其 `sourceSha256`，再生成索引和构建。`sync:rosecode -- --refresh` 会重新核对已有资源；同步失败保留已完成下载，修复网络后可继续。题目和中文翻译依据 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 提供，各题保留作者与正确的存档链接。

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

Knowledge and Puzzle Library publish separate English and Chinese RSS 2.0 feeds:

- `https://knowledge.dezhonger.com/feed.xml`
- `https://knowledge.dezhonger.com/zh/feed.xml`
- `https://puzzle.dezhonger.com/feed.xml`
- `https://puzzle.dezhonger.com/zh/feed.xml`

The feeds include every non-index Markdown page under the Knowledge article sections and the Puzzle `puzzles` and `notes` sections. Each entry contains its title, description, permanent URL, and original publication date. Set `feed: false` in a page's frontmatter only when a leaf page should be excluded intentionally. Knowledge and Puzzle builds regenerate their respective feeds automatically.

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
