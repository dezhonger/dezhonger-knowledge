# Dezhonger Content

A single repository for Dezhonger's independently addressed content sites:

- `knowledge.dezhonger.com`: bilingual technical knowledge, powered by VitePress.
- `puzzle.dezhonger.com`: personal puzzle library and mathematical problem notebook, powered by VitePress.
- `guwen.dezhonger.com`: Chinese classical literature, powered by VitePress.
- `zmq.dezhonger.com` and `rby.dezhonger.com`: original illustrated theme pages.
- `math.dezhonger.com` and `algo.dezhonger.com`: mathematics, algorithms, machine learning and LLM learning paths.
- `english.dezhonger.com`: a content-first English learning site with vocabulary, layered grammar, practical expressions, device speech and local search.
- `biology.dezhonger.com`, `geography.dezhonger.com`, `physics.dezhonger.com`, `chemistry.dezhonger.com` and `history.dezhonger.com`: junior/senior subject learning sites; science sites include competition paths and Chemistry includes an interactive periodic table.

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

### 全站分页

Puzzle 的完整列表统一使用 `PaginationControls.vue` 和 `usePagination.ts`：包括 RoseCode、IBM 等普通题集、Project Euler 的完整题目索引与题解列表、题目总列表、时间线、笔记和题集总览。每页 10 条，超过一页时才显示分页控件；首页的精选内容和统计图表保持概览展示。

统一分页沿用 RoseCode 的设计：提供首页、末页、上一页、下一页按钮；显示当前页前后各两页，并保留首尾页，较大间隔用省略号表示。可以输入页码后按 Enter 或点击“跳转”；空值、小数、负数和超出范围的页码会显示提示，当前页不变。手机上操作按钮、数字页码和输入框分行显示。

先搜索、筛选和排序完整数据，再截取当前页。改变条件会回到第一页。页码保存在 `page` 参数中，搜索和筛选参数也会保留；刷新、直接打开链接、浏览器前进后退会恢复相应条件和页码。Project Euler 的题解列表使用独立的 `writeupPage`，避免与完整题目索引冲突。新增列表应直接复用这两个公共文件，不另建分页实现。

```bash
npm run build:puzzle
npm run validate:pagination
```


### IBM Research / Ponder This 题库

IBM 合集覆盖 **1998 年 5 月至 2026 年 9 月的 341 期**，每期各有中英文题面。按月份从 `IBM-001` 编号至 `IBM-341`，每页 10 期，共 35 页。同一期的子问题、官方提示、修订和 Bonus 保留在同页，题解默认折叠并保留待补充区域。尚未评定难度的新题不显示星级。

前 21 期继续使用原有 Markdown 和链接；第 22 期起使用固定月份地址，例如 `/puzzles/ponder-this-2000-02` 和 `/zh/puzzles/ponder-this-2000-02`。完整正文、公式、图片和资料在构建时写入本站页面；旧题批量补录不进入文章 RSS。

- 官方题源为 [Ponder This 首页和完整归档](https://research.ibm.com/labs/israel/ponder-this)。同步同时读取“当前挑战”和历史目录，按月份去重并检查连续性，避免当月题目尚未进入归档列表时漏题。
- `content/ibm-research/source.json` 保存官方月份、题源、题面和校验和；`zh.json` 保存逐题整理的中文题面，并绑定英文标题和正文版本；`resources.json` 保存 54 个图片或资料引用的来源、本站文件和校验信息。数字、代码、表格与公式保留原题数据。
- `scripts/ibm-research.mjs` 集中负责同步、规范化、目录生成和页面生成；前端目录为自动生成的 `puzzle/.vitepress/theme/data/ibm-research.ts`，不要手工修改。中英文各用一个动态路由模板生成新增的 320 期，无需维护 640 份手写页面。
- 已恢复官方迁移过程中失效的 2008 年 5 月生命游戏格局、2009 年 2 月数字表，以及 2022 年 8 月丢失的任务与附加问。原题存档地址记录在数据中。2009 年 6 月失效的公式图片按同页完整文字定义重新排版，2019 年 2 月截图改用同页迁移资源；EBCDIC 题提供本题所需的 52 字母编码表。
- 可由同题定义确认的指数、货币符号等排版修正记录在 `notationCorrections`；涉及原文歧义的地方在中文题面中说明。原始页面下载缓存位于忽略提交的 `.cache/ibm-research/`。词表是本次导入的文件快照，按文件校验和固定。

```bash
# 从官方目录同步题面、图片和资料，复用已成功下载的缓存
npm run sync:ibm-research

# 只用仓库内已核对的内容重新生成目录，不联网
npm run generate:ibm-research

# 检查月份、双语版本、公式、数据、图片和恢复资料
npm run validate:ibm-research
npm run build:puzzle
npm run validate:ibm-research -- --built
```

新月份或英文题面变化后，需补充或更新对应中文记录及 `sourceSha256`、`sourceTitle`；缺少或过期译文会阻止生成。`sync:ibm-research -- --refresh` 会重新检查已有官方文章，失败时保留已完成的下载。上述流程是按需执行的同步命令，没有配置自动定时发布。

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

## English learning site

English remains a generated HTML / native JavaScript / CSS site. Its single sources of truth are under `content/english/`: alphabetic JSONL word shards and non-duplicated editorial JSON entries, JSON expressions, Markdown grammar topics with depth layers, and a shared taxonomy. See [the Chinese content authoring guide](content/english/README.md).

```bash
npm run dev:english       # generate and preview at http://127.0.0.1:5176
npm run build:english     # source/schema checks, generation and output validation
npm run test:english      # content, search, speech, pagination and local HTTP tests
npm run preview:english  # preview the existing generated output
```

`generate:subjects` delegates English to `scripts/generate-english.mjs`; it cannot overwrite the site with the retired review UI. The generator validates a temporary output directory before replacing `sites/english/`. CSS, modules and the lazily loaded search index share a content-hashed asset directory. Main content is rendered in HTML; speech and search use browser capabilities.

The site contains 11,496 unique words across eight complete source wordlists, 6 grammar topics with 14 depth layers, and 38 expressions. Random practice draws 1–500 unique words from one level, hides Chinese meanings until requested, and paginates large sessions. It uses independent English Learning branding and has no links to other content domains. Source versions, licenses and coverage are documented under `content/english/`. No account or persistent progress system is included.

English has dedicated Nginx rules for real 404s, a generated XML sitemap and robots.txt. Docker copies English from the builder stage, so source changes reach the actual image. `sites/english/` is generated and excluded from Git and Docker input; the image always builds it from source. Large dictionary assets use gzip. `test:english` tests those Nginx rules when a local nginx executable is available; otherwise that single test is explicitly skipped.

## Deployment

The repository is deployed under `~/knowledge` with Docker Compose. Its single `knowledge` container joins the external `dezhonger-edge` network and selects a site from the incoming `Host` header. The public Nginx service in `dezhonger-service` terminates HTTPS and forwards the content domains to this container.
