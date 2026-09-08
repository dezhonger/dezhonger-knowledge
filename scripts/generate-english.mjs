import { readFile, writeFile, readdir, mkdir, mkdtemp, rename, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'
import { load } from 'cheerio'
import { loadContent, root, SITE, SECTIONS, ancestry, inCategory, sceneUrl, grammarLevels, labelOf, detailUrl, ordered } from './english/model.mjs'
import { searchIndex } from './english/search-index.mjs'
import { DATA_FILES } from './english/assets/content-data.js'
import { practiceData, legacyVocabularyData } from './english/practice-data.mjs'
import { escapeHtml as e, layout, heading, home, chips, vocabularyRow, wordDetail, grammarRow, expressionRow, expressionDetail, taxonomyGroups, levelCards, subcategoryLinks, pagination, emptyState, searchPage, icon, practiceBanner, practicePage, sourcesPage } from './english/render.mjs'
import { validateOutput } from './validate-english.mjs'

export async function generateEnglish() {
  const model = await loadContent(), t = model.taxonomy
  const search = searchIndex(model)
  const sourceAssets = resolve(root, 'scripts/english/assets')
  const files = new Map()
  for (const file of (await readdir(sourceAssets)).sort()) files.set(file, await readFile(resolve(sourceAssets, file)))
  const dataFiles = new Map([
    [DATA_FILES.search, JSON.stringify(search)],
    [DATA_FILES.practice, JSON.stringify(practiceData(model))],
    ['vocabulary.json', JSON.stringify(legacyVocabularyData(model))],
  ])
  for (const file of ['ECDICT-MIT.txt', 'IPA-DICT-MIT.txt', 'FOUNDATION-WORDLISTS-MIT.txt']) files.set(file, await readFile(resolve(root, 'LICENSES', file)))
  const digest = createHash('sha256')
  for (const [file, content] of files) digest.update(file).update(content)
  const assets = `/assets/${digest.digest('hex').slice(0, 12)}`
  const routes = new Map()
  const add = (path, title, description, body, options = {}) => {
    if (routes.has(path)) throw new Error(`Duplicate route: ${path}`)
    routes.set(path, { html: layout({ path, title, description, body, assets, ...options }), index: !options.noindex })
  }
  const categoryCrumbs = (nodes, id, url, parent) => [[parent.label, parent.path], ...ancestry(nodes, id).map(node => [node.label, node.id === id ? undefined : url(node.id)])]
  const listPages = ({ path, title, description, items, row, crumbs, prefix = '', section, eyebrow = '' }) => {
    const totalPages = Math.max(1, Math.ceil(items.length / SITE.pageSize))
    for (let page = 1; page <= totalPages; page += 1) {
      const currentPath = page === 1 ? path : `${path}/page/${page}`
      const currentCrumbs = page === 1 ? crumbs : [...crumbs.slice(0, -1), [title, path], [`第 ${page} 页`]]
      const slice = items.slice((page - 1) * SITE.pageSize, page * SITE.pageSize)
      const content = items.length ? `<p class="list-summary">${items.length} 条内容${page > 1 ? ` · 第 ${page} 页` : ''}</p><div class="content-list">${slice.map(row).join('')}</div>${pagination(path, page, totalPages, items.length)}` : emptyState('新的内容会陆续补充，先从其他主题开始吧。', SECTIONS.find(item => item.id === section)?.path || '/')
      add(currentPath, title + (page > 1 ? ` · 第 ${page} 页` : ''), description, heading(title, description, eyebrow) + prefix + content, { crumbs: currentCrumbs, noindex: !items.length, section })
    }
  }
  add('/', SITE.name, '从单词、语法和常用表达开始，在主题与语境中学习英语。', home())
  const vocabTopicUrl = id => `/vocabulary/topic/${id}`
  const grammarCategoryUrl = id => `/grammar/category/${id}`
  add('/vocabulary', '单词', '按学习阶段和主题浏览单词，查看英美音标、中英文释义、例句与常见搭配。', heading('英语词汇', `从基础到进阶，${model.vocabulary.length.toLocaleString('en-US')} 个单词等你学习。`, 'VOCABULARY') + practiceBanner() + `<section class="browse-section"><h2>按学习阶段</h2>${levelCards(t.vocabularyLevels, id => `/vocabulary/level/${id}`, id => model.vocabulary.filter(word => word.levelIds.includes(id)).length)}</section><section class="browse-section"><h2>按主题探索</h2><p class="lead">从身边的事物，到更广阔的世界。</p>${taxonomyGroups(t.topics, vocabTopicUrl, id => inCategory(model.vocabulary, 'topicIds', t.topics, id).length, 2)}</section>`, { crumbs: [['单词']], section: 'vocabulary' })
  for (const level of t.vocabularyLevels) {
    listPages({ path: `/vocabulary/level/${level.id}`, title: `${level.label}单词`, description: `适合${level.label}阶段探索的英语单词。学习标签用于内容导航，不代表官方考试词表。`, items: model.vocabulary.filter(word => word.levelIds.includes(level.id)), row: word => vocabularyRow(word, t), crumbs: [['单词', '/vocabulary'], [level.label]], section: 'vocabulary', prefix: practiceBanner(level.id), eyebrow: 'VOCABULARY' })
  }
  for (const topic of t.topics) {
    listPages({ path: vocabTopicUrl(topic.id), title: topic.label, description: `认识与${topic.label}有关的英语单词，结合释义和例句把它们用起来。`, items: inCategory(model.vocabulary, 'topicIds', t.topics, topic.id), row: word => vocabularyRow(word, t, topic.id), crumbs: categoryCrumbs(t.topics, topic.id, vocabTopicUrl, SECTIONS[0]), prefix: subcategoryLinks(t.topics, topic.id, vocabTopicUrl), section: 'vocabulary', eyebrow: 'WORDS IN CONTEXT' })
  }
  for (const word of model.vocabulary) {
    const topic = word.topicIds[0]
    add(detailUrl('vocabulary', word.id), `${word.word} · ${word.senses[0].zh}`, `${word.word}：${word.senses.map(s => s.zh).join('；')}。查看英美发音、中英文解释、例句与相关分类。`, wordDetail(word, t), { article: true, section: 'vocabulary', crumbs: [['单词', '/vocabulary'], ...(topic ? [[labelOf(t.topics, topic), vocabTopicUrl(topic)]] : []), [word.word]] })
  }
  add('/grammar', '语法', '按学习阶段和语法知识体系浏览文章，在同一主题中逐层理解英语语法。', heading('英语语法', '从基础规则到进阶用法，逐层建立你的语法体系。', 'GRAMMAR') + `<section class="browse-section"><h2>按学习阶段</h2>${levelCards(t.grammarLevels, id => `/grammar/level/${id}`, id => model.grammar.filter(topic => grammarLevels(topic).includes(id)).length)}</section><section class="browse-section"><h2>按知识体系</h2><p class="lead">从词类、时态到从句，建立彼此相连的理解。</p>${taxonomyGroups(t.grammarCategories, grammarCategoryUrl, id => inCategory(model.grammar, 'categoryIds', t.grammarCategories, id).length)}</section>`, { crumbs: [['语法']], section: 'grammar' })
  for (const level of t.grammarLevels) listPages({ path: `/grammar/level/${level.id}`, title: `${level.label}语法`, description: `从${level.label}阶段的理解深度出发，逐步掌握英语规则和实际用法。`, items: model.grammar.filter(topic => grammarLevels(topic).includes(level.id)), row: topic => grammarRow(topic, t, level.id), crumbs: [['语法', '/grammar'], [level.label]], section: 'grammar' })
  for (const node of t.grammarCategories) listPages({ path: grammarCategoryUrl(node.id), title: node.label, description: `关于${node.label}的规则、使用场景、例句和常见错误。`, items: inCategory(model.grammar, 'categoryIds', t.grammarCategories, node.id), row: topic => grammarRow(topic, t), crumbs: categoryCrumbs(t.grammarCategories, node.id, grammarCategoryUrl, SECTIONS[1]), prefix: subcategoryLinks(t.grammarCategories, node.id, grammarCategoryUrl), section: 'grammar' })
  const md = await createMarkdownRenderer(root, { html: false, linkify: false, headers: false })
  function markdown(source, prefix) {
    const $ = load(md.render(source, {}), null, false)
    $('.header-anchor').remove()
    const toc = [], ids = new Set()
    $('h1').each((_, el) => { throw new Error(`Grammar body must begin at h2 or deeper: ${$(el).text()}`) })
    $('h2,h3').each((i, el) => {
      const title = $(el).text(), id = `${prefix}-${i + 1}`
      if (ids.has(id)) throw new Error(`Duplicate heading ${id}`)
      ids.add(id); $(el).attr('id', id); toc.push({ title, id, sub: el.tagName === 'h3' })
    })
    $('table').wrap('<div class="table-scroll" tabindex="0" role="region" aria-label="语法结构对照表"></div>')
    $('script,iframe,object,embed').each(() => { throw new Error('Unexpected active Markdown content') })
    return { html: $.html(), toc }
  }
  for (const topic of model.grammar) {
    const core = markdown(topic.coreMarkdown, 'core'), toc = [...core.toc]
    const layers = topic.layers.map(layer => {
      const body = markdown(layer.markdown, `layer-${layer.id}`)
      toc.push({ title: layer.title, id: `depth-${layer.id}` }, ...body.toc)
      return `<section class="depth-section" id="depth-${layer.id}"><h2>${e(layer.title)}</h2>${chips(layer.levelIds.map(id => [labelOf(t.grammarLevels, id), `/grammar/level/${id}`]))}<div class="prose">${body.html}</div></section>`
    }).join('')
    const related = model.grammar.filter(other => topic.relatedIds?.includes(other.id))
    const body = `<header class="grammar-heading"><p class="eyebrow">UNDERSTAND THE PATTERN</p><h1 id="grammar-title">${e(topic.title)}</h1><p class="lead">${e(topic.description)}</p>${chips([...grammarLevels(topic).map(id => [labelOf(t.grammarLevels, id), `/grammar/level/${id}`]), ...topic.categoryIds.map(id => [labelOf(t.grammarCategories, id), grammarCategoryUrl(id)])])}</header><div class="grammar-layout"><details class="article-toc" open><summary>这篇文章的内容</summary><nav aria-label="页内目录">${toc.map(item => `<a class="${item.sub ? 'toc-sub' : ''}" href="#${item.id}">${e(item.title)}</a>`).join('')}</nav></details><article class="grammar-article" aria-labelledby="grammar-title"><div class="prose">${core.html}</div>${layers}${related.length ? `<section class="detail-section"><h2>继续建立联系</h2>${related.map(other => grammarRow(other, t, undefined, 3)).join('')}</section>` : ''}</article></div>`
    const categoryPath = ancestry(t.grammarCategories, topic.categoryIds[0])
    const category = categoryPath.at(-1).label === topic.title && categoryPath.length > 1 ? categoryPath.at(-2) : categoryPath.at(-1)
    add(detailUrl('grammar', topic.id), topic.title, topic.description, body, { article: true, section: 'grammar', crumbs: [['语法', '/grammar'], [category.label, grammarCategoryUrl(category.id)], [topic.title]] })
  }
  const scenePath = id => sceneUrl(t.scenes, id)
  const sceneDescription = { parenting: '把英语放进陪伴孩子的每一个小瞬间。', work: '开会、协作与沟通，表达清楚也表达得体。', daily: '从一句问候开始，让日常交流更自然。' }
  const roots = ordered(t.scenes.filter(node => !node.parentId))
  const cards = roots.map((node, i) => `<a class="module-card module-card--${SECTIONS[i].id}" href="${scenePath(node.id)}"><div class="module-card-top"><span class="module-icon">${icon('expression', 28)}</span><span class="module-number">0${i + 1}</span></div><p class="module-en">${e(node.id[0].toUpperCase() + node.id.slice(1))}</p><h2>${e(node.label)}</h2><p>${e(sceneDescription[node.id] || node.label)}</p><span class="module-cta">探索场景 ${icon('arrow', 19)}</span></a>`).join('')
  add('/expressions', '常用表达', '亲子、工作与日常生活中的自然英语表达，中英对照、使用场景和发音。', heading('常用表达', '亲子、工作与日常生活中，自然又实用的英语。', 'EXPRESSIONS') + `<div class="module-grid">${cards}</div>`, { section: 'expression', crumbs: [['常用表达']] })
  for (const scene of t.scenes) listPages({ path: scenePath(scene.id), title: scene.label, description: sceneDescription[scene.id] || `${ancestry(t.scenes, scene.id).map(node => node.label).join(' / ')}：结合具体情境，学习自然实用的英语表达。`, items: inCategory(model.expressions, 'sceneIds', t.scenes, scene.id), row: item => expressionRow(item, t), crumbs: categoryCrumbs(t.scenes, scene.id, scenePath, SECTIONS[2]), prefix: subcategoryLinks(t.scenes, scene.id, scenePath), section: 'expression', eyebrow: 'SAY IT NATURALLY' })
  for (const item of model.expressions) add(detailUrl('expression', item.id), `${item.en} · ${item.zh}`, `${item.en} — ${item.zh}。${item.usage || ''}`, expressionDetail(item, model), { article: true, section: 'expression', crumbs: [['常用表达', '/expressions'], [labelOf(t.scenes, item.sceneIds[0]), scenePath(item.sceneIds[0])], [item.zh]] })
  add('/vocabulary/practice', '随机背词', '选择词表，每次随机抽取 1–500 个单词，先回忆再查看中文释义。', practicePage(model), { section: 'vocabulary', crumbs: [['单词', '/vocabulary'], ['随机背词']] })
  const importReport = JSON.parse(await readFile(resolve(root, 'content/english/vocabulary-report.json'), 'utf8'))
  add('/sources', '词表来源', '英语词表、音标数据及开放许可说明。', sourcesPage(model, importReport, assets), { crumbs: [['词表来源']] })
  add('/search', '搜索', '搜索英语单词、中英文释义、语法文章和生活场景中的常用表达。', searchPage(), { noindex: true, section: 'search', crumbs: [['搜索']] })
  add('/404', '页面未找到', '这个地址没有对应的英语内容，请通过分类或搜索继续探索。', heading('这一页，暂时找不到。', '地址可能已更新，或内容还在整理中。你可以从首页重新出发。', '404 · PAGE NOT FOUND') + `<div class="not-found-search">${chips([['返回首页', '/'], ['浏览单词', '/vocabulary'], ['浏览语法', '/grammar'], ['常用表达', '/expressions']])}${searchPage().match(/<form[\s\S]*?<\/form>/)?.[0] || ''}</div>`, { noindex: true, crumbs: [['页面未找到']] })
  await mkdir(resolve(root, '.cache'), { recursive: true })
  const temp = await mkdtemp(resolve(root, '.cache/english-output-'))
  const output = resolve(root, 'sites/english'), backup = resolve(temp, '../english-previous-' + basenameSafe(temp))
  try {
    for (const [path, page] of routes) {
      const filename = resolve(temp, path === '/' ? 'index.html' : path.slice(1) + '.html')
      await mkdir(dirname(filename), { recursive: true }); await writeFile(filename, page.html)
    }
    for (const [file, bytes] of files) {
      const filename = resolve(temp, assets.slice(1), file)
      await mkdir(dirname(filename), { recursive: true }); await writeFile(filename, bytes)
    }
    for (const [file, data] of dataFiles) {
      const filename = resolve(temp, file)
      await mkdir(dirname(filename), { recursive: true }); await writeFile(filename, data)
    }
    const urls = [...routes].filter(([, page]) => page.index).map(([path]) => `<url><loc>${SITE.origin}${e(path)}</loc></url>`)
    await writeFile(resolve(temp, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
    await writeFile(resolve(temp, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.origin}/sitemap.xml\n`)
    await validateOutput(temp, model, false)
    let moved = false
    try { await rename(output, backup); moved = true } catch (error) { if (error.code !== 'ENOENT') throw error }
    try { await rename(temp, output) } catch (error) { if (moved) await rename(backup, output); throw error }
    if (moved) await rm(backup, { recursive: true, force: true })
    console.log(`English: ${model.vocabulary.length} words, ${model.grammar.length} grammar topics, ${model.expressions.length} expressions; ${routes.size} pages generated and validated.`)
  } finally { await rm(temp, { recursive: true, force: true }) }
  return { routes: routes.size, assets, model }
}
const basenameSafe = path => path.split('/').at(-1)
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await generateEnglish()
