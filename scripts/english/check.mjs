import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { root, loadContent } from './model.mjs'
import postcss from 'postcss'

const files = ['scripts/generate-english.mjs', 'scripts/validate-english.mjs', 'scripts/import-english-vocabulary.mjs']
for (const directory of ['scripts/english', 'scripts/english/assets']) {
  for (const file of await readdir(resolve(root, directory))) if (/\.(mjs|js)$/.test(file)) files.push(`${directory}/${file}`)
}
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' })
  if (result.status) throw new Error(`${file}: ${result.stderr}`)
}
postcss.parse(await readFile(resolve(root, 'scripts/english/assets/english.css'), 'utf8'))
await loadContent()
console.log(`English source check: ${files.length} JavaScript files, CSS syntax and content schema passed.`)
