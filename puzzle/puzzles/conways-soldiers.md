---
date: 2026-08-17
title: Conway's Soldiers
description: How far can an army of pegs advance when every move must be a jump?
layout: puzzle
puzzle: conways-soldiers
---

Cover every square on or below a horizontal line of an infinite square grid with a peg. A legal move is the usual peg-solitaire jump: one peg jumps over an adjacent peg into an empty square, and the jumped peg is removed.

<PuzzleVisual variant="pegs" label="A field of pegs with empty spaces above the starting frontier" />

The army wants to advance upward. It is possible to place a peg on the first, second, third, and fourth rows above the initial line.

**Can any sequence of legal jumps reach the fifth row?**

<PuzzleHints />

<PuzzleSolution>

## A pagoda function

Let $\varphi=(1+\sqrt5)/2$. Give each board position a weight $\varphi^{-d}$, where $d$ is a suitably chosen taxicab distance from the target square.

The identity

$$
\varphi^{-n}=\varphi^{-(n+1)}+\varphi^{-(n+2)}
$$

means that, for a jump aimed toward the target, the weight of the landing square equals the combined weight of the two consumed positions. Other jump directions do not increase the total weight.

Now sum the weights of all initially occupied squares. For a target on the fifth row, that total is strictly less than the target square's weight. Since legal moves never increase the total, no sequence can ever place a peg there.

The fourth row is reachable, but the fifth is not. The key is a **monovariant**: a carefully chosen quantity that can only stay the same or decrease.

</PuzzleSolution>
