import DefaultTheme from 'vitepress/theme'
import GuwenCatalog from './components/GuwenCatalog.vue'
import './style.css'

export default {
  ...DefaultTheme,
  enhanceApp(context) {
    DefaultTheme.enhanceApp?.(context)
    const { app } = context
    app.component('GuwenCatalog', GuwenCatalog)
  },
}
