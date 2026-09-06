<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePuzzleLocale } from '../i18n'

const props = defineProps<{ id: string; page: number; pageCount: number }>()
const emit = defineEmits<{ change: [page: number] }>()
const { locale } = usePuzzleLocale()
const jumpValue = ref(String(props.page))
const jumpError = ref(false)
const jumpInput = ref<HTMLInputElement | null>(null)
const words = computed(() => locale.value === 'zh' ? {
  pagination: '分页导航', first: '首页', last: '末页', previous: '上一页', next: '下一页',
  jumpTo: '跳至', jump: '跳转', pageNumber: '跳转页码',
  error: `请输入 1 到 ${props.pageCount} 之间的整数页码。`,
} : {
  pagination: 'Pagination', first: 'First', last: 'Last', previous: 'Previous', next: 'Next',
  jumpTo: 'Go to', jump: 'Go', pageNumber: 'Page number',
  error: `Enter a whole page number from 1 to ${props.pageCount}.`,
})

// Keep the RoseCode window: two neighbors on each side, plus both end pages.
const pageNumbers = computed<(number | string)[]>(() => {
  if (props.pageCount <= 7) return Array.from({ length: props.pageCount }, (_, i) => i + 1)
  const numbers = new Set([1, props.pageCount])
  for (let n = Math.max(1, props.page - 2); n <= Math.min(props.pageCount, props.page + 2); n++) numbers.add(n)
  const result: (number | string)[] = []
  let previous = 0
  for (const n of [...numbers].sort((a, b) => a - b)) {
    if (n - previous === 2) result.push(previous + 1)
    else if (n - previous > 2) result.push(`gap-${n}`)
    result.push(n)
    previous = n
  }
  return result
})

function selectPage(page: number) {
  jumpValue.value = String(page)
  jumpError.value = false
  emit('change', page)
}

function jumpToPage() {
  const value = jumpValue.value.trim()
  const page = Number(value)
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(page) || page < 1 || page > props.pageCount) {
    jumpError.value = true
    jumpInput.value?.focus({ preventScroll: true })
    return
  }
  selectPage(page)
}

watch([() => props.page, () => props.pageCount], () => {
  jumpValue.value = String(props.page)
  jumpError.value = false
})
</script>

<template>
  <nav v-if="pageCount > 1" :id="id" class="puzzle-pagination" :aria-label="words.pagination">
    <div class="pagination-controls">
      <div class="page-actions page-actions--start">
        <button type="button" :disabled="page === 1" @click="selectPage(1)">{{ words.first }}</button>
        <button type="button" :disabled="page === 1" @click="selectPage(page - 1)">← {{ words.previous }}</button>
      </div>
      <div class="page-numbers">
        <template v-for="number in pageNumbers" :key="number">
          <button v-if="typeof number === 'number'" type="button"
            :aria-label="locale === 'zh' ? `第 ${number} 页` : `Page ${number}`"
            :aria-current="number === page ? 'page' : undefined"
            @click="selectPage(number)"
          >{{ number }}</button>
          <span v-else class="page-gap" aria-hidden="true">…</span>
        </template>
      </div>
      <div class="page-actions page-actions--end">
        <button type="button" :disabled="page === pageCount" @click="selectPage(page + 1)">{{ words.next }} →</button>
        <button type="button" :disabled="page === pageCount" @click="selectPage(pageCount)">{{ words.last }}</button>
      </div>
    </div>
    <form class="page-jump" novalidate @submit.prevent="jumpToPage">
      <label :for="`${id}-jump`">{{ words.jumpTo }}</label>
      <input :id="`${id}-jump`" ref="jumpInput" v-model="jumpValue" type="text" inputmode="numeric"
        autocomplete="off" :aria-label="words.pageNumber" :aria-invalid="jumpError ? 'true' : undefined"
        :aria-describedby="jumpError ? `${id}-range ${id}-error` : `${id}-range`"
        @input="jumpError = false"
      />
      <span :id="`${id}-range`">/ {{ pageCount }}{{ locale === 'zh' ? ' 页' : '' }}</span>
      <button type="submit">{{ words.jump }}</button>
    </form>
    <p v-if="jumpError" :id="`${id}-error`" class="page-error" role="alert">{{ words.error }}</p>
  </nav>
</template>

<style scoped>
.puzzle-pagination { --page-accent: var(--pagination-accent, var(--accent)); --page-tint: var(--pagination-tint, var(--surface)); margin-top: 28px; font: 13px var(--sans); }
.pagination-controls { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
button { min-height: 36px; border: 0; border-radius: 3px; padding: 8px; color: var(--page-accent); background: transparent; cursor: pointer; font: inherit; white-space: nowrap; }
button:hover:not(:disabled) { background: var(--page-tint); }
button:disabled { color: var(--faint); cursor: default; }
button:focus-visible, input:focus-visible { outline: 2px solid var(--page-accent); outline-offset: 3px; }
.page-actions, .page-numbers { display: flex; align-items: center; gap: 4px; }
.page-actions--end { justify-content: flex-end; }
.page-numbers { justify-content: center; font: 12px var(--mono); }
.page-numbers button { min-width: 32px; }
.page-numbers button[aria-current="page"] { background: var(--page-tint); font-weight: 600; }
.page-gap { min-width: 16px; text-align: center; color: var(--muted); }
.page-jump { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 18px; color: var(--muted); }
.page-jump input { box-sizing: border-box; width: 64px; min-height: 36px; border: 1px solid var(--line-strong); border-radius: 3px; padding: 6px 8px; background: var(--surface); color: var(--ink); text-align: center; font: 13px var(--mono); }
.page-jump input[aria-invalid="true"] { border-color: var(--page-accent); }
.page-jump button { border: 1px solid var(--line); padding-inline: 12px; }
.page-error { margin: 10px 0 0; color: var(--page-accent); text-align: center; line-height: 1.6; }
@media (max-width: 760px) {
  .pagination-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 4px; }
  .page-actions--end { grid-column: 2; grid-row: 1; }
  .page-numbers { grid-column: 1 / -1; grid-row: 2; }
}
@media (max-width: 600px) {
  .page-numbers { gap: 3px; }
  .page-numbers button { min-width: 30px; padding-inline: 6px; }
}
</style>
