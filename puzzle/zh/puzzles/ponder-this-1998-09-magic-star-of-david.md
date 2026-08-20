---
title: 大卫之星幻方
description: 把 1 到 12 放上六芒星，使六条直线的和全部相同。
layout: puzzle
puzzle: ponder-this-1998-09-magic-star-of-david
---

## IBM Ponder This #005 · 1998 年 9 月

画一个标准的六芒星，也就是 Star of David。图形由 6 条直线构成，共有 12 个顶点；每条直线上有 4 个顶点。

把

$$
1,2,\ldots,12
$$

分别放到 12 个顶点上，每个数字恰好使用一次。要求 6 条直线都满足

$$
\boxed{\text{每条线上的四个数字之和}=26}.
$$

这可以看成一个小型约束满足问题：6 个线性约束必须与 $1$ 到 $12$ 的一个排列同时成立。既可以手工推理，也可以使用回溯搜索，或把方程与枚举结合起来。

[查看 IBM Research 官方题目](https://research.ibm.com/blog/ponder-this-september-1998){target="_blank" rel="noreferrer"}
