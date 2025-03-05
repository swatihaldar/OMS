<template>
  <div class="h-screen flex flex-col">
    <!-- Top Navigation Bar -->
    <NavBar v-if="!hideNavBars" />
    
    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <router-view />
    </div>
    
    <!-- Bottom Navigation Bar -->
    <BottomNav v-if="!hideNavBars" />
  </div>
</template>

<script setup>
// import { createResource } from "frappe-ui";
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './components/NavBar.vue';
import BottomNav from './components/BottomNav.vue';

const route = useRoute();

// Hide NavBar and BottomNav on specific pages
const hideNavBars = computed(() => {
  return route.path === '/profile' || route.path === '/issue/new' || route.path === '/account/login';
});

// const user = createResource({
//   url: "oms.api.get_current_user_info",
//   auto: true,
//   // onError() {
//   //   window.location.href = "/login?redirect-to=%2Fhr%2Froster";
//   // },
// });

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
