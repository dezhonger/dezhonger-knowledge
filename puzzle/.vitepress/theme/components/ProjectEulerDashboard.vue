<script setup lang="ts">
import { computed, ref } from 'vue'
import { projectEulerProblems, projectEulerSnapshot, type ProjectEulerProblem } from '../data/project-euler'
import { usePuzzleLocale } from '../i18n'

type ProblemStatus = 'article' | 'solved' | 'open'
type StatusFilter = 'all' | ProblemStatus
type TimeScale = 'year' | 'month'
type ChartMode = 'cumulative' | 'new'

const { locale, pathFor } = usePuzzleLocale()
const query = ref('')
const statusFilter = ref<StatusFilter>('all')
const rangeStart = ref(0)
const timeScale = ref<TimeScale>('year')
const chartMode = ref<ChartMode>('cumulative')

const words = computed(() =>
  locale.value === 'zh'
    ? {
        back: '题集',
        description: '记录我的 Project Euler 解题旅程：全部题目、完成状态、站内题解与随时间累积的进度。',
        total: '题目总数',
        solved: '已解决',
        published: '站内题解',
        completion: '完成率',
        journey: '解题轨迹',
        journeyDescription: '切换时间粒度，观察每期新增题数或累计完成数。',
        cumulative: '累计完成',
        new: '当期新增',
        year: '按年',
        month: '按月',
        firstSolve: '第一次解题',
        latestSolve: '最近一次解题',
        mostActive: '最高产时期',
        problems: '完整题目索引',
        problemsDescription: '紫色题目进入本站题解，灰色未解决题目进入 Project Euler；绿色题目保留完成日期。',
        all: '全部',
        article: '已解决 · 有题解',
        solvedOnly: '已解决 · 无题解',
        open: '未解决',
        search: '搜索题号或英文标题…',
        allNumbers: '全部题号',
        showing: '当前显示',
        noMatch: '没有符合当前筛选条件的题目。',
        solvedOn: '完成于',
        readArticle: '阅读本站题解',
        visitOfficial: '前往 Project Euler',
        source: '题目编号和标题来自 Project Euler；解题状态来自个人导出数据。',
        chartUnit: '题',
      }
    : {
        back: 'Collections',
        description: 'A record of my Project Euler journey: every problem, completion status, on-site write-ups, and progress over time.',
        total: 'Total problems',
        solved: 'Solved',
        published: 'On-site write-ups',
        completion: 'Completion',
        journey: 'Solving journey',
        journeyDescription: 'Change the time scale to compare new solves with cumulative progress.',
        cumulative: 'Cumulative',
        new: 'New solves',
        year: 'Year',
        month: 'Month',
        firstSolve: 'First solve',
        latestSolve: 'Latest solve',
        mostActive: 'Most active period',
        problems: 'Complete problem index',
        problemsDescription: 'Purple opens an on-site write-up, grey opens Project Euler, and green keeps the solve date.',
        all: 'All',
        article: 'Solved · write-up',
        solvedOnly: 'Solved · no write-up',
        open: 'Unsolved',
        search: 'Search by number or English title…',
        allNumbers: 'All numbers',
        showing: 'Showing',
        noMatch: 'No problems match the current filters.',
        solvedOn: 'Solved',
        readArticle: 'Read the on-site write-up',
        visitOfficial: 'Open on Project Euler',
        source: 'Problem numbers and titles come from Project Euler; solve status comes from a personal export.',
        chartUnit: 'problems',
      },
)

function problemStatus(problem: ProjectEulerProblem): ProblemStatus {
  if (problem.articleSlug) return 'article'
  return problem.solvedAt ? 'solved' : 'open'
}

const counts = computed(() => ({
  article: projectEulerProblems.filter((problem) => problem.articleSlug).length,
  solved: projectEulerProblems.filter((problem) => problem.solvedAt && !problem.articleSlug).length,
  open: projectEulerProblems.filter((problem) => !problem.solvedAt).length,
}))

const completionRate = computed(() => ((projectEulerSnapshot.solved / projectEulerSnapshot.total) * 100).toFixed(1))
const ranges = computed(() =>
  Array.from({ length: Math.ceil(projectEulerSnapshot.total / 100) }, (_, index) => {
    const start = index * 100 + 1
    return { start, label: `${start}–${Math.min(start + 99, projectEulerSnapshot.total)}` }
  }),
)

const visibleProblems = computed(() => {
  const normalizedQuery = query.value.trim().toLocaleLowerCase()
  return projectEulerProblems.filter((problem) => {
    const matchesStatus = statusFilter.value === 'all' || problemStatus(problem) === statusFilter.value
    const matchesRange = rangeStart.value === 0 || (problem.id >= rangeStart.value && problem.id < rangeStart.value + 100)
    const matchesQuery = !normalizedQuery || String(problem.id).includes(normalizedQuery) || problem.title.toLocaleLowerCase().includes(normalizedQuery)
    return matchesStatus && matchesRange && matchesQuery
  })
})

function problemHref(problem: ProjectEulerProblem) {
  if (problem.articleSlug) return pathFor(`/puzzles/${problem.articleSlug}`)
  if (!problem.solvedAt) return `https://projecteuler.net/problem=${problem.id}`
  return undefined
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

const solvedProblems = projectEulerProblems
  .filter((problem): problem is ProjectEulerProblem & { solvedAt: string } => Boolean(problem.solvedAt))
  .sort((left, right) => left.solvedAt.localeCompare(right.solvedAt))

function periodKey(date: string, scale: TimeScale) {
  return scale === 'year' ? date.slice(0, 4) : date.slice(0, 7)
}

function enumeratePeriods(start: string, end: string, scale: TimeScale) {
  if (scale === 'year') {
    const first = Number(start.slice(0, 4))
    const last = Number(end.slice(0, 4))
    return Array.from({ length: last - first + 1 }, (_, index) => String(first + index))
  }

  const periods = []
  let year = Number(start.slice(0, 4))
  let month = Number(start.slice(5, 7))
  const endYear = Number(end.slice(0, 4))
  const endMonth = Number(end.slice(5, 7))
  while (year < endYear || (year === endYear && month <= endMonth)) {
    periods.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month === 13) {
      year += 1
      month = 1
    }
  }
  return periods
}

const chartPoints = computed(() => {
  const scale = timeScale.value
  const totals = new Map<string, number>()
  for (const problem of solvedProblems) {
    const key = periodKey(problem.solvedAt, scale)
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }

  const periods = enumeratePeriods(periodKey(solvedProblems[0].solvedAt, scale), periodKey(solvedProblems.at(-1).solvedAt, scale), scale)
  let cumulative = 0
  return periods.map((period) => {
    const added = totals.get(period) ?? 0
    cumulative += added
    return { period, added, value: chartMode.value === 'cumulative' ? cumulative : added }
  })
})

const chartWidth = computed(() => (timeScale.value === 'month' ? Math.max(900, chartPoints.value.length * 17) : 900))
const chartHeight = 300
const chartPadding = { top: 24, right: 24, bottom: 42, left: 54 }
const chartMax = computed(() => Math.max(1, ...chartPoints.value.map((point) => point.value)))

function chartX(index: number) {
  const width = chartWidth.value - chartPadding.left - chartPadding.right
  return chartPadding.left + (chartPoints.value.length === 1 ? width / 2 : (index / (chartPoints.value.length - 1)) * width)
}

function chartY(value: number) {
  const height = chartHeight - chartPadding.top - chartPadding.bottom
  return chartPadding.top + height - (value / chartMax.value) * height
}

const linePoints = computed(() => chartPoints.value.map((point, index) => `${chartX(index)},${chartY(point.value)}`).join(' '))
const yTicks = computed(() => Array.from({ length: 5 }, (_, index) => Math.round((chartMax.value * index) / 4)))

function showXAxisLabel(period: string, index: number) {
  if (timeScale.value === 'year') return true
  return period.endsWith('-01') || index === chartPoints.value.length - 1
}

function periodLabel(period: string) {
  if (timeScale.value === 'year') return period
  const [year, month] = period.split('-').map(Number)
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

const mostActivePeriod = computed(() => {
  const scale = timeScale.value
  const totals = new Map<string, number>()
  for (const problem of solvedProblems) {
    const key = periodKey(problem.solvedAt, scale)
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }
  const [period, count] = [...totals.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]
  return `${periodLabel(period)} · ${count} ${words.value.chartUnit}`
})

function problemAriaLabel(problem: ProjectEulerProblem) {
  const status = problemStatus(problem)
  const action = status === 'article' ? words.value.readArticle : status === 'open' ? words.value.visitOfficial : words.value.solvedOn
  return `${problem.id}. ${problem.title}. ${action}${problem.solvedAt ? ` ${formatDate(problem.solvedAt)}` : ''}`
}
</script>

<template>
  <div class="pe-dashboard collection-detail shell-width">
    <a class="back-link" :href="pathFor('/collections/')"><span aria-hidden="true">←</span> {{ words.back }}</a>

    <header class="collection-detail__hero pe-dashboard__hero">
      <span class="collection-detail__symbol" aria-hidden="true">∑</span>
      <div>
        <h1>Project Euler</h1>
        <p>{{ words.description }}</p>
      </div>
    </header>

    <section class="pe-stat-grid" :aria-label="words.solved">
      <div><strong>{{ projectEulerSnapshot.total }}</strong><span>{{ words.total }}</span></div>
      <div><strong>{{ projectEulerSnapshot.solved }}</strong><span>{{ words.solved }}</span></div>
      <div><strong>{{ projectEulerSnapshot.publishedSolutions }}</strong><span>{{ words.published }}</span></div>
      <div><strong>{{ completionRate }}%</strong><span>{{ words.completion }}</span></div>
    </section>

    <div class="pe-completion" aria-hidden="true">
      <span class="pe-completion__article" :style="{ width: `${(counts.article / projectEulerSnapshot.total) * 100}%` }"></span>
      <span class="pe-completion__solved" :style="{ width: `${(counts.solved / projectEulerSnapshot.total) * 100}%` }"></span>
    </div>

    <section class="pe-chart-section">
      <div class="pe-section-heading">
        <div><h2>{{ words.journey }}</h2><p>{{ words.journeyDescription }}</p></div>
        <div class="pe-segmented-controls">
          <div><button type="button" :class="{ active: chartMode === 'cumulative' }" @click="chartMode = 'cumulative'">{{ words.cumulative }}</button><button type="button" :class="{ active: chartMode === 'new' }" @click="chartMode = 'new'">{{ words.new }}</button></div>
          <div><button type="button" :class="{ active: timeScale === 'year' }" @click="timeScale = 'year'">{{ words.year }}</button><button type="button" :class="{ active: timeScale === 'month' }" @click="timeScale = 'month'">{{ words.month }}</button></div>
        </div>
      </div>

      <div class="pe-chart-milestones">
        <div><span>{{ words.firstSolve }}</span><strong>{{ formatDate(solvedProblems[0].solvedAt) }}</strong></div>
        <div><span>{{ words.latestSolve }}</span><strong>{{ formatDate(solvedProblems.at(-1).solvedAt) }}</strong></div>
        <div><span>{{ words.mostActive }}</span><strong>{{ mostActivePeriod }}</strong></div>
      </div>

      <div class="pe-chart-scroll">
        <svg class="pe-chart" :width="chartWidth" :height="chartHeight" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" role="img" :aria-label="words.journey">
          <g class="pe-chart__grid">
            <g v-for="tick in yTicks" :key="tick">
              <line :x1="chartPadding.left" :x2="chartWidth - chartPadding.right" :y1="chartY(tick)" :y2="chartY(tick)" />
              <text :x="chartPadding.left - 10" :y="chartY(tick) + 4">{{ tick }}</text>
            </g>
          </g>
          <g v-if="chartMode === 'new'" class="pe-chart__bars">
            <rect v-for="(point, index) in chartPoints" :key="point.period" :x="chartX(index) - Math.max(2, Math.min(14, (chartWidth - chartPadding.left - chartPadding.right) / chartPoints.length - 2)) / 2" :y="chartY(point.value)" :width="Math.max(2, Math.min(14, (chartWidth - chartPadding.left - chartPadding.right) / chartPoints.length - 2))" :height="chartHeight - chartPadding.bottom - chartY(point.value)">
              <title>{{ periodLabel(point.period) }}: {{ point.value }} {{ words.chartUnit }}</title>
            </rect>
          </g>
          <g v-else class="pe-chart__line">
            <polyline :points="linePoints" />
            <circle v-for="(point, index) in chartPoints" :key="point.period" :cx="chartX(index)" :cy="chartY(point.value)" r="3">
              <title>{{ periodLabel(point.period) }}: {{ point.value }} {{ words.chartUnit }}</title>
            </circle>
          </g>
          <g class="pe-chart__x-axis">
            <template v-for="(point, index) in chartPoints" :key="point.period">
              <text v-if="showXAxisLabel(point.period, index)" :x="chartX(index)" :y="chartHeight - 14">{{ timeScale === 'year' ? point.period : point.period.slice(0, 4) }}</text>
            </template>
          </g>
        </svg>
      </div>
    </section>

    <section class="pe-problem-section">
      <div class="pe-section-heading">
        <div><h2>{{ words.problems }}</h2><p>{{ words.problemsDescription }}</p></div>
        <span class="pe-showing-count">{{ words.showing }} {{ visibleProblems.length }} / {{ projectEulerSnapshot.total }}</span>
      </div>

      <div class="pe-filter-toolbar">
        <div class="filter-pills" :aria-label="words.problems">
          <button type="button" :class="{ active: statusFilter === 'all' }" @click="statusFilter = 'all'">{{ words.all }} · {{ projectEulerSnapshot.total }}</button>
          <button type="button" class="pe-filter--article" :class="{ active: statusFilter === 'article' }" @click="statusFilter = 'article'">{{ words.article }} · {{ counts.article }}</button>
          <button type="button" class="pe-filter--solved" :class="{ active: statusFilter === 'solved' }" @click="statusFilter = 'solved'">{{ words.solvedOnly }} · {{ counts.solved }}</button>
          <button type="button" class="pe-filter--open" :class="{ active: statusFilter === 'open' }" @click="statusFilter = 'open'">{{ words.open }} · {{ counts.open }}</button>
        </div>
        <div class="pe-filter-fields">
          <label class="pe-search"><span aria-hidden="true">⌕</span><input v-model="query" type="search" :placeholder="words.search" /></label>
          <select v-model="rangeStart" :aria-label="words.allNumbers">
            <option :value="0">{{ words.allNumbers }}</option>
            <option v-for="range in ranges" :key="range.start" :value="range.start">{{ range.label }}</option>
          </select>
        </div>
      </div>

      <div class="pe-legend" aria-hidden="true">
        <span class="pe-legend--article">{{ words.article }}</span><span class="pe-legend--solved">{{ words.solvedOnly }}</span><span class="pe-legend--open">{{ words.open }}</span>
      </div>

      <div v-if="visibleProblems.length" class="pe-problem-grid">
        <component
          :is="problemHref(problem) ? 'a' : 'div'"
          v-for="problem in visibleProblems"
          :key="problem.id"
          class="pe-problem-card"
          :class="`pe-problem-card--${problemStatus(problem)}`"
          :href="problemHref(problem)"
          :target="problemStatus(problem) === 'open' ? '_blank' : undefined"
          :rel="problemStatus(problem) === 'open' ? 'noreferrer' : undefined"
          :aria-label="problemAriaLabel(problem)"
        >
          <span class="pe-problem-card__number">#{{ String(problem.id).padStart(4, '0') }}</span>
          <strong>{{ problem.title }}</strong>
          <small v-if="problem.solvedAt">{{ formatDate(problem.solvedAt) }}</small>
          <small v-else>projecteuler.net ↗</small>
          <span v-if="problem.articleSlug" class="pe-problem-card__mark" aria-hidden="true">↗</span>
        </component>
      </div>
      <p v-else class="collection-empty">{{ words.noMatch }}</p>
    </section>

    <p class="pe-source-note">{{ words.source }} <a href="https://projecteuler.net/archives" target="_blank" rel="noreferrer">Project Euler ↗</a></p>
  </div>
</template>
