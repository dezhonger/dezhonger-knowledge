<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { collections, difficultyStars, getCollection, getPuzzle, puzzles, puzzleUrl } from '../data/catalog'

const { frontmatter } = useData()
const puzzle = computed(() => getPuzzle(frontmatter.value.puzzle as string))
const collection = computed(() => (puzzle.value ? getCollection(puzzle.value.collection) : undefined))
const collectionPuzzles = computed(() =>
  puzzle.value ? puzzles.filter((item) => item.collection === puzzle.value?.collection).sort((a, b) => a.id.localeCompare(b.id)) : [],
)
const currentIndex = computed(() => collectionPuzzles.value.findIndex((item) => item.slug === puzzle.value?.slug))
const previousPuzzle = computed(() => (currentIndex.value > 0 ? collectionPuzzles.value[currentIndex.value - 1] : undefined))
const nextPuzzle = computed(() => (currentIndex.value >= 0 ? collectionPuzzles.value[currentIndex.value + 1] : undefined))
</script>

<template>
  <article v-if="puzzle" class="puzzle-detail">
    <header class="puzzle-detail__header reading-width">
      <a v-if="collection" class="back-link" :href="`/collections/${collection.slug}`"><span aria-hidden="true">←</span> {{ collection.title }}</a>
      <p class="puzzle-id">P U Z Z L E&nbsp;&nbsp; {{ puzzle.id }}</p>
      <h1>{{ puzzle.title }}</h1>
      <p class="puzzle-source">{{ puzzle.source }}</p>
      <div class="metadata-line">
        <span>{{ puzzle.categories.join(' · ') }}</span>
        <span class="difficulty" :aria-label="`Difficulty ${puzzle.difficulty} out of 5`">{{ difficultyStars(puzzle.difficulty) }}</span>
      </div>
    </header>

    <div class="puzzle-content vp-doc reading-width"><slot /></div>

    <footer class="puzzle-detail__footer reading-width">
      <div class="source-credit">
        <span>Source</span>
        <a :href="puzzle.sourceUrl" target="_blank" rel="noreferrer">{{ puzzle.source }} ↗</a>
        <small>{{ puzzle.license }}</small>
      </div>
      <a v-if="collection" class="back-to-collection" :href="`/collections/${collection.slug}`">Back to {{ collection.title }}</a>
      <nav class="problem-navigation" aria-label="Adjacent puzzles">
        <a v-if="previousPuzzle" :href="puzzleUrl(previousPuzzle)"><small>Previous</small><span>← #{{ previousPuzzle.id }} {{ previousPuzzle.title }}</span></a>
        <span v-else></span>
        <a v-if="nextPuzzle" class="next" :href="puzzleUrl(nextPuzzle)"><small>Next</small><span>#{{ nextPuzzle.id }} {{ nextPuzzle.title }} →</span></a>
      </nav>
    </footer>
  </article>
  <div v-else class="reading-page reading-width"><h1>Puzzle not found</h1></div>
</template>
