---
title: 3 或 5 的倍数
description: Project Euler 第 1 题：形式化描述，并使用等差数列与容斥原理解答。
layout: puzzle
puzzle: multiples-of-3-or-5
projectEuler: 1
---

## 题目原文

If we list all the natural numbers below $10$ that are multiples of $3$ or $5$, we get $3, 5, 6$ and $9$. The sum of these multiples is $23$.

**Find the sum of all the multiples of $3$ or $5$ below $1000$.**

## 形式化题意

定义集合

$$
A=\{n\in\mathbb Z\mid 1\le n<1000,\;3\mid n\text{ 或 }5\mid n\}.
$$

求有限和

$$
S=\sum_{n\in A}n.
$$

<PuzzleHints />

<PuzzleSolution>

## 解题思路

对于任意正整数 $k$，小于上界 $N$ 的所有 $k$ 的正倍数为

$$
k,2k,\ldots,mk,
\qquad
m=\left\lfloor\frac{N-1}{k}\right\rfloor.
$$

它们的和是 $k\,m(m+1)/2$。分别计算 $3$ 的倍数与 $5$ 的倍数之和；由于 $15$ 的倍数同时属于两组，再按照容斥原理减去一次这部分重复项。

这样可以把线性枚举变成常数次计算，并明确处理两个集合的交集。

<ProtectedPuzzleAnswer problem="1" />

</PuzzleSolution>

> 题目原文引自 [Project Euler 第 1 题](https://projecteuler.net/problem=1)，依据 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 使用。
