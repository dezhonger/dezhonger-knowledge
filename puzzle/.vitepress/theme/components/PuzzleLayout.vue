<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { difficultyStars, getCollection, getPuzzle, localizeCollection, localizePuzzle, puzzles, puzzleUrl } from '../data/catalog'
import { usePuzzleLocale } from '../i18n'

const { frontmatter } = useData()
const { locale, copy, pathFor } = usePuzzleLocale()
const puzzleSource = computed(() => getPuzzle(frontmatter.value.puzzle as string))
const puzzle = computed(() => (puzzleSource.value ? localizePuzzle(puzzleSource.value, locale.value) : undefined))
const collection = computed(() => {
  const source = puzzleSource.value ? getCollection(puzzleSource.value.collection) : undefined
  return source ? localizeCollection(source, locale.value) : undefined
})
const collectionPuzzles = computed(() =>
  puzzleSource.value
    ? puzzles
        .filter((item) => item.collection === puzzleSource.value?.collection)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((item) => localizePuzzle(item, locale.value))
    : [],
)
const currentIndex = computed(() => collectionPuzzles.value.findIndex((item) => item.slug === puzzle.value?.slug))
const previousPuzzle = computed(() => (currentIndex.value > 0 ? collectionPuzzles.value[currentIndex.value - 1] : undefined))
const nextPuzzle = computed(() => (currentIndex.value >= 0 ? collectionPuzzles.value[currentIndex.value + 1] : undefined))
const licenseText = computed(() => {
  if (!puzzle.value || locale.value === 'en') return puzzle.value?.license
  return puzzle.value.license.includes('Project Euler')
    ? 'Project Euler 原题依据 CC BY-NC-SA 4.0 使用'
    : '为展示目的改写的摘要'
})
</script>

<template>
  <article v-if="puzzle" class="puzzle-detail">
    <header class="puzzle-detail__header reading-width">
      <a v-if="collection" class="back-link" :href="pathFor(`/collections/${collection.slug}`)"><span aria-hidden="true">←</span> {{ collection.title }}</a>
      <p class="puzzle-id">{{ copy.puzzle }}&nbsp;&nbsp; {{ puzzle.id }}</p>
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
        <span>{{ copy.source }}</span>
        <a :href="puzzle.sourceUrl" target="_blank" rel="noreferrer">{{ puzzle.source }} ↗</a>
        <small>{{ licenseText }}</small>
      </div>
      <a v-if="collection" class="back-to-collection" :href="pathFor(`/collections/${collection.slug}`)">{{ copy.backTo }} {{ collection.title }}</a>
      <nav class="problem-navigation" aria-label="Adjacent puzzles">
        <a v-if="previousPuzzle" :href="pathFor(puzzleUrl(previousPuzzle))"><small>{{ copy.previous }}</small><span>← #{{ previousPuzzle.id }} {{ previousPuzzle.title }}</span></a>
        <span v-else></span>
        <a v-if="nextPuzzle" class="next" :href="pathFor(puzzleUrl(nextPuzzle))"><small>{{ copy.next }}</small><span>#{{ nextPuzzle.id }} {{ nextPuzzle.title }} →</span></a>
      </nav>
    </footer>
  </article>
  <div v-else class="reading-page reading-width"><h1>{{ locale === 'zh' ? '未找到谜题' : 'Puzzle not found' }}</h1></div>
</template>
