<script setup lang="ts">
import { computed, ref } from 'vue'
import { localizeNote, localizePuzzle, notes, puzzles, puzzleUrl } from '../data/catalog'
import { formatDate, formatMonth, usePuzzleLocale } from '../i18n'

type ContentType = 'all' | 'puzzles' | 'notes'

const { locale, copy, pathFor } = usePuzzleLocale()
const selectedType = ref<ContentType>('all')
const selectedMonth = ref('all')
const newestFirst = ref(true)

const entries = computed(() => [
  ...puzzles.map((source) => {
    const puzzle = localizePuzzle(source, locale.value)
    return {
      id: `puzzle-${puzzle.id}`,
      type: 'puzzles' as const,
      label: copy.value.puzzleType,
      number: `#${puzzle.id}`,
      title: puzzle.title,
      summary: puzzle.summary,
      meta: puzzle.categories.join(' · '),
      date: puzzle.createdAt,
      href: pathFor(puzzleUrl(puzzle)),
    }
  }),
  ...notes.map((source) => {
    const note = localizeNote(source, locale.value)
    return {
      id: note.id,
      type: 'notes' as const,
      label: copy.value.noteType,
      number: note.id.replace('note-', 'N'),
      title: note.title,
      summary: note.summary,
      meta: note.readingTime,
      date: note.createdAt,
      href: pathFor(`/notes/${note.slug}`),
    }
  }),
])

const months = computed(() => [...new Set(entries.value.map((entry) => entry.date.slice(0, 7)))].sort().reverse())
const visibleEntries = computed(() =>
  entries.value
    .filter((entry) => selectedType.value === 'all' || entry.type === selectedType.value)
    .filter((entry) => selectedMonth.value === 'all' || entry.date.startsWith(selectedMonth.value))
    .sort((left, right) => (newestFirst.value ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date))),
)

const typeOptions = computed(() => [
  { value: 'all' as const, label: copy.value.contentType.all },
  { value: 'puzzles' as const, label: copy.value.contentType.puzzles },
  { value: 'notes' as const, label: copy.value.contentType.notes },
])
</script>

<template>
  <div class="archive-page timeline-page shell-width">
    <header class="page-intro">
      <p class="archive-eyebrow">{{ copy.timelineEyebrow }}</p>
      <div class="page-intro__title"><h1>{{ copy.timelineTitle }}</h1><span>{{ entries.length }}</span></div>
      <p>{{ copy.timelineIntro }}</p>
    </header>

    <div class="timeline-toolbar">
      <div class="filter-pills" :aria-label="copy.contentTypeLabel">
        <button v-for="option in typeOptions" :key="option.value" type="button" :class="{ active: selectedType === option.value }" @click="selectedType = option.value">{{ option.label }}</button>
      </div>
      <div class="timeline-selects">
        <label>
          <span class="visually-hidden">{{ copy.allMonths }}</span>
          <select v-model="selectedMonth">
            <option value="all">{{ copy.allMonths }}</option>
            <option v-for="month in months" :key="month" :value="month">{{ formatMonth(month, locale) }}</option>
          </select>
        </label>
        <button class="sort-button" type="button" @click="newestFirst = !newestFirst">{{ newestFirst ? copy.newest : copy.oldest }} {{ newestFirst ? '↓' : '↑' }}</button>
      </div>
    </div>

    <div class="timeline-list" aria-live="polite">
      <a v-for="entry in visibleEntries" :key="entry.id" :href="entry.href" class="timeline-row">
        <time :datetime="entry.date">{{ formatDate(entry.date, locale) }}</time>
        <span class="timeline-row__type">{{ entry.label }} · {{ entry.number }}</span>
        <span class="timeline-row__copy"><strong>{{ entry.title }}</strong><small>{{ entry.meta }}</small><p>{{ entry.summary }}</p></span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
      <p v-if="visibleEntries.length === 0" class="archive-empty">{{ copy.noTimeline }}</p>
    </div>
  </div>
</template>
