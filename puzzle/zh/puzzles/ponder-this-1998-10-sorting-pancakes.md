---
title: 煎饼排序
description: 对不同大小的煎饼做前缀翻转，最难的排列需要多少次操作？
layout: puzzle
puzzle: ponder-this-1998-10-sorting-pancakes
---

## IBM Ponder This #006 · 1998 年 10 月

有 $N$ 张大小各不相同的煎饼，目标是将它们排成

$$
1,2,\ldots,N,
$$

即最小的在顶部。唯一允许的操作是选择 $1\le k\le N$，然后把最上面的 $k$ 张整体翻转：

$$
(a_1,a_2,\ldots,a_k,\ldots)
\longrightarrow
(a_k,a_{k-1},\ldots,a_1,\ldots).
$$

对排列 $p$，令 $f(N,p)$ 为将它排序所需的最少翻转次数；再定义

$$
g(N)=\max_{p\in S_N}f(N,p).
$$

> 一般的 $g(N)$ 如何增长？IBM 给出 $g(5)=5$ 作为起点。

这就是经典的煎饼排序问题。若把所有排列视为图的顶点、一次前缀翻转视为一条边，那么 $g(N)$ 就是 pancake graph 的直径。

[查看 IBM Research 官方题目](https://research.ibm.com/blog/ponder-this-october-1998){target="_blank" rel="noreferrer"}
