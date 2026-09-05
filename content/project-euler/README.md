# Project Euler 题库维护

英文题面来自 Project Euler 的公开主线题库，适用 [CC BY-NC-SA 4.0](https://projecteuler.net/copyright)。中文是题面的翻译，适用相同许可。每道题的页面均链接至官方原题。

## 内容与页面

- `official.json`：官方英文标题、未经修改的 HTML 题面、采集时间和每题 SHA-256。
- `zh.json`：按题号保存中文标题与 HTML，`sourceSha256` 和 `sourceTitle` 标识译文对应的英文题面与标题版本。
- `catalog.json`：题号、官方标题、个人完成日期与已发布题解路径。
- `puzzle/public/project-euler/resources/`：原题图片和输入数据文件的站内副本。
- 页面使用共享模板生成，英文路径为 `/project-euler/题号`，中文路径为 `/zh/project-euler/题号`。

题面不会在访客浏览时请求官网或翻译服务。构建读取仓库内的内容和资源，在本地完成公式渲染。

构建先生成共用页面外壳，再将完整题面写入每页 HTML；站内切换题目时读取对应的本站静态数据文件。这使首屏和搜索引擎仍能直接获得完整正文，同时避免大量公式 SVG 进入模块编译过程。`npm run build:puzzle` 已包含全部步骤；本地开发命令也支持题面读取。

重新构建后，需停止并重新启动 `npm run preview:puzzle`，再刷新浏览器，避免预览服务继续使用旧构建的缓存。

## 索引状态

| 颜色 | 标记 | 判定 |
| --- | --- | --- |
| 紫色 | 已有题解 | 本站已发布对应题解 |
| 绿色 | 仅题目 · 已解决 | 个人完成记录存在，本站尚未发布题解 |
| 蓝色 | 仅题目 · 待解 | 已收录题面，暂无个人完成记录或站内题解 |

三种状态都可以点击进入站内题目页。颜色同时配有文字标签。索引支持只查看“仅有题目”，也支持按题号、中英文标题检索。

## 补充题解

沿用现有的中英文题解 Markdown：

1. 在 `puzzle/puzzles/` 和 `puzzle/zh/puzzles/` 编写对应题解，并沿用当前 `catalog.ts` 中的文章登记方式。
2. 在 frontmatter 中填写 `projectEuler: 题号`，正文使用现有的 `<PuzzleSolution>` 组件。
3. 运行 `npm run generate:project-euler` 更新题解映射。
4. 运行 `npm run build:puzzle` 和 `npm run validate:project-euler -- --built` 验证。

生成器只将实际包含 `<PuzzleSolution>` 的文章计为已发布题解。只添加题目表述不会增加题解数量。第 1–3 题的既有文章路径、内容和加密答案继续保留。

批量收录的题目页不会加入文章 RSS。后续正式发布的题解文章沿用现有 RSS 机制。

## 同步题库

```bash
# 同步官方目录和新增题面，复用下载缓存与已有个人完成记录
npm run sync:project-euler

# 如需导入新的个人完成记录
npm run sync:project-euler -- --solves /path/to/export.csv

# 明确重新下载全部英文题面和资源，检查官网勘误
npm run sync:project-euler -- --refresh

# 仅用本地已保存的内容重新生成元数据，不联网
npm run generate:project-euler
```

新题缺少中文翻译，或英文内容发生变化时，同步会明确报出题号并停止生成，避免把过期译文或缺失的中文题面作为完成结果。补齐并核对 `zh.json` 后再运行本地生成。同步不会覆盖现有译文或手写题解。

临时下载、渲染缓存和本地翻译工具位于被 Git 忽略的 `.cache/project-euler/`，不是线上站点依赖。

## 内容校验

```bash
# 检查英文快照与本地资源
node scripts/validate-project-euler.mjs --english-only

# 检查双语覆盖、英文哈希、译文版本、公式、表格、列表与资源结构
npm run validate:project-euler

# 构建后同时检查全部页面、索引跳转、状态统计、正文及语言链接
npm run validate:project-euler -- --built
```

结构检查能够发现公式丢失、图片或附件链接变化，以及缺少的题目页；中文措辞和数学含义仍需要内容复核。
