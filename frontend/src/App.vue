<template>
  <div class="h-screen flex flex-col">
  
    <NavBar v-if="!hideNavBars" />
    
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <router-view />
    </div>
    
    <BottomNav v-if="!hideNavBars" />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './components/NavBar.vue';
import BottomNav from './components/BottomNav.vue';

const route = useRoute();

const hideNavBars = computed(() => {
  // Hide navbar on login, new item pages, and detail/edit pages
  return route.path === '/profile' || 
         route.path === '/issue/new' || 
         route.path === '/account/login' ||
         route.path.includes('/task/') ||
         route.path.includes('/issue/') ||
         (route.name && 
          (route.name.includes('Detail') || 
           route.name.includes('Edit')))
});

onMounted(() => {
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});
</script>