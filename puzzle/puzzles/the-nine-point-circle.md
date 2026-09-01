---
date: 2026-08-17
title: The Nine-Point Circle
description: Nine distinguished points of every triangle quietly share a single circle.
layout: puzzle
puzzle: the-nine-point-circle
---

For an arbitrary triangle $ABC$, mark these nine points:

- the midpoints of the three sides;
- the feet of the three altitudes;
- the midpoints between each vertex and the orthocenter $H$.

<PuzzleVisual variant="geometry" label="A triangle, an interior circle, and three marked points" />

**Prove that all nine points lie on one circle.**

<PuzzleHints />

<PuzzleSolution>

## Begin with six points

Let $D,E,F$ be the altitude feet and $L,M,N$ the side midpoints. Since $\angle BDC=\angle BEC=90^\circ$, points $B,C,D,E$ are concyclic. Similar right-angle arguments connect each altitude foot to the medial triangle.

A compact route is to apply a homothety centered at $H$ with scale factor $1/2$. It sends $A,B,C$ to the three midpoints between the vertices and $H$, and sends the circumcircle of $ABC$ to a circle of half the circumradius.

The center of that image circle is the midpoint of $OH$, where $O$ is the circumcenter. One then verifies that the side midpoints and altitude feet are at the same distance $R/2$ from this center.

All nine points therefore lie on the circle centered at the midpoint of $OH$ with radius $R/2$.

</PuzzleSolution>
