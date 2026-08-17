<script setup lang="ts">
import { collections, puzzles } from '../data/catalog'
</script>

<template>
  <div class="archive-page shell-width">
    <header class="page-intro">
      <p class="archive-eyebrow">CURATED SHELVES</p>
      <div class="page-intro__title"><h1>Collections</h1></div>
      <p>Some are established problem series. Others are themes I want to keep returning to.</p>
    </header>

    <div class="collections-list">
      <a v-for="collection in collections" :key="collection.id" :href="`/collections/${collection.slug}`" class="collection-list-row">
        <span class="collection-list-row__symbol" aria-hidden="true">{{ collection.cover }}</span>
        <span class="collection-list-row__copy">
          <strong>{{ collection.title }}</strong>
          <p>{{ collection.description }}</p>
        </span>
        <span class="collection-list-row__count">{{ puzzles.filter((puzzle) => puzzle.collection === collection.slug).length }} Problems</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>

    <aside class="collection-note">
      <p>Personal shelves</p>
      <div>
        <span>Beautiful Invariants</span><span>Problems That Look Impossible</span><span>One-Line Solutions</span><span>Puzzles With Surprising Answers</span>
      </div>
    </aside>
  </div>
</template>
