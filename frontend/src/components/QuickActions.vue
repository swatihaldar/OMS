<template>
  <div>
    <!-- Quick Actions Grid -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">What would you like to do?</h2>
      
      <div class="grid grid-cols-3 gap-3">
        <!-- Issue Button -->
        <div @click="$router.push('/issue')" class="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center justify-center aspect-square hover:shadow-md transition-all cursor-pointer">
          <div class="w-12 h-12 flex items-center justify-center text-blue-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <span class="text-sm font-medium text-center">Issue</span>
        </div>
        
        <!-- Task Button -->
        <div @click="$router.push('/task')" class="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center justify-center aspect-square hover:shadow-md transition-all cursor-pointer">
          <div class="w-12 h-12 flex items-center justify-center text-purple-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span class="text-sm font-medium text-center">Task</span>
        </div>
        
  
        
      </div>
    </div>
    
    <!-- Floating Action Button -->
    <!-- <div class="fixed bottom-16 right-4 z-30">
      <button 
        @click="toggleActionMenu" 
        class="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-8 w-8 transition-transform duration-300" 
          :class="{ 'rotate-45': showActionMenu }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div> -->
    
    <!-- Action Menu Popup -->
    <!-- <div 
      v-if="showActionMenu" 
      class="fixed inset-0 bg-black bg-opacity-30 z-20"
      @click="showActionMenu = false"
    >
      <div class="absolute bottom-32 right-4 bg-white rounded-lg shadow-xl w-64 overflow-hidden">
       
        <div 
          @click="navigateTo('/issue/new')" 
          class="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
        >
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <span class="font-medium">Create Issue</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        
        <div 
          @click="navigateTo('/task/new')" 
          class="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
        >
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span class="font-medium">Create Task</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
      </div>
    </div> -->
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