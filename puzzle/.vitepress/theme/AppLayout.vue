<script setup lang="ts">
import { Content, useData } from 'vitepress'
import SiteHeader from './components/SiteHeader.vue'
import NoteLayout from './components/NoteLayout.vue'
import PuzzleLayout from './components/PuzzleLayout.vue'

const { frontmatter } = useData()
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <SiteHeader />
    <main id="main-content" class="site-main" tabindex="-1">
      <PuzzleLayout v-if="frontmatter.layout === 'puzzle'">
        <Content />
      </PuzzleLayout>
      <NoteLayout v-else-if="frontmatter.layout === 'note'">
        <Content />
      </NoteLayout>
      <Content v-else />
    </main>
    <footer class="site-footer shell-width">
      <p>A quiet place for problems worth keeping.</p>
      <p class="archive-mark">ZWL · PUZZLE ARCHIVE</p>
    </footer>
  </div>
</template>
