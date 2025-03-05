<template>
  <div class="bg-white border-t border-gray-200 flex justify-around items-center h-16">
    <router-link to="/" class="flex flex-col items-center justify-center w-full h-full" active-class="text-blue-600">
      <HomeIcon class="h-6 w-6" />
      <span class="text-xs mt-1">Home</span>
    </router-link>
    <router-link to="/issue" class="flex flex-col items-center justify-center w-full h-full" active-class="text-blue-600">
      <ChatBubbleLeftRightIcon class="h-6 w-6" />
      <span class="text-xs mt-1">Issues</span>
    </router-link>
  </div>
</template>

<script setup>
import { HomeIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';
</script>
