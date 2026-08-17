---
title: Lattice Paths
description: Count routes through a grid by forgetting the picture and remembering only the moves.
layout: puzzle
puzzle: lattice-paths
---

Starting at the top-left corner of a grid, you may move only one step right or one step down at a time.

<PuzzleVisual variant="lattice" label="A square lattice with a highlighted monotone route" />

There are 6 such routes through a $2\times2$ grid.

**How many routes are there through a $20\times20$ grid?**

<PuzzleHints />

<PuzzleSolution>

## Encode a path as a word

Every valid route consists of exactly 20 right moves and 20 down moves, in some order. So each route is a length-40 word containing 20 copies of $R$ and 20 copies of $D$.

Choose the 20 positions occupied by the right moves:

$$
\binom{40}{20}=\frac{40!}{20!\,20!}=137{,}846{,}528{,}820.
$$

The picture suggests exploration; the move sequence reveals a standard combinatorial object.

</PuzzleSolution>
