<template>
  <span v-if="description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help group relative">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4 shadow-lg">
      <span v-html="description"></span>
    </div>
  </span>
</template>

<script setup>
defineProps({
  description: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.group:hover .group-hover\:block {
  display: block;
}
</style>