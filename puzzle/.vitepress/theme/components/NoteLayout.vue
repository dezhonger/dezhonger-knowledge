<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { getNote } from '../data/catalog'

const { frontmatter } = useData()
const note = computed(() => getNote(frontmatter.value.note as string))
</script>

<template>
  <article v-if="note" class="note-detail reading-width">
    <a class="back-link" href="/notes/"><span aria-hidden="true">←</span> Notes</a>
    <header class="note-detail__header">
      <p class="puzzle-id">N O T E&nbsp;&nbsp; {{ note.id.slice(-3) }}</p>
      <h1>{{ note.title }}</h1>
      <p>{{ note.summary }}</p>
      <div><span>{{ note.createdAt }}</span><span>{{ note.readingTime }}</span></div>
    </header>
    <div class="note-content vp-doc"><slot /></div>
  </article>
</template>
