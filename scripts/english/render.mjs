import { SITE, SECTIONS, ordered, labelOf, ancestry, sceneUrl, detailUrl, grammarLevels } from './model.mjs'

export const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
const e = escapeHtml
const paths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  book: '<path d="M12 5v15M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 1-3-1-5-2-9-1Z"/>',
  vocabulary: '<path d="m4 19 6-14 6 14M6 14h8m3 4h5m-2.5-5v9"/>',
  grammar: '<path d="M5 5h14M5 12h9M5 19h14m-2-9 3 2-3 2"/>',
  expression: '<path d="M20 11a7 7 0 0 1-7 7H7l-4 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z"/><path d="M7 8h9M7 12h6"/>',
  speaker: '<path d="m11 5-5 4H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  leaf: '<path d="M19 3C7 3 2 7 5 15c8 5 15 0 14-12ZM4 21l10-12"/>',
}
export const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`
const link = (href, text, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${e(href)}">${e(text)}</a>`
export const breadcrumb = crumbs => `<nav class="breadcrumb" aria-label="面包屑"><ol><li>${link('/', '首页')}</li>${crumbs.map(([text, href]) => `<li>${icon('chevron', 12)}${href ? link(href, text) : `<span aria-current="page">${e(text)}</span>`}</li>`).join('')}</ol></nav>`
export function searchForm({ large = false, value = '', id = 'search-query', extra = '' } = {}) {
  return `<form class="search-form${large ? ' search-form--large' : ''}" action="/search" role="search" ${extra}><label class="sr-only" for="${id}">搜索单词、语法或英语表达</label>${icon('search', 22)}<input id="${id}" name="q" type="search" value="${e(value)}" placeholder="搜索单词、语法或英语表达" maxlength="120" autocomplete="off"><button type="submit">搜索${icon('arrow', 16)}</button></form>`
}
export function layout({ title, description, path, section, body, assets, crumbs = [], noindex = false, article = false }) {
  description = [...String(description)].slice(0, 180).join('')
  const nav = [['/', '首页'], ...SECTIONS.map(s => [s.path, s.label])]
  const pageTitle = path === '/' ? `${SITE.name} · 学英语，从这里开始` : `${title} · ${SITE.name}`
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(pageTitle)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${SITE.origin}${e(path)}">
<meta property="og:title" content="${e(pageTitle)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${SITE.origin}${e(path)}">
<meta property="og:type" content="${article ? 'article' : 'website'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="zh_CN">
<meta name="theme-color" content="#ffffff">
${noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<link rel="icon" href="${assets}/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${assets}/english.css">
<script type="module" src="${assets}/ui.js"></script>
${path === '/search' ? `<script type="module" src="${assets}/search-ui.js"></script>` : ''}
${path === '/vocabulary/practice' ? `<script type="module" src="${assets}/practice-ui.js"></script>` : ''}
</head>
<body>
<a class="skip-link" href="#main">跳到正文</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="/" aria-label="English Learning 首页"><span class="brand-icon">E<span class="brand-dot"></span></span><span>English<span class="brand-sub">LEARNING</span></span></a>
<nav class="desktop-nav" aria-label="主导航">${nav.map(([href, label]) => `<a href="${href}"${path === href || (href !== '/' && path.startsWith(href + '/')) ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
<div class="header-actions"><a class="header-search" href="/search" aria-label="搜索"${section === 'search' ? ' aria-current="page"' : ''}>${icon('search', 18)}<span>搜索</span></a><a class="header-practice" href="/vocabulary/practice">随机背词 ${icon('arrow', 15)}</a><button class="menu-toggle" aria-label="展开导航" aria-expanded="false" aria-controls="mobile-nav" hidden>${icon('menu')}</button></div>
</div><nav id="mobile-nav" class="mobile-nav" aria-label="手机导航" hidden>${nav.map(([href, label]) => link(href, label)).join('')}${link('/vocabulary/practice', '随机背词')}</nav><noscript><nav class="mobile-nav" aria-label="手机导航">${nav.map(([href, label]) => link(href, label)).join('')}${link('/vocabulary/practice', '随机背词')}</nav></noscript></header>
<main id="main" class="page${path === '/' ? ' page--home' : ''}" tabindex="-1">${crumbs.length ? breadcrumb(crumbs) : ''}${body}</main>
<footer class="site-footer"><div><a class="footer-brand" href="/">English Learning<span>学一点，用一点。</span></a><p>Learn at your own pace.</p><nav aria-label="页脚导航"><a href="/vocabulary/practice">随机背词</a><a href="/sources">词表来源</a></nav></div></footer>
<p id="speech-status" class="speech-status" role="status" aria-live="polite"></p>
</body></html>\n`
}
export const heading = (title, description, eyebrow = '') => `<header class="page-heading">${eyebrow ? `<p class="eyebrow">${e(eyebrow)}</p>` : ''}<h1>${e(title)}</h1><p class="lead">${e(description)}</p></header>`
export function illustration(kind) {
  const art = {
    vocabulary: '<rect x="49" y="17" width="83" height="111" rx="10" fill="currentColor" opacity=".18" transform="rotate(-15 90 75)"/><rect x="62" y="15" width="83" height="112" rx="10" fill="white" transform="rotate(9 100 75)"/><text x="78" y="77" font-size="38" font-family="Arial,sans-serif" font-weight="700" fill="currentColor">Aa</text><path d="M80 94h45M80 104h28" stroke="currentColor" stroke-width="4" opacity=".35" stroke-linecap="round"/><circle cx="36" cy="36" r="6" fill="white"/><path d="M157 105v12m-6-6h12" stroke="currentColor" stroke-width="3" opacity=".6"/>',
    grammar: '<rect x="35" y="27" width="111" height="96" rx="10" fill="white"/><path d="M91 31v87M48 49h29m-29 13h23m-23 13h28m27-26h27m-27 13h23m-23 13h28" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".6"/><path d="m106 97 8 8 16-18" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="37" cy="122" r="13" fill="currentColor" opacity=".18"/><path d="M153 18v12m-6-6h12" stroke="currentColor" stroke-width="3"/>',
    expression: '<path d="M25 28h84a13 13 0 0 1 13 13v41a13 13 0 0 1-13 13H61L40 111V95H25a13 13 0 0 1-13-13V41a13 13 0 0 1 13-13Z" fill="white"/><path d="M38 50h58M38 65h39" stroke="currentColor" stroke-width="5" opacity=".6" stroke-linecap="round"/><path d="M91 80h50a14 14 0 0 1 14 14v27l-15-10H91a12 12 0 0 1-12-12v-7a12 12 0 0 1 12-12Z" fill="currentColor"/><circle cx="102" cy="96" r="3" fill="white"/><circle cx="116" cy="96" r="3" fill="white"/><circle cx="130" cy="96" r="3" fill="white"/>',
    practice: '<rect x="30" y="18" width="84" height="111" rx="12" fill="currentColor" opacity=".16" transform="rotate(-13 75 75)"/><rect x="52" y="22" width="84" height="110" rx="12" fill="white" transform="rotate(8 95 75)"/><path d="M74 61h35m-9-9 10 10-10 10M117 92H80m9-9-10 10 10 10" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  }
  return `<svg class="module-art" viewBox="0 0 180 150" aria-hidden="true">${art[kind] || art.vocabulary}</svg>`
}
export function moduleCards() {
  return `<div class="module-grid">${SECTIONS.map(s => `<a class="module-card module-card--${s.id}" href="${s.path}"><div class="module-copy"><p class="module-en">${s.en}</p><h3>${s.label}</h3><p>${s.description}</p><span class="module-cta">开始学习 ${icon('arrow', 17)}</span></div>${illustration(s.id)}</a>`).join('')}</div>`
}
export function practiceBanner(level = '') {
  return `<section class="practice-banner">${illustration('practice')}<div><p class="eyebrow">VOCABULARY PRACTICE</p><h2>这些单词，你还记得吗？</h2><p>选好词表，随机抽词。先想一想，再点开释义。</p></div><a class="primary-button" href="/vocabulary/practice${level ? `?level=${level}` : ''}">随机背词 ${icon('arrow', 17)}</a></section>`
}
export function home(model) {
  const topics = [['水果', '/vocabulary/topic/fruit', 'Fruit'], ['动物', '/vocabulary/topic/animals', 'Animals'], ['厨房', '/vocabulary/topic/kitchen', 'Kitchen'], ['汽车', '/vocabulary/topic/cars', 'Cars'], ['亲子', '/expressions/parenting', 'Parenting'], ['工作', '/expressions/work', 'Work'], ['旅行', '/expressions/daily/travel', 'Travel'], ['电脑', '/vocabulary/topic/computers', 'Computers']]
  return `<section class="home-hero"><p class="hero-label">ENGLISH LEARNING</p><h1>让英语学习，<span>更简单一点。</span></h1><p class="hero-copy">单词、语法、常用表达，从这里开始。</p>${searchForm({ large: true })}<div class="search-suggestions"><span>试试</span>${link('/search?q=apple', 'apple')}${link('/search?q=现在完成时', '现在完成时')}${link('/search?q=开会', '开会')}</div></section>
<section class="home-section" aria-labelledby="explore-title"><div class="section-heading"><h2 id="explore-title">你想从哪里开始？</h2><span class="section-note">选择一个方向，开始学习</span></div>${moduleCards()}</section>
${practiceBanner()}
<section class="home-section" aria-labelledby="levels-title"><div class="section-heading"><div><h2 id="levels-title">找到适合你的词表</h2><p>从基础启蒙到考试进阶，循序渐进。</p></div><a class="text-link" href="/vocabulary">全部单词 ${icon('arrow', 16)}</a></div>${levelCards(model.taxonomy.vocabularyLevels, id => `/vocabulary/level/${id}`, id => model.vocabulary.filter(word => word.levelIds.includes(id)).length)}</section>
<section class="home-section topic-section" aria-labelledby="topics-title"><div class="section-heading"><h2 id="topics-title">从感兴趣的主题出发</h2></div><div class="popular-topics">${topics.map(([label, href, en]) => `<a href="${href}"><span>${label}<small lang="en">${en}</small></span>${icon('arrow', 16)}</a>`).join('')}</div></section>`
}
export function practicePage(model) {
  return `${heading('随机背词', '先回忆，再揭晓。用一组随机单词，检验你的记忆。', 'VOCABULARY PRACTICE')}<section class="practice-panel" aria-labelledby="practice-setup-title"><div class="practice-panel-heading"><h2 id="practice-setup-title">设置本次练习</h2><span>每次 1–500 个 · 组内不重复</span></div><form id="practice-form" novalidate><div class="practice-field"><label for="practice-level">选择词表</label><select id="practice-level" name="level">${model.taxonomy.vocabularyLevels.map(node => `<option value="${node.id}"${node.id === 'cet6' ? ' selected' : ''}>${e(node.label)} · ${model.vocabulary.filter(word => word.levelIds.includes(node.id)).length.toLocaleString('en-US')} 词</option>`).join('')}</select></div><div class="practice-field"><label for="practice-count">单词数量</label><input id="practice-count" name="count" type="number" min="1" max="500" step="1" value="50" inputmode="numeric" aria-describedby="practice-hint practice-error"></div><button class="primary-button" type="submit" id="practice-start">开始抽词 ${icon('arrow', 17)}</button></form><div class="practice-options"><span>快速选择</span>${[10,50,100,200,500].map(count => `<button type="button" data-practice-count="${count}" aria-pressed="${count === 50}">${count}</button>`).join('')}</div><p id="practice-hint" class="practice-hint">中文释义默认隐藏，点击每个单词下方的按钮查看。</p><p id="practice-error" role="alert" hidden></p></section><section class="practice-session" aria-labelledby="practice-results-title"><div class="practice-results-heading"><h2 id="practice-results-title">本次练习</h2><p id="practice-status" role="status" aria-live="polite">选好词表与数量，点击“开始抽词”。</p></div><div id="practice-empty" class="practice-empty">${illustration('practice')}<h3>准备好，来一组新单词。</h3><p>不记得也没关系，点开释义再认识它一次。</p></div><div id="practice-results" class="practice-grid"></div><nav id="practice-pagination" class="pagination" aria-label="练习分页" hidden></nav></section><noscript><p>随机背词需要开启 JavaScript。你也可以直接<a href="/vocabulary">浏览词表</a>。</p></noscript>`
}
export function speechButton(text, accent = 'uk', label = '', audioSrc = '') {
  const accessible = `${accent === 'uk' ? '英式' : '美式'}朗读：${text}`
  return `<button type="button" class="speak-button" data-speak="${e(text)}" data-accent="${accent}"${audioSrc ? ` data-audio="${e(audioSrc)}"` : ''} aria-label="${e(accessible)}" title="${e(accessible)}" hidden>${icon('speaker', 18)}${label ? `<span>${e(label)}</span>` : ''}</button>`
}
export function chips(items, cls = '') {
  if (!items.length) return ''
  return `<div class="chips ${cls}">${items.map(([label, href]) => href ? link(href, label, 'chip') : `<span class="chip">${e(label)}</span>`).join('')}</div>`
}
export function emptyState(label = '这个主题的内容正在整理中。', back = '/vocabulary') {
  return `<div class="empty-state">${icon('book', 30)}<h2>留一点空间，给新的知识。</h2><p>${e(label)}</p><div>${link(back, '浏览已有内容', 'text-link')}${link('/search', '搜索其他主题', 'text-link')}</div></div>`
}
export function pagination(path, page, totalPages, count) {
  if (totalPages <= 1) return ''
  const url = n => n === 1 ? path : `${path}/page/${n}`
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter(n => n >= 1 && n <= totalPages))
  let previous = 0
  const links = [...pages].sort((a, b) => a - b).map(n => {
    const gap = previous && n - previous > 1 ? '<span class="page-gap">…</span>' : ''
    previous = n
    return gap + (n === page ? `<span class="page-current" aria-current="page">${n}</span>` : link(url(n), n))
  }).join('')
  return `<nav class="pagination" aria-label="分页">${page > 1 ? link(url(page - 1), '上一页') : '<span aria-disabled="true">上一页</span>'}<div>${links}</div>${page < totalPages ? link(url(page + 1), '下一页') : '<span aria-disabled="true">下一页</span>'}<small>第 ${page} / ${totalPages} 页 · 共 ${count} 条</small></nav>`
}
export function vocabularyRow(word, t) {
  const sense = word.senses[0]
  const labels = [...word.levelIds.slice(0, 2).map(id => [labelOf(t.vocabularyLevels, id), `/vocabulary/level/${id}`]), ...word.topicIds.slice(0, 1).map(id => [labelOf(t.topics, id), `/vocabulary/topic/${id}`])]
  const ipa = word.pronunciation?.uk?.ipa || word.pronunciation?.us?.ipa || word.pronunciation?.reference?.ipa
  return `<article class="word-row"><div class="word-row-main"><h2>${link(detailUrl('vocabulary', word.id), word.word)}</h2>${ipa ? `<span class="ipa" lang="en">${e(ipa)}</span>` : ''}<p><span class="part-of-speech">${e(labelOf(t.partsOfSpeech, sense.posId))}</span>${e(sense.zh)}</p></div>${chips(labels)}<a class="row-arrow" href="${detailUrl('vocabulary', word.id)}" aria-label="查看 ${e(word.word)} 详情">${icon('arrow')}</a></article>`
}
export function grammarRow(topic, t, level, headingLevel = 2) {
  const layer = level && topic.layers.find(layer => layer.levelIds.includes(level))
  const url = detailUrl('grammar', topic.id) + (layer ? `#depth-${layer.id}` : '')
  return `<article class="content-row"><span class="row-icon">${icon('grammar', 22)}</span><div><h${headingLevel}>${link(url, topic.title)}</h${headingLevel}><p>${e(topic.description)}</p>${chips(grammarLevels(topic).map(id => [labelOf(t.grammarLevels, id)]))}</div><a class="row-arrow" href="${url}" aria-label="阅读${e(topic.title)}">${icon('arrow')}</a></article>`
}
export function expressionRow(item, t, headingLevel = 2) {
  return `<article class="expression-row"><div><h${headingLevel} lang="en">${link(detailUrl('expression', item.id), item.en)}</h${headingLevel}><p class="translation">${e(item.zh)}</p>${item.usage ? `<p class="usage">${e(item.usage)}</p>` : ''}${chips(item.sceneIds.map(id => [labelOf(t.scenes, id), sceneUrl(t.scenes, id)]))}</div>${speechButton(item.en, 'us')}</article>`
}
const examples = items => items?.length ? `<div class="examples">${items.map(item => `<blockquote><p lang="en">${e(item.en)}</p><p class="translation">${e(item.zh)}</p></blockquote>`).join('')}</div>` : ''
const relations = (items, type = 'vocabulary') => items?.length ? `<div class="related-words">${items.map(item => item.targetId ? link(detailUrl(type, item.targetId), item.text) : `<span lang="en">${e(item.text)}</span>`).join('')}</div>` : ''
export function wordDetail(word, t) {
  const pronunciations = ['uk', 'us'].map(accent => {
    const value = word.pronunciation?.[accent]
    return `<div class="pronunciation"><span class="accent-label">${accent === 'uk' ? '英' : '美'}</span>${value?.ipa ? `<span class="ipa" lang="en">${e(value.ipa)}</span>` : ''}${speechButton(word.word, accent, value?.ipa ? '' : '听发音', value?.audioSrc)}</div>`
  }).join('')
  return `<div class="detail-layout"><article class="word-detail"><header class="word-heading"><p class="eyebrow">WORD BY WORD</p><h1 lang="en">${e(word.word)}</h1><div class="pronunciations">${pronunciations}</div>${word.pronunciation?.reference?.ipa ? `<p class="reference-ipa">参考音标 <span class="ipa">${e(word.pronunciation.reference.ipa)}</span></p>` : ''}${['uk','us'].filter(accent => word.pronunciation?.[accent]?.variants?.length).map(accent => `<p class="reference-ipa">${accent === 'uk' ? '英式' : '美式'}其他读音 <span class="ipa">${word.pronunciation[accent].variants.map(e).join(' · ')}</span></p>`).join('')}<p class="speech-unavailable" hidden>当前浏览器暂不支持朗读。</p></header>
${word.senses.map((sense, i) => `<section class="sense"><div class="sense-heading"><span class="sense-number">${String(i + 1).padStart(2, '0')}</span><span class="part-of-speech">${e(labelOf(t.partsOfSpeech, sense.posId))}</span></div><h2>${e(sense.zh)}</h2>${sense.en ? `<p class="english-definition" lang="en">${e(sense.en)}</p>` : ''}${examples(sense.examples)}</section>`).join('')}
${word.collocations?.length ? `<section class="detail-section"><h2>常见搭配</h2><dl class="collocations">${word.collocations.map(item => `<div><dt lang="en">${e(item.en)}</dt><dd>${e(item.zh)}</dd></div>`).join('')}</dl></section>` : ''}
${word.synonyms?.length || word.antonyms?.length ? `<section class="detail-section relation-grid">${word.synonyms?.length ? `<div><h2>近义表达</h2>${relations(word.synonyms)}</div>` : ''}${word.antonyms?.length ? `<div><h2>反义表达</h2>${relations(word.antonyms)}</div>` : ''}</section>` : ''}
${word.notes ? `<aside class="content-note"><h2>多了解一点</h2><p>${e(word.notes)}</p></aside>` : ''}</article>
<aside class="detail-sidebar"><p class="eyebrow">LEARNING INDEX</p><h2>在这些分类中找到它</h2>${word.levelIds.length ? `<h3>学习阶段</h3>${chips(word.levelIds.map(id => [labelOf(t.vocabularyLevels, id), `/vocabulary/level/${id}`]))}` : ''}${word.topicIds.length ? `<h3>所属主题</h3>${chips(word.topicIds.map(id => [ancestry(t.topics, id).slice(1).map(node => node.label).join(' / ') || labelOf(t.topics, id), `/vocabulary/topic/${id}`]))}` : ''}${word.tagIds?.length ? `<h3>标签</h3>${chips(word.tagIds.map(id => [labelOf(t.tags, id)]))}` : ''}<p class="sidebar-note">阶段标签用于学习导航，<br>不代表官方考试词表。</p>${link('/vocabulary', '探索更多单词 →', 'text-link')}</aside></div>`
}
export function expressionDetail(item, model) {
  const t = model.taxonomy
  const related = model.expressions.filter(other => item.relatedIds?.includes(other.id))
  return `<article class="expression-detail"><p class="eyebrow">A LITTLE MORE NATURAL</p><h1 lang="en">${e(item.en)}</h1><p class="expression-translation">${e(item.zh)}</p><div class="expression-pronunciation">${speechButton(item.en, 'uk', '英式朗读')}${speechButton(item.en, 'us', '美式朗读')}</div><p class="speech-unavailable" hidden>当前浏览器暂不支持朗读。</p>${chips([...(item.difficultyId ? [[labelOf(t.difficulties, item.difficultyId)]] : []), ...(item.tagIds || []).map(id => [labelOf(t.tags, id)])])}
${item.usage ? `<section class="detail-section"><h2>什么时候用</h2><p>${e(item.usage)}</p></section>` : ''}${item.notes ? `<section class="content-note"><h2>这样理解更自然</h2><p>${e(item.notes)}</p></section>` : ''}<section class="detail-section"><h2>适用场景</h2>${chips(item.sceneIds.map(id => [ancestry(t.scenes, id).map(node => node.label).join(' / '), sceneUrl(t.scenes, id)]))}</section>${related.length ? `<section class="detail-section"><h2>还可以这样说</h2><div class="expression-list">${related.map(other => expressionRow(other, t, 3)).join('')}</div></section>` : ''}</article>`
}
export function taxonomyGroups(nodes, url, count) {
  const tree = parent => ordered(nodes.filter(node => node.parentId === parent)).map(node => {
    const children = nodes.some(child => child.parentId === node.id)
    return `<li>${link(url(node.id), node.label)}<span class="taxonomy-count">${count(node.id)}</span>${children ? `<ul>${tree(node.id)}</ul>` : ''}</li>`
  }).join('')
  return `<div class="taxonomy-grid">${ordered(nodes.filter(node => !node.parentId)).map(node => `<section class="taxonomy-group"><h3>${link(url(node.id), node.label)}<span>${count(node.id)}</span></h3><ul>${tree(node.id)}</ul></section>`).join('')}</div>`
}
export function levelCards(nodes, url, count) {
  return `<div class="level-grid">${ordered(nodes).map(node => `<a class="level-card" data-tone="${e(node.color || 'blue')}" href="${url(node.id)}"><div class="level-cover"><span class="level-code">${e(node.code || node.label)}</span><svg viewBox="0 0 180 90" aria-hidden="true"><path d="M10 83c32-20 52 6 80-12s28-28 27-58m-3 41c-22 4-32-9-29-17 15-5 26 7 29 17Zm4-13c24-1 31-15 23-20-14 0-22 10-23 20Z" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/></svg><small>ENGLISH VOCABULARY</small></div><div class="level-card-body"><strong>${e(node.label)}</strong><p>${e(node.description || '分层学习，逐步掌握')}</p><span>${count(node.id).toLocaleString('en-US')} ${node.code ? '个单词' : '篇内容'} ${icon('arrow', 16)}</span></div></a>`).join('')}</div>`
}
export const subcategoryLinks = (nodes, id, url) => chips(ordered(nodes.filter(node => node.parentId === id)).map(node => [node.label, url(node.id)]), 'subcategory-links')
export function searchPage() {
  return `${heading('搜索英语内容', '查单词、找语法，或寻找一句合适的表达。', 'SEARCH')}
<div class="search-page" data-search-page>${searchForm({ large: true, extra: 'data-search-form' })}<div class="search-filters" role="group" aria-label="内容类型"><button type="button" data-type="all" aria-pressed="true">全部</button>${SECTIONS.map(s => `<button type="button" data-type="${s.id}" aria-pressed="false">${s.label}</button>`).join('')}</div><p id="search-status" class="search-status" role="status" aria-live="polite">输入关键词，开始探索。</p><button id="search-retry" class="button-secondary" hidden>重新加载搜索</button><div id="search-results"></div><nav id="search-pagination" class="pagination" aria-label="搜索结果分页" hidden></nav><noscript><p>全站搜索需要开启 JavaScript。你也可以直接浏览${link('/vocabulary', '单词')}、${link('/grammar', '语法')}和${link('/expressions', '常用表达')}。</p></noscript></div>`
}

export function sourcesPage(model, report, assets) {
  const rows = model.taxonomy.vocabularyLevels.map(level => `<tr><td>${e(level.label)}</td><td>${e(level.description)}</td><td>${model.vocabulary.filter(word => word.levelIds.includes(level.id)).length.toLocaleString('en-US')} 词</td></tr>`).join('')
  return heading('词表来源', '完整覆盖所选词表，保留可追溯的数据来源。', 'WORDLIST SOURCES') + `<article class="sources-content prose"><h2>学习阶段与词表</h2><div class="table-scroll"><table><thead><tr><th>分类</th><th>采用的词表</th><th>已收录</th></tr></thead><tbody>${rows}</tbody></table></div><p>幼儿收录 Dolch Pre-primer、Primer 与常见名词；小学收录 Fry 1000 高频词。初中、高中、CET-4、CET-6、IELTS 和 TOEFL 收录 ECDICT 对应标签的完整词条，另保留少量本站整理的词汇。每个词只保存一次，可以同时属于多个分类。</p><p>这些分类是学习导航，不代表所有教材或考试的官方唯一词汇大纲。英美音标来自独立的口音词表；未覆盖的口音不凭空补写，发音按钮仍可使用设备语音。</p><h2>开放数据与许可</h2><ul><li><a href="https://github.com/skywind3000/ECDICT">ECDICT</a>：中英文词典释义及考试标签。<a href="${assets}/ECDICT-MIT.txt">MIT 许可</a>。</li><li><a href="https://github.com/mysticcoders/words-with-toddlers">Dolch / Fry 词表</a>：启蒙与基础高频词。<a href="${assets}/FOUNDATION-WORDLISTS-MIT.txt">MIT 许可</a>。</li><li><a href="https://github.com/open-dict-data/ipa-dict">IPA Dict</a>：英式与美式音标。<a href="${assets}/IPA-DICT-MIT.txt">MIT 许可</a>。</li></ul><p>当前版本收录 ${model.vocabulary.length.toLocaleString('en-US')} 个独立词条，其中 ${report.pronunciation.both.toLocaleString('en-US')} 个具有两种口音的音标。词典可能包含多义、专业用法与地区差异，释义需结合语境理解。</p></article>`
}
