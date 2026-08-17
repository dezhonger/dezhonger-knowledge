---
title: 莫雷奇迹
description: 任意三角形中，相邻角的三等分线交点构成等边三角形。
layout: puzzle
puzzle: morleys-miracle
---

把任意三角形的三个角各自三等分。对每一对相邻顶点，取最靠近它们公共边的两条三等分线之交点。

<PuzzleVisual variant="geometry" label="一个带中心圆形构造的三角形" />

这三个交点看起来构成一个等边三角形。

**证明无论原三角形是什么形状，结论都成立。**

<PuzzleHints />

<PuzzleSolution>

## 反向构造

把原三角形的三个角写为 $3\alpha,3\beta,3\gamma$，则

$$
\alpha+\beta+\gamma=60^\circ.
$$

不从任意三角形出发，而是先作一个等边三角形，再在它周围构造三个角度由 $\alpha,\beta,\gamma$ 决定的三角形。反复使用正弦定理，可以证明外轮廓恰好闭合，且其三个角分别为 $3\alpha,3\beta,3\gamma$。

这些构造线因此就是外部三角形的三等分线。因为内部三角形在构造时就是等边的，原图中三个相邻三等分线交点也必然构成等边三角形。

这是一个“综合法比分析法更干净”的例子：先构造目标图形，才能看见那个似乎偶然的 $60^\circ$ 为什么被 $\alpha+\beta+\gamma$ 强制出现。

</PuzzleSolution>
