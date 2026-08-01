<script setup>
import { ref } from 'vue'
import { inspectJson } from '../../json/json-tools.js'
import { jsonToPhp, phpToJson } from '../php-array-tools.js'

const props = defineProps({
  currentJson: { type: String, required: true },
})

const emit = defineEmits(['send-json'])

const jsonInput = ref(props.currentJson)
const initialPhp = jsonToPhp(props.currentJson)
const phpInput = ref(initialPhp.valid ? initialPhp.output : '')
const jsonError = ref('')
const phpError = ref('')
const message = ref('')

function setMessage(value) {
  message.value = value
  window.setTimeout(() => {
    if (message.value === value) message.value = ''
  }, 2400)
}

function convertToPhp() {
  const validation = inspectJson(jsonInput.value)
  if (!validation.valid) {
    jsonError.value = `${validation.message} Строка ${validation.line}, столбец ${validation.column}.`
    return
  }

  const result = jsonToPhp(jsonInput.value)
  phpInput.value = result.output
  jsonError.value = ''
  phpError.value = ''
  setMessage('PHP-массив готов')
}

function convertToJson() {
  const result = phpToJson(phpInput.value)
  if (!result.valid) {
    phpError.value = `${result.error.message} Строка ${result.error.line}, столбец ${result.error.column}.`
    return
  }

  jsonInput.value = result.output
  phpError.value = ''
  jsonError.value = ''
  setMessage('JSON готов')
}

function takeFromEditor() {
  jsonInput.value = props.currentJson
  jsonError.value = ''
  convertToPhp()
}

function sendToEditor() {
  const validation = inspectJson(jsonInput.value)
  if (!validation.valid) {
    jsonError.value = `${validation.message} Строка ${validation.line}, столбец ${validation.column}.`
    return
  }
  const formatted = JSON.stringify(validation.value, null, 2)
  jsonInput.value = formatted
  emit('send-json', formatted)
  setMessage('JSON отправлен в основной редактор')
}

async function copy(value, label) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    setMessage(`${label} скопирован`)
  } catch {
    setMessage('Не удалось скопировать')
  }
}
</script>

<template>
  <section class="converter-section" aria-labelledby="converter-title">
    <div class="converter-heading">
      <div>
        <p class="converter-eyebrow">FORMAT BRIDGE</p>
        <h2 id="converter-title">JSON <span>↔</span> PHP array</h2>
      </div>
      <p>Переносите структуры данных между JSON и PHP без ручной замены синтаксиса.</p>
    </div>

    <div class="converter-grid">
      <div class="converter-pane" :class="{ 'pane-error': jsonError }">
        <div class="pane-header">
          <div class="pane-label"><span class="format-dot json-dot"></span>JSON</div>
          <div class="pane-actions">
            <button type="button" @click="takeFromEditor">Из редактора</button>
            <button type="button" @click="copy(jsonInput, 'JSON')">Копировать</button>
          </div>
        </div>
        <textarea
          v-model="jsonInput"
          class="converter-textarea"
          aria-label="JSON для конвертации"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          wrap="off"
          @input="jsonError = ''"
        ></textarea>
        <div class="pane-footer">
          <span v-if="jsonError" class="converter-error">{{ jsonError }}</span>
          <button type="button" class="send-button" @click="sendToEditor">В основной редактор ↑</button>
        </div>
      </div>

      <div class="converter-controls" aria-label="Направление конвертации">
        <button type="button" @click="convertToPhp">
          <span>JSON → PHP</span>
          <b aria-hidden="true">→</b>
        </button>
        <button type="button" @click="convertToJson">
          <b aria-hidden="true">←</b>
          <span>PHP → JSON</span>
        </button>
      </div>

      <div class="converter-pane" :class="{ 'pane-error': phpError }">
        <div class="pane-header">
          <div class="pane-label"><span class="format-dot php-dot"></span>PHP array</div>
          <div class="pane-actions">
            <button type="button" @click="copy(phpInput, 'PHP-массив')">Копировать</button>
          </div>
        </div>
        <textarea
          v-model="phpInput"
          class="converter-textarea"
          aria-label="PHP-массив для конвертации"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          wrap="off"
          @input="phpError = ''"
        ></textarea>
        <div class="pane-footer php-footer">
          <span v-if="phpError" class="converter-error">{{ phpError }}</span>
          <span v-else>Поддерживаются <code>[]</code> и <code>array()</code></span>
        </div>
      </div>
    </div>

    <transition name="converter-message">
      <div v-if="message" class="converter-message" role="status">
        <span aria-hidden="true">✓</span>{{ message }}
      </div>
    </transition>
  </section>
</template>

<style scoped>
.converter-section {
  position: relative;
}

.converter-heading {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 56px;
  align-items: end;
  margin-bottom: 28px;
}

.converter-eyebrow {
  margin: 0 0 12px;
  color: #ff9d8f;
  font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.19em;
}

h2 {
  margin: 0;
  color: #eff3ef;
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 580;
  letter-spacing: -0.055em;
  line-height: 1;
}

h2 span {
  color: #657068;
  font-family: Georgia, serif;
  font-weight: 400;
}

.converter-heading > p {
  max-width: 330px;
  margin: 0 0 2px;
  color: #858e87;
  font-size: 14px;
  line-height: 1.6;
}

.converter-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px minmax(0, 1fr);
  border: 1px solid #2a302c;
  background: #131614;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
}

.converter-pane {
  min-width: 0;
  background: #101311;
}

.converter-pane:first-child {
  border-right: 1px solid #292e2b;
}

.converter-pane:last-child {
  border-left: 1px solid #292e2b;
}

.pane-error {
  box-shadow: inset 0 -2px #f17868;
}

.pane-header,
.pane-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 14px 0 18px;
  background: #171a18;
}

.pane-header {
  border-bottom: 1px solid #292e2b;
}

.pane-footer {
  min-height: 45px;
  border-top: 1px solid #292e2b;
}

.pane-label {
  display: flex;
  gap: 9px;
  align-items: center;
  color: #d6dcd7;
  font-size: 11px;
  font-weight: 730;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.format-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.json-dot {
  background: #b9f489;
}

.php-dot {
  background: #9b91ff;
}

.pane-actions {
  display: flex;
  gap: 3px;
}

.pane-actions button,
.send-button {
  border: 0;
  background: transparent;
  color: #69726b;
  cursor: pointer;
  font-size: 10px;
  font-weight: 620;
}

.pane-actions button {
  padding: 8px;
}

.pane-actions button:hover,
.send-button:hover {
  color: #dfe5e0;
}

.converter-textarea {
  position: static;
  display: block;
  width: 100%;
  height: 330px;
  resize: vertical;
  border: 0;
  outline: 0;
  padding: 20px;
  background: #101311;
  color: #d9e0db;
  caret-color: #b9f489;
  font: 12px/21px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  tab-size: 2;
  white-space: pre;
}

.pane-footer {
  color: #5f6861;
  font-size: 10px;
}

.php-footer {
  justify-content: flex-end;
}

.php-footer:has(.converter-error) {
  justify-content: flex-start;
}

.pane-footer code {
  color: #858e87;
  font-size: 10px;
}

.send-button {
  margin-left: auto;
  color: #8fa584;
}

.converter-error {
  overflow: hidden;
  max-width: 75%;
  color: #ff8b7c;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.converter-controls {
  display: flex;
  flex-direction: column;
  gap: 9px;
  align-items: stretch;
  justify-content: center;
  padding: 12px;
  background: #151816;
}

.converter-controls button {
  display: grid;
  min-height: 74px;
  place-items: center;
  border: 1px solid #2d342f;
  background: #1b201c;
  color: #8d978f;
  cursor: pointer;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.converter-controls button:hover {
  border-color: #4b594f;
  color: #e2e9e3;
}

.converter-controls b {
  color: #b9f489;
  font-size: 20px;
  font-weight: 400;
}

.converter-message {
  position: absolute;
  right: 16px;
  bottom: 58px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 13px;
  border: 1px solid #34452d;
  background: #1a2117;
  color: #cfe9c1;
  font-size: 10px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.28);
}

.converter-message span {
  color: #a8e779;
  font-weight: 800;
}

.converter-message-enter-active,
.converter-message-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.converter-message-enter-from,
.converter-message-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 850px) {
  .converter-heading {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .converter-grid {
    grid-template-columns: 1fr;
  }

  .converter-pane:first-child,
  .converter-pane:last-child {
    border: 0;
  }

  .converter-controls {
    flex-direction: row;
    border-top: 1px solid #292e2b;
    border-bottom: 1px solid #292e2b;
  }

  .converter-controls button {
    min-height: 48px;
    flex: 1;
    grid-auto-flow: column;
  }

  .converter-textarea {
    height: 280px;
  }
}

@media (max-width: 520px) {
  .converter-section {
    margin-top: 0;
  }

  .pane-actions button:first-child {
    display: none;
  }

  .converter-controls button {
    padding: 6px;
  }
}
</style>
