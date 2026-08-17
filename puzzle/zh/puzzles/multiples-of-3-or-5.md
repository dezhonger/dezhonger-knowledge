---
title: 3 或 5 的倍数
description: 把遍历改写成等差数列求和，是练习容斥原理的第一步。
layout: puzzle
puzzle: multiples-of-3-or-5
---

10 以下的自然数中，3 或 5 的倍数是 $3,5,6,9$，它们的和是 $23$。

**求 1000 以下所有 3 或 5 的倍数之和。**

<PuzzleVisual variant="numbers" label="几个小质数的乘积" />

普通循环当然可以完成。更有趣的问法是：如何完全去掉循环？

<PuzzleHints />

<PuzzleSolution>

## 等差数列与容斥原理

$N$ 以下所有 $k$ 的正倍数之和为

$$
k\frac{m(m+1)}2,\qquad m=\left\lfloor\frac{N-1}{k}\right\rfloor.
$$

加上 3 的倍数和 5 的倍数，再减去被重复计算的 15 的倍数：

$$
3\frac{333\cdot334}{2}
+5\frac{199\cdot200}{2}
-15\frac{66\cdot67}{2}
=\boxed{233168}.
$$

这道小题带来一个耐用习惯：在直接相加计数或求和之前，先明确地找出重叠部分。

</PuzzleSolution>
