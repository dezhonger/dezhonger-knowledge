import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

type FilterValue = string | number | boolean
interface FilterBinding {
  state: Ref<FilterValue>
  values?: readonly FilterValue[] | (() => readonly FilterValue[])
}
interface PaginationOptions {
  filters?: Record<string, FilterBinding>
  anchor: string
  pageParameter?: string
}

export const PAGE_SIZE = 10

export function usePagination<T>(items: Readonly<Ref<readonly T[]>>, options: PaginationOptions) {
  const page = ref(1)
  const pageCount = computed(() => Math.max(1, Math.ceil(items.value.length / PAGE_SIZE)))
  const visibleItems = computed(() => items.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
  const filters = Object.entries(options.filters || {}).map(([key, binding]) => ({ key, ...binding, initial: binding.state.value }))
  const pageParameter = options.pageParameter || 'page'
  let restoring = false
  let mounted = false

  function filterValue(raw: string | null, filter: (typeof filters)[number]): FilterValue {
    if (raw === null) return filter.initial
    let value: FilterValue = raw
    if (typeof filter.initial === 'number') value = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : filter.initial
    if (typeof filter.initial === 'boolean') value = raw === '1' ? true : raw === '0' ? false : filter.initial
    const allowed = typeof filter.values === 'function' ? filter.values() : filter.values
    return allowed && !allowed.includes(value) ? filter.initial : value
  }

  function writeParameters(params: URLSearchParams) {
    for (const filter of filters) {
      const value = filter.state.value
      if (value === filter.initial || (typeof value === 'string' && !value.trim())) params.delete(filter.key)
      else params.set(filter.key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value).trim())
    }
    if (page.value === 1) params.delete(pageParameter)
    else params.set(pageParameter, String(page.value))
  }

  function parameters() {
    const params = new URLSearchParams()
    writeParameters(params)
    return params.size ? `?${params}` : ''
  }

  function updateUrl(replace: boolean) {
    if (!mounted) return
    const url = new URL(window.location.href)
    writeParameters(url.searchParams)
    const next = `${url.pathname}${url.search}${url.hash}`
    if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
    window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', next)
  }

  function restoreLocation() {
    restoring = true
    const params = new URLSearchParams(window.location.search)
    for (const filter of filters) filter.state.value = filterValue(params.get(filter.key), filter)
    const raw = params.get(pageParameter) || '1'
    const requested = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : 1
    page.value = Math.min(pageCount.value, Math.max(1, requested))
    restoring = false
    updateUrl(true)
  }

  function setPage(value: number) {
    if (!Number.isSafeInteger(value)) return
    const next = Math.min(pageCount.value, Math.max(1, value))
    if (next === page.value) return
    page.value = next
    updateUrl(false)
    if (mounted) document.querySelector(options.anchor)?.scrollIntoView({ block: 'nearest' })
  }

  watch(filters.map((filter) => filter.state), () => {
    if (restoring) return
    page.value = 1
    updateUrl(true)
  }, { flush: 'sync' })
  watch(pageCount, (count) => {
    if (restoring || page.value <= count) return
    page.value = count
    updateUrl(true)
  }, { flush: 'sync' })
  onMounted(() => { mounted = true; restoreLocation(); window.addEventListener('popstate', restoreLocation) })
  onBeforeUnmount(() => { mounted = false; window.removeEventListener('popstate', restoreLocation) })
  return { page, pageCount, visibleItems, setPage, parameters }
}
