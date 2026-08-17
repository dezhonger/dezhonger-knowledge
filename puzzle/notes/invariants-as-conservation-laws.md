---
title: Invariants as Conservation Laws
description: A practical way to search for the quantity a legal move cannot change.
layout: note
note: invariants-as-conservation-laws
---

An invariant is a quantity or property preserved by every legal move. A monovariant is allowed to change, but only in one direction. Both turn a long search over possible move sequences into a short statement about what no sequence can do.

## Start with the move, not the goal

When a puzzle asks whether one state can reach another, resist the urge to simulate immediately. Write down exactly what one legal move changes:

1. Which objects are created or removed?
2. Which positions change color, parity, or orientation?
3. Is there a natural weighted sum?
4. Can the move be expressed as addition in a small modulus?

The mutilated chessboard uses a two-color count. Conway's Soldiers uses an infinite weighted sum. The surface details differ, but the proof pattern is the same.

## A tiny algebraic model

Suppose a state is a vector $x$ and every legal move adds one of the vectors $m_1,\ldots,m_k$. A linear invariant is a vector $w$ such that

$$
w\cdot m_i=0 \quad \text{for every legal move }m_i.
$$

Then $w\cdot x$ is unchanged along every reachable path. Coloring arguments are often this idea in disguise.

## A useful checklist

| Symptom | Candidate tool |
| --- | --- |
| Pieces cover adjacent cells | Coloring or parity |
| Jumps consume and create pieces | Weighted sum |
| Moves rotate or swap objects | Permutation sign |
| Quantity appears to drift | Monovariant or potential function |

> A good invariant does not describe how to win. It explains why an entire universe of attempted wins cannot work.

The creative step is choosing the representation in which the move becomes simple.
