<template>
    <div class="bg-white rounded-xl shadow-md p-6 h-full">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 gap-4">
        <button @click="$router.push('/issue/new')" 
                class="bg-blue-600 text-white rounded-xl p-4 flex items-center transition-all hover:bg-blue-700 hover:shadow-lg">
          <div class="bg-blue-500 p-2 rounded-lg mr-4">
            <PlusCircleIcon class="h-6 w-6" />
          </div>
          <span class="font-medium">New Issue</span>
        </button>
        
        <button @click="$router.push('/issue')" 
                class="bg-gray-100 text-gray-800 rounded-xl p-4 flex items-center transition-all hover:bg-gray-200 hover:shadow-md">
          <div class="bg-gray-200 p-2 rounded-lg mr-4">
            <Bars3Icon class="h-6 w-6" />
          </div>
          <span class="font-medium">View Issues</span>
        </button>
        
        <!-- <button @click="$router.push('/reports')" 
                class="bg-indigo-50 text-indigo-800 rounded-xl p-4 flex items-center transition-all hover:bg-indigo-100 hover:shadow-md">
          <div class="bg-indigo-100 p-2 rounded-lg mr-4">
            <ChartBarIcon class="h-6 w-6" />
          </div>
          <span class="font-medium">Reports</span>
        </button> -->
      </div>
    </div>
  </template>
  
  <script setup>
  import { PlusCircleIcon, Bars3Icon, ChartBarIcon } from '@heroicons/vue/24/outline';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  </script>
  