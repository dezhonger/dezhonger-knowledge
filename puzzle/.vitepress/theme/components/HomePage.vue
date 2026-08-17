<script setup lang="ts">
import { collections, difficultyStars, puzzles, puzzleUrl } from '../data/catalog'
import PuzzleVisual from './PuzzleVisual.vue'

const featured = puzzles[0]
const recent = puzzles.slice(0, 5)
</script>

<template>
  <div class="home-page">
    <section class="home-hero shell-width">
      <p class="archive-eyebrow">A PERSONAL PUZZLE LIBRARY</p>
      <h1>A collection of curious problems,<br /> puzzles, and beautiful ideas.</h1>
      <p>Things I’ve found worth thinking about.</p>
    </section>

    <section class="home-section shell-width">
      <div class="section-heading section-heading--archive">
        <p>Featured puzzle</p>
        <span>#{{ featured.id }}</span>
      </div>
      <a class="featured-card" :href="puzzleUrl(featured)">
        <div class="featured-card__copy">
          <p class="puzzle-id">P U Z Z L E&nbsp;&nbsp; {{ featured.id }}</p>
          <h2>{{ featured.title }}</h2>
          <p class="featured-summary">{{ featured.summary }}</p>
          <div class="metadata-line">
            <span>{{ featured.categories.join(' · ') }}</span>
            <span class="difficulty" :aria-label="`Difficulty ${featured.difficulty} out of 5`">{{ difficultyStars(featured.difficulty) }}</span>
          </div>
          <span class="text-link">Explore <i aria-hidden="true">→</i></span>
        </div>
        <PuzzleVisual :variant="featured.cover" label="Numbered drawers arranged for the prisoners puzzle" />
      </a>
    </section>

    <section class="home-section shell-width">
      <div class="section-heading">
        <h2>Collections</h2>
        <a href="/collections/">View all <span aria-hidden="true">→</span></a>
      </div>
      <div class="collection-grid">
        <a v-for="collection in collections" :key="collection.id" class="collection-card" :href="`/collections/${collection.slug}`">
          <span class="collection-symbol" aria-hidden="true">{{ collection.cover }}</span>
          <div>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.problemCount }} Problems</p>
          </div>
          <span class="row-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="home-section home-section--recent shell-width">
      <div class="section-heading">
        <h2>Recently Added</h2>
        <a href="/puzzles/">View all <span aria-hidden="true">→</span></a>
      </div>
      <div class="recent-list">
        <a v-for="puzzle in recent" :key="puzzle.id" :href="puzzleUrl(puzzle)" class="recent-row">
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
