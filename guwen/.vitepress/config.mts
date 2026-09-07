import { defineConfig, type DefaultTheme } from 'vitepress'
import works from '../data/works.json'
import curriculum from '../data/curriculum.json'

type Work = { id: string; title: string; author: string; book: string; additionalBooks?: string[]; genre: string; stage: string; link: string }

const bookOrder = curriculum.books.map((book) => book.name)

function workGroups(stage: 'primary' | 'junior' | 'senior'): DefaultTheme.SidebarItem[] {
  const stageWorks = (works as Work[]).filter((work) => work.stage === stage)
  return bookOrder
    .filter((book) => stageWorks.some((work) => work.book === book || work.additionalBooks?.includes(book)))
    .map((book) => ({
      text: book,
      collapsed: true,
      items: stageWorks.filter((work) => work.book === book || work.additionalBooks?.includes(book))
        .sort((a, b) => {
          const order = curriculum.books.find((item) => item.name === book)!.requiredWorks
          const rank = (id: string) => order.includes(id) ? order.indexOf(id) : order.length
          return rank(a.id) - rank(b.id)
        })
        .map((work) => ({ text: work.title, link: work.link })),
    }))
}

function classicGroups(): DefaultTheme.SidebarItem[] {
  const classicWorks = (works as Work[]).filter((work) => work.stage === 'classic')
  return [{ text: '经典名篇', collapsed: false, items: classicWorks.map((work) => ({ text: work.title, link: work.link })) }]
}

const commonSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '开始阅读',
    items: [
      { text: '古文首页', link: '/' },
      { text: '小学篇目', link: '/primary/' },
      { text: '初中篇目', link: '/junior/' },
      { text: '高中篇目', link: '/senior/' },
      { text: '经典名篇', link: '/classic/' },
      { text: '关于本站', link: '/about' },
      { text: '教材范围', link: '/curriculum' },
    ],
  },
]

const sidebar: DefaultTheme.Sidebar = {
  '/primary/': [...commonSidebar, ...workGroups('primary')],
  '/junior/': [...commonSidebar, ...workGroups('junior')],
  '/senior/': [...commonSidebar, ...workGroups('senior')],
  '/classic/': [...commonSidebar, ...classicGroups()],
  '/': commonSidebar,
}

export default defineConfig({
  lang: 'zh-CN',
  title: '古文',
  titleTemplate: ':title · 古文',
  description: '按学段与体裁整理的古诗文阅读站。',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://guwen.dezhonger.com/' },
  head: [
    ['meta', { name: 'theme-color', content: '#f7f2e8' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
  ],
  themeConfig: {
    siteTitle: '古文',
    nav: [
      { text: '小学', link: '/primary/' },
      { text: '初中', link: '/junior/' },
      { text: '高中', link: '/senior/' },
      { text: '经典', link: '/classic/' },
    ],
    sidebar,
    outline: { level: [2, 3], label: '本页内容' },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            displayDetails: '显示详情', resetButtonTitle: '重置搜索', backButtonTitle: '关闭搜索', noResultsText: '没有找到结果',
            footer: { selectText: '选择', selectKeyAriaLabel: '回车', navigateText: '切换', navigateUpKeyAriaLabel: '上箭头', navigateDownKeyAriaLabel: '下箭头', closeText: '关闭', closeKeyAriaLabel: 'ESC' },
          },
        },
      },
    },
    lastUpdated: { text: '更新时间' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    footer: { message: '读古诗文原文，体会文字中的天地与人心。', copyright: '© 2026 古文' },
  },
})
