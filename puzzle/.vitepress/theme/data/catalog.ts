export type PuzzleStatus = 'solved' | 'studying' | 'open'

export interface Puzzle {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  solution: string
  hints: string[]
  collection: string
  source: string
  sourceUrl: string
  license: string
  difficulty: 1 | 2 | 3 | 4 | 5
  status: PuzzleStatus
  createdAt: string
  updatedAt: string
  cover: 'prisoners' | 'lattice' | 'numbers' | 'chessboard' | 'geometry' | 'doors' | 'pegs'
  categories: string[]
  searchText: string
  zh: Pick<Puzzle, 'title' | 'summary' | 'hints' | 'source' | 'categories' | 'searchText'>
}

export interface Collection {
  id: string
  slug: string
  title: string
  description: string
  cover: string
  problemCount: number
  noteCount: number
  zh: Pick<Collection, 'title' | 'description'>
}

export interface Note {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  createdAt: string
  updatedAt: string
  readingTime: string
  searchText: string
  zh: Pick<Note, 'title' | 'summary' | 'readingTime' | 'searchText'>
}

export const collections: Collection[] = [
  {
    id: 'collection-euler',
    slug: 'project-euler',
    title: 'Project Euler',
    description: 'Mathematical and computational problems that reward both proof and implementation.',
    cover: '∑',
    problemCount: 3,
    noteCount: 1,
    zh: {
      title: 'Project Euler',
      description: '同时奖励数学证明与编程实现的数学和计算问题。',
    },
  },
  {
    id: 'collection-geometry',
    slug: 'geometry',
    title: 'Geometry',
    description: 'Diagrams, constructions, and the small observations that make a proof click.',
    cover: '△',
    problemCount: 2,
    noteCount: 1,
    zh: {
      title: '几何',
      description: '图形、作图，以及让证明豁然开朗的微小观察。',
    },
  },
  {
    id: 'collection-games-logic',
    slug: 'games-and-logic',
    title: 'Games & Logic',
    description: 'Strategies, invariants, boards, and puzzles where the rules hide the real problem.',
    cover: '♜',
    problemCount: 3,
    noteCount: 1,
    zh: {
      title: '游戏与逻辑',
      description: '策略、不变量、棋盘，以及那些真正问题藏在规则之下的谜题。',
    },
  },
  {
    id: 'collection-probability',
    slug: 'counterintuitive-probability',
    title: 'Counterintuitive Probability',
    description: 'Problems that make intuition stumble before a clean model restores order.',
    cover: '∞',
    problemCount: 2,
    noteCount: 0,
    zh: {
      title: '反直觉概率',
      description: '先让直觉失足，再用清晰模型恢复秩序的概率问题。',
    },
  },
  {
    id: 'collection-ibm-research',
    slug: 'ibm-research',
    title: 'IBM Research',
    description: 'Monthly challenges and elegant problems from IBM Research, including Ponder This.',
    cover: 'IBM',
    problemCount: 6,
    noteCount: 0,
    zh: {
      title: 'IBM Research',
      description: '来自 IBM Research 的每月挑战与精巧问题，包括 Ponder This 系列。',
    },
  },
  {
    id: 'collection-jane-street',
    slug: 'jane-street-puzzles',
    title: 'Jane Street’s Puzzles',
    description: 'Mathematical, logical, and computational puzzles published by Jane Street.',
    cover: '◇',
    problemCount: 0,
    noteCount: 0,
    zh: {
      title: 'Jane Street’s Puzzles',
      description: '由 Jane Street 发布的数学、逻辑与计算型谜题。',
    },
  },
  {
    id: 'collection-sequences',
    slug: 'sequences',
    title: 'Sequences',
    description: 'Interesting integer sequences, recurrences, patterns, and the ideas they encode.',
    cover: '1,1,2',
    problemCount: 0,
    noteCount: 0,
    zh: {
      title: 'Sequences',
      description: '记录有趣的整数数列、递推关系、模式，以及它们所承载的思想。',
    },
  },
]

export const puzzles: Puzzle[] = [
  {
    id: '0187',
    slug: 'the-100-prisoners-problem',
    title: 'The 100 Prisoners Problem',
    summary: 'A cycle-following strategy turns an almost impossible search into a surprisingly hopeful one.',
    content: 'puzzles/the-100-prisoners-problem.md',
    solution: 'puzzles/the-100-prisoners-problem.md#solution',
    hints: [
      'Do not let each prisoner choose drawers independently at random.',
      'Treat the numbers inside the drawers as a permutation and follow its cycles.',
      'The group succeeds exactly when the permutation has no cycle longer than 50.',
    ],
    collection: 'games-and-logic',
    source: 'Classic probability puzzle',
    sourceUrl: 'https://en.wikipedia.org/wiki/100_prisoners_problem',
    license: 'Adapted summary for demonstration',
    difficulty: 4,
    status: 'solved',
    createdAt: '2026-08-17',
    updatedAt: '2026-08-17',
    cover: 'prisoners',
    categories: ['Probability', 'Logic'],
    searchText: 'permutation cycles drawers prisoners strategy chance harmonic probability',
    zh: {
      title: '100 名囚徒问题',
      summary: '沿置换环行走的策略，把几乎不可能的搜索变成了颇有希望的尝试。',
      hints: ['不要让每名囚徒独立随机选择抽屉。', '把抽屉中的数字视为一个置换，并沿它的环前进。', '所有人成功，当且仅当置换中没有长度超过 50 的环。'],
      source: '经典概率谜题',
      categories: ['概率', '逻辑'],
      searchText: '置换 环 抽屉 囚徒 策略 成功率 调和级数 概率',
    },
  },
  {
    id: '0186',
    slug: 'conways-soldiers',
    title: "Conway's Soldiers",
    summary: 'How far can an army of pegs advance when every move must be a jump?',
    content: 'puzzles/conways-soldiers.md',
    solution: 'puzzles/conways-soldiers.md#solution',
    hints: ['Try assigning a weight to every square.', 'Choose the weight so that a legal jump never increases the total.'],
    collection: 'games-and-logic',
    source: 'John Horton Conway',
    sourceUrl: 'https://en.wikipedia.org/wiki/Conway%27s_soldiers',
    license: 'Adapted summary for demonstration',
    difficulty: 5,
    status: 'studying',
    createdAt: '2026-08-16',
    updatedAt: '2026-08-17',
    cover: 'pegs',
    categories: ['Game', 'Invariant'],
    searchText: 'peg solitaire golden ratio pagoda function invariant jump army',
    zh: {
      title: '康威的士兵',
      summary: '当每一步都必须跳过一枚棋子时，一支木钉军队能前进多远？',
      hints: ['尝试给每个格子赋予一个权重。', '选择权重，使任意合法跳跃都不会增加总和。'],
      source: '约翰·霍顿·康威',
      categories: ['游戏', '不变量'],
      searchText: '孔明棋 黄金分割 宝塔函数 不变量 跳跃 军队',
    },
  },
  {
    id: '0185',
    slug: 'the-mutilated-chessboard',
    title: 'The Mutilated Chessboard',
    summary: 'Two missing corners, thirty-one dominoes, and one coloring that settles everything.',
    content: 'puzzles/the-mutilated-chessboard.md',
    solution: 'puzzles/the-mutilated-chessboard.md#solution',
    hints: ['Color the board as a normal chessboard.', 'Count how many squares of each color remain.'],
    collection: 'games-and-logic',
    source: 'Classic invariant puzzle',
    sourceUrl: 'https://en.wikipedia.org/wiki/Mutilated_chessboard_problem',
    license: 'Adapted summary for demonstration',
    difficulty: 2,
    status: 'solved',
    createdAt: '2026-08-15',
    updatedAt: '2026-08-15',
    cover: 'chessboard',
    categories: ['Invariant', 'Chessboard'],
    searchText: 'domino tiling black white squares opposite corners coloring parity',
    zh: {
      title: '残缺的棋盘',
      summary: '去掉两个角、放下三十一块多米诺骨牌，一种染色方式就能决定答案。',
      hints: ['像普通国际象棋棋盘一样黑白染色。', '数一数剩下的两种颜色各有多少格。'],
      source: '经典不变量谜题',
      categories: ['不变量', '棋盘'],
      searchText: '多米诺 铺砖 黑白 对角 染色 奇偶性 棋盘',
    },
  },
  {
    id: '0142',
    slug: 'monty-hall-paradox',
    title: 'The Monty Hall Paradox',
    summary: 'One prize, three doors, and an informed host: should you switch?',
    content: 'puzzles/monty-hall-paradox.md',
    solution: 'puzzles/monty-hall-paradox.md#solution',
    hints: ['Keep track of what the host knows.', 'Your first choice is wrong with probability 2/3.'],
    collection: 'counterintuitive-probability',
    source: 'Classic conditional probability puzzle',
    sourceUrl: 'https://en.wikipedia.org/wiki/Monty_Hall_problem',
    license: 'Adapted summary for demonstration',
    difficulty: 2,
    status: 'solved',
    createdAt: '2026-08-14',
    updatedAt: '2026-08-14',
    cover: 'doors',
    categories: ['Probability', 'Conditional'],
    searchText: 'three doors host goat car switch conditional probability bayes',
    zh: {
      title: '蒙提霍尔悖论',
      summary: '一份奖品、三扇门和一位知道答案的主持人：应该换门吗？',
      hints: ['留意主持人知道什么。', '你第一次选错的概率是 2/3。'],
      source: '经典条件概率谜题',
      categories: ['概率', '条件概率'],
      searchText: '三扇门 主持人 山羊 汽车 换门 条件概率 贝叶斯',
    },
  },
  {
    id: '0118',
    slug: 'the-nine-point-circle',
    title: 'The Nine-Point Circle',
    summary: 'Nine distinguished points of every triangle quietly share a single circle.',
    content: 'puzzles/the-nine-point-circle.md',
    solution: 'puzzles/the-nine-point-circle.md#solution',
    hints: ['Start with the medial triangle.', 'Look for cyclic quadrilaterals created by right angles.'],
    collection: 'geometry',
    source: 'Classical Euclidean geometry',
    sourceUrl: 'https://en.wikipedia.org/wiki/Nine-point_circle',
    license: 'Adapted summary for demonstration',
    difficulty: 3,
    status: 'solved',
    createdAt: '2026-08-12',
    updatedAt: '2026-08-13',
    cover: 'geometry',
    categories: ['Geometry', 'Circle'],
    searchText: 'triangle midpoint altitude orthocenter feet circle euler geometry',
    zh: {
      title: '九点圆',
      summary: '任意三角形中的九个特殊点，安静地共圆。',
      hints: ['从中点三角形开始。', '寻找由直角产生的圆内接四边形。'],
      source: '经典欧氏几何',
      categories: ['几何', '圆'],
      searchText: '三角形 中点 高 垂心 垂足 圆 欧拉 几何',
    },
  },
  {
    id: '0117',
    slug: 'morleys-miracle',
    title: "Morley's Miracle",
    summary: 'Adjacent angle trisectors of an arbitrary triangle form an equilateral triangle.',
    content: 'puzzles/morleys-miracle.md',
    solution: 'puzzles/morleys-miracle.md#solution',
    hints: ['A direct angle chase is possible, but a constructed equilateral triangle is cleaner.', 'Write the three original angles as triples.'],
    collection: 'geometry',
    source: 'Frank Morley',
    sourceUrl: 'https://en.wikipedia.org/wiki/Morley%27s_trisector_theorem',
    license: 'Adapted summary for demonstration',
    difficulty: 5,
    status: 'open',
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
    cover: 'geometry',
    categories: ['Geometry', 'Construction'],
    searchText: 'triangle angle trisectors equilateral theorem construction proof',
    zh: {
      title: '莫雷奇迹',
      summary: '任意三角形中，相邻角的三等分线交点构成等边三角形。',
      hints: ['可以直接追角，但构造一个等边三角形更干净。', '把原三角形的三个角分别写成三倍角。'],
      source: '弗兰克·莫雷',
      categories: ['几何', '作图'],
      searchText: '三角形 角三等分线 等边三角形 定理 构造 证明',
    },
  },
  {
    id: '0091',
    slug: 'the-two-envelope-problem',
    title: 'The Two Envelope Problem',
    summary: 'A seductive expected-value argument seems to say that switching is always better.',
    content: 'puzzles/the-two-envelope-problem.md',
    solution: 'puzzles/the-two-envelope-problem.md#solution',
    hints: ['Ask whether the same symbol can represent both a fixed observation and a random quantity.', 'An expectation needs a prior distribution.'],
    collection: 'counterintuitive-probability',
    source: 'Classic probability paradox',
    sourceUrl: 'https://en.wikipedia.org/wiki/Two_envelopes_problem',
    license: 'Adapted summary for demonstration',
    difficulty: 4,
    status: 'studying',
    createdAt: '2026-08-08',
    updatedAt: '2026-08-09',
    cover: 'numbers',
    categories: ['Probability', 'Paradox'],
    searchText: 'two envelopes expected value switching prior distribution paradox',
    zh: {
      title: '两个信封问题',
      summary: '一个诱人的期望值计算，似乎说无论何时换信封都更好。',
      hints: ['问一问：同一个符号能否同时表示固定观察值和随机量？', '计算期望值需要一个先验分布。'],
      source: '经典概率悖论',
      categories: ['概率', '悖论'],
      searchText: '两个信封 期望值 交换 先验分布 悖论',
    },
  },
  {
    id: '0015',
    slug: 'lattice-paths',
    title: 'Lattice Paths',
    summary: 'Count routes through a grid by forgetting the picture and remembering only the moves.',
    content: 'puzzles/lattice-paths.md',
    solution: 'puzzles/lattice-paths.md#solution',
    hints: ['Every route uses the same number of right and down moves.', 'Choose which positions in the move sequence are right moves.'],
    collection: 'project-euler',
    source: 'Project Euler · Problem 15',
    sourceUrl: 'https://projecteuler.net/problem=15',
    license: 'Project Euler terms apply to the original problem',
    difficulty: 2,
    status: 'solved',
    createdAt: '2026-08-06',
    updatedAt: '2026-08-07',
    cover: 'lattice',
    categories: ['Combinatorics', 'Grid'],
    searchText: 'lattice grid paths binomial coefficient choose right down combinatorics',
    zh: {
      title: '格子路径',
      summary: '忘掉图形，只记住每一步的方向，就能计数网格中的路径。',
      hints: ['每条路径使用的向右和向下步数都一样。', '在整个步骤序列中，选择哪些位置放向右移动。'],
      source: 'Project Euler · 第 15 题',
      categories: ['组合数学', '网格'],
      searchText: '格子 网格 路径 二项式系数 组合 向右 向下',
    },
  },
  {
    id: '0003',
    slug: 'largest-prime-factor',
    title: 'Largest Prime Factor',
    summary: 'A short factor-stripping loop is enough when every discovered divisor changes the remaining problem.',
    content: 'puzzles/largest-prime-factor.md',
    solution: 'puzzles/largest-prime-factor.md#solution',
    hints: ['Remove each small factor completely before continuing.', 'When the loop ends, the remaining number may itself be prime.'],
    collection: 'project-euler',
    source: 'Project Euler · Problem 3',
    sourceUrl: 'https://projecteuler.net/problem=3',
    license: 'Project Euler terms apply to the original problem',
    difficulty: 2,
    status: 'solved',
    createdAt: '2026-08-04',
    updatedAt: '2026-08-05',
    cover: 'numbers',
    categories: ['Number Theory', 'Algorithm'],
    searchText: 'prime factor trial division integer algorithm factorization code',
    zh: {
      title: '最大质因数',
      summary: '每找到一个因数就立即缩小剩余问题，一个简短的连续除法循环就足够了。',
      hints: ['继续除以每个小因数，直到它不再整除剩余值。', '循环结束时，剩下的数本身可能就是质数。'],
      source: 'Project Euler · 第 3 题',
      categories: ['数论', '算法'],
      searchText: '质因数 试除法 整数 算法 分解 代码',
    },
  },
  {
    id: '0001',
    slug: 'multiples-of-3-or-5',
    title: 'Multiples of 3 or 5',
    summary: 'A first exercise in turning iteration into arithmetic with inclusion–exclusion.',
    content: 'puzzles/multiples-of-3-or-5.md',
    solution: 'puzzles/multiples-of-3-or-5.md#solution',
    hints: ['Sum multiples of 3 and multiples of 5 separately.', 'Correct for numbers counted twice.'],
    collection: 'project-euler',
    source: 'Project Euler · Problem 1',
    sourceUrl: 'https://projecteuler.net/problem=1',
    license: 'Project Euler terms apply to the original problem',
    difficulty: 1,
    status: 'solved',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    cover: 'numbers',
    categories: ['Arithmetic', 'Inclusion–Exclusion'],
    searchText: 'multiples arithmetic series inclusion exclusion sum natural numbers',
    zh: {
      title: '3 或 5 的倍数',
      summary: '把遍历改写成等差数列求和，是练习容斥原理的第一步。',
      hints: ['分别计算 3 的倍数和 5 的倍数之和。', '修正被重复计数的项。'],
      source: 'Project Euler · 第 1 题',
      categories: ['算术', '容斥原理'],
      searchText: '倍数 等差数列 容斥原理 求和 自然数',
    },
  },
  {
    id: 'IBM-001',
    slug: 'ponder-this-1998-05-belt-around-the-earth',
    title: 'A belt around the earth',
    summary: 'Six extra metres, one lifted point, and a height that defies first intuition.',
    content: 'puzzles/ponder-this-1998-05-belt-around-the-earth.md',
    solution: 'puzzles/ponder-this-1998-05-belt-around-the-earth.md#solution',
    hints: [],
    collection: 'ibm-research',
    source: 'IBM Research · Ponder This · May 1998',
    sourceUrl: 'https://research.ibm.com/blog/ponder-this-may-1998',
    license: 'Adapted problem statement; the original prompt and official solution are available at IBM Research.',
    difficulty: 4,
    status: 'open',
    createdAt: '1998-05-01',
    updatedAt: '1998-05-01',
    cover: 'geometry',
    categories: ['Geometry', 'Approximation'],
    searchText: 'IBM Ponder This May 1998 belt around earth circle tangent arc length transcendental equation Taylor approximation',
    zh: {
      title: '地球上的腰带',
      summary: '多出 6 米、抬起一个点，答案会颠覆最初的直觉。',
      hints: [],
      source: 'IBM Research · Ponder This · 1998 年 5 月',
      categories: ['几何', '近似'],
      searchText: 'IBM Ponder This 1998 5月 地球 腰带 圆 切线 弧长 超越方程 泰勒 近似',
    },
  },
  {
    id: 'IBM-002',
    slug: 'ponder-this-1998-06-shaking-hands-in-a-party',
    title: 'Shaking hands in a party',
    summary: 'Seven distinct answers about handshakes reveal a hidden structure among four couples.',
    content: 'puzzles/ponder-this-1998-06-shaking-hands-in-a-party.md',
    solution: 'puzzles/ponder-this-1998-06-shaking-hands-in-a-party.md#solution',
    hints: [],
    collection: 'ibm-research',
    source: 'IBM Research · Ponder This · June 1998',
    sourceUrl: 'https://research.ibm.com/blog/ponder-this-june-1998',
    license: 'Adapted problem statement; the original prompt and official solution are available at IBM Research.',
    difficulty: 3,
    status: 'open',
    createdAt: '1998-06-01',
    updatedAt: '1998-06-01',
    cover: 'numbers',
    categories: ['Combinatorics', 'Logic'],
    searchText: 'IBM Ponder This June 1998 shaking hands party couples graph degree sequence Pat Chris',
    zh: {
      title: '聚会握手问题',
      summary: '七个互不相同的握手次数，揭示四对夫妻间隐藏的结构。',
      hints: [],
      source: 'IBM Research · Ponder This · 1998 年 6 月',
      categories: ['组合数学', '逻辑'],
      searchText: 'IBM Ponder This 1998 6月 聚会 握手 夫妻 图论 度数序列 Pat Chris',
    },
  },
  {
    id: 'IBM-003',
    slug: 'ponder-this-1998-07-tennis-balls-in-a-bucket',
    title: 'Tennis balls in a bucket',
    summary: 'Arrange distinct positive counts in rows of three while making their common sum as small as possible.',
    content: 'puzzles/ponder-this-1998-07-tennis-balls-in-a-bucket.md',
    solution: 'puzzles/ponder-this-1998-07-tennis-balls-in-a-bucket.md#solution',
    hints: [],
    collection: 'ibm-research',
    source: 'IBM Research · Ponder This · July 1998',
    sourceUrl: 'https://research.ibm.com/blog/ponder-this-july-1998',
    license: 'Adapted problem statement; the original prompt and official solution are available at IBM Research.',
    difficulty: 4,
    status: 'open',
    createdAt: '1998-07-01',
    updatedAt: '1998-07-01',
    cover: 'numbers',
    categories: ['Combinatorics', 'Optimization'],
    searchText: 'IBM Ponder This July 1998 tennis balls bucket rows distinct positive integers construction optimal minimum sum',
    zh: {
      title: '桶中的网球',
      summary: '把互不相同的正整数排入每行三个桶，并让公共和尽可能小。',
      hints: [],
      source: 'IBM Research · Ponder This · 1998 年 7 月',
      categories: ['组合数学', '最优化'],
      searchText: 'IBM Ponder This 1998 7月 网球 桶 行 不同正整数 构造 最优 最小和',
    },
  },
  {
    id: 'IBM-004',
    slug: 'ponder-this-1998-08-equilateral-triangle',
    title: 'Equilateral triangle',
    summary: 'A small equilateral triangle with cyclically equal offsets forces the outer triangle to be equilateral too.',
    content: 'puzzles/ponder-this-1998-08-equilateral-triangle.md',
    solution: 'puzzles/ponder-this-1998-08-equilateral-triangle.md#solution',
    hints: [],
    collection: 'ibm-research',
    source: 'IBM Research · Ponder This · August 1998',
    sourceUrl: 'https://research.ibm.com/blog/ponder-this-august-1998',
    license: 'Adapted problem statement; the original prompt and official solution are available at IBM Research.',
    difficulty: 4,
    status: 'open',
    createdAt: '1998-08-01',
    updatedAt: '1998-08-01',
    cover: 'geometry',
    categories: ['Geometry', 'Proof'],
    searchText: 'IBM Ponder This August 1998 equilateral triangle ABC DEF AD BE CF proof geometry',
    zh: {
      title: '等边三角形',
      summary: '内部等边三角形与循环相等的边上距离，迫使外部三角形也成为等边。',
      hints: [],
      source: 'IBM Research · Ponder This · 1998 年 8 月',
      categories: ['几何', '证明'],
      searchText: 'IBM Ponder This 1998 8月 等边三角形 ABC DEF AD BE CF 证明 几何',
    },
  },
  {
    id: 'IBM-005',
    slug: 'ponder-this-1998-09-magic-star-of-david',
    title: 'Magic Star of David',
    summary: 'Place 1 through 12 on a six-pointed star so every one of its six lines has the same sum.',
    content: 'puzzles/ponder-this-1998-09-magic-star-of-david.md',
    solution: 'puzzles/ponder-this-1998-09-magic-star-of-david.md#solution',
    hints: [],
    collection: 'ibm-research',
    source: 'IBM Research · Ponder This · September 1998',
    sourceUrl: 'https://research.ibm.com/blog/ponder-this-september-1998',
    license: 'Adapted problem statement; the original prompt and official solution are available at IBM Research.',
    difficulty: 4,
    status: 'open',
    createdAt: '1998-09-01',
    updatedAt: '1998-09-01',
    cover: 'numbers',
    categories: ['Combinatorics', 'Search'],
    searchText: 'IBM Ponder This September 1998 magic Star of David six lines twelve vertices constraint satisfaction backtracking',
    zh: {
      title: '大卫之星幻方',
      summary: '把 1 到 12 放上六芒星，使六条直线的和全部相同。',
      hints: [],
      source: 'IBM Research · Ponder This · 1998 年 9 月',
      categories: ['组合数学', '搜索'],
      searchText: 'IBM Ponder This 1998 9月 大卫之星 六芒星 幻方 六条线 十二顶点 约束满足 回溯',
    },
  },
  {
    id: 'IBM-006',
    slug: 'ponder-this-1998-10-sorting-pancakes',
    title: 'Sorting pancakes',
    summary: 'How many prefix reversals can the hardest permutation of differently sized pancakes require?',
    content: 'puzzles/ponder-this-1998-10-sorting-pancakes.md',
    solution: 'puzzles/ponder-this-1998-10-sorting-pancakes.md#solution',
    hints: [],
    collection: 'ibm-research',
    source: 'IBM Research · Ponder This · October 1998',
    sourceUrl: 'https://research.ibm.com/blog/ponder-this-october-1998',
    license: 'Adapted problem statement; the original prompt and official solution are available at IBM Research.',
    difficulty: 4,
    status: 'open',
    createdAt: '1998-10-01',
    updatedAt: '1998-10-01',
    cover: 'numbers',
    categories: ['Algorithm', 'Graph Theory'],
    searchText: 'IBM Ponder This October 1998 sorting pancakes prefix reversal permutation pancake graph diameter',
    zh: {
      title: '煎饼排序',
      summary: '对不同大小的煎饼做前缀翻转，最难的排列需要多少次操作？',
      hints: [],
      source: 'IBM Research · Ponder This · 1998 年 10 月',
      categories: ['算法', '图论'],
      searchText: 'IBM Ponder This 1998 10月 煎饼排序 前缀翻转 排列 煎饼图 直径',
    },
  },
]

export const notes: Note[] = [
  {
    id: 'note-001',
    slug: 'invariants-as-conservation-laws',
    title: 'Invariants as Conservation Laws',
    summary: 'A practical way to search for the quantity a legal move cannot change.',
    content: 'notes/invariants-as-conservation-laws.md',
    createdAt: '2026-08-11',
    updatedAt: '2026-08-16',
    readingTime: '6 min read',
    searchText: 'invariant monovariant coloring parity conservation game moves proof',
    zh: {
      title: '把不变量看作守恒律',
      summary: '一种实用方法：寻找合法操作无法改变的量。',
      readingTime: '阅读约 6 分钟',
      searchText: '不变量 单调量 染色 奇偶性 守恒 游戏 操作 证明',
    },
  },
  {
    id: 'note-002',
    slug: 'when-symmetry-counts-too-much',
    title: 'When Symmetry Counts Too Much',
    summary: 'Orbit thinking, Burnside’s lemma, and the warning signs of accidental overcounting.',
    content: 'notes/when-symmetry-counts-too-much.md',
    createdAt: '2026-08-07',
    updatedAt: '2026-08-12',
    readingTime: '8 min read',
    searchText: 'symmetry orbit burnside lemma fixed points combinatorics counting',
    zh: {
      title: '对称性何时会多算',
      summary: '轨道视角、Burnside 引理，以及意外重复计数的警告信号。',
      readingTime: '阅读约 8 分钟',
      searchText: '对称 轨道 Burnside 引理 不动点 组合数学 计数',
    },
  },
  {
    id: 'note-003',
    slug: 'drawing-the-right-diagram',
    title: 'Drawing the Right Diagram',
    summary: 'Why one auxiliary line can be more valuable than a page of algebra.',
    content: 'notes/drawing-the-right-diagram.md',
    createdAt: '2026-08-03',
    updatedAt: '2026-08-09',
    readingTime: '5 min read',
    searchText: 'geometry diagram auxiliary line construction cyclic quadrilateral visual proof',
    zh: {
      title: '画对那张图',
      summary: '为什么一条辅助线可能比一页代数推导更有价值。',
      readingTime: '阅读约 5 分钟',
      searchText: '几何 图形 辅助线 作图 圆内接四边形 可视化证明',
    },
  },
]

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug)
}

export function getPuzzle(slug: string) {
  return puzzles.find((puzzle) => puzzle.slug === slug)
}

export function getNote(slug: string) {
  return notes.find((note) => note.slug === slug)
}

export function puzzleUrl(puzzle: Puzzle) {
  return `/puzzles/${puzzle.slug}`
}

export function difficultyStars(difficulty: number) {
  return `${'★'.repeat(difficulty)}${'☆'.repeat(5 - difficulty)}`
}

export function statusLabel(status: PuzzleStatus) {
  return status === 'solved' ? 'Solved' : status === 'studying' ? 'Studying' : 'Open'
}

export type PuzzleLocale = 'en' | 'zh'

export function localizePuzzle(puzzle: Puzzle, locale: PuzzleLocale) {
  return locale === 'zh'
    ? { ...puzzle, ...puzzle.zh, content: `zh/${puzzle.content}`, solution: `zh/${puzzle.solution}` }
    : puzzle
}

export function localizeCollection(collection: Collection, locale: PuzzleLocale) {
  return locale === 'zh' ? { ...collection, ...collection.zh } : collection
}

export function localizeNote(note: Note, locale: PuzzleLocale) {
  return locale === 'zh' ? { ...note, ...note.zh, content: `zh/${note.content}` } : note
}

export function localizedStatusLabel(status: PuzzleStatus, locale: PuzzleLocale) {
  if (locale === 'en') return statusLabel(status)
  return status === 'solved' ? '已解决' : status === 'studying' ? '研究中' : '待解'
}
