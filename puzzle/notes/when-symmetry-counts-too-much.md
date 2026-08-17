---
title: When Symmetry Counts Too Much
description: Orbit thinking, Burnside’s lemma, and the warning signs of accidental overcounting.
layout: note
note: when-symmetry-counts-too-much
---

“Divide by the number of symmetries” is one of the most tempting shortcuts in combinatorics. It works only when every object has an orbit of the same size.

## The warning sign

If some configurations look more symmetric than others, their stabilizers are different. A generic necklace may have $n$ distinct rotations, while a repeating necklace has fewer. Dividing the raw count by $n$ treats those cases as if their orbits were equal.

Burnside's lemma replaces that assumption with an average:

$$
\lvert X/G\rvert=\frac{1}{\lvert G\rvert}\sum_{g\in G}\lvert\operatorname{Fix}(g)\rvert.
$$

Rather than counting orbits directly, count how many configurations each symmetry leaves unchanged.

## Why the average is exact

Count pairs $(g,x)$ for which $g$ fixes $x$ in two ways. Summing by group elements gives the numerator above. Summing by objects gives the total size of all stabilizers. The orbit–stabilizer theorem then contributes exactly $|G|$ for each orbit.

This is a useful recurring pattern: when direct division fails, search for a double count whose local irregularities average out.
