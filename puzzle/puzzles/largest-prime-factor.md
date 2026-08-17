---
title: Largest Prime Factor
description: A short factor-stripping loop is enough when every discovered divisor changes the remaining problem.
layout: puzzle
puzzle: largest-prime-factor
---

The prime factors of $13{,}195$ are $5,7,13,$ and $29$.

**What is the largest prime factor of $600{,}851{,}475{,}143$?**

<PuzzleVisual variant="numbers" label="A multiplication of prime factors" />

The challenge is less about raw speed than about keeping the remaining number small as soon as a factor is known.

<PuzzleHints />

<PuzzleSolution>

## Strip each factor completely

Whenever $d$ divides the remaining value, divide by $d$ until it no longer does. We only need to test while $d^2\le n$; if a value greater than 1 remains afterward, that remainder is prime.

```ts
function largestPrimeFactor(value: number): number {
  let n = value
  let largest = 1

  for (let divisor = 2; divisor * divisor <= n; divisor += divisor === 2 ? 1 : 2) {
    while (n % divisor === 0) {
      largest = divisor
      n /= divisor
    }
  }

  return n > 1 ? n : largest
}
```

For the given number, the result is

$$
\boxed{6857}.
$$

The changing loop bound matters: every division reduces $n$, so later trial divisors do not need to approach the square root of the original input.

</PuzzleSolution>
