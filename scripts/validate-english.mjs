import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { load } from 'cheerio'
import { DATA_FILES } from './english/assets/content-data.js'
import { root, SITE, loadContent, detailUrl } from './english/model.mjs'

async function filesUnder(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesUnder(path))
    else files.push(path)
  }
  return files
}
export async function validateOutput(directory = resolve(root, 'sites/english'), model = null, verbose = true) {
  model ||= await loadContent()
  const files = await filesUnder(directory)
  const all = new Set(files.map(file => relative(directory, file)))
  const pages = new Map(), links = new Map(), sitemapRoutes = new Set()
  let linkCount = 0
  const sitemap = load(await readFile(resolve(directory, 'sitemap.xml'), 'utf8'), { xmlMode: true })
  sitemap('loc').each((_, el) => {
    const value = sitemap(el).text()
    assert.ok(value.startsWith(SITE.origin + '/'), `Wrong sitemap origin: ${value}`)
    assert.ok(!sitemapRoutes.has(value), `Duplicate sitemap URL: ${value}`)
    sitemapRoutes.add(value)
  })
  for (const file of files.filter(file => file.endsWith('.html'))) {
    const local = relative(directory, file), path = local === 'index.html' ? '/' : '/' + local.slice(0, -5)
    const $ = load(await readFile(file, 'utf8'))
    assert.equal($('h1').length, 1, `${local}: expected one h1`)
    assert.ok($('title').text().trim(), `${local}: title missing`)
    assert.ok($('meta[name="description"]').attr('content'), `${local}: description missing`)
    assert.equal($('link[rel="canonical"]').attr('href'), SITE.origin + path, `${local}: canonical mismatch`)
    for (const key of ['title', 'description', 'url', 'site_name', 'type', 'locale']) assert.ok($(`meta[property="og:${key}"]`).attr('content'), `${local}: missing og:${key}`)
    assert.equal($('html').attr('lang'), 'zh-CN')
    assert.equal($('main').length, 1)
    assert.equal($('.breadcrumb').length, path === '/' ? 0 : 1, `${local}: breadcrumb`)
    const ids = new Set()
    $('[id]').each((_, el) => {
      const id = $(el).attr('id')
      assert.ok(!ids.has(id), `${local}: duplicate id ${id}`); ids.add(id)
    })
    $('[data-speak]').each((_, el) => {
      assert.ok($(el).attr('aria-label'), `${local}: speech needs a name`)
      assert.ok(!$(el).attr('data-speak').startsWith('/'), `${local}: speech must not read IPA`)
    })
    assert.ok(!/dezhonger/i.test($('body').text()), `${local}: unwanted site branding`)
    const noindex = $('meta[name="robots"]').attr('content')?.includes('noindex')
    assert.equal(sitemapRoutes.has(SITE.origin + path), !noindex, `${local}: sitemap/noindex mismatch`)
    $('a[href],link[href],script[src]').each((_, el) => {
      const value = $(el).attr('href') || $(el).attr('src')
      if (/^(https?:)?\/\//.test(value)) {
        const external = new URL(value, SITE.origin)
        assert.ok(!/(^|\.)dezhonger\.com$/.test(external.hostname) || external.origin === SITE.origin, `${local}: forbidden cross-site link`)
        return
      }
      if (/^(mailto|tel):/.test(value)) return
      const url = new URL(value, SITE.origin + path)
      linkCount += 1
      const key = url.pathname + url.hash
      if (!links.has(key)) links.set(key, { from: local, url })
    })
    $('h2,h3').each((_, el) => assert.ok($(el).text().trim(), `${local}: empty section heading`))
    pages.set(path, ids)
  }
  for (const { from, url } of links.values()) {
    if (url.origin !== SITE.origin) continue
    const path = decodeURIComponent(url.pathname)
    if (pages.has(path)) {
      if (url.hash) assert.ok(pages.get(path).has(decodeURIComponent(url.hash.slice(1))), `${from}: missing heading ${url.pathname}${url.hash}`)
    } else assert.ok(all.has(path.slice(1)), `${from}: broken local link ${url.pathname}`)
  }
  for (const url of sitemapRoutes) assert.ok(pages.has(new URL(url).pathname), `Sitemap points to missing page: ${url}`)
  for (const [type, items] of [['vocabulary', model.vocabulary], ['grammar', model.grammar], ['expression', model.expressions]]) {
    items.forEach(item => assert.ok(pages.has(detailUrl(type, item.id)), `${type}/${item.id}: detail missing`))
  }
  const docs = JSON.parse(await readFile(resolve(directory, DATA_FILES.search), 'utf8'))
  assert.equal(docs.length, model.vocabulary.length + model.grammar.length + model.expressions.length)
  assert.equal(new Set(docs.map(doc => doc.id)).size, docs.length, 'Search entities duplicated')
  docs.forEach(doc => assert.ok(pages.has(doc.url), `Search target missing: ${doc.url}`))
  const robots = await readFile(resolve(directory, 'robots.txt'), 'utf8')
  assert.ok(robots.includes(`Sitemap: ${SITE.origin}/sitemap.xml`))
  assert.ok(!robots.includes('<html'))
  const legacy = JSON.parse(await readFile(resolve(directory, 'vocabulary.json'), 'utf8'))
  const practice = JSON.parse(await readFile(resolve(directory, DATA_FILES.practice), 'utf8'))
  assert.equal(legacy.words.length, model.vocabulary.length)
  assert.equal(practice.words.length, model.vocabulary.length)
  for (const ids of Object.values(legacy.lists)) assert.ok(ids.every(id => legacy.words[id]?.length === 5), 'Broken legacy vocabulary reference')
  if (verbose) console.log(`English validation: ${pages.size} HTML pages, ${linkCount} internal references, ${docs.length} search entities, ${sitemapRoutes.size} sitemap URLs passed.`)
  return { pages: pages.size, links: linkCount, search: docs.length, sitemap: sitemapRoutes.size }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await validateOutput()
