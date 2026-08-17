<script setup lang="ts">
import { computed } from 'vue'
import { collections, localizeCollection, puzzles } from '../data/catalog'
import { usePuzzleLocale } from '../i18n'

const { locale, copy, pathFor } = usePuzzleLocale()
const localizedCollections = computed(() => collections.map((collection) => localizeCollection(collection, locale.value)))
</script>

<template>
  <div class="archive-page shell-width">
    <header class="page-intro">
      <p class="archive-eyebrow">{{ copy.curatedShelves }}</p>
      <div class="page-intro__title"><h1>{{ copy.collections }}</h1></div>
      <p>{{ copy.collectionIntro }}</p>
    </header>

    <div class="collections-list">
      <a v-for="collection in localizedCollections" :key="collection.id" :href="pathFor(`/collections/${collection.slug}`)" class="collection-list-row">
        <span class="collection-list-row__symbol" aria-hidden="true">{{ collection.cover }}</span>
        <span class="collection-list-row__copy">
          <strong>{{ collection.title }}</strong>
          <p>{{ collection.description }}</p>
        </span>
        <span class="collection-list-row__count">{{ puzzles.filter((puzzle) => puzzle.collection === collection.slug).length }} {{ copy.problems }}</span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</template>
