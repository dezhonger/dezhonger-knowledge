<script setup lang="ts">
import { ref } from 'vue'
import { usePuzzleLocale } from '../i18n'

const stage = ref<0 | 1 | 2>(0)
const { copy } = usePuzzleLocale()
</script>

<template>
  <section id="solution" class="reveal-section solution-section" :class="{ open: stage === 2 }">
    <div class="reveal-section__heading"><p>{{ copy.solution }}</p><span>{{ copy.solutionSubtitle }}</span></div>
    <button v-if="stage === 0" class="solution-button" type="button" @click="stage = 1">{{ copy.showSolution }}</button>
    <div v-else-if="stage === 1" class="solution-confirmation">
      <p>{{ copy.tried }}</p>
      <div><button type="button" @click="stage = 0">{{ copy.notYet }}</button><button class="confirm" type="button" @click="stage = 2">{{ copy.showSolutionConfirm }}</button></div>
    </div>
    <div class="solution-reveal-grid"><div><div class="solution-content"><slot /></div></div></div>
    <button v-if="stage === 2" class="hide-solution" type="button" @click="stage = 0">{{ copy.hideSolution }}</button>
  </section>
</template>
