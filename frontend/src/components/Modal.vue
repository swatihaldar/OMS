<template>
    <div class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
      <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
  
        <!-- Modal panel -->
        <div class="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div class="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              @click="$emit('close')"
            >
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <slot></slot>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { XMarkIcon } from '@heroicons/vue/24/outline';


  
  const emit = defineEmits(['close']);
  
  const handleBackdropClick = (event) => {
    // Close modal when clicking outside
    if (event.target === event.currentTarget) {
      emit('close');
    }
  };
  </script>
  
  