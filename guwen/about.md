---
title: 关于本站
description: Dezhonger 古文的内容组织、搜索与更新方式。
---

# 关于本站

这是一个 Markdown 驱动的静态古诗文站点，与技术知识库共用 `dezhonger-knowledge` 仓库，但通过 `guwen.dezhonger.com` 独立访问。

## 内容原则

- 先提供可阅读、可搜索的古诗文原文。
- 每篇独立成页，并标注朝代、作者、学段和体裁。
- 目录按人教版统编教材分册整理；不同年份修订可能产生少量篇目变化。
- 公共领域作品收录完整原文；仍在著作权保护期内的作品只保留目录信息。
- 不收录现代教辅的译文、赏析或题目。

## 如何添加文章

教材目录、文章元数据和原文保存在 `guwen/data/works.json`，构建时会自动生成每篇 Markdown、分册目录、侧边栏和全文搜索索引。

- 日常补充：编辑 `guwen/data/works.json`，再运行 `npm run build:guwen`。
- 更新教材清单：运行 `npm run sync:guwen`，检查生成结果后提交。
- 新增手写专题文章：可以直接在 `guwen/` 下添加 Markdown，不需要数据库。
