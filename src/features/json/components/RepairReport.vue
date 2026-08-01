<script setup>
defineProps({
  changes: { type: Array, required: true },
})
</script>

<template>
  <section class="repair-report" aria-live="polite">
    <span class="report-icon" aria-hidden="true">✦</span>
    <div>
      <strong>Что было исправлено</strong>
      <p>{{ changes.join(' · ') }}</p>
    </div>
  </section>
</template>
