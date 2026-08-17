<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { getPuzzle } from '../data/catalog'

const { frontmatter } = useData()
const puzzle = computed(() => getPuzzle(frontmatter.value.puzzle as string))
const revealed = ref<number[]>([])

function toggle(index: number) {
  revealed.value = revealed.value.includes(index) ? revealed.value.filter((item) => item !== index) : [...revealed.value, index]
}
</script>

<template>
  <section v-if="puzzle?.hints.length" class="reveal-section hint-section">
    <div class="reveal-section__heading"><p>Hints</p><span>Open one at a time</span></div>
    <div class="hint-list">
      <div v-for="(hint, index) in puzzle.hints" :key="hint" class="hint-item" :class="{ open: revealed.includes(index) }">
        <button type="button" :aria-expanded="revealed.includes(index)" @click="toggle(index)">
          <span>Hint {{ index + 1 }}</span><small>{{ revealed.includes(index) ? 'Hide' : 'Reveal' }}</small>
        </button>
        <div class="reveal-grid"><div><p>{{ hint }}</p></div></div>
      </div>
    </div>
  </section>
</template>
