---
title: Multiples of 3 or 5
description: A first exercise in turning iteration into arithmetic with inclusion–exclusion.
layout: puzzle
puzzle: multiples-of-3-or-5
---

Among the natural numbers below 10, the multiples of 3 or 5 are $3,5,6,$ and $9$. Their sum is $23$.

**Find the sum of all multiples of 3 or 5 below 1000.**

<PuzzleVisual variant="numbers" label="A multiplication of small prime numbers" />

An ordinary loop works. The more interesting solution asks how to remove the loop entirely.

<PuzzleHints />

<PuzzleSolution>

## Arithmetic series and inclusion–exclusion

The sum of positive multiples of $k$ below a limit $N$ is

$$
k\frac{m(m+1)}2,\qquad m=\left\lfloor\frac{N-1}{k}\right\rfloor.
$$

Add the multiples of 3 and 5, then subtract the multiples of 15 that were counted twice:

$$
3\frac{333\cdot334}{2}
+5\frac{199\cdot200}{2}
-15\frac{66\cdot67}{2}
=\boxed{233168}.
$$

This small problem introduces a durable habit: identify overlap explicitly before adding counts or sums.

</PuzzleSolution>
