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
  return route.path === '/profile' || route.path === '/issue/new' || route.path === '/account/login' 
});


onMounted(() => {
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});
</script>
