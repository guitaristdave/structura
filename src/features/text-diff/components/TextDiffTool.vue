<script setup>
import { ref } from 'vue'
import { compareText } from '../text-diff.js'

const leftText = ref('Structura проверяет данные,\nформатирует JSON и исправляет ошибки.')
const rightText = ref('Structura быстро проверяет данные,\nформатирует код и подсвечивает ошибки.')
const comparison = ref(null)

function compare() {
  comparison.value = compareText(leftText.value, rightText.value)
}

function clear() {
  leftText.value = ''
  rightText.value = ''
  comparison.value = null
}

function swap() {
  const previousLeft = leftText.value
  leftText.value = rightText.value
  rightText.value = previousLeft
  if (comparison.value) compare()
}
</script>

<template>
  <section class="diff-tool" aria-labelledby="diff-title">
    <div class="diff-heading">
      <div>
        <p class="diff-eyebrow">TEXT DIFF</p>
        <h1 id="diff-title">Найдите каждое<br><em>важное отличие.</em></h1>
      </div>
      <p>Сравните два текстовых фрагмента — добавленные и удалённые части будут подсвечены отдельно.</p>
    </div>

    <div class="diff-input-card">
      <div class="input-pane">
        <div class="pane-title"><span>01</span>Исходный текст</div>
        <textarea
          v-model="leftText"
          class="diff-textarea"
          aria-label="Первый текстовый фрагмент"
          spellcheck="false"
          placeholder="Вставьте первый фрагмент…"
          @input="comparison = null"
        ></textarea>
      </div>

      <div class="input-divider" aria-hidden="true">VS</div>

      <div class="input-pane">
        <div class="pane-title"><span>02</span>Изменённый текст</div>
        <textarea
          v-model="rightText"
          class="diff-textarea"
          aria-label="Второй текстовый фрагмент"
          spellcheck="false"
          placeholder="Вставьте второй фрагмент…"
          @input="comparison = null"
        ></textarea>
      </div>

      <div class="diff-actions">
        <div>
          <button type="button" class="quiet-button" @click="swap">⇄ Поменять местами</button>
          <button type="button" class="quiet-button" @click="clear">Очистить</button>
        </div>
        <button type="button" class="compare-button" @click="compare">
          <span aria-hidden="true">◫</span>
          Сравнить
        </button>
      </div>
    </div>

    <section v-if="comparison" class="diff-result" aria-live="polite" aria-label="Результат сравнения">
      <div class="result-header">
        <div>
          <strong>{{ comparison.identical ? 'Тексты полностью совпадают' : 'Найдены различия' }}</strong>
          <span v-if="!comparison.identical">
            −{{ comparison.removed }} симв. · +{{ comparison.added }} симв.
          </span>
          <span v-else>Изменений нет</span>
        </div>
        <div class="legend">
          <span><i class="removed-key"></i>Удалено</span>
          <span><i class="added-key"></i>Добавлено</span>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-pane">
          <div class="result-label">Исходный текст</div>
          <div class="diff-content">
            <span
              v-for="(part, index) in comparison.left"
              :key="index"
              :class="part.type"
            >{{ part.text }}</span>
          </div>
        </div>
        <div class="result-pane">
          <div class="result-label">Изменённый текст</div>
          <div class="diff-content">
            <span
              v-for="(part, index) in comparison.right"
              :key="index"
              :class="part.type"
            >{{ part.text }}</span>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.diff-heading {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.7fr);
  gap: 64px;
  align-items: end;
  margin-bottom: 42px;
}

.diff-eyebrow {
  margin: 0 0 17px;
  color: #80c8ff;
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

.diff-heading > p {
  max-width: 330px;
  margin: 0 0 3px;
  color: #909792;
  font-size: 15px;
  line-height: 1.65;
}

.diff-input-card,
.diff-result {
  border: 1px solid #2a302c;
  background: #131614;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
}

.diff-input-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 54px minmax(0, 1fr);
}

.input-pane {
  min-width: 0;
}

.pane-title,
.result-label {
  min-height: 52px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid #292e2b;
  background: #171a18;
  color: #cbd2cc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pane-title span {
  color: #56615a;
  font: 9px/1 ui-monospace, monospace;
}

.input-divider {
  display: grid;
  place-items: center;
  border-right: 1px solid #292e2b;
  border-left: 1px solid #292e2b;
  background: #151816;
  color: #4e5750;
  font: 700 9px/1 ui-monospace, monospace;
  letter-spacing: 0.12em;
}

.diff-textarea {
  position: static;
  display: block;
  width: 100%;
  height: 300px;
  resize: vertical;
  border: 0;
  outline: 0;
  padding: 22px;
  background: #101311;
  color: #d9e0db;
  caret-color: #b9f489;
  font: 13px/22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
}

.diff-textarea::placeholder {
  color: #49504b;
}

.diff-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 10px 12px 10px 18px;
  border-top: 1px solid #292e2b;
  background: #171a18;
}

.diff-actions > div {
  display: flex;
  gap: 4px;
}

.quiet-button,
.compare-button {
  border: 0;
  cursor: pointer;
  font-size: 11px;
  font-weight: 680;
}

.quiet-button {
  padding: 10px;
  background: transparent;
  color: #69716b;
}

.quiet-button:hover {
  color: #d9dfda;
}

.compare-button {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  min-height: 42px;
  padding: 0 22px;
  background: #b9f489;
  color: #15200f;
}

.compare-button:hover {
  background: #c9ffa0;
  transform: translateY(-1px);
}

.diff-result {
  margin-top: 18px;
}

.result-header {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 18px;
  border-bottom: 1px solid #292e2b;
  background: #171a18;
}

.result-header > div:first-child {
  display: grid;
  gap: 4px;
}

.result-header strong {
  color: #dde3de;
  font-size: 12px;
}

.result-header > div:first-child span {
  color: #69716b;
  font: 10px/1.2 ui-monospace, monospace;
}

.legend {
  display: flex;
  gap: 16px;
  color: #747d76;
  font-size: 10px;
}

.legend span {
  display: flex;
  gap: 6px;
  align-items: center;
}

.legend i {
  width: 9px;
  height: 9px;
}

.removed-key {
  background: #8c3e3a;
}

.added-key {
  background: #3d6d42;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.result-pane + .result-pane {
  border-left: 1px solid #292e2b;
}

.result-label {
  min-height: 42px;
  color: #727b74;
  font-size: 9px;
}

.diff-content {
  min-height: 190px;
  overflow-wrap: anywhere;
  padding: 22px;
  color: #c8d0ca;
  font: 13px/22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
}

.diff-content .removed,
.diff-content .added {
  padding: 2px 0;
}

.diff-content .removed {
  background: rgba(226, 86, 76, 0.24);
  color: #ffb0a8;
  text-decoration: line-through;
  text-decoration-color: rgba(255, 176, 168, 0.6);
}

.diff-content .added {
  background: rgba(103, 192, 111, 0.22);
  color: #bdecc0;
}

@media (max-width: 760px) {
  .diff-heading {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }

  h1 {
    font-size: clamp(38px, 12vw, 56px);
  }

  .diff-input-card {
    grid-template-columns: 1fr;
  }

  .input-divider {
    min-height: 34px;
    border: 0;
    border-top: 1px solid #292e2b;
    border-bottom: 1px solid #292e2b;
  }

  .diff-textarea {
    height: 230px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-pane + .result-pane {
    border-top: 1px solid #292e2b;
    border-left: 0;
  }

  .result-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .diff-actions {
    align-items: stretch;
    flex-direction: column-reverse;
    gap: 8px;
  }

  .compare-button {
    justify-content: center;
  }

  .diff-actions > div {
    justify-content: space-between;
  }
}
</style>
