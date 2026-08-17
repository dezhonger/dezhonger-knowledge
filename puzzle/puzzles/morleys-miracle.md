---
title: Morley's Miracle
description: Adjacent angle trisectors of an arbitrary triangle form an equilateral triangle.
layout: puzzle
puzzle: morleys-miracle
---

Trisect each of the three angles of an arbitrary triangle. For each pair of adjacent vertices, take the intersection of the two trisectors nearest their common side.

<PuzzleVisual variant="geometry" label="A triangle with a central circular construction" />

The three intersection points appear to form an equilateral triangle.

**Prove that they always do, no matter the shape of the original triangle.**

<PuzzleHints />

<PuzzleSolution>

## Reverse the construction

Write the angles of the original triangle as $3\alpha$, $3\beta$, and $3\gamma$, so

$$
\alpha+\beta+\gamma=60^\circ.
$$

Instead of starting with the arbitrary triangle, begin with an equilateral triangle and build three surrounding triangles whose angles are chosen from $\alpha$, $\beta$, and $\gamma$. Repeated applications of the sine rule show that the outer boundary closes and has angles $3\alpha$, $3\beta$, and $3\gamma$.

The constructed lines are therefore exactly the trisectors of that outer triangle. Because the inner triangle was equilateral by construction, the three adjacent-trisector intersections in the original configuration must also form an equilateral triangle.

This is a case where synthesis is cleaner than analysis: constructing the desired figure first reveals why the apparently accidental $60^\circ$ is forced by $\alpha+\beta+\gamma$.

</PuzzleSolution>
