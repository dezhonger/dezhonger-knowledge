<script setup lang="ts">
import { ref } from 'vue'

const stage = ref<0 | 1 | 2>(0)
</script>

<template>
  <section id="solution" class="reveal-section solution-section" :class="{ open: stage === 2 }">
    <div class="reveal-section__heading"><p>Solution</p><span>Best opened after a real attempt</span></div>
    <button v-if="stage === 0" class="solution-button" type="button" @click="stage = 1">Show Solution</button>
    <div v-else-if="stage === 1" class="solution-confirmation">
      <p>Have you tried it yourself?</p>
      <div><button type="button" @click="stage = 0">Not yet</button><button class="confirm" type="button" @click="stage = 2">Show solution</button></div>
    </div>
    <div class="solution-reveal-grid"><div><div class="solution-content"><slot /></div></div></div>
    <button v-if="stage === 2" class="hide-solution" type="button" @click="stage = 0">Hide solution</button>
  </section>
</template>
