<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { projectEulerProblems } from '../data/project-euler'
import { usePuzzleLocale } from '../i18n'

const { frontmatter } = useData()
const { locale, pathFor } = usePuzzleLocale()
const problem = computed(() => projectEulerProblems.find((item) => item.id === Number(frontmatter.value.projectEuler)))
const title = (item: typeof projectEulerProblems[number]) => locale.value === 'zh' ? item.titleZh : item.title
const titleHtml = computed(() => locale.value === 'zh' ? problem.value?.titleZhHtml : problem.value?.titleHtml)
const previous = computed(() => problem.value ? projectEulerProblems[problem.value.id - 2] : undefined)
const next = computed(() => problem.value ? projectEulerProblems[problem.value.id] : undefined)
const statementKey = computed(() => `${locale.value}:${frontmatter.value.projectEuler}`)
const initialHtml = import.meta.env.SSR ? `<!--pe-statement:${statementKey.value}-->` : document.querySelector(`[data-pe-statement="${statementKey.value}"]`)?.innerHTML || ''
const hasInitialHtml = Boolean(initialHtml && !initialHtml.includes('<!--pe-statement:'))
const statementHtml = ref(import.meta.env.SSR || hasInitialHtml ? initialHtml : '')
const loading = ref(!import.meta.env.SSR && !hasInitialHtml)
const failed = ref(false)
const retry = ref(0)
let loadedAsset = hasInitialHtml ? frontmatter.value.statementAsset : ''
if (!import.meta.env.SSR) watch([() => frontmatter.value.statementAsset, retry], async ([asset, attempt], _, onCleanup) => {
  if (!asset || (asset === loadedAsset && !attempt)) return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true
  failed.value = false
  statementHtml.value = ''
  try {
    const response = await fetch(asset, { signal: controller.signal })
    if (!response.ok) throw new Error(`Statement HTTP ${response.status}`)
    const data = await response.json()
    if (typeof data.html !== 'string' || !data.html) throw new Error('Empty statement')
    if (controller.signal.aborted) return
    statementHtml.value = data.html
    loadedAsset = asset
  } catch (error) {
    if (!controller.signal.aborted) failed.value = true
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}, { immediate: true })
const status = computed(() => problem.value?.articleSlug ? 'article' : problem.value?.solvedAt ? 'solved' : 'open')
const words = computed(() => locale.value === 'zh' ? {
  index: '完整题目索引', statement: '题目', writeup: '已有题解',
  solved: '仅题目 · 已解决', open: '仅题目 · 待解',
  read: '阅读题解', pending: '题解待补充',
  note: '这道题的题目已收录，解题思路、代码和答案将在后续补充。',
  source: '原题', credit: '题目来自 Project Euler，依据 CC BY-NC-SA 4.0 使用；本页为中文翻译。',
  previous: '上一题', next: '下一题', navigation: '相邻题目',
} : {
  index: 'Complete problem index', statement: 'Problem', writeup: 'Write-up available',
  solved: 'Statement only · Solved', open: 'Statement only · Unsolved',
  read: 'Read the write-up', pending: 'Write-up coming later',
  note: 'The complete problem is available here. An approach, code, and answer will be added later.',
  source: 'Original problem', credit: 'Problem reproduced from Project Euler under CC BY-NC-SA 4.0.',
  previous: 'Previous', next: 'Next', navigation: 'Adjacent problems',
})
</script>

<template>
  <article v-if="problem" class="puzzle-detail pe-detail">
    <header class="puzzle-detail__header reading-width">
      <a class="back-link" :href="pathFor('/collections/project-euler#problem-index')">← {{ words.index }}</a>
      <p class="puzzle-id">PROJECT EULER · #{{ String(problem.id).padStart(4, '0') }}</p>
      <h1 v-if="titleHtml" class="pe-math-title" v-html="titleHtml" />
      <h1 v-else>{{ title(problem) }}</h1>
      <p v-if="locale === 'zh'" class="pe-detail__english-title pe-math-title"><span v-if="problem.titleHtml" v-html="problem.titleHtml" /><template v-else>{{ problem.title }}</template></p>
      <div class="pe-detail__meta">
        <span class="pe-status" :class="`pe-status--${status}`">{{ status === 'article' ? words.writeup : status === 'solved' ? words.solved : words.open }}</span>
        <a :href="`https://projecteuler.net/problem=${problem.id}`" target="_blank" rel="noreferrer">{{ words.source }} ↗</a>
      </div>
    </header>

    <div class="puzzle-content vp-doc reading-width" :aria-busy="loading">
      <p v-if="loading" role="status">{{ locale === 'zh' ? '正在加载题目…' : 'Loading the problem…' }}</p>
      <p v-if="failed" role="alert">{{ locale === 'zh' ? '题目暂时加载失败。' : 'The problem could not be loaded.' }} <button type="button" class="pe-retry" @click="retry++">{{ locale === 'zh' ? '重试' : 'Retry' }}</button></p>
      <div class="pe-statement" :data-pe-statement="statementKey" v-html="statementHtml" />
    </div>

    <section class="pe-writeup-entry reading-width">
      <template v-if="problem.articleSlug">
        <h2>{{ words.writeup }}</h2>
        <a class="pe-writeup-entry__link" :href="pathFor(`/puzzles/${problem.articleSlug}`)">{{ words.read }} →</a>
      </template>
      <template v-else><h2>{{ words.pending }}</h2><p>{{ words.note }}</p></template>
    </section>

    <footer class="puzzle-detail__footer reading-width">
      <div class="source-credit">
        <a :href="`https://projecteuler.net/problem=${problem.id}`" target="_blank" rel="noreferrer">Project Euler · {{ words.statement }} {{ problem.id }} ↗</a>
        <small>{{ words.credit }} <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a></small>
      </div>
      <a class="back-to-collection" :href="pathFor('/collections/project-euler#problem-index')">{{ words.index }}</a>
      <nav class="problem-navigation" :aria-label="words.navigation">
        <a v-if="previous" :href="pathFor(`/project-euler/${previous.id}`)"><small>{{ words.previous }}</small><span>← #{{ previous.id }} {{ title(previous) }}</span></a>
        <span v-else></span>
        <a v-if="next" class="next" :href="pathFor(`/project-euler/${next.id}`)"><small>{{ words.next }}</small><span>#{{ next.id }} {{ title(next) }} →</span></a>
      </nav>
    </footer>
  </article>
</template>
