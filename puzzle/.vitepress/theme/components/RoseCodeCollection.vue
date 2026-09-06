<script setup lang="ts">
import { computed, ref } from 'vue'
import { roseCodeProblems } from '../data/rosecode'
import { usePuzzleLocale } from '../i18n'
import { usePagination } from '../usePagination'
import PaginationControls from './PaginationControls.vue'
import '../rosecode.css'

const { locale, pathFor } = usePuzzleLocale()
const query = ref('')
const words = computed(() => locale.value === 'zh' ? {
  back: '题集', intro: '570 道数学与编程题 · 题目存档', search: '搜索题号或标题',
  empty: '没有找到匹配的题目。', source: '题目来自 RoseCode 存档。',
} : {
  back: 'Collections', intro: '570 math & programming problems · An archive', search: 'Search by number or title',
  empty: 'No problems match your search.', source: 'Preserved from the RoseCode archive.',
})
const matches = computed(() => {
  const value = query.value.trim().toLowerCase().replace(/^(?:rosecode|rc)[\s#-]*/i, '')
  if (!value) return roseCodeProblems
  if (/^\d+$/.test(value)) return roseCodeProblems.filter((problem) => problem.id === Number(value))
  return roseCodeProblems.filter((problem) => value.split(/\s+/).every((term) => `${problem.title} ${problem.titleZh}`.toLowerCase().includes(term)))
})
const { page, pageCount, visibleItems: visible, setPage, parameters } = usePagination(matches, {
  anchor: '.rc-search', filters: { q: { state: query } },
})
</script>

<template>
  <section class="rc-page rc-index">
    <a class="rc-back" :href="pathFor('/collections/')">← {{ words.back }}</a>
    <header class="rc-intro">
      <p class="rc-kicker">MATHEMATICS · PROGRAMMING</p>
      <h1>RoseCode<span aria-hidden="true">.</span></h1>
      <p class="rc-description">{{ words.intro }}</p>
    </header>
    <div class="rc-search">
      <label class="rc-sr-only" for="rosecode-search">{{ words.search }}</label>
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" /><path d="m15 15 5 5" /></svg>
      <input id="rosecode-search" v-model="query" type="search" :placeholder="words.search" autocomplete="off" />
    </div>
    <div class="rc-results" aria-live="polite" aria-atomic="true">
      <ol class="rc-list">
        <li v-for="problem in visible" :key="problem.id">
          <a :href="pathFor(`/rosecode/${problem.id}${parameters()}`)">
            <span class="rc-number">{{ String(problem.id).padStart(3, '0') }}</span>
            <span class="rc-title">{{ locale === 'zh' ? problem.titleZh : problem.title }}</span>
            <span class="rc-arrow" aria-hidden="true">↗</span>
          </a>
        </li>
      </ol>
      <p v-if="!matches.length" class="rc-empty">{{ words.empty }}</p>
    </div>
    <PaginationControls id="rosecode-pagination" :page="page" :page-count="pageCount" @change="setPage" />
    <p class="rc-archive-note"><a href="https://rosecode.neocities.org/" target="_blank" rel="noreferrer">{{ words.source }} ↗</a></p>
  </section>
</template>
