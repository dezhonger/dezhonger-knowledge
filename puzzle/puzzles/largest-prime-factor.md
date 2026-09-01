---
date: 2026-08-17
title: Largest Prime Factor
description: Project Euler Problem 3, formalized as a maximization over prime divisors and solved by repeated trial division.
layout: puzzle
puzzle: largest-prime-factor
projectEuler: 3
---

## Original problem

The prime factors of $13195$ are $5, 7, 13$ and $29$.

**What is the largest prime factor of the number $600851475143$?**

## Formal statement

For

$$
N=600851475143,
$$

find

$$
\max\{p\in\mathbb P\mid p\mid N\},
$$

where $\mathbb P$ is the set of prime numbers.

<PuzzleHints />

<PuzzleSolution>

## Approach

Start with the smallest possible divisor. Whenever the current divisor divides the remaining value, divide it out completely before moving on. Each successful division shrinks the unresolved part of the factorization.

It is enough to test divisors while $d^2\le n$. If a value greater than $1$ remains after that point, it cannot have a smaller undiscovered factor and is therefore prime. The largest divisor removed—or that final remainder—is the required factor.

<ProtectedPuzzleAnswer problem="3" />

</PuzzleSolution>

> The original problem is reproduced from [Project Euler Problem 3](https://projecteuler.net/problem=3) under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
