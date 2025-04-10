<template>
  <div class="bg-white border-t border-gray-200 flex justify-around items-center h-12 sm:h-16 mb-1">
    <router-link to="/" class="flex flex-col items-center justify-center w-full h-full" active-class="text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span class="text-[10px] mt-0.5">Home</span>
    </router-link>
    
    <router-link to="/task" class="flex flex-col items-center justify-center w-full h-full" active-class="text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      <span class="text-[10px] mt-0.5">Tasks</span>
    </router-link>
    
    <div class="relative flex flex-col items-center w-full">
      <button @click="toggleActionMenu" class="absolute -top-6 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-6 w-6 transition-transform duration-300" 
          :class="{ 'rotate-45': showActionMenu }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <div class="h-5 w-5 opacity-0"><!-- Spacer --></div>
      <span class="text-[10px] mt-0.5 opacity-0">Add</span>
    </div>
    
    <router-link to="/issue" class="flex flex-col items-center justify-center w-full h-full" active-class="text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
      <span class="text-[10px] mt-0.5">Issues</span>
    </router-link>
    
    <router-link to="/profile" class="flex flex-col items-center justify-center w-full h-full" active-class="text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span class="text-[10px] mt-0.5">Profile</span>
    </router-link>
  </div>
  
  <!-- Action Menu Popup -->
  <div 
    v-if="showActionMenu" 
    class="fixed inset-0 bg-black bg-opacity-30 z-40"
    @click="showActionMenu = false"
  >
    <div class="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl w-56 overflow-hidden">
      <div 
        @click="navigateTo('/issue/new')" 
        class="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
      >
        <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <span class="font-medium text-sm">Create Issue</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      <div 
        @click="navigateTo('/task/new')" 
        class="flex items-center px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
      >
        <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span class="font-medium text-sm">Create Task</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showActionMenu = ref(false);

const toggleActionMenu = () => {
  showActionMenu.value = !showActionMenu.value;
};

const navigateTo = (path) => {
  showActionMenu.value = false;
  router.push(path);
};
</script>