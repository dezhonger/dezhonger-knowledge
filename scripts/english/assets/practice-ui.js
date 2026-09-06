import { PRACTICE, parseCount, drawWords, practicePageSlice } from './practice.js'
import { refreshSpeechButtons, stopSpeech } from './ui.js'
const form = document.querySelector('#practice-form')
const level = document.querySelector('#practice-level')
const count = document.querySelector('#practice-count')
const startButton = document.querySelector('#practice-start')
const output = document.querySelector('#practice-results')
const status = document.querySelector('#practice-status')
const error = document.querySelector('#practice-error')
const empty = document.querySelector('#practice-empty')
const pagination = document.querySelector('#practice-pagination')
const presets = [...document.querySelectorAll('[data-practice-count]')]
let dataPromise, session = [], revealed = new Set(), page = 1, sequence = 0, sessionLevel = '', requested = 0, poolSize = 0
const make = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}
async function loadData() {
  if (!dataPromise) dataPromise = fetch(new URL('./practice-data.json', import.meta.url)).then(async response => {
    if (!response.ok) throw new Error('load')
    const data = await response.json()
    if (data.version !== 1 || !Array.isArray(data.words) || !data.levels) throw new Error('shape')
    return data
  }).catch(error => { dataPromise = null; throw error })
  return dataPromise
}
function speak(word, accent) {
  const button = make('button', 'speak-button', accent === 'uk' ? '英' : '美')
  button.type = 'button'; button.hidden = true
  button.dataset.speak = word.word; button.dataset.accent = accent
  button.setAttribute('aria-label', `${accent === 'uk' ? '英式' : '美式'}朗读：${word.word}`)
  return button
}
function render() {
  stopSpeech()
  output.replaceChildren(); pagination.replaceChildren()
  const slice = practicePageSlice(session, page); page = slice.page
  empty.hidden = session.length > 0
  const shortfall = requested > poolSize ? `（词表共 ${poolSize} 个，已全部抽取）` : ''
  status.textContent = `${sessionLevel} · 已随机抽取 ${session.length} 个词${shortfall} · 当前 ${slice.start + 1}–${slice.start + slice.items.length}`
  for (const [i, word] of slice.items.entries()) {
    const card = make('article', 'practice-card')
    const top = make('div', 'practice-card-top')
    top.append(make('span', 'practice-number', String(slice.start + i + 1).padStart(2, '0')))
    const audio = make('div', 'practice-audio'); audio.append(speak(word, 'uk'), speak(word, 'us')); top.append(audio)
    const heading = make('h3', '', word.word); heading.lang = 'en'
    const ipa = make('p', 'ipa', word.uk || word.us || word.reference); ipa.lang = 'en'
    const meaning = make('div', 'practice-meaning'); meaning.id = `meaning-${word.id}`; meaning.hidden = !revealed.has(word.id)
    for (const sense of word.meanings) {
      const line = make('p'); line.append(make('span', 'part-of-speech', sense.pos), document.createTextNode(sense.zh)); meaning.append(line)
    }
    const reveal = make('button', 'reveal-button', meaning.hidden ? '显示中文释义' : '隐藏中文释义')
    reveal.type = 'button'; reveal.setAttribute('aria-expanded', String(!meaning.hidden)); reveal.setAttribute('aria-controls', meaning.id)
    reveal.addEventListener('click', () => {
      meaning.hidden = !meaning.hidden
      if (meaning.hidden) revealed.delete(word.id); else revealed.add(word.id)
      reveal.textContent = meaning.hidden ? '显示中文释义' : '隐藏中文释义'
      reveal.setAttribute('aria-expanded', String(!meaning.hidden))
    })
    const detail = make('a', 'practice-detail', '查看完整词条 →'); detail.href = '/vocabulary/' + word.id
    card.append(top, heading, ipa, reveal, meaning, detail); output.append(card)
  }
  refreshSpeechButtons(output)
  pagination.hidden = slice.totalPages <= 1
  if (!pagination.hidden) {
    for (const [label, next] of [['上一页', page - 1], ['下一页', page + 1]]) {
      const button = make('button', '', label); button.type = 'button'; button.disabled = next < 1 || next > slice.totalPages
      button.addEventListener('click', () => { page = next; render(); document.querySelector('.practice-results-heading').scrollIntoView({ block: 'start' }) })
      pagination.append(button)
    }
    pagination.append(make('small', '', `第 ${page} / ${slice.totalPages} 页 · 本组共 ${session.length} 个单词`))
  }
}
function updatePresets() { presets.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.practiceCount) === Number(count.value)))) }
function resetSession() {
  sequence += 1; stopSpeech(); session = []; revealed = new Set(); page = 1
  output.replaceChildren(); empty.hidden = false; pagination.hidden = true; error.hidden = true
  startButton.disabled = false; startButton.textContent = '开始抽词'
  output.removeAttribute('aria-busy'); status.textContent = '词表已切换。点击“开始抽词”，生成一组新单词。'
}
if (form) {
  const params = new URLSearchParams(location.search)
  if ([...level.options].some(option => option.value === params.get('level'))) level.value = params.get('level')
  else level.value = PRACTICE.defaultLevel
  if (params.has('count')) { try { count.value = String(parseCount(params.get('count'))) } catch { count.value = String(PRACTICE.defaultCount) } }
  updatePresets()
  level.addEventListener('change', resetSession)
  count.addEventListener('input', () => { error.hidden = true; count.removeAttribute('aria-invalid'); updatePresets() })
  presets.forEach(button => button.addEventListener('click', () => { count.value = button.dataset.practiceCount; count.removeAttribute('aria-invalid'); error.hidden = true; updatePresets() }))
  form.addEventListener('submit', async event => {
    event.preventDefault()
    let amount
    try { amount = parseCount(count.value) } catch (issue) { error.textContent = issue.message; error.hidden = false; count.setAttribute('aria-invalid', 'true'); count.focus(); return }
    count.removeAttribute('aria-invalid'); error.hidden = true
    const request = ++sequence, selectedLevel = level.value
    startButton.disabled = true; startButton.textContent = '正在抽词…'; status.textContent = '正在准备词表…'; output.setAttribute('aria-busy', 'true')
    try {
      const data = await loadData()
      if (request !== sequence) return
      const pool = data.levels[selectedLevel]
      if (!Array.isArray(pool) || !pool.length) throw new Error('pool')
      const selected = drawWords(pool, amount)
      session = selected.map(index => data.words[index])
      if (session.some(word => !word)) throw new Error('entry')
      sessionLevel = level.selectedOptions[0].textContent.split(' · ')[0]
      poolSize = pool.length; requested = amount; revealed = new Set(); page = 1
      history.replaceState({}, '', `/vocabulary/practice?level=${encodeURIComponent(selectedLevel)}&count=${amount}`)
      render()
    } catch {
      if (request === sequence) { error.textContent = '词表暂时加载失败，请点击“重新抽词”重试。'; error.hidden = false; status.textContent = '没有生成新的练习，当前内容保持不变。' }
    } finally {
      if (request === sequence) { startButton.disabled = false; startButton.textContent = '重新抽词'; output.removeAttribute('aria-busy') }
    }
  })
}
