<script setup>
import { ref } from 'vue'
import { decodeBase64, encodeBase64 } from '../base64-tools.js'

const source = ref('')
const result = ref('')
const error = ref('')
const operation = ref('encode')
const copied = ref(false)

function transform(type) {
  operation.value = type
  error.value = ''
  try {
    result.value = type === 'encode' ? encodeBase64(source.value) : decodeBase64(source.value)
  } catch (caughtError) {
    result.value = ''
    error.value = caughtError instanceof Error ? caughtError.message : String(caughtError)
  }
}

function swap() {
  source.value = result.value
  result.value = ''
  error.value = ''
}

async function copyResult() {
  if (!result.value) return
  await navigator.clipboard.writeText(result.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}
</script>

<template>
  <section class="base64-tool" aria-labelledby="base64-title">
    <div class="tool-heading">
      <div><p class="eyebrow">BASE64 CODEC</p><h1 id="base64-title">Base64 <em>codec.</em></h1></div>
      <p>Корректная работа с UTF-8, кириллицей, emoji и URL-safe Base64 — полностью локально.</p>
    </div>

    <div class="codec-card">
      <div class="codec-pane">
        <header><span>Исходные данные</span><small>{{ source.length }} симв.</small></header>
        <textarea v-model="source" aria-label="Исходные данные Base64" spellcheck="false" placeholder="Введите текст или Base64…"></textarea>
      </div>
      <div class="codec-actions">
        <button type="button" :class="{ active: operation === 'encode' }" @click="transform('encode')">Encode <b>→</b></button>
        <button type="button" :class="{ active: operation === 'decode' }" @click="transform('decode')"><b>←</b> Decode</button>
      </div>
      <div class="codec-pane result-pane" :class="{ 'has-error': error }">
        <header><span>Результат</span><button type="button" @click="copyResult">{{ copied ? '✓ Скопировано' : 'Копировать' }}</button></header>
        <textarea :value="result" aria-label="Результат Base64" readonly placeholder="Результат появится здесь"></textarea>
        <p v-if="error">{{ error }}</p>
      </div>
      <footer><button type="button" @click="swap">⇄ Перенести результат во входное поле</button><span>{{ operation === 'encode' ? 'TEXT → BASE64' : 'BASE64 → TEXT' }}</span></footer>
    </div>
  </section>
</template>

<style scoped>
.tool-heading { display: grid; grid-template-columns: 1.4fr .7fr; gap: 64px; align-items: end; margin-bottom: 42px; }
.eyebrow { margin: 0 0 17px; color: #ffb45f; font: 700 11px/1 ui-monospace, monospace; letter-spacing: .19em; }
h1 { margin: 0; color: #f2f5f2; font-size: clamp(42px, 6vw, 68px); font-weight: 590; letter-spacing: -.058em; line-height: .98; }
h1 em { color: #8e9690; font-family: Georgia, serif; font-weight: 400; letter-spacing: -.045em; }
.tool-heading > p { max-width: 330px; margin: 0 0 3px; color: #909792; font-size: 15px; line-height: 1.65; }
.codec-card { display: grid; grid-template-columns: minmax(0,1fr) 112px minmax(0,1fr); border: 1px solid #2a302c; background: #131614; box-shadow: 0 24px 80px rgba(0,0,0,.22); }
.codec-pane { position: relative; min-width: 0; background: #101311; }
.codec-pane:first-child { border-right: 1px solid #292e2b; }
.result-pane { border-left: 1px solid #292e2b; }
.codec-pane header { display: flex; min-height: 54px; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #292e2b; background: #171a18; color: #cfd6d0; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.codec-pane header small { color: #59615b; font: 9px ui-monospace, monospace; }
.codec-pane header button { border: 0; background: transparent; color: #738078; cursor: pointer; font-size: 10px; }
.codec-pane textarea { position: static; width: 100%; height: 340px; resize: vertical; border: 0; outline: 0; padding: 22px; background: #101311; color: #d9e0db; font: 12px/21px ui-monospace, monospace; white-space: pre-wrap; }
.codec-pane p { position: absolute; right: 14px; bottom: 12px; left: 14px; margin: 0; padding: 10px; background: #2a1715; color: #ff9689; font-size: 10px; }
.codec-actions { display: flex; flex-direction: column; gap: 9px; justify-content: center; padding: 12px; background: #151816; }
.codec-actions button { display: grid; min-height: 70px; place-items: center; border: 1px solid #2d342f; background: #1b201c; color: #7c867e; cursor: pointer; font-size: 10px; font-weight: 700; }
.codec-actions button.active { border-color: #586149; color: #e5eae6; }
.codec-actions b { color: #ffb45f; font-size: 18px; font-weight: 400; }
.codec-card > footer { grid-column: 1/-1; display: flex; min-height: 52px; align-items: center; justify-content: space-between; padding: 8px 16px; border-top: 1px solid #292e2b; background: #171a18; }
.codec-card > footer button { border: 0; background: transparent; color: #748078; cursor: pointer; font-size: 10px; }
.codec-card > footer span { color: #555e57; font: 9px ui-monospace, monospace; }
@media(max-width:760px){.tool-heading{grid-template-columns:1fr;gap:20px;margin-bottom:30px}h1{font-size:clamp(38px,12vw,56px)}.codec-card{grid-template-columns:1fr}.codec-pane:first-child,.result-pane{border:0}.codec-actions{flex-direction:row;border-block:1px solid #292e2b}.codec-actions button{min-height:48px;flex:1}.codec-pane textarea{height:260px}}
</style>
