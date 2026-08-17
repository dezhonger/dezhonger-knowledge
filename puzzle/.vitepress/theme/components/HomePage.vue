<script setup lang="ts">
import { computed } from 'vue'
import { collections, difficultyStars, localizeCollection, localizePuzzle, puzzles, puzzleUrl } from '../data/catalog'
import { usePuzzleLocale } from '../i18n'
import PuzzleVisual from './PuzzleVisual.vue'

const { locale, copy, pathFor } = usePuzzleLocale()
const localizedPuzzles = computed(() => puzzles.map((puzzle) => localizePuzzle(puzzle, locale.value)))
const localizedCollections = computed(() => collections.map((collection) => localizeCollection(collection, locale.value)))
const featured = computed(() => localizedPuzzles.value[0])
const recent = computed(() => localizedPuzzles.value.slice(0, 5))
</script>

<template>
  <div class="home-page">
    <section class="home-hero shell-width">
      <p class="archive-eyebrow">{{ copy.homeEyebrow }}</p>
      <h1>{{ copy.homeTitle }}</h1>
      <p>{{ copy.homeSubtitle }}</p>
    </section>

    <section class="home-section shell-width">
      <div class="section-heading section-heading--archive">
        <p>{{ copy.featured }}</p>
        <span>#{{ featured.id }}</span>
      </div>
      <a class="featured-card" :href="pathFor(puzzleUrl(featured))">
        <div class="featured-card__copy">
          <p class="puzzle-id">{{ copy.puzzle }}&nbsp;&nbsp; {{ featured.id }}</p>
          <h2>{{ featured.title }}</h2>
          <p class="featured-summary">{{ featured.summary }}</p>
          <div class="metadata-line">
            <span>{{ featured.categories.join(' · ') }}</span>
            <span class="difficulty" :aria-label="`Difficulty ${featured.difficulty} out of 5`">{{ difficultyStars(featured.difficulty) }}</span>
          </div>
          <span class="text-link">{{ copy.explore }} <i aria-hidden="true">→</i></span>
        </div>
        <PuzzleVisual :variant="featured.cover" label="Numbered drawers arranged for the prisoners puzzle" />
      </a>
    </section>

    <section class="home-section shell-width">
      <div class="section-heading">
        <h2>{{ copy.collections }}</h2>
        <a :href="pathFor('/collections/')">{{ copy.viewAll }} <span aria-hidden="true">→</span></a>
      </div>
      <div class="collection-grid">
        <a v-for="collection in localizedCollections" :key="collection.id" class="collection-card" :href="pathFor(`/collections/${collection.slug}`)">
          <span class="collection-symbol" aria-hidden="true">{{ collection.cover }}</span>
          <div>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.problemCount }} {{ copy.problems }}</p>
          </div>
          <span class="row-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="home-section home-section--recent shell-width">
      <div class="section-heading">
        <h2>{{ copy.recentlyAdded }}</h2>
        <a :href="pathFor('/puzzles/')">{{ copy.viewAll }} <span aria-hidden="true">→</span></a>
      </div>
      <div class="recent-list">
        <a v-for="puzzle in recent" :key="puzzle.id" :href="pathFor(puzzleUrl(puzzle))" class="recent-row">
          <span class="recent-row__id">#{{ puzzle.id }}</span>
          <span class="recent-row__main">
            <strong>{{ puzzle.title }}</strong>
            <small>{{ puzzle.categories.join(' · ') }}</small>
          </span>
          <span class="difficulty" :aria-label="`Difficulty ${puzzle.difficulty} out of 5`">{{ difficultyStars(puzzle.difficulty) }}</span>
          <span class="row-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  </div>
</template>
