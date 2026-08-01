<script setup>
defineProps({
  modelValue: { type: String, required: true },
})

defineEmits(['update:modelValue'])

const tools = [
  { id: 'json', number: '01', label: 'JSON валидатор' },
  { id: 'php', number: '02', label: 'JSON ↔ PHP' },
  { id: 'diff', number: '03', label: 'Сравнение текста' },
  { id: 'generators', number: '04', label: 'Генераторы' },
  { id: 'base64', number: '05', label: 'Base64' },
  { id: 'regex', number: '06', label: 'Regex' },
  { id: 'url', number: '07', label: 'URL cleaner' },
]
</script>

<template>
  <nav class="tool-navigation" aria-label="Инструменты">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      :class="{ active: modelValue === tool.id }"
      :aria-current="modelValue === tool.id ? 'page' : undefined"
      @click="$emit('update:modelValue', tool.id)"
    >
      <span>{{ tool.number }}</span>
      {{ tool.label }}
    </button>
  </nav>
</template>

<style scoped>
.tool-navigation {
  display: flex;
  width: min(1080px, calc(100% - 48px));
  min-height: 62px;
  margin: 0 auto;
  align-items: stretch;
  overflow-x: auto;
  border-bottom: 1px solid #252a27;
  scrollbar-width: thin;
}

button {
  position: relative;
  display: flex;
  gap: 9px;
  align-items: center;
  border: 0;
  min-width: max-content;
  flex: 1;
  justify-content: center;
  padding: 0 14px;
  background: transparent;
  color: #626a64;
  cursor: pointer;
  font-size: 11px;
  font-weight: 620;
}

button::after {
  position: absolute;
  right: 14px;
  bottom: -1px;
  left: 14px;
  height: 2px;
  background: #b9f489;
  content: '';
  opacity: 0;
  transform: scaleX(0.5);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

button:hover {
  color: #b8c0ba;
}

button.active {
  color: #eef2ee;
}

button.active::after {
  opacity: 1;
  transform: scaleX(1);
}

button span {
  color: #4c544e;
  font: 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
}

button.active span {
  color: #9bcf76;
}

@media (max-width: 760px) {
  .tool-navigation {
    width: min(100% - 28px, 1080px);
  }

  button {
    padding: 0 12px;
    font-size: 11px;
  }
}
</style>
