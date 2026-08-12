<script setup lang="ts">
import { computed, ref } from 'vue'
import worksData from '../../../data/works.json'

type Work = {
  title: string
  author: string
  dynasty: string
  book: string
  genre: string
  stage: 'junior' | 'senior'
  link: string
  copyrightProtected?: boolean
}

const props = defineProps<{ stage: 'junior' | 'senior' }>()
const query = ref('')
const selectedBook = ref('')
const selectedGenre = ref('')
const selectedAuthor = ref('')

const allWorks = worksData as Work[]
const stageWorks = computed(() => allWorks.filter((work) => work.stage === props.stage))
const books = computed(() => [...new Set(stageWorks.value.map((work) => work.book))])
const genres = computed(() => [...new Set(stageWorks.value.map((work) => work.genre))])
const authors = computed(() => [...new Set(stageWorks.value.map((work) => work.author))].sort((a, b) => a.localeCompare(b, 'zh-CN')))

const visibleWorks = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase('zh-CN')
  return stageWorks.value.filter((work) => {
    const text = `${work.title} ${work.author} ${work.dynasty} ${work.book} ${work.genre}`.toLocaleLowerCase('zh-CN')
    return (!keyword || text.includes(keyword))
      && (!selectedBook.value || work.book === selectedBook.value)
      && (!selectedGenre.value || work.genre === selectedGenre.value)
      && (!selectedAuthor.value || work.author === selectedAuthor.value)
  })
})

const groupedWorks = computed(() => books.value
  .map((book) => ({ book, works: visibleWorks.value.filter((work) => work.book === book) }))
  .filter((group) => group.works.length))

function reset() {
  query.value = ''
  selectedBook.value = ''
  selectedGenre.value = ''
  selectedAuthor.value = ''
}
</script>

<template>
  <section class="guwen-catalog" aria-label="古诗文筛选目录">
    <div class="guwen-filters">
      <label class="filter-search">
        <span>关键词</span>
        <input v-model="query" type="search" placeholder="标题、作者、朝代">
      </label>
      <label>
        <span>教材分册</span>
        <select v-model="selectedBook">
          <option value="">全部分册</option>
          <option v-for="book in books" :key="book" :value="book">{{ book }}</option>
        </select>
      </label>
      <label>
        <span>体裁</span>
        <select v-model="selectedGenre">
          <option value="">全部体裁</option>
          <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
        </select>
      </label>
      <label>
        <span>作者</span>
        <select v-model="selectedAuthor">
          <option value="">全部作者</option>
          <option v-for="author in authors" :key="author" :value="author">{{ author }}</option>
        </select>
      </label>
      <button type="button" @click="reset">清除筛选</button>
    </div>

    <p class="filter-result">显示 <strong>{{ visibleWorks.length }}</strong> / {{ stageWorks.length }} 篇</p>

    <div v-if="groupedWorks.length" class="works-directory">
      <section v-for="group in groupedWorks" :key="group.book" class="book-group">
        <div class="book-heading"><h2>{{ group.book }}</h2><span>{{ group.works.length }} 篇</span></div>
        <ul>
          <li v-for="work in group.works" :key="work.link">
            <a :href="work.link">{{ work.title }}</a>
            <span>{{ work.dynasty }} · {{ work.author }}</span>
            <small>{{ work.genre }}</small>
            <small v-if="work.copyrightProtected" class="copyright-tag">目录信息</small>
          </li>
        </ul>
      </section>
    </div>
    <p v-else class="filter-empty">没有匹配的篇目，请清除部分筛选条件。</p>
  </section>
</template>
