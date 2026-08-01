<script setup>
import { computed, ref } from 'vue'
import { removeBackslashes } from '../url-cleaner.js'

const source = ref('')
const result = computed(() => removeBackslashes(source.value))
const removedCount = computed(() => (source.value.match(/\\/g) ?? []).length)
const copied = ref(false)

async function copyResult() {
  if (!result.value) return
  await navigator.clipboard.writeText(result.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}
</script>

<template>
  <section class="url-tool" aria-labelledby="url-title">
    <div class="tool-heading">
      <div><p class="eyebrow">URL CLEANER</p><h1 id="url-title">Очистка <em>ссылок.</em></h1></div>
      <p>Удаляет обратные слеши <code>\</code> из ссылок, скопированных из JSON, логов или исходного кода.</p>
    </div>

    <div class="cleaner-card">
      <div class="cleaner-pane">
        <header><span>Экранированная ссылка</span><button type="button" @click="source = ''">Очистить</button></header>
        <textarea v-model="source" aria-label="Экранированная ссылка" spellcheck="false" placeholder="https:\/\/example.com\/path"></textarea>
      </div>
      <div class="cleaner-arrow" aria-hidden="true"><span>REMOVE \</span><b>↓</b></div>
      <div class="result-box">
        <div><span>Чистая ссылка</span><small>Удалено символов: {{ removedCount }}</small></div>
        <code>{{ result || 'Результат появится здесь' }}</code>
        <button type="button" :disabled="!result" @click="copyResult">{{ copied ? '✓ Скопировано' : 'Копировать ссылку' }}</button>
      </div>
      <footer><span>Пример</span><code>https:/\/\www.example.com/\something</code><b>→</b><code>https://www.example.com/something</code></footer>
    </div>
  </section>
</template>

<style scoped>
.tool-heading{display:grid;grid-template-columns:1.4fr .7fr;gap:64px;align-items:end;margin-bottom:42px}.eyebrow{margin:0 0 17px;color:#ff8f9f;font:700 11px/1 ui-monospace,monospace;letter-spacing:.19em}h1{margin:0;color:#f2f5f2;font-size:clamp(42px,6vw,68px);font-weight:590;letter-spacing:-.058em;line-height:.98}h1 em{color:#8e9690;font-family:Georgia,serif;font-weight:400;letter-spacing:-.045em}.tool-heading>p{max-width:330px;margin:0 0 3px;color:#909792;font-size:15px;line-height:1.65}.tool-heading code{color:#bdc5bf}.cleaner-card{border:1px solid #2a302c;background:#131614;box-shadow:0 24px 80px rgba(0,0,0,.22)}.cleaner-pane header{display:flex;min-height:54px;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #292e2b;background:#171a18;color:#cbd2cc;font-size:10px;font-weight:700;text-transform:uppercase}.cleaner-pane header button{border:0;background:transparent;color:#6e776f;cursor:pointer;font-size:10px}.cleaner-pane textarea{position:static;width:100%;height:170px;resize:vertical;border:0;outline:0;padding:26px;background:#101311;color:#dbe2dc;font:14px/24px ui-monospace,monospace;white-space:pre-wrap}.cleaner-arrow{display:flex;min-height:48px;align-items:center;justify-content:center;gap:12px;border-block:1px solid #292e2b;background:#151816;color:#5d665f}.cleaner-arrow span{font:9px ui-monospace,monospace;letter-spacing:.08em}.cleaner-arrow b{color:#ff8f9f;font-size:18px;font-weight:400}.result-box{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:22px;background:#111412}.result-box>div{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between}.result-box span{color:#858f87;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.result-box small{color:#606961;font:9px ui-monospace,monospace}.result-box code{overflow-wrap:anywhere;color:#b9f489;font:14px/1.6 ui-monospace,monospace}.result-box button{min-height:40px;border:0;padding:0 16px;background:#b9f489;color:#15200f;cursor:pointer;font-size:10px;font-weight:750}.result-box button:disabled{background:#272c28;color:#606862;cursor:not-allowed}.cleaner-card>footer{display:flex;gap:12px;align-items:center;overflow-x:auto;min-height:58px;padding:10px 16px;border-top:1px solid #292e2b;background:#171a18;white-space:nowrap}.cleaner-card>footer span{color:#606961;font-size:9px;text-transform:uppercase}.cleaner-card>footer code{color:#858f87;font:10px ui-monospace,monospace}.cleaner-card>footer b{color:#ff8f9f;font-weight:400}
@media(max-width:760px){.tool-heading{grid-template-columns:1fr;gap:20px;margin-bottom:30px}h1{font-size:clamp(38px,12vw,56px)}.cleaner-pane textarea{height:200px}.result-box{grid-template-columns:1fr}.result-box button{justify-self:start}.cleaner-card>footer{display:none}}
</style>
