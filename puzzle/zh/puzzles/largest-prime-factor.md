---
date: 2026-08-17
title: 最大质因数
description: Project Euler 第 3 题：形式化为质因数集合上的最大值，并使用连续试除法求解。
layout: puzzle
puzzle: largest-prime-factor
projectEuler: 3
---

## 题目原文

The prime factors of $13195$ are $5, 7, 13$ and $29$.

**What is the largest prime factor of the number $600851475143$?**

## 形式化题意

给定

$$
N=600851475143,
$$

求

$$
\max\{p\in\mathbb P\mid p\mid N\},
$$

其中 $\mathbb P$ 表示所有质数组成的集合。

<PuzzleHints />

<PuzzleSolution>

## 解题思路

从最小的候选因数开始试除。只要当前因数能整除剩余值，就把这个因数完全除尽，再继续考察下一个候选因数。每次成功除法都会缩小尚未分解的部分。

只需要在 $d^2\le n$ 时继续试除。如果循环结束后仍有一个大于 $1$ 的剩余值，那么它不可能再含有更小但尚未发现的因数，因此它本身就是质数。最后被除去的最大因数或这个剩余质数就是答案。

<ProtectedPuzzleAnswer problem="3" />

</PuzzleSolution>

> 题目原文引自 [Project Euler 第 3 题](https://projecteuler.net/problem=3)，依据 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 使用。
