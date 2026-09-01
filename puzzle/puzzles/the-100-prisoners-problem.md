---
date: 2026-08-17
title: The 100 Prisoners Problem
description: A cycle-following strategy turns an almost impossible search into a surprisingly hopeful one.
layout: puzzle
puzzle: the-100-prisoners-problem
---

One hundred prisoners are numbered from 1 to 100. In another room are one hundred closed drawers, also numbered 1 to 100. Each drawer contains one prisoner's number, placed uniformly at random with no repeats.

Each prisoner may open at most **50 drawers** and must find their own number. The prisoners enter one at a time and cannot communicate after the search begins. If every prisoner succeeds, everyone is released; if even one fails, everyone loses.

<PuzzleVisual variant="prisoners" label="Twenty representative numbered drawers with a few highlighted positions" />

If everyone simply opens 50 random drawers, the group succeeds with probability $2^{-100}$, effectively zero.

**Can the prisoners agree on a strategy that gives the group a meaningful chance?**

<PuzzleHints />

<PuzzleSolution>

## Follow the permutation

Prisoner $i$ first opens drawer $i$. If it contains number $j$, the prisoner next opens drawer $j$, then continues in the same way.

The drawer contents form a permutation of $1,2,\ldots,100$. Every permutation decomposes into disjoint cycles, and prisoner $i$ is walking around the unique cycle containing $i$. They find their own number precisely when that cycle has length at most 50.

Therefore everyone succeeds exactly when the random permutation has **no cycle longer than 50**.

For $k > 50$, a permutation can contain at most one cycle of length $k$, and the probability that it contains such a cycle is $1/k$. Hence

$$
P(\text{success}) = 1 - \sum_{k=51}^{100}\frac{1}{k} \approx 0.31183.
$$

So the shared strategy raises the chance of complete success from roughly $7.9\times10^{-31}$ to a little over **31%**.

The striking part is not merely the improvement. It is that the prisoners create correlation: they either tend to succeed together or fail together, which is exactly what the rules reward.

</PuzzleSolution>
