---
title: 九点圆
description: 任意三角形中的九个特殊点，安静地共圆。
layout: puzzle
puzzle: the-nine-point-circle
---

对任意三角形 $ABC$，标出以下九个点：

- 三条边的中点；
- 三条高的垂足；
- 每个顶点与垂心 $H$ 连线的中点。

<PuzzleVisual variant="geometry" label="一个三角形、内部圆与三个标记点" />

**证明这九个点都在同一个圆上。**

<PuzzleHints />

<PuzzleSolution>

## 先处理六个点

设 $D,E,F$ 为三条高的垂足，$L,M,N$ 为三边中点。由于 $\angle BDC=\angle BEC=90^\circ$，点 $B,C,D,E$ 共圆。类似的直角论证可以把每个垂足与中点三角形联系起来。

一条更紧凑的路线，是使用以 $H$ 为中心、比例为 $1/2$ 的位似变换。它把 $A,B,C$ 映射到三个顶点与 $H$ 连线的中点，并把 $ABC$ 的外接圆映射为半径减半的圆。

这个像圆的圆心是 $OH$ 的中点，其中 $O$ 是外心。再验证三边中点和三个垂足到该点的距离都是 $R/2$。

因此，九个点全部位于以 $OH$ 中点为圆心、$R/2$ 为半径的同一个圆上。

</PuzzleSolution>
