<template>
    <nav class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="max-w-7xl mx-auto flex items-center">
        <ol class="flex items-center space-x-2">
          <li>
            <router-link to="/" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </router-link>
          </li>
          
          <li v-for="(item, index) in items" :key="index" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            
            <router-link 
              v-if="item.path && !item.active" 
              :to="item.path" 
              class="text-sm text-gray-500 hover:text-gray-700"
            >
              {{ item.label }}
            </router-link>
            
            <span 
              v-else 
              class="text-sm font-medium text-blue-600"
            >
              {{ item.label }}
            </span>
          </li>
        </ol>
      </div>
    </nav>
  </template>
  
  <script setup>
  defineProps({
    items: {
      type: Array,
      default: () => []
    }
  });
  </script>