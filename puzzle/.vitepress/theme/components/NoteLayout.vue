<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { getNote, localizeNote } from '../data/catalog'
import { formatDate, usePuzzleLocale } from '../i18n'

const { frontmatter } = useData()
const { locale, copy, pathFor } = usePuzzleLocale()
const note = computed(() => {
  const source = getNote(frontmatter.value.note as string)
  return source ? localizeNote(source, locale.value) : undefined
})
</script>

<template>
  <article v-if="note" class="note-detail reading-width">
    <a class="back-link" :href="pathFor('/notes/')"><span aria-hidden="true">←</span> {{ copy.backNotes }}</a>
    <header class="note-detail__header">
      <p class="puzzle-id">{{ copy.noteType }}&nbsp;&nbsp; {{ note.id.slice(-3) }}</p>
      <h1>{{ note.title }}</h1>
      <p>{{ note.summary }}</p>
      <div><span>{{ formatDate(note.createdAt, locale) }}</span><span>{{ note.readingTime }}</span></div>
    </header>
    <div class="note-content vp-doc"><slot /></div>
  </article>
</template>
