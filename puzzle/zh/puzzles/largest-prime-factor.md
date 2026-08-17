---
title: 最大质因数
description: 每找到一个因数就立即缩小剩余问题，一个简短的连续除法循环就足够了。
layout: puzzle
puzzle: largest-prime-factor
---

$13{,}195$ 的质因数是 $5,7,13,29$。

**$600{,}851{,}475{,}143$ 的最大质因数是多少？**

<PuzzleVisual variant="numbers" label="一组质因数的乘积" />

难点并不只是原始速度，而是每次发现因数后，都立即把剩余的数缩小。

<PuzzleHints />

<PuzzleSolution>

## 完全除去每个因数

只要 $d$ 能整除剩余值，就不断除以 $d$，直到不再整除。我们只需要在 $d^2\le n$ 时继续测试；如果结束时仍有大于 1 的剩余值，它就是质数。

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

对题目中的数，结果为

$$
\boxed{6857}.
$$

不断变化的循环上界很重要：每次除法都会减小 $n$，所以后续试除数无需接近原始输入的平方根。

</PuzzleSolution>
