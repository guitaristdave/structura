<script setup>
import { useTheme } from '../composables/useTheme.js'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <header class="topbar">
    <a class="brand" href="#" aria-label="Structura — на главную">
      <span class="brand-mark" aria-hidden="true">{ }</span>
      <span>Struct<span>ura</span></span>
    </a>
    <div class="header-actions">
      <div class="privacy-note">
        <span class="privacy-dot" aria-hidden="true"></span>
        Работает локально в браузере
      </div>
      <button
        type="button"
        class="theme-toggle"
        :class="{ light: theme === 'light' }"
        :aria-label="theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'"
        :aria-pressed="theme === 'light'"
        @click="toggleTheme"
      >
        <span aria-hidden="true">◐</span>
        <i aria-hidden="true"><b></b></i>
        <span aria-hidden="true">☼</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.theme-toggle {
  display: flex;
  gap: 7px;
  align-items: center;
  border: 0;
  padding: 6px 0;
  background: transparent;
  color: #656e67;
  cursor: pointer;
}

.theme-toggle > span {
  width: 13px;
  font: 13px/1 ui-monospace, monospace;
  text-align: center;
}

.theme-toggle > i {
  position: relative;
  width: 34px;
  height: 18px;
  border: 1px solid #384039;
  border-radius: 20px;
  background: #1b201c;
}

.theme-toggle b {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #a8e779;
  transition: transform 0.2s ease, background 0.2s ease;
}

.theme-toggle.light b {
  transform: translateX(16px);
}

.theme-toggle:hover {
  color: #c8d0ca;
}

:global(html[data-theme='light']) .theme-toggle {
  color: #707a72;
}

:global(html[data-theme='light']) .theme-toggle > i {
  border-color: #cbd2c9;
  background: #edf0e9;
}

:global(html[data-theme='light']) .theme-toggle b {
  background: #5f913d;
}

:global(html[data-theme='light']) .theme-toggle:hover {
  color: #202820;
}

@media (max-width: 520px) {
  .header-actions {
    gap: 12px;
  }

  .theme-toggle > span {
    display: none;
  }
}
</style>
