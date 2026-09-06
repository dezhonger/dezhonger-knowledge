<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { roseCodeProblems } from '../data/rosecode'
import { usePuzzleLocale } from '../i18n'
import '../rosecode.css'

const { frontmatter } = useData()
const { locale, pathFor } = usePuzzleLocale()
const problem = computed(() => roseCodeProblems.find((item) => item.id === Number(frontmatter.value.rosecode)))
const previous = computed(() => roseCodeProblems.find((item) => item.id === (problem.value?.id || 0) - 1))
const next = computed(() => roseCodeProblems.find((item) => item.id === (problem.value?.id || 0) + 1))
const key = computed(() => `${locale.value}:${frontmatter.value.rosecode}`)
const initial = import.meta.env.SSR ? `<!--rc-statement:${key.value}-->` : document.querySelector(`[data-rc-statement="${key.value}"]`)?.innerHTML || ''
const hydrated = Boolean(initial && !initial.includes('<!--rc-statement:'))
const html = ref(initial)
const loading = ref(!import.meta.env.SSR && !hydrated)
const failed = ref(false)
const retry = ref(0)
const listParams = ref('')
let loadedAsset = hydrated ? frontmatter.value.statementAsset : ''
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const list = new URLSearchParams()
  if (params.get('q')) list.set('q', params.get('q')!)
  if (/^[1-9]\d*$/.test(params.get('page') || '')) list.set('page', params.get('page')!)
  listParams.value = list.size ? `?${list}` : ''
})
if (!import.meta.env.SSR) watch([() => frontmatter.value.statementAsset, retry], async ([asset], _, onCleanup) => {
  if (!asset || (asset === loadedAsset && html.value && !failed.value)) return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true
  failed.value = false
  html.value = ''
  try {
    const response = await fetch(asset, { signal: controller.signal })
    if (!response.ok) throw new Error('Statement unavailable')
    const value = await response.json()
    if (typeof value.html !== 'string' || !value.html) throw new Error('Empty statement')
    if (!controller.signal.aborted) { html.value = value.html; loadedAsset = asset }
  } catch {
    if (!controller.signal.aborted) failed.value = true
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}, { immediate: true })
const words = computed(() => locale.value === 'zh' ? {
  previous: '上一题', next: '下一题', navigation: '相邻题目', source: '原题存档', retry: '重试',
  loading: '正在加载题目…', failed: '题目暂时加载失败。',
  interactive: '原题的交互功能已停用；现存程序以代码文本保留。',
  submission: '原题要求提交 Brainfuck 程序，本页仅保留题面。',
  credit: '题目来自 RoseCode；中文翻译与格式整理由本站完成。',
} : {
  previous: 'Previous', next: 'Next', navigation: 'Adjacent problems', source: 'Original archive', retry: 'Retry',
  loading: 'Loading the problem…', failed: 'The problem could not be loaded.',
  interactive: 'The original interaction is no longer available. Any surviving program is preserved as source code.',
  submission: 'The original task required a Brainfuck submission. This page preserves the statement only.',
  credit: 'Problem preserved from RoseCode, with formatting adapted for this archive.',
})
const categories: Record<string, string> = { ProgrammingArchive: '编程', MathArchive: '数学', Math: '数学', Programming: '编程', Probability: '概率', Crypto: '密码', 'Brainf**k': 'Brainfuck', Sequence: '数列', Hack: '计算机挑战', TimeRace: '限时挑战' }
</script>

<template>
  <article v-if="problem" class="rc-page rc-problem">
    <a class="rc-back" :href="pathFor(`/collections/rosecode${listParams}`)">← RoseCode</a>
    <header class="rc-problem-header">
      <p class="rc-kicker">ROSECODE <span aria-hidden="true">/</span> {{ String(problem.id).padStart(3, '0') }}</p>
      <h1>{{ locale === 'zh' ? problem.titleZh : problem.title }}</h1>
      <p v-if="locale === 'zh'" class="rc-original-title">{{ problem.title }}</p>
      <p class="rc-meta">{{ problem.author }} <span>·</span> {{ locale === 'zh' ? categories[problem.category] || problem.category : problem.category.replace('Archive', '') }} <span>·</span> <time :datetime="problem.publishedAt">{{ problem.publishedAt }}</time></p>
    </header>
    <p v-if="problem.limitations.includes('interactive')" class="rc-notice">{{ words.interactive }}</p>
    <p v-if="problem.limitations.includes('code-submission')" class="rc-notice">{{ words.submission }}</p>
    <div class="rc-statement-container" :aria-busy="loading">
      <p v-if="loading" role="status">{{ words.loading }}</p>
      <p v-if="failed" role="alert">{{ words.failed }} <button class="rc-retry" @click="retry++">{{ words.retry }}</button></p>
      <div class="rc-statement" :data-rc-statement="key" v-html="html" />
    </div>
    <footer class="rc-problem-footer">
      <a :href="`https://rosecode.neocities.org/problem.html?id=${problem.archiveNumber}`" target="_blank" rel="noreferrer">{{ words.source }} ↗</a>
      <p>{{ words.credit }} <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a></p>
      <nav class="rc-neighbours" :aria-label="words.navigation">
        <a v-if="previous" :href="pathFor(`/rosecode/${previous.id}${listParams}`)">← {{ words.previous }} <span>{{ String(previous.id).padStart(3, '0') }}</span></a>
        <span v-else />
        <a v-if="next" :href="pathFor(`/rosecode/${next.id}${listParams}`)">{{ words.next }} <span>{{ String(next.id).padStart(3, '0') }}</span> →</a>
      </nav>
    </footer>
  </article>
</template>
