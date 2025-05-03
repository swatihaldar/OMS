<template>
  <div class="h-screen flex flex-col">
    <!-- Mobile sidebar toggle button (only shown on mobile when sidebar is closed) -->
    <button 
      v-if="isMobile && !sidebarOpen && !isLoginPage"
      @click="sidebarOpen = true"
      class="fixed top-3 left-1 z-50 p-1.5 rounded-md  md:hidden"
      aria-label="Open menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Sidebar component - hidden on login page -->
    <AppSidebar 
      v-if="!isLoginPage"
      :isOpen="sidebarOpen" 
      :isMobile="isMobile"
      @toggle="sidebarOpen = !sidebarOpen"
    />

    <div 
      class="flex-1 flex flex-col transition-all duration-300"
      :class="[
        !isLoginPage && !isMobile ? 'md:ml-64 lg:ml-72' : ''
      ]"
    >
      <!-- Fixed navbar -->
      <div v-if="!hideNavBars" class="sticky top-0 z-30 w-full">
        <NavBar />
      </div>
      
      <!-- Main content area -->
      <div class="flex-1 overflow-y-auto bg-gray-50">
        <router-view />
      </div>
      
      <!-- Bottom nav - only visible on mobile -->
      <div v-if="!hideNavBars" class="sticky bottom-0  md:hidden">
        <BottomNav />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './components/NavBar.vue';
import BottomNav from './components/BottomNav.vue';
import AppSidebar from './components/AppSidebar.vue';

const route = useRoute();
const sidebarOpen = ref(false);
const isMobile = ref(false);

// Check if current page is login page
const isLoginPage = computed(() => {
  return route.path === '/account/login';
});

const hideNavBars = computed(() => {
  // Hide navbar on login, new item pages, and detail/edit pages
  return route.path === '/profile' || 
         route.path === '/issue/new' || 
         route.path === '/account/login' ||
         route.path.includes('/task/') ||
         route.path.includes('/issue/') ||
         route.path.includes('/timesheet/') ||
         (route.name && 
          (route.name.includes('Detail') || 
           route.name.includes('Edit')))
});

// Check screen size and set mobile state
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768; // Tailwind's md breakpoint
  // On desktop, sidebar is always open (except on login page)
  if (!isMobile.value && !isLoginPage.value) {
    sidebarOpen.value = true;
  } else {
    sidebarOpen.value = false;
  }
};

// Close sidebar when navigating to login page
watch(() => route.path, (newPath) => {
  if (newPath === '/account/login') {
    sidebarOpen.value = false;
  }
});

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  
  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/oms/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>