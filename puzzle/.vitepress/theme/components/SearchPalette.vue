<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { collections, notes, puzzles, puzzleUrl } from '../data/catalog'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const puzzleSources = import.meta.glob('../../../puzzles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const noteSources = import.meta.glob('../../../notes/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function sourceFor(sources: Record<string, string>, slug: string) {
  return Object.entries(sources).find(([path]) => path.endsWith(`/${slug}.md`))?.[1] || ''
}

const items = [
  ...puzzles.map((puzzle) => ({
    type: 'Puzzle',
    eyebrow: `#${puzzle.id}`,
    title: puzzle.title,
    description: puzzle.categories.join(' · '),
    href: puzzleUrl(puzzle),
    haystack: `${puzzle.id} ${puzzle.title} ${puzzle.summary} ${puzzle.searchText} ${puzzle.categories.join(' ')} ${sourceFor(puzzleSources, puzzle.slug)}`,
  })),
  ...collections.map((collection) => ({
    type: 'Collection',
    eyebrow: collection.cover,
    title: collection.title,
    description: `${collection.problemCount} problems`,
    href: `/collections/${collection.slug}`,
    haystack: `${collection.title} ${collection.description}`,
  })),
  ...notes.map((note) => ({
    type: 'Note',
    eyebrow: 'NOTE',
    title: note.title,
    description: note.readingTime,
    href: `/notes/${note.slug}`,
    haystack: `${note.title} ${note.summary} ${note.searchText} ${sourceFor(noteSources, note.slug)}`,
  })),
]

const results = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  if (!normalized) return items.slice(0, 7)
  const terms = normalized.split(/\s+/)
  return items.filter((item) => terms.every((term) => item.haystack.toLowerCase().includes(term))).slice(0, 12)
})

function close() {
  emit('update:open', false)
}

function moveActive(direction: 1 | -1) {
  if (!results.value.length) return
  activeIndex.value = (activeIndex.value + direction + results.value.length) % results.value.length
}

function openActive() {
  const item = results.value[activeIndex.value]
  if (!item) return
  close()
  window.location.href = item.href
}

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    emit('update:open', !props.open)
  } else if (event.key === 'Escape' && props.open) {
    close()
  }
}

watch(
  () => props.open,
  async (open) => {
    document.documentElement.classList.toggle('search-is-open', open)
    if (open) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      input.value?.focus()
    }
  },
)

watch(query, () => {
  activeIndex.value = 0
})

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.documentElement.classList.remove('search-is-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="open" class="search-backdrop" role="presentation" @mousedown.self="close">
        <section class="search-palette" role="dialog" aria-modal="true" aria-label="Search Puzzle Library">
          <div class="search-field">
            <span class="search-icon" aria-hidden="true"></span>
            <input
              ref="input"
              v-model="query"
              type="search"
              placeholder="Search puzzles, collections, and notes…"
              aria-label="Search query"
              @keydown.down.prevent="moveActive(1)"
              @keydown.up.prevent="moveActive(-1)"
              @keydown.enter.prevent="openActive"
            />
            <button type="button" aria-label="Close search" @click="close">ESC</button>
          </div>
          <div class="search-results" aria-live="polite">
            <p class="search-caption">{{ query ? `${results.length} results` : 'Suggested' }}</p>
            <a
              v-for="(item, index) in results"
              :key="`${item.type}-${item.href}`"
              :href="item.href"
              :class="{ active: activeIndex === index }"
              :aria-current="activeIndex === index ? 'true' : undefined"
              @mouseenter="activeIndex = index"
              @click="close"
            >
              <span class="search-result__eyebrow">{{ item.eyebrow }}</span>
              <span class="search-result__copy">
                <strong>{{ item.title }}</strong>
                <small>{{ item.type }} · {{ item.description }}</small>
              </span>
              <span class="row-arrow" aria-hidden="true">→</span>
            </a>
            <p v-if="results.length === 0" class="search-empty">No matching entry. Try a title, number, or idea.</p>
          </div>
          <footer class="search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> browse</span><span><kbd>↵</kbd> open</span></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
