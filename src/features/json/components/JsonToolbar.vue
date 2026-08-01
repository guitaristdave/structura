<script setup>
defineProps({
  repairDisabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['beautify', 'compact', 'copy', 'repair'])
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group format-group" aria-label="Форматирование">
      <button type="button" class="tool-button" @click="$emit('beautify')">
        <span class="button-symbol" aria-hidden="true">≡</span>
        Beautify
      </button>
      <button type="button" class="tool-button" @click="$emit('compact')">
        <span class="button-symbol compact-symbol" aria-hidden="true">⇥</span>
        Compact
      </button>
    </div>

    <div class="toolbar-group action-group">
      <button type="button" class="tool-button secondary-action" @click="$emit('copy')">
        <span class="button-symbol" aria-hidden="true">▣</span>
        Копировать
      </button>
      <button
        type="button"
        class="repair-button"
        :disabled="repairDisabled"
        @click="$emit('repair')"
      >
        <span aria-hidden="true">✦</span>
        Починить JSON
      </button>
    </div>
  </div>
</template>
