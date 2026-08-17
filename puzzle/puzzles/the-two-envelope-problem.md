---
title: The Two Envelope Problem
description: A seductive expected-value argument seems to say that switching is always better.
layout: puzzle
puzzle: the-two-envelope-problem
---

Two envelopes contain positive sums of money. One contains twice as much as the other. You choose an envelope and observe an amount $A$.

A tempting argument says the other envelope contains either $A/2$ or $2A$, each with probability $1/2$, so its expected value is

$$
\frac12\cdot\frac A2 + \frac12\cdot 2A = \frac54A.
$$

<PuzzleVisual variant="numbers" label="A product of small prime numbers" />

**If switching has higher expected value, should you switch forever? Where is the mistake?**

<PuzzleHints />

<PuzzleSolution>

## The missing prior

After observing $A$, the events “$A$ is the smaller amount” and “$A$ is the larger amount” need not have equal probability. Their probabilities depend on how the original pair of amounts was generated.

The symbol $A$ is being asked to play two roles at once: a fixed observed value and a random pre-observation amount. The naive calculation silently keeps the $1/2$ probabilities from before opening the envelope while substituting information available only afterward.

With a specified prior distribution over the smaller amount, Bayes' rule can determine the conditional probabilities and a legitimate expected value. Without such a prior, the conditional expectation is not defined by the puzzle statement alone.

</PuzzleSolution>
