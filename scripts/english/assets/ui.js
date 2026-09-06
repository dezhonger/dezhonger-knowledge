import { createSpeechPlayer } from './speech.js'

const toggle = document.querySelector('.menu-toggle')
const menu = document.querySelector('#mobile-nav')
if (toggle && menu) {
  toggle.hidden = false
  const close = () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', '展开导航') }
  toggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden
    toggle.setAttribute('aria-expanded', String(!menu.hidden))
    toggle.setAttribute('aria-label', menu.hidden ? '展开导航' : '收起导航')
  })
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { close(); toggle.focus() } })
  document.addEventListener('click', event => { if (!menu.hidden && !event.target.closest('.site-header')) close() })
  window.matchMedia('(min-width: 721px)').addEventListener('change', event => { if (event.matches) close() })
}
const toc = document.querySelector('.article-toc')
if (toc) {
  const query = window.matchMedia('(max-width: 720px)')
  const update = () => { toc.open = !query.matches }
  update()
  query.addEventListener('change', update)
  toc.addEventListener('click', event => { if (query.matches && event.target.closest('a')) toc.open = false })
}
let messageTimer
const status = document.querySelector('#speech-status')
const player = createSpeechPlayer({
  synth: window.speechSynthesis,
  Utterance: window.SpeechSynthesisUtterance,
  onState(button) {
    document.querySelectorAll('[data-playing]').forEach(item => { delete item.dataset.playing; item.removeAttribute('aria-busy') })
    if (button) { button.dataset.playing = ''; button.setAttribute('aria-busy', 'true') }
  },
  onMessage(message) {
    clearTimeout(messageTimer)
    if (status) { status.textContent = message; messageTimer = setTimeout(() => { status.textContent = '' }, 6500) }
  },
})
export function refreshSpeechButtons(container = document) {
  container.querySelectorAll('[data-speak]').forEach(button => { button.hidden = !player.supported })
}
export function stopSpeech() { player.cancel() }
refreshSpeechButtons()
document.querySelectorAll('.speech-unavailable').forEach(note => { note.hidden = player.supported })
document.addEventListener('click', event => {
  const button = event.target.closest('[data-speak]')
  if (!button) return
  // data-audio is reserved for a future local audio adapter; first edition uses device speech.
  player.speak({ text: button.dataset.speak, accent: button.dataset.accent, key: button })
})
window.addEventListener('pagehide', () => player.cancel())
