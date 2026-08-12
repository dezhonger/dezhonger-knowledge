import { defineConfig, type DefaultTheme } from 'vitepress'

const repository = 'https://github.com/dezhonger/dezhonger-knowledge'

const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '开始阅读',
    items: [
      { text: '古文首页', link: '/' },
      { text: '初中篇目', link: '/junior/' },
      { text: '高中篇目', link: '/senior/' },
      { text: '关于本站', link: '/about' },
    ],
  },
  {
    text: '初中 · 文言文',
    collapsed: false,
    items: [
      { text: '桃花源记', link: '/junior/classical/taohuayuanji' },
      { text: '三峡', link: '/junior/classical/sanxia' },
      { text: '陋室铭', link: '/junior/classical/loushiming' },
      { text: '爱莲说', link: '/junior/classical/ailianshuo' },
      { text: '岳阳楼记', link: '/junior/classical/yueyanglouji' },
    ],
  },
  {
    text: '初中 · 诗词曲',
    collapsed: false,
    items: [
      { text: '观沧海', link: '/junior/poetry/guancanghai' },
      { text: '木兰诗', link: '/junior/poetry/mulanshi' },
      { text: '饮酒（其五）', link: '/junior/poetry/yinjiu' },
      { text: '望岳', link: '/junior/poetry/wangyue' },
      { text: '水调歌头', link: '/junior/poetry/shuidiaogetou' },
    ],
  },
  {
    text: '高中 · 文言文',
    collapsed: false,
    items: [
      { text: '劝学（节选）', link: '/senior/classical/quanxue' },
      { text: '师说', link: '/senior/classical/shishuo' },
      { text: '赤壁赋', link: '/senior/classical/chibifu' },
      { text: '六国论', link: '/senior/classical/liuguolun' },
    ],
  },
  {
    text: '高中 · 诗词',
    collapsed: false,
    items: [
      { text: '短歌行', link: '/senior/poetry/duangexing' },
      { text: '梦游天姥吟留别', link: '/senior/poetry/mengyou' },
      { text: '登高', link: '/senior/poetry/denggao' },
      { text: '念奴娇·赤壁怀古', link: '/senior/poetry/nianjiaochibi' },
    ],
  },
]

export default defineConfig({
  lang: 'zh-CN',
  title: 'Dezhonger 古文',
  titleTemplate: ':title · Dezhonger 古文',
  description: '按学段与体裁整理的古诗文阅读站。',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://guwen.dezhonger.com/' },
  head: [
    ['meta', { name: 'theme-color', content: '#f7f2e8' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
  ],
  themeConfig: {
    siteTitle: 'Dezhonger 古文',
    nav: [
      { text: '初中', link: '/junior/' },
      { text: '高中', link: '/senior/' },
      { text: '技术知识库', link: 'https://knowledge.dezhonger.com/zh/' },
      { text: '主站', link: 'https://dezhonger.com/?lang=zh' },
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
    editLink: { pattern: `${repository}/edit/main/guwen/:path`, text: '在 GitHub 上编辑此页' },
    lastUpdated: { text: '更新时间' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    socialLinks: [{ icon: 'github', link: repository }],
    footer: { message: '古诗文原文属于公共领域；整理与校读持续进行。', copyright: '© 2026 Dezhonger' },
  },
})
