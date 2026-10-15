import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createAlgoCatalog } from './algo/catalog.mjs'

const root = resolve(import.meta.dirname, '..')
const escape = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
const icons = {
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  theme: '<path d="M20.5 13a8.5 8.5 0 1 1-9.5-9.5 6.5 6.5 0 0 0 9.5 9.5Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
}
const icon = name => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`
const groupHref = group => `/${group.id}/`
const topicHref = topic => `/topics/${topic.id}.html`

export async function generateAlgo() {
  const directory = resolve(root, 'sites/algo')
  await mkdir(resolve(directory, 'topics'), { recursive: true })
  await mkdir(resolve(directory, 'assets'), { recursive: true })
  const catalog = createAlgoCatalog()
  const topics = catalog.flatMap(group => group.modules.flatMap(module => module.concepts.map(topic => ({ ...topic, group, module }))))
  const assets = {}
  for (const name of ['algo.css', 'algo.js']) {
    const source = resolve(root, 'scripts/algo/assets', name)
    const hash = createHash('sha256').update(await readFile(source)).digest('hex').slice(0, 12)
    assets[name] = `/assets/${name.replace('.', `.${hash}.`)}`
    await copyFile(source, resolve(directory, '.' + assets[name]))
  }
  const searchRecords = topics.map(topic => ({ title: topic.title, category: topic.group.label, chapter: topic.module.title, url: topicHref(topic), text: [topic.title, topic.group.label, topic.module.title, topic.explanation, topic.method, topic.example, topic.pitfall].join(' ') }))
  const searchJson = JSON.stringify(searchRecords)
  const searchHash = createHash('sha256').update(searchJson).digest('hex').slice(0, 12)
  const searchUrl = `/assets/search.${searchHash}.json`
  await writeFile(resolve(directory, '.' + searchUrl), searchJson + '\n')

  function moduleNav(module, current) {
    return `<details class="nav-module"${module.concepts.some(topic => topic.id === current) ? ' open' : ''}><summary>${escape(module.title)}</summary><div class="nav-topics">${module.concepts.map(topic => `<a href="${topicHref(topic)}"${topic.id === current ? ' class="active" aria-current="page"' : ''}>${escape(topic.title)}</a>`).join('')}</div></details>`
  }
  function sidebar(group, current, isHome) {
    return `<aside class="sidebar" id="sidebar" aria-label="章节导航"><a href="/" class="sidebar-title">算法知识库</a>${group ? `<a class="sidebar-home${!current ? ' active' : ''}" href="${groupHref(group)}"${!current ? ' aria-current="page"' : ''}>${escape(group.label)}简介</a>${group.modules.map(module => moduleNav(module, current)).join('')}<div class="sidebar-categories"><span>探索其他分类</span>${catalog.filter(item => item.id !== group.id).map(item => `<a href="${groupHref(item)}">${escape(item.label)}</a>`).join('')}</div>` : `<a class="sidebar-home${isHome ? ' active' : ''}" href="/"${isHome ? ' aria-current="page"' : ''}>开始阅读</a>${catalog.map(item => `<details class="nav-group"><summary>${escape(item.label)}</summary><a class="group-overview" href="${groupHref(item)}">${escape(item.label)}简介</a>${item.modules.map(module => moduleNav(module, current)).join('')}</details>`).join('')}`}</aside>`
  }
  function page({ title, description, group, current, body, toc, path = '/' }) {
    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(description)}"><meta name="color-scheme" content="light dark"><title>${escape(title)} - Algo Wiki</title><link rel="canonical" href="https://algo.dezhonger.com${path}"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="${assets['algo.css']}"><script>try{const t=localStorage.getItem('algo-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.dataset.theme='dark'}catch{}</script></head>
<body><a class="skip-link" href="#main-content">跳到正文</a><header class="site-header wiki-header"><div class="header-inner header-main"><button class="menu-toggle icon-button" aria-label="打开章节导航" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button><a href="/" class="site-logo" aria-label="Algo Wiki 首页">${icon('book')}<span class="site-title">Algo Wiki</span></a><span class="current-page-label">${escape(title)}</span><div class="header-actions"><button class="theme-toggle icon-button" aria-label="切换到深色模式">${icon('theme')}</button><button class="search-trigger" aria-label="搜索知识库" aria-haspopup="dialog">${icon('search')}<span>搜索</span><kbd>/</kbd></button></div></div><nav class="top-tabs" aria-label="知识分类">${catalog.map(item => `<a href="${groupHref(item)}"${group?.id === item.id ? ' class="active" aria-current="page"' : ''}>${escape(item.label)}</a>`).join('')}</nav></header>
<button class="mobile-overlay" aria-label="关闭章节导航" hidden></button><div class="wiki-layout">${sidebar(group, current, path === '/')}<main class="article" id="main-content" tabindex="-1">${body}</main><aside class="page-toc" aria-label="本页目录"><span class="toc-title">本页目录</span><nav>${toc.map(([id, label]) => `<a href="#${id}">${escape(label)}</a>`).join('')}</nav></aside></div>
<footer class="site-footer">Algo Wiki · 算法与智能计算知识库<span>布局参考 <a href="https://oi-wiki.org/math/" target="_blank" rel="noopener noreferrer">OI Wiki</a></span></footer>
<dialog id="algo-search" class="search-dialog" aria-labelledby="search-title" data-search-index="${searchUrl}"><div class="search-dialog-head"><label for="search-input" id="search-title">搜索知识库</label><button class="search-close icon-button" aria-label="关闭搜索">${icon('close')}</button></div><div class="search-input-wrap">${icon('search')}<input class="search-input" id="search-input" type="search" placeholder="搜索算法、模型、知识点…" autocomplete="off"><button class="search-clear" aria-label="清空搜索" hidden>清空</button></div><p class="search-hint" role="status" aria-live="polite">输入关键词，搜索全部 ${topics.length} 个知识点</p><div id="search-results"></div><div class="search-dialog-footer"><kbd>↑</kbd><kbd>↓</kbd> 选择 <kbd>Enter</kbd> 打开 <kbd>Esc</kbd> 关闭</div></dialog><script type="module" src="${assets['algo.js']}"></script></body></html>\n`
  }
  const overviewToc = [['about', '关于知识库'], ['categories', '知识分类'], ['learning', '如何开始']]
  const homeBody = `<div class="breadcrumbs">首页</div><h1>算法知识库</h1><section id="about"><p>算法连接问题与解法，也连接理论与实际系统。这里将算法竞赛、工程算法、机器学习、大模型和计算机视觉整理成五条相互关联的学习路径。</p><p>你可以按左侧章节逐步阅读，也可以通过顶部分类和搜索直接查找一个知识点。每篇文章围绕概念、方法、应用和适用边界展开。</p></section><section id="categories"><h2>知识分类</h2><div class="overview-links">${catalog.map(group => `<div><h3><a href="${groupHref(group)}">${escape(group.label)} <span aria-hidden="true">→</span></a></h3><p>${escape(group.description)}</p><p class="chapter-meta">${group.modules.length} 个章节 · ${group.modules.reduce((n, module) => n + module.concepts.length, 0)} 个知识点</p></div>`).join('')}</div></section><section id="learning"><h2>如何开始</h2><ol class="learning-route"><li><strong>建立基础。</strong>算法竞赛从复杂度与数据结构开始；机器学习与视觉先补齐线性代数、概率和优化基础。</li><li><strong>围绕问题阅读。</strong>先明确输入、目标与约束，再选择算法或模型，并通过例子理解方法。</li><li><strong>检查成立条件。</strong>复杂度、数据分布、数值精度与故障模型，决定一个方法何时可用。</li></ol><div class="intro-note">机器学习与大模型已分为独立目录。两者共享深度学习与注意力机制基础；计算机视觉在此基础上关注图像、空间与视频。</div></section><div class="article-meta">共 ${catalog.length} 个分类 · ${catalog.reduce((n, group) => n + group.modules.length, 0)} 个章节 · ${topics.length} 个知识点</div><nav class="article-footer"><span></span><a href="/competitive/"><small>开始阅读 →</small>算法竞赛简介</a></nav>`
  await writeFile(resolve(directory, 'index.html'), page({ title: '算法知识库', description: '算法竞赛、工程算法、机器学习、大模型与计算机视觉的分类知识库。', body: homeBody, toc: overviewToc }))

  for (const group of catalog) {
    await mkdir(resolve(directory, group.id), { recursive: true })
    const toc = [['introduction', '简介'], ['route', '学习路线'], ...group.modules.map(module => [module.id, module.title])]
    const body = `<div class="breadcrumbs"><a href="/">首页</a><span>/</span>${escape(group.label)}</div><h1>${escape(group.label)}简介</h1><section id="introduction"><p>${escape(group.description)}</p><p>本分类共 ${group.modules.length} 个章节、${group.modules.reduce((n, module) => n + module.concepts.length, 0)} 个知识点。展开左侧章节，或从下方目录选择一篇文章开始阅读。</p></section><section id="route"><h2>学习路线</h2><p>${escape(group.guide)}</p></section>${group.modules.map(module => `<section class="chapter-section" id="${module.id}"><h2>${escape(module.title)}</h2><p>${escape(module.summary)}</p><ul class="topic-list">${module.concepts.map(topic => `<li class="topic-row"><a href="${topicHref(topic)}">${escape(topic.title)}</a></li>`).join('')}</ul></section>`).join('')}<div class="article-meta">${escape(group.english)} · ${group.modules.length} 个章节</div><nav class="article-footer"><a href="/"><small>← 返回</small>算法知识库</a><a href="${topicHref(group.modules[0].concepts[0])}"><small>下一篇 →</small>${escape(group.modules[0].concepts[0].title)}</a></nav>`
    await writeFile(resolve(directory, group.id, 'index.html'), page({ title: `${group.label}简介`, description: group.description, group, body, toc, path: groupHref(group) }))
  }
  for (const topic of topics) {
    const groupTopics = topics.filter(item => item.group.id === topic.group.id)
    const index = groupTopics.findIndex(item => item.id === topic.id)
    const previous = groupTopics[index - 1]
    const next = groupTopics[index + 1]
    const toc = [['concept', '概念解释'], ['method', '核心方法与条件'], ['example', '例题或应用'], ['pitfall', '常见易错点'], ['check', '自检']]
    if (topic.references?.length) toc.push(['references', '延伸阅读'])
    const sections = [['concept', '概念解释', topic.explanation, ''], ['method', '核心方法与条件', topic.method, ''], ['example', '例题或应用', topic.example, 'formula'], ['pitfall', '常见易错点', topic.pitfall, 'warning'], ['check', '自检', `请尝试不用原文解释“${topic.title}”解决什么问题，再设计一个属于“${topic.module.title}”的实例，并说明适用条件和判断依据。`, '']]
    const body = `<div class="breadcrumbs"><a href="/">首页</a><span>/</span><a href="${groupHref(topic.group)}">${escape(topic.group.label)}</a><span>/</span><a href="${groupHref(topic.group)}#${topic.module.id}">${escape(topic.module.title)}</a></div><h1>${escape(topic.title)}</h1><p class="article-meta">${escape(topic.module.title)}</p>${sections.map(([id, title, copy, type]) => `<section id="${id}" class="topic-section ${type}"><h2>${title}</h2><p>${escape(copy)}</p></section>`).join('')}${topic.references?.length ? `<section id="references"><h2>延伸阅读</h2><ul>${topic.references.map(reference => `<li><a href="${escape(reference.url)}" target="_blank" rel="noopener noreferrer">${escape(reference.title)}</a></li>`).join('')}</ul></section>` : ''}<nav class="article-footer"><a href="${previous ? topicHref(previous) : groupHref(topic.group)}"><small>← 上一篇</small>${escape(previous?.title || `${topic.group.label}简介`)}</a>${next ? `<a href="${topicHref(next)}"><small>下一篇 →</small>${escape(next.title)}</a>` : `<a href="${groupHref(topic.group)}"><small>返回目录 →</small>${escape(topic.group.label)}</a>`}</nav>`
    await writeFile(resolve(directory, 'topics', `${topic.id}.html`), page({ title: topic.title, description: topic.explanation, group: topic.group, current: topic.id, body, toc, path: topicHref(topic) }))
  }
  await writeFile(resolve(directory, 'assets/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#4051b5"/><path d="M7 8h5c3 0 4 2 4 3 0-1 1-3 4-3h5v15h-5c-2 0-3 1-4 2-1-1-2-2-4-2H7z" fill="none" stroke="white" stroke-width="2"/></svg>\n`)
  const paths = ['/', ...catalog.map(groupHref), ...topics.map(topicHref)]
  await writeFile(resolve(directory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>https://algo.dezhonger.com${path}</loc></url>`).join('')}</urlset>\n`)
  await writeFile(resolve(directory, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://algo.dezhonger.com/sitemap.xml\n')
  console.log(`Generated Algo Wiki: ${catalog.length} categories, ${topics.length} topics, ${paths.length} pages`)
  return { catalog, topics, directory }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await generateAlgo()
