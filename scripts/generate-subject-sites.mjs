import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { subjects } from './subject-data.mjs'

const root = resolve(import.meta.dirname, '..')

const navSubjects = [
  ['math', '数学'], ['algo', '算法'], ['english', '英语'], ['biology', '生物'],
  ['geography', '地理'], ['physics', '物理'], ['chemistry', '化学'], ['history', '历史'],
]

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

function periodicTable() {
  return `
    <section class="periodic-section" aria-labelledby="periodic-title">
      <div class="section-heading"><div><p class="section-kicker">INTERACTIVE REFERENCE</p><h2 id="periodic-title">元素周期表</h2></div><span>118 个元素</span></div>
      <p class="section-intro">按周期、族和元素类别组织。点击任意元素查看名称、原子序数、相对原子质量、电子排布与常见氧化态。</p>
      <div class="periodic-controls" aria-label="元素类别筛选">
        <button class="element-filter active" data-element-filter="all">全部</button>
        <button class="element-filter" data-element-filter="alkali">碱金属</button>
        <button class="element-filter" data-element-filter="transition">过渡金属</button>
        <button class="element-filter" data-element-filter="metalloid">类金属</button>
        <button class="element-filter" data-element-filter="nonmetal">非金属</button>
        <button class="element-filter" data-element-filter="halogen">卤素</button>
        <button class="element-filter" data-element-filter="noble">稀有气体</button>
      </div>
      <p class="periodic-mobile-note">小屏幕上按元素序数展示，点击元素查看详细数据。</p>
      <div class="periodic-scroll"><div id="periodic-table" class="periodic-table" aria-label="元素周期表"></div></div>
      <aside id="element-detail" class="element-detail" aria-live="polite">
        <div><span class="detail-number">1</span><strong class="detail-symbol">H</strong></div>
        <div><h3>氢 · Hydrogen</h3><p>最轻的元素，也是宇宙中丰度最高的元素。</p></div>
        <dl><div><dt>相对原子质量</dt><dd>1.008</dd></div><div><dt>电子排布</dt><dd>1s¹</dd></div><div><dt>常见氧化态</dt><dd>+1, −1</dd></div></dl>
      </aside>
    </section>`
}

function renderModule(item, index) {
  return `<article class="learning-module" data-search="${escapeHtml(`${item.title} ${item.summary} ${item.concepts.join(' ')}`)}">
    <div class="module-index">${String(index + 1).padStart(2, '0')}</div>
    <div class="module-body">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="module-summary">${escapeHtml(item.summary)}</p>
      <h4>本章内容</h4>
      <ul>${item.concepts.map((concept) => `<li>${escapeHtml(concept)}</li>`).join('')}</ul>
      <div class="example"><strong>方法与边界</strong><span>${escapeHtml(item.example)}</span></div>
    </div>
  </article>`
}

function renderSubject(slug, subject) {
  const allModules = subject.groups.flatMap((group) => group.modules)
  const nav = navSubjects.map(([key, label]) => `<a${key === slug ? ' aria-current="page"' : ''} href="https://${key}.dezhonger.com">${label}</a>`).join('')
  const filters = subject.groups.map((group) => `<button class="filter-button" data-filter="${group.id}">${group.label}<span>${group.modules.length}</span></button>`).join('')
  const groups = subject.groups.map((group) => `<section class="subject-group" id="${group.id}" data-group="${group.id}">
    <div class="group-head"><div><p class="section-kicker">${group.id.toUpperCase()}</p><h2>${group.label}</h2><p>${group.description}</p></div><span>${group.modules.length} 章</span></div>
    <div class="module-grid">${group.modules.map(renderModule).join('')}</div>
  </section>`).join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${escapeHtml(subject.intro)}">
  <title>${subject.name}知识体系</title>
  <link rel="stylesheet" href="subject.css">
</head>
<body data-subject="${slug}">
  <header class="site-header">
    <a class="site-name" href="/">${subject.name}</a>
    <nav aria-label="学科导航">${nav}<a href="https://guwen.dezhonger.com">古文</a><a href="https://knowledge.dezhonger.com/zh/">知识库</a></nav>
  </header>
  <div class="page-shell">
    <aside class="sidebar" aria-label="${subject.name}目录筛选">
      <div class="side-title">${subject.name}学习路径</div>
      <button class="filter-button active" data-filter="all">全部章节<span>${allModules.length}</span></button>
      ${filters}
      <div class="side-divider"></div>
      <p class="side-note">${escapeHtml(subject.source)}。页面提供知识框架与学习提示，不替代正式教材。</p>
    </aside>
    <main>
      <section class="hero-row">
        <div><p class="breadcrumb">${subject.eyebrow}</p><h1>${subject.name}知识体系</h1><p class="intro">${subject.intro}</p></div>
        <label class="search-box"><span>搜索章节和知识点</span><input id="subject-search" type="search" placeholder="输入关键词" autocomplete="off"></label>
      </section>
      <div class="overview"><strong id="visible-count">${allModules.length}</strong><span>章内容</span><strong>${subject.groups.length}</strong><span>条学习路径</span><p>每章均包含核心内容和方法边界，所有结果直接展示在页面中。</p></div>
${subject.special === 'periodic-table' ? periodicTable() : ''}
      <div id="subject-content">${groups}</div>
      <p id="empty-state" class="empty-state" hidden>没有匹配的内容，请尝试更短的关键词。</p>
    </main>
  </div>
  <footer>${subject.name} · 课程框架、核心概念与学习方法</footer>
  <script src="subject.js"></script>
${subject.special === 'periodic-table' ? '  <script src="elements.js"></script>' : ''}
</body>
</html>`
}

for (const [slug, subject] of Object.entries(subjects)) {
  const directory = resolve(root, 'sites', slug)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'index.html'), `${renderSubject(slug, subject)}\n`)
  await copyFile(resolve(root, 'sites/shared/subject.css'), resolve(directory, 'subject.css'))
  await copyFile(resolve(root, 'sites/shared/subject.js'), resolve(directory, 'subject.js'))
  if (subject.special === 'periodic-table') {
    await copyFile(resolve(root, 'sites/shared/elements.js'), resolve(directory, 'elements.js'))
  }
}

console.log(`Generated ${Object.keys(subjects).length} subject sites`)
