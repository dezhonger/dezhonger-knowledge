<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { collections, localizeCollection, localizeNote, localizePuzzle, notes, puzzles, puzzleUrl } from '../data/catalog'
import { projectEulerProblems } from '../data/project-euler'
import { normalizePuzzleSearch, usePuzzleLocale } from '../i18n'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const { locale, copy, pathFor } = usePuzzleLocale()
const puzzleSources = import.meta.glob('../../../puzzles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const noteSources = import.meta.glob('../../../notes/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const zhPuzzleSources = import.meta.glob('../../../zh/puzzles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const zhNoteSources = import.meta.glob('../../../zh/notes/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function sourceFor(sources: Record<string, string>, slug: string) {
  return Object.entries(sources).find(([path]) => path.endsWith(`/${slug}.md`))?.[1] || ''
}

const items = computed(() => [
  ...puzzles.map((sourcePuzzle) => {
    const puzzle = localizePuzzle(sourcePuzzle, locale.value)
    return {
      type: copy.value.puzzleType,
      eyebrow: `#${puzzle.id}`,
      title: puzzle.title,
      description: puzzle.categories.join(' · '),
      href: pathFor(puzzleUrl(puzzle)),
      haystack: `${puzzle.id} ${puzzle.title} ${puzzle.summary} ${puzzle.searchText} ${puzzle.categories.join(' ')} ${sourceFor(locale.value === 'zh' ? zhPuzzleSources : puzzleSources, puzzle.slug)}`,
    }
  }),
  ...projectEulerProblems.map((problem) => ({
    type: copy.value.puzzleType,
    eyebrow: `PE #${problem.id}`,
    title: locale.value === 'zh' ? problem.titleZh : problem.title,
    description: 'Project Euler',
    href: pathFor(`/project-euler/${problem.id}`),
    haystack: `PE-${problem.id} ${String(problem.id).padStart(4, '0')} Project Euler ${problem.title} ${problem.titleZh} ${normalizePuzzleSearch(problem.title)} ${normalizePuzzleSearch(problem.titleZh)}`,
  })),
  ...collections.map((sourceCollection) => {
    const collection = localizeCollection(sourceCollection, locale.value)
    return {
      type: copy.value.collections,
      eyebrow: collection.cover,
      title: collection.title,
      description: `${collection.problemCount} ${copy.value.problems}`,
      href: pathFor(`/collections/${collection.slug}`),
      haystack: `${collection.title} ${collection.description}`,
    }
  }),
  ...notes.map((sourceNote) => {
    const note = localizeNote(sourceNote, locale.value)
    return {
      type: copy.value.noteType,
      eyebrow: copy.value.noteType.toUpperCase(),
      title: note.title,
      description: note.readingTime,
      href: pathFor(`/notes/${note.slug}`),
      haystack: `${note.title} ${note.summary} ${note.searchText} ${sourceFor(locale.value === 'zh' ? zhNoteSources : noteSources, note.slug)}`,
    }
  }),
])

const results = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  if (!normalized) return items.value.slice(0, 7)
  const terms = normalized.split(/\s+/)
  return items.value.filter((item) => terms.every((term) => item.haystack.toLowerCase().includes(term))).slice(0, 12)
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
        <section class="search-palette" role="dialog" aria-modal="true" :aria-label="copy.searchLabel">
          <div class="search-field">
            <span class="search-icon" aria-hidden="true"></span>
            <input
              ref="input"
              v-model="query"
              type="search"
              :placeholder="copy.searchPlaceholder"
              :aria-label="copy.searchLabel"
              @keydown.down.prevent="moveActive(1)"
              @keydown.up.prevent="moveActive(-1)"
              @keydown.enter.prevent="openActive"
            />
            <button type="button" :aria-label="copy.closeSearch" @click="close">ESC</button>
          </div>
          <div class="search-results" aria-live="polite">
            <p class="search-caption">{{ query ? `${results.length} ${copy.results}` : copy.suggested }}</p>
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
            <p v-if="results.length === 0" class="search-empty">{{ copy.noResults }}</p>
          </div>
          <footer class="search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> {{ copy.browse }}</span><span><kbd>↵</kbd> {{ copy.open }}</span></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
