<template>
    <div>
      <!-- Backdrop -->
      <transition name="fade">
        <div 
          v-if="modelValue" 
          class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          @click="$emit('update:modelValue', false)"
        ></div>
      </transition>
  
      <!-- Bottom Sheet -->
      <transition name="slide-up">
        <div 
          v-if="modelValue" 
          class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
          :class="[fullScreen ? 'min-h-screen rounded-none' : 'max-w-3xl mx-auto']"
        >
          <!-- Handle for dragging -->
          <div class="w-full flex justify-center pt-2 pb-1 sticky top-0 bg-white z-10">
            <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
  
          <!-- Header -->
          <div class="px-4 py-3 flex items-center justify-between border-b sticky top-3 bg-white z-10">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button 
              @click="$emit('update:modelValue', false)" 
              class="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon class="h-6 w-6 text-gray-500" />
            </button>
          </div>
  
          <!-- Content -->
          <div class="p-4">
            <slot></slot>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { XMarkIcon } from '@heroicons/vue/24/outline';
  
  defineProps({
    modelValue: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: 'Details'
    },
    fullScreen: {
      type: Boolean,
      default: false
    }
  });
  
  defineEmits(['update:modelValue']);
  </script>
  
  <style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: transform 0.3s ease;
  }
  
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(100%);
  }
  </style>
  
  