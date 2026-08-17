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
}

export interface Collection {
  id: string
  slug: string
  title: string
  description: string
  cover: string
  problemCount: number
  noteCount: number
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
  },
  {
    id: 'collection-geometry',
    slug: 'geometry',
    title: 'Geometry',
    description: 'Diagrams, constructions, and the small observations that make a proof click.',
    cover: '△',
    problemCount: 2,
    noteCount: 1,
  },
  {
    id: 'collection-games-logic',
    slug: 'games-and-logic',
    title: 'Games & Logic',
    description: 'Strategies, invariants, boards, and puzzles where the rules hide the real problem.',
    cover: '♜',
    problemCount: 3,
    noteCount: 1,
  },
  {
    id: 'collection-probability',
    slug: 'counterintuitive-probability',
    title: 'Counterintuitive Probability',
    description: 'Problems that make intuition stumble before a clean model restores order.',
    cover: '∞',
    problemCount: 2,
    noteCount: 0,
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
