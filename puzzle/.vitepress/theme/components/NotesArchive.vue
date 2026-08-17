<script setup lang="ts">
import { notes } from '../data/catalog'
</script>

<template>
  <div class="archive-page shell-width">
    <header class="page-intro">
      <p class="archive-eyebrow">MARGINALIA & WORKING NOTES</p>
      <div class="page-intro__title"><h1>Notes</h1><span>{{ notes.length }} notes</span></div>
      <p>Ideas that sit beside the puzzles: techniques, proofs, diagrams, and questions worth extending.</p>
    </header>
    <div class="notes-list">
      <a v-for="note in notes" :key="note.id" :href="`/notes/${note.slug}`" class="note-row">
        <span class="note-row__date">{{ note.createdAt.slice(5).replace('-', '.') }}</span>
        <span class="note-row__copy"><strong>{{ note.title }}</strong><p>{{ note.summary }}</p><small>{{ note.readingTime }}</small></span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</template>
