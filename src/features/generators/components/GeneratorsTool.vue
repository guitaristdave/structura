<script setup>
import { computed, onUnmounted, ref } from 'vue'
import {
  dateTimeToTimestamp,
  generatePassword,
  generateToken,
  generateUuidV4,
  getTimestamps,
  timestampToDateTime,
} from '../generators.js'

const uuid = ref(generateUuidV4())
const token = ref(generateToken())
const passwordLength = ref(20)
const password = ref(generatePassword(passwordLength.value))
const timestamps = ref(getTimestamps())
const copied = ref('')
const timestampInput = ref('')
const dateTimeInput = ref('')
let copiedTimer

const timestampResult = computed(() => {
  try {
    return { valid: true, ...timestampToDateTime(timestampInput.value) }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) }
  }
})

const dateTimeResult = computed(() => {
  try {
    return { valid: true, ...dateTimeToTimestamp(dateTimeInput.value) }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) }
  }
})

const clockTimer = window.setInterval(() => {
  timestamps.value = getTimestamps()
}, 1000)

onUnmounted(() => {
  window.clearInterval(clockTimer)
  window.clearTimeout(copiedTimer)
})

async function copy(value, label) {
  await navigator.clipboard.writeText(String(value))
  copied.value = label
  window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copied.value = ''
  }, 1800)
}

function refreshPassword() {
  password.value = generatePassword(passwordLength.value)
}
</script>

<template>
  <section class="generators-tool" aria-labelledby="generators-title">
    <div class="tool-heading">
      <div>
        <p class="eyebrow">QUICK GENERATORS</p>
        <h1 id="generators-title">Генераторы <em>значений.</em></h1>
      </div>
      <p>UUID, временные метки и безопасные случайные значения генерируются локально в вашем браузере.</p>
    </div>

    <div class="generator-grid">
      <article class="generator-card accent-green">
        <header><span>01</span><strong>UUID v4</strong><small>RANDOM UUID</small></header>
        <code>{{ uuid }}</code>
        <footer>
          <button type="button" @click="uuid = generateUuidV4()">↻ Новый</button>
          <button type="button" @click="copy(uuid, 'UUID')">{{ copied === 'UUID' ? '✓ Скопировано' : 'Копировать' }}</button>
        </footer>
      </article>

      <article class="generator-card accent-blue">
        <header><span>02</span><strong>Текущий timestamp</strong><small>LIVE · 1 SEC</small></header>
        <div class="timestamp-list">
          <button type="button" @click="copy(timestamps.seconds, 'Секунды')">
            <span>SECONDS</span><code>{{ timestamps.seconds }}</code>
          </button>
          <button type="button" @click="copy(timestamps.milliseconds, 'Миллисекунды')">
            <span>MILLISECONDS</span><code>{{ timestamps.milliseconds }}</code>
          </button>
          <button type="button" @click="copy(timestamps.iso, 'ISO')">
            <span>ISO 8601</span><code>{{ timestamps.iso }}</code>
          </button>
        </div>
        <footer><span>{{ copied && ['Секунды', 'Миллисекунды', 'ISO'].includes(copied) ? `✓ ${copied} скопированы` : 'Нажмите на значение, чтобы скопировать' }}</span></footer>
      </article>

      <article class="generator-card accent-violet">
        <header><span>03</span><strong>Безопасный токен</strong><small>192 BIT · HEX</small></header>
        <code class="wrap-value">{{ token }}</code>
        <footer>
          <button type="button" @click="token = generateToken()">↻ Новый</button>
          <button type="button" @click="copy(token, 'Токен')">{{ copied === 'Токен' ? '✓ Скопировано' : 'Копировать' }}</button>
        </footer>
      </article>

      <article class="generator-card accent-coral">
        <header><span>04</span><strong>Надёжный пароль</strong><small>WEB CRYPTO</small></header>
        <code class="wrap-value">{{ password }}</code>
        <footer>
          <label>Длина <input v-model.number="passwordLength" type="number" min="8" max="128" @change="refreshPassword"></label>
          <button type="button" @click="refreshPassword">↻ Новый</button>
          <button type="button" @click="copy(password, 'Пароль')">{{ copied === 'Пароль' ? '✓' : 'Копировать' }}</button>
        </footer>
      </article>
    </div>

    <section class="timestamp-converter" aria-labelledby="timestamp-converter-title">
      <header>
        <div><span>05</span><strong id="timestamp-converter-title">Timestamp converter</strong></div>
        <small>SECONDS · MILLISECONDS · LOCAL · UTC</small>
      </header>

      <div class="conversion-grid">
        <div class="conversion-pane">
          <label for="timestamp-input">Timestamp → datetime</label>
          <div class="conversion-input">
            <input id="timestamp-input" v-model="timestampInput" type="text" inputmode="numeric" spellcheck="false" placeholder="1722513600">
            <span>{{ timestampInput.length >= 12 ? 'MS' : 'SEC' }}</span>
          </div>
          <div v-if="timestampInput && timestampResult.valid" class="conversion-results">
            <button type="button" @click="copy(timestampResult.local, 'Локальная дата')">
              <span>LOCAL TIME</span><code>{{ timestampResult.local }}</code>
            </button>
            <button type="button" @click="copy(timestampResult.iso, 'ISO дата')">
              <span>UTC · ISO 8601</span><code>{{ timestampResult.iso }}</code>
            </button>
          </div>
          <p v-else-if="timestampInput" class="conversion-error">{{ timestampResult.error }}</p>
        </div>

        <div class="conversion-direction" aria-hidden="true">⇄</div>

        <div class="conversion-pane">
          <label for="datetime-input">Datetime → timestamp</label>
          <div class="conversion-input">
            <input id="datetime-input" v-model="dateTimeInput" type="datetime-local" step="1">
            <span>LOCAL</span>
          </div>
          <div v-if="dateTimeInput && dateTimeResult.valid" class="conversion-results">
            <button type="button" @click="copy(dateTimeResult.seconds, 'Timestamp sec')">
              <span>SECONDS</span><code>{{ dateTimeResult.seconds }}</code>
            </button>
            <button type="button" @click="copy(dateTimeResult.milliseconds, 'Timestamp ms')">
              <span>MILLISECONDS</span><code>{{ dateTimeResult.milliseconds }}</code>
            </button>
          </div>
          <p v-else-if="dateTimeInput" class="conversion-error">{{ dateTimeResult.error }}</p>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.tool-heading {
  display: grid;
  grid-template-columns: 1.4fr 0.7fr;
  gap: 64px;
  align-items: end;
  margin-bottom: 42px;
}

.eyebrow {
  margin: 0 0 17px;
  color: #d4a2ff;
  font: 700 11px/1 ui-monospace, monospace;
  letter-spacing: 0.19em;
}

h1 { margin: 0; color: #f2f5f2; font-size: clamp(42px, 6vw, 68px); font-weight: 590; letter-spacing: -0.058em; line-height: 0.98; }
h1 em { color: #8e9690; font-family: Georgia, serif; font-weight: 400; letter-spacing: -0.045em; }
.tool-heading > p { max-width: 330px; margin: 0 0 3px; color: #909792; font-size: 15px; line-height: 1.65; }

.generator-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.generator-card { display: grid; min-width: 0; grid-template-rows: auto minmax(128px, 1fr) auto; border: 1px solid #2a302c; background: #111412; box-shadow: 0 18px 55px rgba(0, 0, 0, 0.15); }
.generator-card header { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 3px 7px; align-content: center; min-height: 62px; padding: 8px 14px; border-bottom: 1px solid #292e2b; background: #171a18; }
.generator-card header span { font: 9px/1 ui-monospace, monospace; }
.generator-card header strong { color: #d9dfda; font-size: 12px; }
.generator-card header small { grid-column: 2; color: #59615b; font: 8px/1 ui-monospace, monospace; }
.generator-card > code { display: flex; min-width: 0; min-height: 128px; align-items: center; overflow-wrap: anywhere; padding: 18px; color: #dce3dd; font: 12px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }
.generator-card footer { display: flex; min-height: 58px; flex-wrap: wrap; align-content: center; align-items: center; justify-content: flex-end; gap: 5px; padding: 8px 10px; border-top: 1px solid #292e2b; background: #171a18; color: #626b64; font-size: 10px; }
.generator-card footer button { min-width: 0; min-height: 32px; flex: 1; border: 1px solid #303631; padding: 0 8px; background: #1e231f; color: #aeb6b0; cursor: pointer; font-size: 9px; font-weight: 650; white-space: nowrap; }
.generator-card footer button:hover { border-color: #4b574e; color: #eff3ef; }
.generator-card footer label { display: flex; width: 100%; gap: 6px; align-items: center; justify-content: space-between; color: #687169; }
.generator-card footer input { width: 50px; border: 1px solid #303631; padding: 6px; background: #111412; color: #cfd6d0; font: 11px ui-monospace, monospace; }
.accent-green header > span { color: #a8e779; }
.accent-blue header > span { color: #80c8ff; }
.accent-violet header > span { color: #c59cff; }
.accent-coral header > span { color: #ff9486; }

.timestamp-list { display: grid; min-height: 128px; align-content: center; padding: 12px 14px; }
.timestamp-list button { display: grid; min-width: 0; grid-template-columns: 68px minmax(0, 1fr); gap: 8px; border: 0; padding: 7px 0; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.timestamp-list button:hover code { color: #b9f489; }
.timestamp-list span { color: #5e675f; font: 8px/1.5 ui-monospace, monospace; }
.timestamp-list code { overflow: hidden; color: #cfd6d0; font: 10px/1.4 ui-monospace, monospace; text-overflow: ellipsis; }

.timestamp-converter { margin-top: 14px; border: 1px solid #2a302c; background: #111412; box-shadow: 0 18px 55px rgba(0, 0, 0, 0.15); }
.timestamp-converter > header { display: flex; min-height: 58px; align-items: center; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid #292e2b; background: #171a18; }
.timestamp-converter > header div { display: flex; gap: 12px; align-items: center; }
.timestamp-converter > header span { color: #80c8ff; font: 9px ui-monospace, monospace; }
.timestamp-converter > header strong { color: #d9dfda; font-size: 12px; }
.timestamp-converter > header small { color: #59615b; font: 9px ui-monospace, monospace; }
.conversion-grid { display: grid; grid-template-columns: 1fr 54px 1fr; }
.conversion-pane { min-width: 0; padding: 22px; }
.conversion-pane > label { display: block; margin-bottom: 10px; color: #7a847c; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.conversion-input { display: grid; grid-template-columns: 1fr auto; align-items: center; border: 1px solid #303631; background: #0e110f; }
.conversion-input input { min-width: 0; height: 44px; border: 0; outline: 0; padding: 0 12px; background: transparent; color: #dce3dd; color-scheme: dark; font: 12px ui-monospace, monospace; }
.conversion-input span { padding: 0 12px; color: #667068; font: 9px ui-monospace, monospace; }
.conversion-results { display: grid; gap: 1px; margin-top: 12px; background: #242925; }
.conversion-results button { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 12px; border: 0; padding: 11px 12px; background: #151816; color: inherit; cursor: pointer; text-align: left; }
.conversion-results button:hover code { color: #b9f489; }
.conversion-results span { color: #5f6961; font: 9px/1.5 ui-monospace, monospace; }
.conversion-results code { overflow: hidden; color: #cfd6d0; font: 11px/1.4 ui-monospace, monospace; text-overflow: ellipsis; }
.conversion-direction { display: grid; place-items: center; border-inline: 1px solid #292e2b; color: #647068; font-size: 18px; }
.conversion-error { margin: 12px 0 0; color: #ff9183; font-size: 10px; }

@media (max-width: 760px) {
  .tool-heading { grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px; }
  h1 { font-size: clamp(38px, 12vw, 56px); }
  .timestamp-converter > header small { display: none; }
  .conversion-grid { grid-template-columns: 1fr; }
  .conversion-direction { min-height: 36px; border-block: 1px solid #292e2b; border-inline: 0; }
}

@media (max-width: 900px) {
  .generator-grid {
    grid-template-columns: none;
    grid-auto-columns: minmax(270px, 78vw);
    grid-auto-flow: column;
    overflow-x: auto;
    padding-bottom: 8px;
    overscroll-behavior-inline: contain;
    scroll-snap-type: inline mandatory;
  }

  .generator-card {
    scroll-snap-align: start;
  }
}
</style>
