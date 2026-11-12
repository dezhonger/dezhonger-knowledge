import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { validateHistory } from './validate.mjs'
import { renderDetail } from './render.mjs'

const scriptRoot = fileURLToPath(new URL('.', import.meta.url))
const historyRoot = resolve(scriptRoot, '../../sites/history')
const outputRoot = resolve(historyRoot, 'explore')
const templatePath = resolve(scriptRoot, 'templates/explore.html')

async function historyAssetVersion() {
  const hash = createHash('sha256')
  for (const file of [
    'sites/history/assets/atlas.css', 'sites/history/assets/home.css',
    'sites/history/assets/home.js', 'sites/history/assets/explore.css',
    'sites/history/assets/detail.css', 'sites/history/assets/world-land.svg',
    'sites/history/assets/summer-mountains-met.jpg',
    'sites/history/explore/explore.js', 'scripts/history/query.mjs',
  ]) {
    hash.update(file)
    hash.update(await readFile(resolve(scriptRoot, '../..', file)))
  }
  return hash.digest('hex').slice(0, 12)
}

const result = await validateHistory()
if (result.errors.length) {
  console.error(result.errors.join('\n'))
  process.exitCode = 1
} else {
  // Remove only retired history-course outputs, including stale files from an
  // earlier local build. The Atlas root, data, assets and detail pages remain.
  for (const legacyPath of [
    'learning', 'topics', 'learning-base.css', 'learning.js',
    'subject.css', 'subject.js', 'themes.css', 'explore/explore.css',
  ]) await rm(resolve(historyRoot, legacyPath), { recursive: true, force: true })
  await mkdir(outputRoot, { recursive: true })
  const assetVersion = await historyAssetVersion()
  const versioned = html => html.replaceAll('__ASSET_VERSION__', assetVersion)
  const homeHtml = versioned(await readFile(resolve(scriptRoot, 'templates/home.html'), 'utf8'))
  await writeFile(resolve(historyRoot, 'index.html'), homeHtml)
  const html = versioned(await readFile(templatePath, 'utf8'))
  await writeFile(resolve(outputRoot, 'index.html'), html)
  await copyFile(resolve(scriptRoot, 'query.mjs'), resolve(outputRoot, 'query.js'))
  const publicRecords = Object.fromEntries(['Region', 'PoliticalEntity', 'Person', 'RulerTerm', 'Event', 'Source', 'Assertion', 'Evidence'].map(type => [type, result.records[type]]))
  await mkdir(resolve(outputRoot, 'data'), { recursive: true })
  await writeFile(resolve(outputRoot, 'data/atlas.json'), JSON.stringify({ schemaVersion: 1, records: publicRecords }))
  const detailTemplate = versioned(await readFile(resolve(scriptRoot, 'templates/detail.html'), 'utf8'))
  for (const [type, directory] of [['PoliticalEntity', 'political-entities'], ['Person', 'people'], ['Event', 'events']]) {
    for (const entity of result.records[type]) {
      const article = result.articles.get(entity.articleId)
      const pageDirectory = resolve(outputRoot, directory, entity.id)
      await mkdir(pageDirectory, { recursive: true })
      await writeFile(resolve(pageDirectory, 'index.html'), renderDetail(detailTemplate, type, entity, result.records, article))
    }
  }
  console.log('History root home, exploration index, data and 11 detail pages generated.')
}
