# IBM Research 题库补全验收记录

本次将 IBM Ponder This 合集从 21 期补齐到 **341 期**，覆盖 **1998 年 5 月至 2026 年 9 月**。新增 `IBM-022` 至 `IBM-341` 共 320 期，每期均提供英文题面和整理后的中文题面。原有 21 期文件、编号和链接保持原样。

本地基线为 `main` 的 `34a9202`。本文记录内容范围、构建结果和本地浏览器验收。

## 内容与题源

| 项目 | 结果 |
| --- | --- |
| 官方目录 | [IBM Ponder This](https://research.ibm.com/labs/israel/ponder-this) 的当前挑战与全部历史目录合并去重 |
| 月份覆盖 | 341 个连续月份，无缺月、重复月份或重复题源链接 |
| 最新一期 | [2026 年 9 月：Loeschian Arithmetic Progressions](https://research.ibm.com/blog/ponder-this-september-2026) |
| 本地页面 | 682 个中英文页面，其中新增 640 个 |
| 页面内容 | 保留题目条件、例子、公式、代码、矩阵、官方提示和 Bonus；题解为默认折叠的待补充占位 |
| 新题状态 | 待解；统一归类为数学，未评定难度的题目不显示星级 |
| 资料 | 54 个图片或必要资料引用，记录本站文件、来源和校验和 |
| 分页 | 每页 10 期，共 35 页；末页为第 341 期 |
| RSS | 中英文各保持原来的 34 条文章，历史补录不批量进入订阅 |

中文题面经过逐题整理；公式和文字数据独立校验，未采用未经核对的机器翻译初稿。源码采用集中数据与生成器维护，新增题目按固定月份地址生成，例如 `/zh/puzzles/ponder-this-2000-02`。

## 官方迁移遗失内容的恢复

| 题目 | 处理与依据 |
| --- | --- |
| 2008 年 5 月 | 从 [IBM 原题表格存档](https://web.archive.org/web/20150908055054/https://www.research.ibm.com/haifa/ponderthis/May_PonderThis_Table.htm) 恢复 9×20 的生命游戏目标格局，共 34 个活格。 |
| 2009 年 2 月 | 从 [IBM 原弹窗存档](https://web.archive.org/web/20090221213230/http://www.research.ibm.com:80/files/feb2009_popup.shtml) 恢复 26 行、255 个十六进制数据项。 |
| 2009 年 6 月 | 原公式图片返回 404，按照同页完整的文字定义重新排版公式，保留恢复说明。 |
| 2015 年 12 月 | 根据 [IBM 字符集对照表](https://www.ibm.com/docs/en/openxl-fortran-aix/17.1.3?topic=reference-ascii-ebcdic-character-sets) 提供本题所需的 52 个英文字母编码。 |
| 2019 年 2 月 | 失效的截图链接指向同页已经迁移的官方图片。 |
| 2022 年 8 月 | 从 [IBM 原题存档](https://web.archive.org/web/20220818112624/https://research.ibm.com/haifa/ponderthis/challenges/August2022.html) 恢复官网新页面遗漏的非法示例、计数目标和附加问。 |

可由同题定义确认的上标、货币符号等修正记录在 `source.json` 的 `notationCorrections` 中。涉及原题记号歧义的地方在中文页面中说明。当前题目月份与网页实际发表日期分开保存，避免月末提前发布影响题号顺序。

## 验证结果

以下检查全部通过：

```bash
npm run generate:ibm-research
npm run validate:ibm-research
npm run build:puzzle
npm run validate:ibm-research -- --built
npm run validate:rosecode -- --built
npm run validate:pagination
git diff --check
```

数据校验覆盖月份连续性、唯一编号、译文版本、公式内容与数量、代码和矩阵原文、长数字、图片对应关系及资料文件校验和。构建后逐页核对全部 682 个页面，并核对新增页面的正文、标题、语言地址、相邻题链接、题解折叠状态、Sitemap 和 RSS 排除情况。

最终构建成功；有非阻塞的“大于 500 kB 分包”提示。生成结果可以完整打开，未将该提示视为错误或忽略构建失败。

浏览器检查使用本地预览，已验证：

- 中文合集显示 341 期，末页第 35 页只显示最新第 341 期。
- 第 341 期中英文切换正常，主问题和两个附加问题完整显示。
- 英文界面搜索中文标题“整数幂条件”，能找到新增第 22 期。
- 第 22 期可返回原第 21 期，原第 21 期也能继续到第 22 期。
- 在末页切换“数学”筛选会回到第 1 页，每页 10 期；倒序浏览从第 341 期开始。
- 手机视口下，生命游戏目标图与十六进制数据完整可见；数据区可独立滚动，页面无横向撑宽。
- 复杂公式页面在 375 px 手机视口下，页面宽度与滚动宽度均为 375 px；短公式正常排版，长公式可以独立横向滚动，深色模式下可读。
- 题解先显示确认步骤，确认后只有“待补充”占位，并可重新收起。
- 页面检查未发现控制台错误或警告。

## 全站分页统一

按确认范围，将 RoseCode 的分页设计抽成 `PaginationControls.vue`，以 `usePagination.ts` 统一每页 10 条、筛选后重置与 URL 状态恢复。RoseCode、IBM 等普通题集、Project Euler、题目总列表、时间线、笔记和题集总览均已接入；Project Euler 的题解列表也使用独立页码。原有两套分页代码和样式已移除。

中英文均支持首页、末页、上一页、下一页、当前页前后各两页数字与输入页码跳转。只有超过一页时显示控件。

本地验收结果：

- 16 个中英文列表页面的构建结果检查通过，长列表首屏均为 10 条，单页列表隐藏分页。
- IBM 的输入跳转、数字按钮、首尾页、前后页均正常；输入 0、小数或超出范围的数字会提示错误，当前页不变。
- 筛选和排序后回到第一页；刷新、直接打开带条件的链接、浏览器前进后退均恢复正确状态。
- RoseCode 在搜索结果第 2 页打开题目，再点击返回链接，仍保留搜索词和页码。
- Project Euler 第 101 页显示最后 8 题；题号范围、搜索与分页组合正常。
- 题目总列表和时间线每页 10 条；搜索无结果、只有一条结果或筛选为 3 篇笔记时隐藏分页。
- 手机和桌面视口均无分页横向溢出，浏览器未记录错误或警告。
- IBM 的 682 个中英文页面与 RoseCode 的 1140 个中英文页面完整性回归通过。

## 本地查看与后续维护

- [本地合集预览](http://127.0.0.1:4175/zh/collections/ibm-research)
- [最新一期](http://127.0.0.1:4175/zh/puzzles/ponder-this-2026-09)
- [恢复的生命游戏题](http://127.0.0.1:4175/zh/puzzles/ponder-this-2008-05)
- [恢复的数字表题](http://127.0.0.1:4175/zh/puzzles/ponder-this-2009-02)

维护命令、文件职责与新增月份流程见 [README](README.md#ibm-research--ponder-this-题库)。构建只读取本地内容，不依赖在线翻译或临时模型。以后同步遇到缺失或过期的译文、必要资料时会明确失败，保留已成功下载的缓存，修复后可继续。

提交信息：`feat(ibm-research): complete archive and unify site pagination`
