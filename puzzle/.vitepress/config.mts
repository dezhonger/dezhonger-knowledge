import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Puzzle Library',
  titleTemplate: ':title · Puzzle Library',
  description: 'A personal library of curious problems, puzzles, and beautiful ideas.',
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
    ['meta', { property: 'og:site_name', content: 'Puzzle Library' }],
    ['meta', { property: 'og:image', content: 'https://puzzle.dezhonger.com/og.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://puzzle.dezhonger.com/og.png' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'Puzzle Library',
      titleTemplate: ':title · Puzzle Library',
      description: 'A personal library of curious problems, puzzles, and beautiful ideas.',
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: '谜题库',
      titleTemplate: ':title · 谜题库',
      description: '一个收藏好奇问题、谜题与美丽思想的个人题库。',
    },
  },
  transformHead({ pageData }) {
    const isChinese = pageData.relativePath.startsWith('zh/')
    const englishRelativePath = isChinese ? pageData.relativePath.slice(3) : pageData.relativePath
    const cleanPath = englishRelativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
    const englishPath = `/${cleanPath}`.replace(/\/+/g, '/')
    const chinesePath = englishPath === '/' ? '/zh/' : `/zh${englishPath}`
    const currentPath = isChinese ? chinesePath : englishPath
    const pageTitle = pageData.title || (isChinese ? '谜题库' : 'Puzzle Library')
    const pageDescription = pageData.description || (isChinese ? '一个收藏好奇问题、谜题与美丽思想的个人题库。' : 'A personal library of curious problems, puzzles, and beautiful ideas.')

    return [
      ['link', { rel: 'canonical', href: `https://puzzle.dezhonger.com${currentPath}` }],
      ['link', { rel: 'alternate', hreflang: 'en', href: `https://puzzle.dezhonger.com${englishPath}` }],
      ['link', { rel: 'alternate', hreflang: 'zh-CN', href: `https://puzzle.dezhonger.com${chinesePath}` }],
      ['link', { rel: 'alternate', hreflang: 'x-default', href: `https://puzzle.dezhonger.com${englishPath}` }],
      ['meta', { property: 'og:locale', content: isChinese ? 'zh_CN' : 'en_US' }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: pageDescription }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: pageDescription }],
    ]
  },
  themeConfig: {},
})
