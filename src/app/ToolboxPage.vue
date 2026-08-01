<script setup>
import { computed, nextTick, ref } from 'vue'
import { inspectJson, repairJson } from '../features/json/json-tools.js'
import Base64Tool from '../features/base64/components/Base64Tool.vue'
import GeneratorsTool from '../features/generators/components/GeneratorsTool.vue'
import ErrorDetail from '../features/json/components/ErrorDetail.vue'
import JsonToolbar from '../features/json/components/JsonToolbar.vue'
import PageIntro from '../features/json/components/PageIntro.vue'
import RepairReport from '../features/json/components/RepairReport.vue'
import WorkspaceFooter from '../features/json/components/WorkspaceFooter.vue'
import PhpArrayConverter from '../features/php-array/components/PhpArrayConverter.vue'
import TextDiffTool from '../features/text-diff/components/TextDiffTool.vue'
import RegexTool from '../features/regex/components/RegexTool.vue'
import UrlCleanerTool from '../features/url-cleaner/components/UrlCleanerTool.vue'
import ToastNotice from '../shared/components/ToastNotice.vue'
import AppHeader from '../shared/layout/AppHeader.vue'
import ToolNavigation from '../shared/layout/ToolNavigation.vue'

const starterJson = `{
  "project": "Structura",
  "status": "ready",
  "features": [
    "validation",
    "formatting",
    "smart repair"
  ],
  "settings": {
    "indent": 2,
    "liveValidation": true
  }
}`

const source = ref(starterJson)
const activeTool = ref('json')
const editor = ref(null)
const gutter = ref(null)
const toast = ref('')
const lastRepair = ref([])
let toastTimer

const validation = computed(() => inspectJson(source.value))
const lineCount = computed(() => Math.max(1, source.value.split('\n').length))
const characterCount = computed(() => source.value.length.toLocaleString('ru-RU'))
const byteCount = computed(() => new TextEncoder().encode(source.value).length.toLocaleString('ru-RU'))

function announce(message) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = ''
  }, 2600)
}

function formatJson(spaces) {
  if (!validation.value.valid) {
    announce('Сначала исправьте синтаксическую ошибку')
    jumpToError()
    return
  }

  source.value = JSON.stringify(validation.value.value, null, spaces)
  lastRepair.value = []
  announce(spaces ? 'JSON отформатирован' : 'JSON сжат в одну строку')
}

function repair() {
  if (!source.value.trim()) {
    announce('Вставьте JSON для восстановления')
    editor.value?.focus()
    return
  }

  if (validation.value.valid) {
    announce('JSON уже валиден — чинить нечего')
    return
  }

  const result = repairJson(source.value)
  source.value = result.output
  lastRepair.value = result.changes

  nextTick(() => {
    if (result.valid) {
      announce(`Готово: исправлений — ${result.changes.length}`)
    } else {
      announce('Исправлена часть ошибок — проверьте отмеченное место')
      jumpToError()
    }
  })
}

function jumpToError() {
  if (validation.value.valid || !editor.value) return
  const position = validation.value.offset
  editor.value.focus()
  editor.value.setSelectionRange(position, Math.min(position + 1, source.value.length))
  const lineHeight = 24
  editor.value.scrollTop = Math.max(0, (validation.value.line - 4) * lineHeight)
  syncScroll()
}

async function copyJson() {
  if (!source.value) return
  try {
    await navigator.clipboard.writeText(source.value)
    announce('JSON скопирован')
  } catch {
    editor.value?.select()
    document.execCommand('copy')
    announce('JSON скопирован')
  }
}

function clearEditor() {
  source.value = ''
  lastRepair.value = []
  nextTick(() => editor.value?.focus())
}

function syncScroll() {
  if (!editor.value || !gutter.value) return
  gutter.value.scrollTop = editor.value.scrollTop
}

function handleShortcut(event) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    formatJson(2)
  }
}

function acceptConvertedJson(value) {
  source.value = value
  lastRepair.value = []
  activeTool.value = 'json'
  announce('JSON загружен из конвертера')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <ToolNavigation v-model="activeTool" />

    <main>
      <div v-show="activeTool === 'json'" class="tool-view">
        <PageIntro />

        <section class="workspace" aria-label="Редактор JSON">
          <JsonToolbar
            :repair-disabled="validation.valid"
            @beautify="formatJson(2)"
            @compact="formatJson(0)"
            @copy="copyJson"
            @repair="repair"
          />

          <div class="editor-frame" :class="{ 'has-error': !validation.valid && source.trim() }">
            <div ref="gutter" class="line-gutter" aria-hidden="true">
              <span
                v-for="line in lineCount"
                :key="line"
                :class="{ 'error-line': !validation.valid && validation.line === line }"
              >{{ line }}</span>
            </div>
            <textarea
              ref="editor"
              v-model="source"
              aria-label="JSON"
              aria-describedby="validation-message"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              wrap="off"
              @scroll="syncScroll"
              @keydown="handleShortcut"
              @input="lastRepair = []"
            ></textarea>
            <button v-if="source" type="button" class="clear-button" aria-label="Очистить редактор" @click="clearEditor">×</button>
          </div>

          <WorkspaceFooter
            :validation="validation"
            :has-content="Boolean(source.trim())"
            :line-count="lineCount"
            :character-count="characterCount"
            :byte-count="byteCount"
            @jump="jumpToError"
          />
        </section>

        <ErrorDetail
          v-if="!validation.valid && source.trim()"
          :validation="validation"
        />

        <RepairReport v-if="lastRepair.length" :changes="lastRepair" />

        <p class="shortcut-hint"><kbd>⌘</kbd> <span>+</span> <kbd>Enter</kbd> — быстро отформатировать</p>
      </div>

      <PhpArrayConverter
        v-show="activeTool === 'php'"
        :current-json="source"
        @send-json="acceptConvertedJson"
      />

      <TextDiffTool v-show="activeTool === 'diff'" />
      <GeneratorsTool v-show="activeTool === 'generators'" />
      <Base64Tool v-show="activeTool === 'base64'" />
      <RegexTool v-show="activeTool === 'regex'" />
      <UrlCleanerTool v-show="activeTool === 'url'" />
    </main>

    <ToastNotice :message="toast" />
  </div>
</template>

<style>
:root {
  color: #e9eee9;
  background: #0d0f0e;
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: #0d0f0e;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background:
    radial-gradient(circle at 80% 5%, rgba(156, 243, 102, 0.07), transparent 27rem),
    #0d0f0e;
}

button,
textarea {
  font: inherit;
}

button {
  color: inherit;
}

button:focus-visible,
textarea:focus-visible,
a:focus-visible {
  outline: 2px solid #b9f489;
  outline-offset: 3px;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1180px, calc(100% - 48px));
  height: 76px;
  margin: 0 auto;
  border-bottom: 1px solid #252a27;
}

.brand {
  display: inline-flex;
  gap: 11px;
  align-items: center;
  color: #f3f6f3;
  font-size: 30px;
  font-weight: 720;
  letter-spacing: -0.03em;
  text-decoration: none;
}

.brand > span:last-child > span {
  color: #98a29b;
  font-weight: 540;
}

.brand-mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #354038;
  background: #181c19;
  color: #b9f489;
  font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: -0.15em;
}

.privacy-note {
  display: flex;
  gap: 9px;
  align-items: center;
  color: #89918c;
  font-size: 12px;
  font-weight: 560;
}

.privacy-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a8e779;
  box-shadow: 0 0 0 4px rgba(168, 231, 121, 0.08);
}

main {
  width: min(1080px, calc(100% - 48px));
  margin: 0 auto;
  padding: 54px 0 64px;
}

.intro h1,
.diff-tool h1,
.converter-section h2,
.tool-heading h1 {
  font-size: clamp(32px, 4.3vw, 50px) !important;
  line-height: 1.03 !important;
}

.intro,
.diff-heading,
.converter-heading,
.tool-heading {
  margin-bottom: 30px !important;
}

.intro {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.75fr);
  gap: 64px;
  align-items: end;
  margin-bottom: 42px;
}

.eyebrow {
  margin: 0 0 17px;
  color: #a8e779;
  font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.19em;
}

h1 {
  margin: 0;
  color: #f2f5f2;
  font-size: clamp(42px, 6vw, 68px);
  font-weight: 590;
  letter-spacing: -0.058em;
  line-height: 0.98;
}

h1 em {
  color: #8e9690;
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 400;
  letter-spacing: -0.045em;
}

.intro-copy {
  max-width: 330px;
  margin: 0 0 3px;
  color: #909792;
  font-size: 15px;
  line-height: 1.65;
}

.workspace {
  overflow: hidden;
  border: 1px solid #2a302c;
  background: #131614;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
}

.toolbar {
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 18px;
  border-bottom: 1px solid #292e2b;
  background: #171a18;
}

.toolbar-group {
  display: flex;
  gap: 5px;
  align-items: center;
}

.tool-button,
.repair-button,
.jump-button,
.clear-button {
  border: 0;
  cursor: pointer;
}

.tool-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid transparent;
  background: transparent;
  color: #bec5c0;
  font-size: 12px;
  font-weight: 620;
}

.tool-button:hover {
  border-color: #323833;
  background: #202420;
  color: #f1f4f1;
}

.button-symbol {
  color: #768078;
  font: 700 17px/1 ui-monospace, monospace;
}

.compact-symbol {
  transform: rotate(90deg);
}

.secondary-action {
  margin-right: 4px;
}

.repair-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 40px;
  padding: 0 17px;
  background: #b9f489;
  color: #15200f;
  font-size: 12px;
  font-weight: 760;
  box-shadow: 0 7px 22px rgba(185, 244, 137, 0.12);
}

.repair-button:hover:not(:disabled) {
  background: #c9ffa0;
  transform: translateY(-1px);
}

.repair-button:disabled {
  background: #272c28;
  color: #606862;
  cursor: not-allowed;
  box-shadow: none;
}

.editor-frame {
  position: relative;
  height: 430px;
  background: #101311;
}

.editor-frame::before {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  left: 56px;
  width: 1px;
  background: #252a27;
  content: '';
  pointer-events: none;
}

.editor-frame.has-error::after {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #f17868;
  content: '';
  opacity: 0.75;
}

.line-gutter {
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  width: 56px;
  padding: 24px 0;
  background: #121513;
  color: #4f5751;
  font: 12px/24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: right;
  user-select: none;
}

.line-gutter span {
  display: block;
  height: 24px;
  padding-right: 16px;
}

.line-gutter .error-line {
  color: #ff8b7c;
  font-weight: 700;
}

textarea {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  resize: none;
  border: 0;
  border-radius: 0;
  outline: 0;
  padding: 24px 54px 28px 76px;
  background: transparent;
  color: #d9e0db;
  caret-color: #b9f489;
  font: 13px/24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  tab-size: 2;
  white-space: pre;
}

textarea::selection {
  background: rgba(185, 244, 137, 0.22);
}

.clear-button {
  position: absolute;
  z-index: 3;
  top: 17px;
  right: 17px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  background: #202521;
  color: #727b74;
  font-size: 19px;
  line-height: 1;
}

.clear-button:hover {
  color: #eef2ee;
}

.workspace-footer {
  display: flex;
  min-height: 76px;
  align-items: center;
  gap: 16px;
  padding: 13px 18px;
  border-top: 1px solid #292e2b;
  background: #171a18;
}

.validation-status {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 11px;
  align-items: center;
}

.status-icon {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
}

.valid .status-icon {
  background: rgba(168, 231, 121, 0.11);
  color: #a8e779;
}

.invalid .status-icon {
  background: rgba(241, 120, 104, 0.12);
  color: #ff8b7c;
}

.validation-status div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.validation-status strong {
  overflow: hidden;
  color: #dce2dd;
  font-size: 12px;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.validation-status span:not(.status-icon) {
  color: #666f68;
  font-size: 11px;
}

.jump-button {
  padding: 8px 10px;
  background: transparent;
  color: #ff9486;
  font-size: 11px;
  font-weight: 650;
}

.jump-button:hover {
  color: #ffc0b8;
}

.document-stats {
  display: flex;
  gap: 16px;
  color: #59615b;
  font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.error-detail,
.repair-report {
  margin-top: 14px;
  border: 1px solid #312a28;
  background: #171413;
}

.error-detail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid #302725;
  color: #ad8a84;
  font-size: 11px;
  font-weight: 660;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.error-detail-heading code {
  color: #ff8b7c;
  font-size: 10px;
}

.error-detail pre {
  overflow-x: auto;
  margin: 0;
  padding: 16px;
  color: #d9c7c3;
  font: 12px/20px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.repair-report {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  padding: 16px;
  border-color: #34452d;
  background: #151a13;
}

.report-icon {
  color: #a8e779;
}

.repair-report strong {
  display: block;
  margin-bottom: 5px;
  color: #dce6d7;
  font-size: 12px;
}

.repair-report p {
  margin: 0;
  color: #75816f;
  font-size: 11px;
  line-height: 1.5;
}

.shortcut-hint {
  margin: 20px 0 0;
  color: #505752;
  font-size: 10px;
  text-align: center;
}

.shortcut-hint kbd {
  display: inline-grid;
  min-width: 22px;
  height: 22px;
  place-items: center;
  border: 1px solid #2b302d;
  background: #151816;
  color: #747c76;
  font: inherit;
}

.shortcut-hint span {
  padding: 0 4px;
}

.toast {
  position: fixed;
  z-index: 10;
  right: 24px;
  bottom: 24px;
  padding: 13px 17px;
  border: 1px solid #3b443d;
  background: #202521;
  color: #e5eae6;
  font-size: 12px;
  font-weight: 620;
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.35);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

html[data-theme='light'] {
  color: #222923;
  background: #f3f4ef;
}

html[data-theme='light'] body {
  background:
    radial-gradient(circle at 80% 5%, rgba(103, 155, 68, 0.1), transparent 28rem),
    #f3f4ef;
}

html[data-theme='light'] .topbar,
html[data-theme='light'] .tool-navigation {
  border-color: #d8ddd5 !important;
}

html[data-theme='light'] .brand,
html[data-theme='light'] h1,
html[data-theme='light'] .diff-tool h1,
html[data-theme='light'] .converter-section h2 {
  color: #1b231d !important;
}

html[data-theme='light'] .brand > span:last-child > span,
html[data-theme='light'] h1 em,
html[data-theme='light'] .diff-tool h1 em,
html[data-theme='light'] .converter-section h2 span {
  color: #798179 !important;
}

html[data-theme='light'] .brand-mark {
  border-color: #cbd3c8;
  background: #f8faf5;
  color: #5b8b3c;
}

html[data-theme='light'] .privacy-note,
html[data-theme='light'] .intro-copy,
html[data-theme='light'] .diff-heading > p,
html[data-theme='light'] .converter-heading > p {
  color: #687168 !important;
}

html[data-theme='light'] .privacy-dot {
  background: #69a545;
  box-shadow: 0 0 0 4px rgba(92, 143, 58, 0.1);
}

html[data-theme='light'] .tool-navigation button {
  color: #747d75 !important;
}

html[data-theme='light'] .tool-navigation button:hover,
html[data-theme='light'] .tool-navigation button.active {
  color: #202820 !important;
}

html[data-theme='light'] .tool-navigation button.active::after {
  background: #63933f !important;
}

html[data-theme='light'] .tool-navigation button.active span {
  color: #588838 !important;
}

html[data-theme='light'] .workspace,
html[data-theme='light'] .converter-grid,
html[data-theme='light'] .diff-input-card,
html[data-theme='light'] .diff-result {
  border-color: #d5dbd2 !important;
  background: #ffffff !important;
  box-shadow: 0 24px 70px rgba(54, 66, 56, 0.09) !important;
}

html[data-theme='light'] .toolbar,
html[data-theme='light'] .workspace-footer,
html[data-theme='light'] .pane-header,
html[data-theme='light'] .pane-footer,
html[data-theme='light'] .diff-actions,
html[data-theme='light'] .result-header,
html[data-theme='light'] .result-label,
html[data-theme='light'] .pane-title {
  border-color: #dce1d9 !important;
  background: #f7f8f4 !important;
}

html[data-theme='light'] .editor-frame,
html[data-theme='light'] .line-gutter,
html[data-theme='light'] .converter-pane,
html[data-theme='light'] .converter-textarea,
html[data-theme='light'] .diff-textarea,
html[data-theme='light'] .diff-content {
  background: #ffffff !important;
}

html[data-theme='light'] .editor-frame::before {
  background: #e0e4dc;
}

html[data-theme='light'] textarea,
html[data-theme='light'] .converter-textarea,
html[data-theme='light'] .diff-textarea,
html[data-theme='light'] .diff-content {
  color: #283029 !important;
  caret-color: #588838;
}

html[data-theme='light'] textarea::selection {
  background: rgba(95, 145, 61, 0.2);
}

html[data-theme='light'] .line-gutter {
  color: #a0a8a0;
}

html[data-theme='light'] .tool-button {
  color: #525c54;
}

html[data-theme='light'] .tool-button:hover {
  border-color: #d8ddd5;
  background: #ecefe9;
  color: #1f2721;
}

html[data-theme='light'] .button-symbol,
html[data-theme='light'] .document-stats,
html[data-theme='light'] .shortcut-hint,
html[data-theme='light'] .result-header > div:first-child span,
html[data-theme='light'] .legend {
  color: #7b857d !important;
}

html[data-theme='light'] .repair-button,
html[data-theme='light'] .compare-button {
  background: #5f913d !important;
  color: #ffffff !important;
  box-shadow: 0 8px 22px rgba(82, 129, 51, 0.16) !important;
}

html[data-theme='light'] .repair-button:hover:not(:disabled),
html[data-theme='light'] .compare-button:hover {
  background: #527f34 !important;
}

html[data-theme='light'] .repair-button:disabled {
  background: #e4e8e1 !important;
  color: #9ca49d !important;
  box-shadow: none !important;
}

html[data-theme='light'] .clear-button {
  background: #edf0ea;
  color: #737d75;
}

html[data-theme='light'] .validation-status strong,
html[data-theme='light'] .repair-report strong,
html[data-theme='light'] .result-header strong,
html[data-theme='light'] .pane-label,
html[data-theme='light'] .pane-title {
  color: #303831 !important;
}

html[data-theme='light'] .validation-status span:not(.status-icon),
html[data-theme='light'] .repair-report p,
html[data-theme='light'] .pane-footer,
html[data-theme='light'] .pane-actions button,
html[data-theme='light'] .quiet-button,
html[data-theme='light'] .result-label {
  color: #727d74 !important;
}

html[data-theme='light'] .valid .status-icon {
  background: rgba(87, 145, 50, 0.12);
  color: #558e34;
}

html[data-theme='light'] .error-detail {
  border-color: #efcbc6;
  background: #fff8f6;
}

html[data-theme='light'] .error-detail-heading {
  border-color: #efd6d2;
  color: #a45d55;
}

html[data-theme='light'] .error-detail pre {
  color: #754b46;
}

html[data-theme='light'] .repair-report {
  border-color: #cbdcc2;
  background: #f6fbf2;
}

html[data-theme='light'] .shortcut-hint kbd {
  border-color: #d5dad2;
  background: #fafbf8;
  color: #657067;
}

html[data-theme='light'] .toast,
html[data-theme='light'] .converter-message {
  border-color: #cad5c4 !important;
  background: #ffffff !important;
  color: #35422f !important;
  box-shadow: 0 16px 45px rgba(45, 58, 48, 0.14) !important;
}

html[data-theme='light'] .converter-pane:first-child,
html[data-theme='light'] .converter-pane:last-child,
html[data-theme='light'] .input-divider,
html[data-theme='light'] .result-pane + .result-pane {
  border-color: #dce1d9 !important;
}

html[data-theme='light'] .converter-controls,
html[data-theme='light'] .input-divider {
  background: #f1f3ee !important;
  color: #879088 !important;
}

html[data-theme='light'] .converter-controls button {
  border-color: #d5dcd2 !important;
  background: #ffffff !important;
  color: #59635b !important;
}

html[data-theme='light'] .converter-controls button:hover {
  border-color: #96aa8c !important;
  color: #252d26 !important;
}

html[data-theme='light'] .converter-controls b,
html[data-theme='light'] .send-button,
html[data-theme='light'] .report-icon {
  color: #5f913d !important;
}

html[data-theme='light'] .diff-content .removed {
  background: rgba(210, 65, 55, 0.14) !important;
  color: #a33e37 !important;
}

html[data-theme='light'] .diff-content .added {
  background: rgba(67, 145, 74, 0.15) !important;
  color: #35723b !important;
}

html[data-theme='light'] .generators-tool h1,
html[data-theme='light'] .base64-tool h1,
html[data-theme='light'] .regex-tool h1,
html[data-theme='light'] .url-tool h1 {
  color: #1b231d;
}

html[data-theme='light'] .generators-tool h1 em,
html[data-theme='light'] .base64-tool h1 em,
html[data-theme='light'] .regex-tool h1 em,
html[data-theme='light'] .url-tool h1 em {
  color: #798179;
}

html[data-theme='light'] .tool-heading > p {
  color: #687168;
}

html[data-theme='light'] .generator-card,
html[data-theme='light'] .timestamp-converter,
html[data-theme='light'] .codec-card,
html[data-theme='light'] .regex-card,
html[data-theme='light'] .cleaner-card {
  border-color: #d5dbd2;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(54, 66, 56, 0.09);
}

html[data-theme='light'] .generator-card,
html[data-theme='light'] .codec-pane,
html[data-theme='light'] .codec-pane textarea,
html[data-theme='light'] .regex-pane textarea,
html[data-theme='light'] .highlighted-text,
html[data-theme='light'] .empty-result,
html[data-theme='light'] .cleaner-pane textarea,
html[data-theme='light'] .result-box {
  background: #ffffff;
  color: #283029;
}

html[data-theme='light'] .timestamp-converter {
  border-color: #d5dbd2;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(54, 66, 56, 0.08);
}

html[data-theme='light'] .generator-card header,
html[data-theme='light'] .generator-card footer,
html[data-theme='light'] .timestamp-converter > header,
html[data-theme='light'] .codec-pane header,
html[data-theme='light'] .codec-card > footer,
html[data-theme='light'] .pattern-row,
html[data-theme='light'] .regex-pane header,
html[data-theme='light'] .cleaner-pane header,
html[data-theme='light'] .cleaner-card > footer {
  border-color: #dce1d9;
  background: #f7f8f4;
  color: #303831;
}

html[data-theme='light'] .timestamp-converter > header strong {
  color: #303831;
}

html[data-theme='light'] .conversion-input {
  border-color: #d7ddd4;
  background: #ffffff;
}

html[data-theme='light'] .conversion-input input {
  color: #283029;
  color-scheme: light;
}

html[data-theme='light'] .conversion-results {
  background: #dce1d9;
}

html[data-theme='light'] .conversion-results button {
  background: #f7f8f4;
}

html[data-theme='light'] .conversion-results code {
  color: #303831;
}

html[data-theme='light'] .conversion-direction {
  border-color: #dce1d9;
  color: #758077;
}

html[data-theme='light'] .generator-card header strong,
html[data-theme='light'] .generator-card > code,
html[data-theme='light'] .timestamp-list code {
  color: #303831;
}

html[data-theme='light'] .generator-card footer button,
html[data-theme='light'] .generator-card footer input,
html[data-theme='light'] .flag-switches button {
  border-color: #d7ddd4;
  background: #ffffff;
  color: #59635b;
}

html[data-theme='light'] .generator-card footer input,
html[data-theme='light'] .pattern-input input {
  color: #283029;
}

html[data-theme='light'] .codec-pane,
html[data-theme='light'] .result-pane,
html[data-theme='light'] .regex-pane + .regex-pane {
  border-color: #dce1d9;
}

html[data-theme='light'] .codec-actions,
html[data-theme='light'] .cleaner-arrow {
  border-color: #dce1d9;
  background: #f1f3ee;
  color: #727c74;
}

html[data-theme='light'] .codec-actions button {
  border-color: #d5dcd2;
  background: #ffffff;
  color: #59635b;
}

html[data-theme='light'] .codec-actions button.active {
  border-color: #ca934d;
  color: #222a23;
}

html[data-theme='light'] .pattern-input {
  border-color: #d7ddd4;
  background: #ffffff;
}

html[data-theme='light'] .flag-switches button.active {
  border-color: #75a796;
  background: #edf8f4;
  color: #347c6c;
}

html[data-theme='light'] .test-button,
html[data-theme='light'] .result-box button {
  background: #5f913d;
  color: #ffffff;
}

html[data-theme='light'] .highlighted-text .match {
  background: rgba(48, 156, 133, 0.16);
  color: #246f60;
}

html[data-theme='light'] .regex-error {
  background: #fff8f6;
}

html[data-theme='light'] .result-box code {
  color: #4f8430;
}

@media (max-width: 760px) {
  .topbar,
  main {
    width: min(100% - 28px, 1080px);
  }

  .topbar {
    height: 66px;
  }

  .privacy-note {
    font-size: 0;
  }

  .privacy-note::after {
    content: 'Локально';
    font-size: 11px;
  }

  main {
    padding-top: 38px;
  }

  .intro h1,
  .diff-tool h1,
  .converter-section h2,
  .tool-heading h1 {
    font-size: clamp(30px, 9vw, 42px) !important;
  }

  .intro {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }

  h1 {
    font-size: clamp(38px, 12vw, 56px);
  }

  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
  }

  .toolbar-group {
    width: 100%;
  }

  .tool-button {
    flex: 1;
    justify-content: center;
    padding: 0 9px;
  }

  .repair-button {
    flex: 1.35;
    justify-content: center;
  }

  .secondary-action {
    flex: 1;
  }

  .editor-frame {
    height: 400px;
  }

  textarea {
    padding-right: 42px;
    padding-left: 70px;
    font-size: 12px;
  }

  .workspace-footer {
    flex-wrap: wrap;
  }

  .validation-status {
    flex-basis: calc(100% - 80px);
  }

  .document-stats {
    width: 100%;
    padding-left: 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
