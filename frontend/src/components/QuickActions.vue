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
      
      <!-- <button @click="$router.push('/profile')" 
              class="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 flex items-center transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-md">
        <div class="bg-purple-500 bg-opacity-30 p-2 rounded-lg mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span class="font-medium">My Profile</span>
      </button> -->
    </div>
  </div>
</template>
  
<script setup>
import { useRouter } from 'vue-router';
  
const router = useRouter();
</script>

