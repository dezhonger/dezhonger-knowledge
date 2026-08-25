---
title: Multiples of 3 or 5
description: Project Euler Problem 1, stated precisely and solved with arithmetic progressions and inclusion–exclusion.
layout: puzzle
puzzle: multiples-of-3-or-5
projectEuler: 1
---

## Original problem

If we list all the natural numbers below $10$ that are multiples of $3$ or $5$, we get $3, 5, 6$ and $9$. The sum of these multiples is $23$.

**Find the sum of all the multiples of $3$ or $5$ below $1000$.**

## Formal statement

Let

$$
A=\{n\in\mathbb Z\mid 1\le n<1000,\;3\mid n\text{ or }5\mid n\}.
$$

Compute the finite sum

$$
S=\sum_{n\in A}n.
$$

<PuzzleHints />

<PuzzleSolution>

## Approach

For any positive integer $k$, the positive multiples of $k$ below a limit $N$ are

$$
k,2k,\ldots,mk,
\qquad
m=\left\lfloor\frac{N-1}{k}\right\rfloor.
$$

Their sum is therefore $k\,m(m+1)/2$. Apply this formula to the multiples of $3$ and $5$. Multiples of $15$ occur in both groups, so subtract their sum once by inclusion–exclusion.

This turns a linear scan into a constant-size calculation and makes the overlap explicit.

<ProtectedPuzzleAnswer problem="1" />

</PuzzleSolution>

> The original problem is reproduced from [Project Euler Problem 1](https://projecteuler.net/problem=1) under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
