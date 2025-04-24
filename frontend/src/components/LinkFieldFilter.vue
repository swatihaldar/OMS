<template>
    <div class="relative">
      <!-- Search input shown when search is active -->
      <div v-if="showSearch" class="relative">
        <input
          v-model="searchQuery"
          type="text"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :placeholder="`Search ${field.label}...`"
          @input="filterOptions"
          @blur="closeSearchDelayed"
          ref="searchInput"
          autocomplete="off"
        />
        <button 
          v-if="searchQuery" 
          @click.stop="clearSearch" 
          class="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Dropdown select shown when search is not active -->
      <div v-else class="relative">
        <select
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @focus="openSearch"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
        >
          <option value="">All {{ field.label }}</option>
          <option v-for="option in filteredOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      <!-- Dropdown results when searching -->
      <div 
        v-if="showSearch && filteredOptions.length > 0" 
        class="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <div 
          v-for="option in filteredOptions" 
          :key="option.value" 
          @mousedown.prevent="selectOption(option)"
          class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {{ option.label }}
        </div>
      </div>
      
      <!-- No results message -->
      <div 
        v-if="showSearch && searchQuery && filteredOptions.length === 0" 
        class="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg p-3 text-sm text-gray-500"
      >
        No results found
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch, nextTick, onMounted } from 'vue';
  
  const props = defineProps({
    field: {
      type: Object,
      required: true
    },
    options: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: String,
      default: ''
    }
  });
  
  const emit = defineEmits(['update:modelValue']);
  
  // Local state
  const showSearch = ref(false);
  const searchQuery = ref('');
  const searchTimeout = ref(null);
  const searchInput = ref(null);
  
  // All available options
  const allOptions = computed(() => {
    return props.options || [];
  });
  
  // Filtered options based on search query
  const filteredOptions = computed(() => {
    if (!searchQuery.value) {
      return allOptions.value;
    }
    
    const query = searchQuery.value.toLowerCase();
    return allOptions.value.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  });
  
  // Watch for changes in modelValue to update the search query
  watch(() => props.modelValue, (newValue) => {
    if (newValue && !showSearch.value) {
      const selectedOption = allOptions.value.find(opt => opt.value === newValue);
      if (selectedOption) {
        searchQuery.value = selectedOption.label;
      }
    }
  }, { immediate: true });
  
  // Methods
  const openSearch = () => {
    showSearch.value = true;
    
    // Initialize search with current value's label if it exists
    if (props.modelValue) {
      const option = allOptions.value.find(opt => opt.value === props.modelValue);
      if (option) {
        searchQuery.value = option.label;
      }
    }
    
    // Focus the search input after it's rendered
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus();
      }
    });
  };
  
  const closeSearchDelayed = () => {
    setTimeout(() => {
      // If there's a selected value, update the filter
      if (searchQuery.value && filteredOptions.value.length > 0) {
        selectOption(filteredOptions.value[0]);
      } else if (!searchQuery.value) {
        // Clear the selection if search is empty
        emit('update:modelValue', '');
      }
      
      showSearch.value = false;
    }, 200);
  };
  
  const filterOptions = () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }
    
    searchTimeout.value = setTimeout(() => {
      // No additional action needed as filteredOptions is a computed property
    }, 300);
  };
  
  const selectOption = (option) => {
    emit('update:modelValue', option.value);
    searchQuery.value = option.label;
    showSearch.value = false;
  };
  
  const clearSearch = () => {
    searchQuery.value = '';
    emit('update:modelValue', '');
    
    // Focus back on the search input
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus();
      }
    });
  };
  
  onMounted(() => {
    // Initialize search query if there's a selected value
    if (props.modelValue) {
      const option = allOptions.value.find(opt => opt.value === props.modelValue);
      if (option) {
        searchQuery.value = option.label;
      }
    }
  });
  </script>