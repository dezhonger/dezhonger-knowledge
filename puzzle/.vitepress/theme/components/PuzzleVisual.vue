<script setup lang="ts">
const props = defineProps<{ variant: string; label?: string }>()
const board = Array.from({ length: 64 }, (_, index) => index)
const doors = Array.from({ length: 20 }, (_, index) => index + 1)
const pegs = Array.from({ length: 25 }, (_, index) => index)
</script>

<template>
  <figure class="puzzle-visual" :class="`puzzle-visual--${props.variant}`" :aria-label="label || 'Puzzle diagram'">
    <div v-if="variant === 'prisoners'" class="door-grid" aria-hidden="true">
      <span v-for="door in doors" :key="door" :class="{ marked: [1, 7, 13, 18].includes(door) }">{{ door }}</span>
    </div>
    <div v-else-if="variant === 'chessboard'" class="chess-grid" aria-hidden="true">
      <span v-for="cell in board" :key="cell" :class="{ removed: cell === 0 || cell === 63 }"></span>
    </div>
    <div v-else-if="variant === 'lattice'" class="lattice-grid" aria-hidden="true">
      <span class="route route-a"></span><span class="route route-b"></span><span class="route route-c"></span>
      <i class="point point-a"></i><i class="point point-b"></i>
    </div>
    <div v-else-if="variant === 'geometry'" class="geometry-figure" aria-hidden="true">
      <span class="triangle-line side-a"></span><span class="triangle-line side-b"></span><span class="triangle-line side-c"></span>
      <span class="circle-line"></span><i class="geo-dot dot-a"></i><i class="geo-dot dot-b"></i><i class="geo-dot dot-c"></i>
    </div>
    <div v-else-if="variant === 'doors'" class="monty-doors" aria-hidden="true">
      <span><b>1</b><i></i></span><span class="open"><b>2</b><i></i></span><span><b>3</b><i></i></span>
    </div>
    <div v-else-if="variant === 'pegs'" class="peg-board" aria-hidden="true">
      <span v-for="peg in pegs" :key="peg" :class="{ empty: peg < 8 || peg === 12 }"></span>
    </div>
    <div v-else class="number-figure" aria-hidden="true">
      <span>2</span><i>×</i><span>3</span><i>×</i><span>5</span><i>×</i><span>7</span>
    </div>
  </figure>
</template>
