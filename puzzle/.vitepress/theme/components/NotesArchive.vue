<script setup lang="ts">
import { computed } from 'vue'
import { localizeNote, notes } from '../data/catalog'
import { formatDate, usePuzzleLocale } from '../i18n'

const { locale, copy, pathFor } = usePuzzleLocale()
const localizedNotes = computed(() => notes.map((note) => localizeNote(note, locale.value)))
</script>

<template>
  <div class="archive-page shell-width">
    <header class="page-intro">
      <p class="archive-eyebrow">{{ copy.marginalia }}</p>
      <div class="page-intro__title"><h1>{{ copy.nav.notes }}</h1><span>{{ notes.length }} {{ copy.noteCount }}</span></div>
      <p>{{ copy.noteIntro }}</p>
    </header>
    <div class="notes-list">
      <a v-for="note in localizedNotes" :key="note.id" :href="pathFor(`/notes/${note.slug}`)" class="note-row">
        <time class="note-row__date" :datetime="note.createdAt">{{ formatDate(note.createdAt, locale) }}</time>
        <span class="note-row__copy"><strong>{{ note.title }}</strong><p>{{ note.summary }}</p><small>{{ note.readingTime }}</small></span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</template>
