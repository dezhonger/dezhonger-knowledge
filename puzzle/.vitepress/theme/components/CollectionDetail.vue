<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCollection, puzzles, puzzleUrl, statusLabel } from '../data/catalog'

const props = defineProps<{ slug: string }>()
const collection = getCollection(props.slug)
const category = ref('All')
const ascending = ref(true)

const collectionPuzzles = computed(() => puzzles.filter((puzzle) => puzzle.collection === props.slug))
const categories = computed(() => ['All', ...new Set(collectionPuzzles.value.flatMap((puzzle) => puzzle.categories))])
const visiblePuzzles = computed(() =>
  collectionPuzzles.value
    .filter((puzzle) => category.value === 'All' || puzzle.categories.includes(category.value))
    .sort((left, right) => (ascending.value ? left.id.localeCompare(right.id) : right.id.localeCompare(left.id))),
)
const solvedCount = computed(() => collectionPuzzles.value.filter((puzzle) => puzzle.status === 'solved').length)
</script>

<template>
  <div v-if="collection" class="collection-detail shell-width">
    <a class="back-link" href="/collections/"><span aria-hidden="true">←</span> Collections</a>
    <header class="collection-detail__hero">
      <span class="collection-detail__symbol" aria-hidden="true">{{ collection.cover }}</span>
      <div>
        <h1>{{ collection.title }}</h1>
        <p>{{ collection.description }}</p>
        <div class="collection-stats"><span>{{ collectionPuzzles.length }} Problems</span><span>{{ solvedCount }} solved</span></div>
      </div>
    </header>

    <div class="completion-line" aria-hidden="true"><span :style="{ width: `${(solvedCount / collectionPuzzles.length) * 100}%` }"></span></div>

    <div class="collection-toolbar">
      <div class="filter-pills" aria-label="Filter collection">
        <button v-for="item in categories" :key="item" type="button" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
      </div>
      <button class="sort-button" type="button" @click="ascending = !ascending">Number {{ ascending ? '↑' : '↓' }}</button>
    </div>

    <div class="collection-problems">
      <a v-for="puzzle in visiblePuzzles" :key="puzzle.id" :href="puzzleUrl(puzzle)">
        <span class="collection-problem__id">{{ puzzle.id }}</span>
        <span class="collection-problem__copy"><strong>{{ puzzle.title }}</strong><small>{{ puzzle.categories.join(' · ') }}</small></span>
        <span class="status-text" :class="`status-text--${puzzle.status}`">{{ statusLabel(puzzle.status) }}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</template>
