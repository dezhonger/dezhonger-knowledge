---
title: 关于本站
description: Dezhonger 古文的内容组织、搜索与更新方式。
---

# 关于本站

这是一个 Markdown 驱动的静态古诗文站点，与技术知识库共用 `dezhonger-knowledge` 仓库，但通过 `guwen.dezhonger.com` 独立访问。

## 内容原则

- 先提供可阅读、可搜索的古诗文原文。
- 每篇独立成页，并标注朝代、作者、学段和体裁。
- 不直接复制现代教辅的译文、赏析或题目。
- 教材篇目会因地区、年份和版本不同而变化，本站按学段整理，不把当前目录称为唯一版本。

## 如何添加文章

在 `guwen/junior/` 或 `guwen/senior/` 下新增 Markdown 文件，再把链接加入 `guwen/.vitepress/config.mts` 的侧边栏。提交并部署后，VitePress 会自动重建页面、目录和全文搜索索引。
