export const ACCENTS = { uk: { lang: 'en-GB', label: '英式' }, us: { lang: 'en-US', label: '美式' } }
const language = value => value.replaceAll('_', '-').toLowerCase()
export function selectVoice(voices, accent) {
  const requested = language((ACCENTS[accent] || ACCENTS.uk).lang)
  const exact = voices.filter(voice => language(voice.lang) === requested)
  return exact.find(voice => voice.localService) || exact[0] || voices.find(voice => /^en(?:-|$)/i.test(language(voice.lang))) || null
}
/** Browser adapters are injected so selection, cancellation and races can be tested without audio hardware. */
export function createSpeechPlayer({ synth, Utterance, onState = () => {}, onMessage = () => {} }) {
  const supported = Boolean(synth && typeof synth.speak === 'function' && typeof synth.cancel === 'function' && typeof Utterance === 'function')
  let generation = 0, current = null, voices = []
  const refreshVoices = () => { try { voices = synth?.getVoices?.() || [] } catch { voices = [] } }
  refreshVoices()
  synth?.addEventListener?.('voiceschanged', refreshVoices)
  function cancel() {
    generation += 1
    current = null
    if (supported) { try { synth.cancel() } catch { /* A browser shutdown must not break navigation. */ } }
    onState(null)
  }
  function speak({ text, accent = 'uk', key = null }) {
    if (!supported || !text?.trim()) return false
    cancel()
    const request = generation
    refreshVoices()
    const preference = ACCENTS[accent] || ACCENTS.uk
    const voice = selectVoice(voices, accent)
    try {
      const utterance = new Utterance(text)
      current = utterance
      utterance.lang = voice?.lang || preference.lang
      if (voice) utterance.voice = voice
      utterance.rate = 0.9
      const finish = () => { if (request === generation) { current = null; onState(null) } }
      utterance.onend = finish
      utterance.onerror = event => {
        if (request !== generation) return
        finish()
        if (!['canceled', 'interrupted'].includes(event.error)) onMessage('暂时无法播放。请确认设备有可用的英语声音，再试一次。')
      }
      onState(key)
      onMessage(voice && language(voice.lang) !== language(preference.lang) ? '当前使用设备可用的英语声音。' : '')
      // Always speak the word or sentence, never its IPA transcription.
      synth.speak(utterance)
      return true
    } catch {
      if (request === generation) { current = null; onState(null); onMessage('暂时无法朗读，请稍后重试。') }
      return false
    }
  }
  return { supported, speak, cancel, dispose() { cancel(); synth?.removeEventListener?.('voiceschanged', refreshVoices) } }
}
