<script setup>
defineProps({
  validation: { type: Object, required: true },
})
</script>

<template>
  <section class="error-detail" aria-label="Место ошибки">
    <div class="error-detail-heading">
      <span>Проблемный фрагмент</span>
      <code>Ln {{ validation.line }} · Col {{ validation.column }}</code>
    </div>
    <pre><code>{{ validation.snippet }}
{{ ' '.repeat(Math.max(0, validation.column - 1)) }}^ здесь</code></pre>
  </section>
</template>
