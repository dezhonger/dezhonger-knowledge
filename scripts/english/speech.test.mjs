import test from 'node:test'
import assert from 'node:assert/strict'
import { createSpeechPlayer, selectVoice } from './assets/speech.js'

function device(voices) {
  const spoken = [], events = new Map()
  const synth = { getVoices: () => voices, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name), cancel() { spoken.at(-1)?.onerror?.({ error: 'interrupted' }) }, speak(item) { spoken.push(item) } }
  class Utterance { constructor(text) { this.text = text } }
  return { synth, Utterance, spoken, events }
}
test('prefers requested accent and falls back to another English voice, never a Chinese voice', () => {
  const voices = [{ lang: 'zh-CN' }, { lang: 'en-US' }, { lang: 'en-GB' }, { lang: 'en_GB', localService: true }]
  assert.equal(selectVoice(voices, 'uk'), voices[3])
  assert.equal(selectVoice(voices, 'us'), voices[1])
  assert.equal(selectVoice(voices.slice(0, 2), 'uk'), voices[1])
  assert.equal(selectVoice(voices.slice(0, 1), 'us'), null)
})
test('says the word, cancels previous requests and ignores stale callbacks', () => {
  const dev = device([{ lang: 'en-GB' }, { lang: 'en-US' }]), states = [], messages = []
  const player = createSpeechPlayer({ ...dev, onState: state => states.push(state), onMessage: message => messages.push(message) })
  assert.ok(player.speak({ text: 'apple', accent: 'uk', key: 'first' }))
  const first = dev.spoken[0]
  player.speak({ text: 'banana', accent: 'us', key: 'second' })
  first.onend(); first.onerror({ error: 'network' })
  assert.equal(states.at(-1), 'second')
  assert.equal(first.text, 'apple')
  assert.equal(dev.spoken[1].lang, 'en-US')
  assert.ok(messages.every(message => !message.includes('无法')))
  dev.spoken[1].onend(); assert.equal(states.at(-1), null)
  player.dispose(); assert.equal(dev.events.size, 0)
})
test('handles late voices, missing voices, unsupported APIs and synchronous speech failures', () => {
  const voices = [], dev = device(voices), messages = []
  const player = createSpeechPlayer({ ...dev, onMessage: message => messages.push(message) })
  player.speak({ text: 'hello', accent: 'us' }); assert.equal(dev.spoken[0].lang, 'en-US')
  voices.push({ lang: 'en-AU' }); dev.events.get('voiceschanged')()
  player.speak({ text: 'hello', accent: 'us' }); assert.ok(messages.at(-1).includes('可用'))
  dev.synth.speak = () => { throw new Error('unavailable') }
  assert.equal(player.speak({ text: 'hello' }), false)
  assert.ok(messages.at(-1).includes('无法'))
  const unsupported = createSpeechPlayer({})
  assert.equal(unsupported.supported, false); assert.equal(unsupported.speak({ text: 'apple' }), false)
  assert.doesNotThrow(() => unsupported.dispose())
})
