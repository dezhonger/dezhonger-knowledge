import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en',
  title: 'ZWL Puzzle Library',
  titleTemplate: ':title · ZWL Puzzle Library',
  description: 'A personal archive of curious problems, puzzles, and beautiful ideas.',
  cleanUrls: true,
  appearance: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://puzzle.dezhonger.com/' },
  markdown: {
    math: true,
    lineNumbers: false,
  },
  head: [
    ['meta', { name: 'theme-color', content: '#F7F6F2' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'ZWL Puzzle Library' }],
    ['meta', { property: 'og:image', content: 'https://puzzle.dezhonger.com/og.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://puzzle.dezhonger.com/og.png' }],
  ],
  themeConfig: {},
})
