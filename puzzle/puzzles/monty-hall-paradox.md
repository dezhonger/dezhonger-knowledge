---
date: 2026-08-17
title: The Monty Hall Paradox
description: "One prize, three doors, and an informed host: should you switch?"
layout: puzzle
puzzle: monty-hall-paradox
---

A prize is hidden behind one of three doors. You choose one door. The host, who knows where the prize is, then opens a different door that certainly hides no prize.

Two unopened doors remain: your original choice and one alternative.

<PuzzleVisual variant="doors" label="Three doors, one opened by the host" />

**Should you stay, switch, or does it make no difference?**

Assume the host always opens a losing door and always offers the switch.

<PuzzleHints />

<PuzzleSolution>

## Switch

Your first choice is correct with probability $1/3$ and wrong with probability $2/3$. The host's action does not redistribute that original probability evenly; it reveals information while obeying a rule.

| Initial choice | Probability | If you switch |
| --- | ---: | --- |
| Prize | $1/3$ | Lose |
| No prize | $2/3$ | Win |

Thus staying wins with probability $1/3$, while switching wins with probability $2/3$.

An equivalent way to make the asymmetry visible is to imagine one hundred doors. Choose one; the informed host opens 98 losing doors. Your single door still carries its original $1/100$ chance, while the one surviving alternative carries the other $99/100$.

</PuzzleSolution>
