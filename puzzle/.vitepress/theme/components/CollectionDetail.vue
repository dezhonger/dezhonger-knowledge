<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCollection, localizeCollection, localizedStatusLabel, localizePuzzle, puzzles, puzzleUrl } from '../data/catalog'
import { usePuzzleLocale } from '../i18n'

const props = defineProps<{ slug: string }>()
const { locale, copy, pathFor } = usePuzzleLocale()
const collectionSource = getCollection(props.slug)
const collection = computed(() => (collectionSource ? localizeCollection(collectionSource, locale.value) : undefined))
const category = ref('All')
const ascending = ref(true)

const collectionPuzzles = computed(() => puzzles.filter((puzzle) => puzzle.collection === props.slug))
const categories = computed(() => {
  const categoryNames = [...new Set(collectionPuzzles.value.flatMap((puzzle) => puzzle.categories))]
  return [
    { value: 'All', label: copy.value.filters.all },
    ...categoryNames.map((name) => {
      const puzzle = collectionPuzzles.value.find((item) => item.categories.includes(name))
      const index = puzzle?.categories.indexOf(name) ?? -1
      return { value: name, label: locale.value === 'zh' && puzzle && index >= 0 ? puzzle.zh.categories[index] : name }
    }),
  ]
})
const visiblePuzzles = computed(() =>
  collectionPuzzles.value
    .filter((puzzle) => category.value === 'All' || puzzle.categories.includes(category.value))
    .sort((left, right) => (ascending.value ? left.id.localeCompare(right.id) : right.id.localeCompare(left.id)))
    .map((puzzle) => localizePuzzle(puzzle, locale.value)),
)
const solvedCount = computed(() => collectionPuzzles.value.filter((puzzle) => puzzle.status === 'solved').length)
</script>

<template>
  <div v-if="collection" class="collection-detail shell-width">
    <a class="back-link" :href="pathFor('/collections/')"><span aria-hidden="true">←</span> {{ copy.backCollections }}</a>
    <header class="collection-detail__hero">
      <span class="collection-detail__symbol" :class="{ compact: collection.cover.length > 1 }" aria-hidden="true">{{ collection.cover }}</span>
      <div>
        <h1>{{ collection.title }}</h1>
        <p>{{ collection.description }}</p>
        <div class="collection-stats"><span>{{ collectionPuzzles.length }} {{ copy.problems }}</span><span>{{ solvedCount }} {{ copy.solved }}</span></div>
      </div>
    </header>

    <div class="completion-line" aria-hidden="true"><span :style="{ width: collectionPuzzles.length ? `${(solvedCount / collectionPuzzles.length) * 100}%` : '0%' }"></span></div>

    <div class="collection-toolbar">
      <div class="filter-pills" aria-label="Filter collection">
        <button v-for="item in categories" :key="item.value" type="button" :class="{ active: category === item.value }" @click="category = item.value">{{ item.label }}</button>
      </div>
      <button class="sort-button" type="button" @click="ascending = !ascending">{{ copy.number }} {{ ascending ? '↑' : '↓' }}</button>
    </div>

    <div class="collection-problems">
      <a v-for="puzzle in visiblePuzzles" :key="puzzle.id" :href="pathFor(puzzleUrl(puzzle))">
        <span class="collection-problem__id">{{ puzzle.id }}</span>
        <span class="collection-problem__copy"><strong>{{ puzzle.title }}</strong><small>{{ puzzle.categories.join(' · ') }}</small></span>
        <span class="status-text" :class="`status-text--${puzzle.status}`">{{ localizedStatusLabel(puzzle.status, locale) }}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>
    <p v-if="collectionPuzzles.length === 0" class="collection-empty">{{ copy.noEntries }}</p>
  </div>
</template>
