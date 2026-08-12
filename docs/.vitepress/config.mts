import { defineConfig, type DefaultTheme } from 'vitepress'

const repository = 'https://github.com/dezhonger/dezhonger-knowledge'
const service = {
  en: 'https://150.109.77.66/?lang=en',
  zh: 'https://150.109.77.66/?lang=zh',
}

const englishSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Start here',
    items: [
      { text: 'How to use this site', link: '/guide' },
      { text: 'About', link: '/about' },
    ],
  },
  {
    text: 'Backend engineering',
    items: [
      { text: 'Overview', link: '/backend/' },
      { text: 'Designing a small Go service', link: '/backend/go-service-design' },
    ],
  },
  {
    text: 'Systems',
    items: [
      { text: 'Overview', link: '/systems/' },
      { text: 'A network request, end to end', link: '/systems/network-request-lifecycle' },
    ],
  },
  {
    text: 'AI engineering',
    items: [
      { text: 'Overview', link: '/ai/' },
      { text: 'Embedding search in practice', link: '/ai/embedding-search' },
    ],
  },
]

const chineseSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '从这里开始',
    items: [
      { text: '如何使用本站', link: '/zh/guide' },
      { text: '关于本站', link: '/zh/about' },
    ],
  },
  {
    text: '后端工程',
    items: [
      { text: '概览', link: '/zh/backend/' },
      { text: '设计一个小型 Go 服务', link: '/zh/backend/go-service-design' },
    ],
  },
  {
    text: '计算机系统',
    items: [
      { text: '概览', link: '/zh/systems/' },
      { text: '一次网络请求的完整旅程', link: '/zh/systems/network-request-lifecycle' },
    ],
  },
  {
    text: 'AI 工程',
    items: [
      { text: '概览', link: '/zh/ai/' },
      { text: 'Embedding 检索实践', link: '/zh/ai/embedding-search' },
    ],
  },
]

export default defineConfig({
  base: '/knowledge/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://150.109.77.66/knowledge/' },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/knowledge/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'Dezhonger Knowledge',
      titleTemplate: ':title · Dezhonger Knowledge',
      description: 'Clear, practical notes on backend systems, computer science, and AI engineering.',
      themeConfig: {
        logo: '/logo.svg',
        siteTitle: 'Dezhonger Knowledge',
        nav: [
          { text: 'Backend', link: '/backend/' },
          { text: 'Systems', link: '/systems/' },
          { text: 'AI', link: '/ai/' },
          { text: 'Tools', link: service.en },
        ],
        sidebar: englishSidebar,
        outline: { level: [2, 3], label: 'On this page' },
        search: { provider: 'local' },
        editLink: { pattern: `${repository}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
        lastUpdated: { text: 'Updated' },
        docFooter: { prev: 'Previous', next: 'Next' },
        socialLinks: [{ icon: 'github', link: repository }],
        footer: {
          message: 'Original notes, written for understanding.',
          copyright: '© 2026 Dezhonger',
        },
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'Dezhonger 知识库',
      titleTemplate: ':title · Dezhonger 知识库',
      description: '清晰、实用的后端、计算机系统与 AI 工程笔记。',
      themeConfig: {
        logo: '/logo.svg',
        siteTitle: 'Dezhonger 知识库',
        nav: [
          { text: '后端', link: '/zh/backend/' },
          { text: '系统', link: '/zh/systems/' },
          { text: 'AI', link: '/zh/ai/' },
          { text: '工具站', link: service.zh },
        ],
        sidebar: chineseSidebar,
        outline: { level: [2, 3], label: '本页内容' },
        search: {
          provider: 'local',
          options: {
            locales: {
              zh: {
                translations: {
                  button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
                  modal: {
                    displayDetails: '显示详情',
                    resetButtonTitle: '重置搜索',
                    backButtonTitle: '关闭搜索',
                    noResultsText: '没有找到结果',
                    footer: {
                      selectText: '选择',
                      selectKeyAriaLabel: '回车',
                      navigateText: '切换',
                      navigateUpKeyAriaLabel: '上箭头',
                      navigateDownKeyAriaLabel: '下箭头',
                      closeText: '关闭',
                      closeKeyAriaLabel: 'ESC',
                    },
                  },
                },
              },
            },
          },
        },
        editLink: { pattern: `${repository}/edit/main/docs/:path`, text: '在 GitHub 上编辑此页' },
        lastUpdated: { text: '更新时间' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        socialLinks: [{ icon: 'github', link: repository }],
        footer: {
          message: '所有文章均为原创，以理解为目标。',
          copyright: '© 2026 Dezhonger',
        },
      },
    },
  },
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '重置搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有找到结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'ESC',
                },
              },
            },
          },
        },
      },
    },
    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Use light theme',
    darkModeSwitchTitle: 'Use dark theme',
  },
})
