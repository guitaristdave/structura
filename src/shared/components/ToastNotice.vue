<script setup>
defineProps({
  message: { type: String, default: '' },
})
</script>

<template>
  <transition name="toast">
    <div v-if="message" class="toast" role="status">{{ message }}</div>
  </transition>
</template>
