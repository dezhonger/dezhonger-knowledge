---
title: The Mutilated Chessboard
description: Two missing corners, thirty-one dominoes, and one coloring that settles everything.
layout: puzzle
puzzle: the-mutilated-chessboard
---

Remove two diagonally opposite corner squares from a standard $8\times8$ chessboard. The remaining board contains 62 squares.

You also have 31 dominoes, each covering exactly two orthogonally adjacent squares.

<PuzzleVisual variant="chessboard" label="An eight by eight chessboard with opposite corners removed" />

The areas match perfectly: $31\times2=62$.

**Can the mutilated board be tiled without overlap or gaps?**

<PuzzleHints />

<PuzzleSolution>

## Color is the invariant

Opposite corners of a chessboard have the same color. Removing them leaves 30 squares of that color and 32 of the other color.

Every orthogonally placed domino covers one black square and one white square. Therefore 31 dominoes would have to cover exactly 31 black and 31 white squares.

But the mutilated board has a $30/32$ split, so a tiling is impossible.

Area was necessary, but not sufficient. The coloring exposes the constraint that every legal tile must preserve.

</PuzzleSolution>
