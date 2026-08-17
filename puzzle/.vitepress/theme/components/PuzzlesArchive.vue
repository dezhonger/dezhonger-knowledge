<script setup lang="ts">
import { computed, ref } from 'vue'
import { difficultyStars, puzzles, puzzleUrl } from '../data/catalog'

const filters = ['All', 'Math', 'Logic', 'Geometry', 'Games'] as const
const activeFilter = ref<(typeof filters)[number]>('All')
const query = ref('')

function matchesFilter(categories: string[], filter: (typeof filters)[number]) {
  if (filter === 'All') return true
  if (filter === 'Math') return categories.some((category) => ['Arithmetic', 'Number Theory', 'Combinatorics', 'Probability'].includes(category))
  if (filter === 'Logic') return categories.some((category) => ['Logic', 'Invariant', 'Paradox'].includes(category))
  if (filter === 'Games') return categories.some((category) => ['Game', 'Chessboard'].includes(category))
  return categories.includes('Geometry')
}

const visiblePuzzles = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  return puzzles.filter((puzzle) => {
    const text = `${puzzle.id} ${puzzle.title} ${puzzle.summary} ${puzzle.searchText}`.toLowerCase()
    return matchesFilter(puzzle.categories, activeFilter.value) && (!normalized || text.includes(normalized))
  })
})
</script>

<template>
  <div class="archive-page shell-width">
    <header class="page-intro">
      <p class="archive-eyebrow">THE COMPLETE INDEX</p>
      <div class="page-intro__title">
        <h1>All Puzzles</h1>
        <span>{{ puzzles.length }} puzzles</span>
      </div>
      <p>Problems collected for the idea inside them, not merely for the answer at the end.</p>
    </header>

    <div class="archive-tools">
      <div class="filter-pills" aria-label="Filter puzzles">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          :class="{ active: activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
      <label class="archive-search">
        <span class="search-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Search puzzles</span>
        <input v-model="query" type="search" placeholder="Search puzzles…" />
      </label>
    </div>

    <div class="puzzle-archive-list" aria-live="polite">
      <a v-for="puzzle in visiblePuzzles" :key="puzzle.id" :href="puzzleUrl(puzzle)" class="puzzle-archive-row">
        <span class="puzzle-archive-row__id">#{{ puzzle.id }}</span>
        <span class="puzzle-archive-row__copy">
          <strong>{{ puzzle.title }}</strong>
          <small>{{ puzzle.categories.join(' · ') }}</small>
          <p>{{ puzzle.summary }}</p>
        </span>
        <span class="difficulty" :aria-label="`Difficulty ${puzzle.difficulty} out of 5`">{{ difficultyStars(puzzle.difficulty) }}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
      <p v-if="visiblePuzzles.length === 0" class="archive-empty">No puzzles match this search.</p>
    </div>
  </div>
</template>
