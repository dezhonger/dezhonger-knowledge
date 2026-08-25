<script setup lang="ts">
import { computed, ref } from 'vue'
import { encryptedProjectEulerAnswers } from '../data/protected-project-euler-answers'
import { usePuzzleLocale } from '../i18n'

const props = defineProps<{ problem: string }>()
const { locale } = usePuzzleLocale()
const password = ref('')
const unlockedHtml = ref('')
const error = ref('')
const busy = ref(false)

const words = computed(() =>
  locale.value === 'zh'
    ? {
        eyebrow: '代码与最终结果',
        title: '密码保护内容',
        description: '输入访问密码后，内容只会在当前浏览器中解密。',
        placeholder: '访问密码',
        unlock: '解锁',
        unlocking: '正在解锁…',
        invalid: '密码错误，请重试。',
        lock: '重新锁定',
        unavailable: '这道题暂时没有可解锁的内容。',
      }
    : {
        eyebrow: 'Code & final result',
        title: 'Password-protected content',
        description: 'Enter the access password. Decryption happens only in this browser.',
        placeholder: 'Access password',
        unlock: 'Unlock',
        unlocking: 'Unlocking…',
        invalid: 'Incorrect password. Please try again.',
        lock: 'Lock again',
        unavailable: 'There is no protected content for this problem yet.',
      },
)

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function unlock() {
  const payload = encryptedProjectEulerAnswers[props.problem]?.[locale.value]
  if (!payload || !password.value || busy.value) return

  busy.value = true
  error.value = ''

  try {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password.value), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(payload.salt), iterations: payload.iterations },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    )
    const additionalData = encoder.encode(`project-euler:${props.problem}:${locale.value}`)
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(payload.iv), additionalData },
      key,
      fromBase64(payload.ciphertext),
    )
    unlockedHtml.value = new TextDecoder().decode(plaintext)
    password.value = ''
  } catch {
    password.value = ''
    error.value = words.value.invalid
  } finally {
    busy.value = false
  }
}

function lock() {
  unlockedHtml.value = ''
  error.value = ''
  password.value = ''
}
</script>

<template>
  <section class="protected-answer" :class="{ unlocked: unlockedHtml }">
    <p class="protected-answer__eyebrow">{{ words.eyebrow }}</p>
    <div v-if="unlockedHtml" class="protected-answer__content">
      <div v-html="unlockedHtml"></div>
      <button type="button" @click="lock">{{ words.lock }}</button>
    </div>
    <form v-else-if="encryptedProjectEulerAnswers[problem]?.[locale]" @submit.prevent="unlock">
      <div>
        <strong>{{ words.title }}</strong>
        <p>{{ words.description }}</p>
      </div>
      <div class="protected-answer__controls">
        <label>
          <span class="visually-hidden">{{ words.placeholder }}</span>
          <input v-model="password" type="password" :placeholder="words.placeholder" autocomplete="current-password" :aria-invalid="Boolean(error)" />
        </label>
        <button type="submit" :disabled="busy || !password">{{ busy ? words.unlocking : words.unlock }}</button>
      </div>
      <p v-if="error" class="protected-answer__error" role="alert">{{ error }}</p>
    </form>
    <p v-else>{{ words.unavailable }}</p>
  </section>
</template>
