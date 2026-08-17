import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import AppLayout from './AppLayout.vue'
import CollectionDetail from './components/CollectionDetail.vue'
import CollectionsArchive from './components/CollectionsArchive.vue'
import HomePage from './components/HomePage.vue'
import NotesArchive from './components/NotesArchive.vue'
import PuzzlesArchive from './components/PuzzlesArchive.vue'
import PuzzleHints from './components/PuzzleHints.vue'
import PuzzleSolution from './components/PuzzleSolution.vue'
import PuzzleVisual from './components/PuzzleVisual.vue'
import TimelinePage from './components/TimelinePage.vue'
import './style.css'

export default {
  ...DefaultTheme,
  Layout: AppLayout,
  enhanceApp(context) {
    DefaultTheme.enhanceApp?.(context)
    context.app.component('CollectionDetail', CollectionDetail)
    context.app.component('CollectionsArchive', CollectionsArchive)
    context.app.component('HomePage', HomePage)
    context.app.component('NotesArchive', NotesArchive)
    context.app.component('PuzzlesArchive', PuzzlesArchive)
    context.app.component('PuzzleHints', PuzzleHints)
    context.app.component('PuzzleSolution', PuzzleSolution)
    context.app.component('PuzzleVisual', PuzzleVisual)
    context.app.component('TimelinePage', TimelinePage)
  },
} satisfies Theme
