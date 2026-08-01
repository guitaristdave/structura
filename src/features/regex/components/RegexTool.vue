<script setup>
import { computed, ref } from 'vue'
import { testRegex } from '../regex-tools.js'

const pattern = ref('(?:https?:\\/\\/)?([\\w.-]+)')
const flags = ref('gi')
const testText = ref('Документация: https://example.com/docs\nЗеркало: www.example.org')
const result = ref(null)

const matchCount = computed(() => result.value?.valid ? result.value.matches.length : 0)

function runTest() {
  result.value = testRegex(pattern.value, flags.value, testText.value)
}

function toggleFlag(flag) {
  flags.value = flags.value.includes(flag)
    ? flags.value.replace(flag, '')
    : `${flags.value}${flag}`
}

runTest()
</script>

<template>
  <section class="regex-tool" aria-labelledby="regex-title">
    <div class="tool-heading">
      <div><p class="eyebrow">REGEX TESTER</p><h1 id="regex-title">Проверяйте паттерны.<br><em>Видите совпадения.</em></h1></div>
      <p>Тестируйте JavaScript-регулярные выражения и сразу находите все совпадения в тексте.</p>
    </div>

    <div class="regex-card">
      <div class="pattern-row">
        <label><span>Регулярное выражение</span><div class="pattern-input"><b>/</b><input v-model="pattern" type="text" spellcheck="false" @keydown.enter="runTest"><b>/</b><input v-model="flags" class="flags-input" aria-label="Флаги регулярного выражения" maxlength="7" @keydown.enter="runTest"></div></label>
        <div class="flag-switches" aria-label="Популярные флаги">
          <button v-for="flag in ['g','i','m','s','u']" :key="flag" type="button" :class="{ active: flags.includes(flag) }" @click="toggleFlag(flag)">{{ flag }}</button>
        </div>
        <button type="button" class="test-button" @click="runTest">Проверить</button>
      </div>

      <div class="regex-columns">
        <div class="regex-pane">
          <header><span>Тестовый текст</span><small>{{ testText.length }} симв.</small></header>
          <textarea v-model="testText" spellcheck="false" aria-label="Текст для проверки регулярного выражения" @input="result = null"></textarea>
        </div>
        <div class="regex-pane result-pane">
          <header><span>Результат</span><small v-if="result?.valid">{{ matchCount }} совпадений</small></header>
          <div v-if="result?.valid" class="highlighted-text">
            <span v-for="(part,index) in result.segments" :key="index" :class="part.type">{{ part.text }}</span>
            <p v-if="!matchCount">Совпадений не найдено</p>
          </div>
          <div v-else-if="result" class="regex-error"><strong>Ошибка выражения</strong><span>{{ result.error }}</span></div>
          <div v-else class="empty-result">Нажмите «Проверить», чтобы увидеть совпадения</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tool-heading{display:grid;grid-template-columns:1.4fr .7fr;gap:64px;align-items:end;margin-bottom:42px}.eyebrow{margin:0 0 17px;color:#77d5c1;font:700 11px/1 ui-monospace,monospace;letter-spacing:.19em}h1{margin:0;color:#f2f5f2;font-size:clamp(42px,6vw,68px);font-weight:590;letter-spacing:-.058em;line-height:.98}h1 em{color:#8e9690;font-family:Georgia,serif;font-weight:400;letter-spacing:-.045em}.tool-heading>p{max-width:330px;margin:0 0 3px;color:#909792;font-size:15px;line-height:1.65}.regex-card{border:1px solid #2a302c;background:#131614;box-shadow:0 24px 80px rgba(0,0,0,.22)}.pattern-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:16px;align-items:end;padding:16px 18px;border-bottom:1px solid #292e2b;background:#171a18}.pattern-row label>span{display:block;margin-bottom:8px;color:#69726b;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.pattern-input{display:grid;grid-template-columns:auto minmax(0,1fr) auto 54px;align-items:center;border:1px solid #303631;background:#101311}.pattern-input b{padding:0 10px;color:#77d5c1;font:16px ui-monospace,monospace}.pattern-input input{min-width:0;height:40px;border:0;outline:0;background:transparent;color:#dbe2dc;font:12px ui-monospace,monospace}.pattern-input .flags-input{color:#a8e779}.flag-switches{display:flex;gap:3px}.flag-switches button{width:34px;height:40px;border:1px solid #303631;background:#1d211e;color:#687169;cursor:pointer;font:11px ui-monospace,monospace}.flag-switches button.active{border-color:#4f675d;background:#202b27;color:#77d5c1}.test-button{min-height:42px;border:0;padding:0 20px;background:#b9f489;color:#15200f;cursor:pointer;font-size:11px;font-weight:750}.regex-columns{display:grid;grid-template-columns:1fr 1fr}.regex-pane+ .regex-pane{border-left:1px solid #292e2b}.regex-pane header{display:flex;min-height:48px;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #292e2b;background:#151816;color:#bdc5bf;font-size:10px;font-weight:700;text-transform:uppercase}.regex-pane header small{color:#637067;font:9px ui-monospace,monospace}.regex-pane textarea{position:static;width:100%;height:330px;resize:vertical;border:0;outline:0;padding:22px;background:#101311;color:#d9e0db;font:12px/22px ui-monospace,monospace;white-space:pre-wrap}.highlighted-text,.empty-result{min-height:330px;overflow-wrap:anywhere;padding:22px;background:#101311;color:#cbd2cc;font:12px/22px ui-monospace,monospace;white-space:pre-wrap}.highlighted-text .match{border-bottom:1px solid #77d5c1;background:rgba(75,190,166,.22);color:#b8f3e7}.highlighted-text p,.empty-result{color:#59625b}.highlighted-text p{margin:0}.regex-error{display:grid;min-height:330px;align-content:center;gap:8px;padding:24px;background:#171312;text-align:center}.regex-error strong{color:#ff9183;font-size:12px}.regex-error span{color:#916a65;font-size:11px}.empty-result{display:grid;place-items:center;text-align:center}
@media(max-width:800px){.tool-heading{grid-template-columns:1fr;gap:20px;margin-bottom:30px}h1{font-size:clamp(38px,12vw,56px)}.pattern-row{grid-template-columns:1fr}.flag-switches{overflow-x:auto}.test-button{min-height:44px}.regex-columns{grid-template-columns:1fr}.regex-pane+ .regex-pane{border-top:1px solid #292e2b;border-left:0}.regex-pane textarea,.highlighted-text,.empty-result,.regex-error{height:250px;min-height:250px}}
</style>
