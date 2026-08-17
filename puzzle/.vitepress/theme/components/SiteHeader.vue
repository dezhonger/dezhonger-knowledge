<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData, useRoute } from 'vitepress'
import SearchPalette from './SearchPalette.vue'
import { usePuzzleLocale } from '../i18n'

const route = useRoute()
const { isDark } = useData()
const menuOpen = ref(false)
const searchOpen = ref(false)
const { copy, pathFor, alternatePath } = usePuzzleLocale()

const links = computed(() => [
  { label: copy.value.nav.puzzles, href: pathFor('/puzzles/') },
  { label: copy.value.nav.collections, href: pathFor('/collections/') },
  { label: copy.value.nav.notes, href: pathFor('/notes/') },
  { label: copy.value.nav.timeline, href: pathFor('/timeline/') },
  { label: copy.value.nav.about, href: pathFor('/about') },
])

const currentPath = computed(() => route.path)

function isActive(href: string) {
  return href.endsWith('/about') ? currentPath.value === href : currentPath.value.startsWith(href)
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner shell-width">
      <a class="wordmark" :href="pathFor('/')" :aria-label="copy.homeLabel">{{ copy.brand }}</a>

      <nav class="desktop-nav" :aria-label="copy.navLabel">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          :class="{ active: isActive(link.href) }"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="header-actions">
        <button class="search-trigger" type="button" :aria-label="copy.searchLabel" @click="searchOpen = true">
          <span class="search-icon" aria-hidden="true"></span>
          <span class="search-label">{{ copy.search }}</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          class="theme-toggle"
          type="button"
          role="switch"
          :aria-checked="isDark"
          :aria-label="isDark ? copy.useLight : copy.useDark"
          @click="isDark = !isDark"
        >
          <span class="theme-toggle__icon" aria-hidden="true"></span>
        </button>
        <a class="language-toggle" :href="alternatePath" :aria-label="copy.languageLabel">{{ copy.language }}</a>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="mobile-navigation"
          :aria-label="copy.menu"
          @click="menuOpen = !menuOpen"
        >
          <span></span><span></span>
        </button>
      </div>
    </div>

    <nav v-if="menuOpen" id="mobile-navigation" class="mobile-nav" :aria-label="copy.mobileNavLabel">
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        :class="{ active: isActive(link.href) }"
        @click="closeMenu"
      >
        {{ link.label }}
      </a>
    </nav>
  </header>

  <SearchPalette v-model:open="searchOpen" />
</template>
