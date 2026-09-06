<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { roseCodeProblems } from '../data/rosecode'
import { usePuzzleLocale } from '../i18n'
import '../rosecode.css'

const { locale, pathFor } = usePuzzleLocale()
const query = ref('')
const page = ref(1)
const pageSize = 10
const words = computed(() => locale.value === 'zh' ? {
  back: '题集', intro: '570 道数学与编程题 · 题目存档', search: '搜索题号或标题',
  previous: '上一页', next: '下一页', empty: '没有找到匹配的题目。', pagination: '题目分页',
  source: '题目来自 RoseCode 存档。',
} : {
  back: 'Collections', intro: '570 math & programming problems · An archive', search: 'Search by number or title',
  previous: 'Previous', next: 'Next', empty: 'No problems match your search.', pagination: 'Problem pages',
  source: 'Preserved from the RoseCode archive.',
})
const matches = computed(() => {
  const value = query.value.trim().toLowerCase().replace(/^(?:rosecode|rc)[\s#-]*/i, '')
  if (!value) return roseCodeProblems
  if (/^\d+$/.test(value)) return roseCodeProblems.filter((problem) => problem.id === Number(value))
  return roseCodeProblems.filter((problem) => value.split(/\s+/).every((term) => `${problem.title} ${problem.titleZh}`.toLowerCase().includes(term)))
})
const pageCount = computed(() => Math.max(1, Math.ceil(matches.value.length / pageSize)))
const visible = computed(() => matches.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function parameters() {
  const params = new URLSearchParams()
  if (query.value.trim()) params.set('q', query.value.trim())
  if (page.value > 1) params.set('page', String(page.value))
  return params.size ? `?${params}` : ''
}
function updateUrl(replace: boolean) {
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method](window.history.state, '', `${window.location.pathname}${parameters()}`)
}
function syncLocation() {
  const params = new URLSearchParams(window.location.search)
  query.value = params.get('q') || ''
  const requested = Number(params.get('page') || 1)
  page.value = Number.isInteger(requested) && requested > 0 ? Math.min(requested, pageCount.value) : 1
  updateUrl(true)
}
function search(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  page.value = 1
  updateUrl(true)
}
function turnPage(value: number) {
  page.value = Math.min(pageCount.value, Math.max(1, value))
  updateUrl(false)
  document.querySelector('.rc-search')?.scrollIntoView({ block: 'nearest' })
}
onMounted(() => { syncLocation(); window.addEventListener('popstate', syncLocation) })
onBeforeUnmount(() => window.removeEventListener('popstate', syncLocation))
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
      <input id="rosecode-search" :value="query" type="search" :placeholder="words.search" autocomplete="off" @input="search" />
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
    <nav v-if="pageCount > 1" class="rc-pagination" :aria-label="words.pagination">
      <button :disabled="page === 1" @click="turnPage(page - 1)">← {{ words.previous }}</button>
      <span aria-live="polite">{{ page }} <span class="rc-page-divider">/</span> {{ pageCount }}</span>
      <button :disabled="page === pageCount" @click="turnPage(page + 1)">{{ words.next }} →</button>
    </nav>
    <p class="rc-archive-note"><a href="https://rosecode.neocities.org/" target="_blank" rel="noreferrer">{{ words.source }} ↗</a></p>
  </section>
</template>
