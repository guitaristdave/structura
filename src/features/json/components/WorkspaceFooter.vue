<script setup>
defineProps({
  validation: { type: Object, required: true },
  hasContent: { type: Boolean, required: true },
  lineCount: { type: Number, required: true },
  characterCount: { type: String, required: true },
  byteCount: { type: String, required: true },
})

defineEmits(['jump'])
</script>

<template>
  <div class="workspace-footer">
    <div
      id="validation-message"
      class="validation-status"
      :class="validation.valid ? 'valid' : 'invalid'"
      role="status"
    >
      <span class="status-icon" aria-hidden="true">{{ validation.valid ? '✓' : '!' }}</span>
      <div v-if="validation.valid">
        <strong>Валидный JSON</strong>
        <span>Синтаксических ошибок не найдено</span>
      </div>
      <div v-else>
        <strong>{{ validation.message }}</strong>
        <span v-if="hasContent">Строка {{ validation.line }}, столбец {{ validation.column }}</span>
        <span v-else>Проверка выполняется автоматически</span>
      </div>
    </div>

    <button
      v-if="!validation.valid && hasContent"
      type="button"
      class="jump-button"
      @click="$emit('jump')"
    >
      К ошибке <span aria-hidden="true">↗</span>
    </button>

    <div class="document-stats" aria-label="Статистика документа">
      <span>{{ lineCount }} {{ lineCount === 1 ? 'строка' : 'строк' }}</span>
      <span>{{ characterCount }} симв.</span>
      <span>{{ byteCount }} байт</span>
    </div>
  </div>
</template>
