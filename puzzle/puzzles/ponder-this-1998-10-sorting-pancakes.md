---
title: Sorting pancakes
description: How many prefix reversals can the hardest permutation of differently sized pancakes require?
layout: puzzle
puzzle: ponder-this-1998-10-sorting-pancakes
---

## IBM Ponder This #006 · October 1998

There are $N$ pancakes of distinct sizes. The aim is to put them in the order

$$
1,2,\ldots,N,
$$

with the smallest pancake on top. The only permitted operation is to choose $1\le k\le N$ and reverse the top $k$ pancakes:

$$
(a_1,a_2,\ldots,a_k,\ldots)
\longrightarrow
(a_k,a_{k-1},\ldots,a_1,\ldots).
$$

For a permutation $p$, let $f(N,p)$ be the fewest flips needed to sort it, and define

$$
g(N)=\max_{p\in S_N}f(N,p).
$$

> How does $g(N)$ grow? IBM gives $g(5)=5$ as a starting point.

The problem is the classic pancake-sorting problem. If every permutation is a vertex and one prefix reversal is an edge, then $g(N)$ is the diameter of the pancake graph.

[Read the original IBM Research problem](https://research.ibm.com/blog/ponder-this-october-1998){target="_blank" rel="noreferrer"}
