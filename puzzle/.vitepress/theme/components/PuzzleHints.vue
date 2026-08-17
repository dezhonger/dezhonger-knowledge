<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { getPuzzle, localizePuzzle } from '../data/catalog'
import { usePuzzleLocale } from '../i18n'

const { frontmatter } = useData()
const { locale, copy } = usePuzzleLocale()
const puzzle = computed(() => {
  const source = getPuzzle(frontmatter.value.puzzle as string)
  return source ? localizePuzzle(source, locale.value) : undefined
})
const revealed = ref<number[]>([])

function toggle(index: number) {
  revealed.value = revealed.value.includes(index) ? revealed.value.filter((item) => item !== index) : [...revealed.value, index]
}
</script>

<template>
  <section v-if="puzzle?.hints.length" class="reveal-section hint-section">
    <div class="reveal-section__heading"><p>{{ copy.hints }}</p><span>{{ copy.hintsSubtitle }}</span></div>
    <div class="hint-list">
      <div v-for="(hint, index) in puzzle.hints" :key="hint" class="hint-item" :class="{ open: revealed.includes(index) }">
        <button type="button" :aria-expanded="revealed.includes(index)" @click="toggle(index)">
          <span>{{ copy.hint }} {{ index + 1 }}</span><small>{{ revealed.includes(index) ? copy.hide : copy.reveal }}</small>
        </button>
        <div class="reveal-grid"><div><p>{{ hint }}</p></div></div>
      </div>
    </div>
  </section>
</template>
