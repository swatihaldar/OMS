<template>
  <div class="bg-white rounded-xl shadow-md p-6 h-full">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
    <div class="grid grid-cols-1 gap-4">
      <button @click="$router.push('/issue/new')" 
              class="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 flex items-center transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg">
        <div class="bg-blue-500 bg-opacity-30 p-2 rounded-lg mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span class="font-medium">New Issue</span>
      </button>
      
      <button @click="$router.push('/issue')" 
              class="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl p-4 flex items-center transition-all hover:from-gray-200 hover:to-gray-300 hover:shadow-md">
        <div class="bg-gray-500 bg-opacity-10 p-2 rounded-lg mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
        <span class="font-medium">View Issues</span>
      </button>
      
      <button @click="$router.push('/task')" 
              class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 flex items-center transition-all hover:from-green-600 hover:to-green-700 hover:shadow-md">
        <div class="bg-green-500 bg-opacity-30 p-2 rounded-lg mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span class="font-medium">View Tasks</span>
      </button>
    </div>
  </div>
</template>
  
<script setup>
import { useRouter } from 'vue-router';
  
const router = useRouter();
</script>

