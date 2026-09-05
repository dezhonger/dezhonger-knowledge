<script setup lang="ts">
import { Content, useData } from 'vitepress'
import SiteHeader from './components/SiteHeader.vue'
import NoteLayout from './components/NoteLayout.vue'
import PuzzleLayout from './components/PuzzleLayout.vue'
import ProjectEulerProblem from './components/ProjectEulerProblem.vue'
import { usePuzzleLocale } from './i18n'

const { frontmatter } = useData()
const { copy } = usePuzzleLocale()
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">{{ copy.skip }}</a>
    <SiteHeader />
    <main id="main-content" class="site-main" tabindex="-1">
      <ProjectEulerProblem v-if="frontmatter.layout === 'project-euler'" />
      <PuzzleLayout v-else-if="frontmatter.layout === 'puzzle'">
        <Content />
      </PuzzleLayout>
      <NoteLayout v-else-if="frontmatter.layout === 'note'">
        <Content />
      </NoteLayout>
      <Content v-else />
    </main>
    <footer class="site-footer shell-width">
      <p>{{ copy.footer }}</p>
      <p class="archive-mark">{{ copy.footerMark }}</p>
    </footer>
  </div>
</template>
