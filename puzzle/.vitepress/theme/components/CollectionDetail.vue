<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getCollection, localizeCollection, localizedStatusLabel, localizePuzzle, puzzles, puzzleUrl } from '../data/catalog'
import { usePuzzleLocale } from '../i18n'

const PAGE_SIZE = 10

const props = defineProps<{ slug: string }>()
const { locale, copy, pathFor } = usePuzzleLocale()
const collectionSource = getCollection(props.slug)
const collection = computed(() => (collectionSource ? localizeCollection(collectionSource, locale.value) : undefined))
const category = ref('All')
const ascending = ref(true)
const currentPage = ref(1)

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
const filteredPuzzles = computed(() =>
  collectionPuzzles.value
    .filter((puzzle) => category.value === 'All' || puzzle.categories.includes(category.value))
    .sort((left, right) => (ascending.value ? left.id.localeCompare(right.id) : right.id.localeCompare(left.id)))
    .map((puzzle) => localizePuzzle(puzzle, locale.value)),
)
const pageCount = computed(() => Math.max(1, Math.ceil(filteredPuzzles.value.length / PAGE_SIZE)))
const visiblePuzzles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredPuzzles.value.slice(start, start + PAGE_SIZE)
})
const paginationItems = computed<(number | 'ellipsis-start' | 'ellipsis-end')[]>(() => {
  const total = pageCount.value
  const current = currentPage.value

  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', total]
  if (current >= total - 3) return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total]
})
const solvedCount = computed(() => collectionPuzzles.value.filter((puzzle) => puzzle.status === 'solved').length)

function pageFromLocation() {
  if (typeof window === 'undefined') return 1
  const value = Number(new URL(window.location.href).searchParams.get('page'))
  return Number.isInteger(value) && value > 0 ? value : 1
}

function updatePageUrl(page: number, replace = false) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (page === 1) url.searchParams.delete('page')
  else url.searchParams.set('page', String(page))
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method](window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

function setPage(page: number, replace = false, scroll = true) {
  const nextPage = Math.min(Math.max(page, 1), pageCount.value)
  if (nextPage === currentPage.value) return
  currentPage.value = nextPage
  updatePageUrl(nextPage, replace)

  if (scroll && typeof document !== 'undefined') {
    window.requestAnimationFrame(() => document.querySelector('.collection-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

function resetPage() {
  if (currentPage.value === 1) return
  currentPage.value = 1
  updatePageUrl(1, true)
}

function selectCategory(value: string) {
  category.value = value
  resetPage()
}

function toggleSort() {
  ascending.value = !ascending.value
  resetPage()
}

function syncPageFromLocation() {
  const requestedPage = pageFromLocation()
  const nextPage = Math.min(requestedPage, pageCount.value)
  currentPage.value = nextPage
  if (requestedPage !== nextPage) updatePageUrl(nextPage, true)
}

onMounted(() => {
  syncPageFromLocation()
  window.addEventListener('popstate', syncPageFromLocation)
})

onBeforeUnmount(() => window.removeEventListener('popstate', syncPageFromLocation))
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
        <button v-for="item in categories" :key="item.value" type="button" :class="{ active: category === item.value }" @click="selectCategory(item.value)">{{ item.label }}</button>
      </div>
      <button class="sort-button" type="button" @click="toggleSort">{{ copy.number }} {{ ascending ? '↑' : '↓' }}</button>
    </div>

    <div class="collection-problems" aria-live="polite">
      <a v-for="puzzle in visiblePuzzles" :key="puzzle.id" :href="pathFor(puzzleUrl(puzzle))">
        <span class="collection-problem__id">{{ puzzle.id }}</span>
        <span class="collection-problem__copy"><strong>{{ puzzle.title }}</strong><small>{{ puzzle.categories.join(' · ') }}</small></span>
        <span class="status-text" :class="`status-text--${puzzle.status}`">{{ localizedStatusLabel(puzzle.status, locale) }}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>
    <nav v-if="pageCount > 1" class="collection-pagination" :aria-label="copy.collectionPagination">
      <button type="button" :disabled="currentPage === 1" @click="setPage(currentPage - 1)">{{ copy.previousPage }}</button>
      <div class="collection-pagination__pages">
        <template v-for="item in paginationItems" :key="item">
          <button
            v-if="typeof item === 'number'"
            type="button"
            :class="{ active: currentPage === item }"
            :aria-current="currentPage === item ? 'page' : undefined"
            :aria-label="`${copy.page} ${item}`"
            @click="setPage(item)"
          >
            {{ item }}
          </button>
          <span v-else aria-hidden="true">…</span>
        </template>
      </div>
      <button type="button" :disabled="currentPage === pageCount" @click="setPage(currentPage + 1)">{{ copy.nextPage }}</button>
    </nav>
    <p v-if="collectionPuzzles.length === 0" class="collection-empty">{{ copy.noEntries }}</p>
  </div>
</template>
