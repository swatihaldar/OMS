<template>
    <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-3 border filter-dropdown">
      <div v-if="statusField" class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
        <select
          :value="statusFilter"
          @input="$emit('update:status-filter', $event.target.value)"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option v-for="option in getStatusOptions()" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
      
      <!-- Additional Filters -->
      <div v-for="field in fields" :key="field.fieldname" class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">{{ field.label }}</label>
        
        <!-- Link field filter with search -->
        <div v-if="field.fieldtype === 'Link'" class="relative">
          <input
            v-if="showLinkSearch[field.fieldname]"
            v-model="linkSearchQueries[field.fieldname]"
            type="text"
            class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :placeholder="`Search ${field.label}...`"
            @input="filterLinkOptions(field.fieldname)"
            @blur="closeLinkSearchDelayed(field.fieldname)"
          />
          
          <select
            v-else
            :value="customFilters[field.fieldname]"
            @input="updateCustomFilter(field.fieldname, $event.target.value)"
            @focus="openLinkSearch(field.fieldname)"
            class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All {{ field.label }}</option>
            <option v-for="option in getFilteredLinkOptions(field)" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <!-- Select field filter -->
        <select
          v-else-if="field.fieldtype === 'Select'"
          :value="customFilters[field.fieldname]"
          @input="updateCustomFilter(field.fieldname, $event.target.value)"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All {{ field.label }}</option>
          <option v-for="option in getSelectOptions(field)" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        
        <!-- Date field filter -->
        <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'" class="flex gap-2">
          <input
            :value="dateFilters[field.fieldname]?.from"
            @input="updateDateFilter(field.fieldname, 'from', $event.target.value)"
            type="date"
            class="w-1/2 border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="From"
          />
          <input
            :value="dateFilters[field.fieldname]?.to"
            @input="updateDateFilter(field.fieldname, 'to', $event.target.value)"
            type="date"
            class="w-1/2 border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="To"
          />
        </div>
        
        <!-- Text field filter -->
        <input
          v-else
          :value="customFilters[field.fieldname]"
          @input="updateCustomFilter(field.fieldname, $event.target.value)"
          type="text"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :placeholder="`Filter by ${field.label}`"
        />
      </div>
      
      <!-- Assignment filter -->
      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Assignment</label>
        <select
          :value="assignmentFilter"
          @input="$emit('update:assignment-filter', $event.target.value)"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Records</option>
          <option value="assigned_to_me">Assigned to Me</option>
          <option value="created_by_me">Created by Me</option>
          <option value="both">Both</option>
        </select>
      </div>
      
      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
        <select
          :value="sortOption"
          @input="$emit('update:sort-option', $event.target.value)"
          class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="creation desc">Newest First</option>
          <option value="creation asc">Oldest First</option>
          <option v-for="field in sortableFields" :key="field.fieldname" :value="`${field.fieldname} asc`">
            {{ field.label }} (A-Z)
          </option>
          <option v-for="field in sortableFields" :key="`${field.fieldname}-desc`" :value="`${field.fieldname} desc`">
            {{ field.label }} (Z-A)
          </option>
        </select>
      </div>
      
      <div class="flex justify-between">
        <button 
          @click="$emit('reset')" 
          class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
        >
          Reset
        </button>
        <button 
          @click="$emit('apply')" 
          class="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  const props = defineProps({
    doctype: {
      type: String,
      required: true
    },
    fields: {
      type: Array,
      required: true
    },
    statusField: {
      type: Object,
      default: null
    },
    linkFieldOptions: {
      type: Object,
      default: () => ({})
    },
    statusFilter: {
      type: String,
      default: ''
    },
    customFilters: {
      type: Object,
      default: () => ({})
    },
    dateFilters: {
      type: Object,
      default: () => ({})
    },
    assignmentFilter: {
      type: String,
      default: ''
    },
    sortOption: {
      type: String,
      default: 'creation desc'
    },
    sortableFields: {
      type: Array,
      default: () => []
    }
  });
  
  const emit = defineEmits([
    'update:status-filter',
    'update:custom-filters',
    'update:date-filters',
    'update:assignment-filter',
    'update:sort-option',
    'apply',
    'reset',
    'close'
  ]);
  
  // Local state for link field search
  const showLinkSearch = ref({});
  const linkSearchQueries = ref({});
  const filteredLinkOptions = ref({});
  const searchTimeouts = ref({});
  
  // Initialize filtered options with all options
  for (const field of props.fields) {
    if (field.fieldtype === 'Link') {
      const options = props.linkFieldOptions[field.fieldname] || [];
      filteredLinkOptions.value[field.fieldname] = [...options];
      linkSearchQueries.value[field.fieldname] = '';
      showLinkSearch.value[field.fieldname] = false;
    }
  }
  
  const getStatusOptions = () => {
    if (props.statusField && props.statusField.options) {
      return props.statusField.options.split('\n');
    }
    return ['Open', 'Closed', 'Resolved', 'On Hold', 'Replied'];
  };
  
  const getSelectOptions = (field) => {
    if (field.options) {
      return field.options.split('\n');
    }
    return [];
  };
  
  const getFilteredLinkOptions = (field) => {
    return filteredLinkOptions.value[field.fieldname] || 
           props.linkFieldOptions[field.fieldname] || [];
  };
  
  const filterLinkOptions = (fieldname) => {
    if (searchTimeouts.value[fieldname]) {
      clearTimeout(searchTimeouts.value[fieldname]);
    }
    
    searchTimeouts.value[fieldname] = setTimeout(() => {
      const query = linkSearchQueries.value[fieldname]?.toLowerCase() || '';
      const allOptions = props.linkFieldOptions[fieldname] || [];
      
      if (!query) {
        filteredLinkOptions.value[fieldname] = [...allOptions];
        return;
      }
      
      filteredLinkOptions.value[fieldname] = allOptions.filter(option => 
        option.label.toLowerCase().includes(query)
      );
    }, 300);
  };
  
  const openLinkSearch = (fieldname) => {
    showLinkSearch.value[fieldname] = true;
    
    // Initialize search with current value's label if it exists
    if (props.customFilters[fieldname]) {
      const options = props.linkFieldOptions[fieldname] || [];
      const option = options.find(opt => opt.value === props.customFilters[fieldname]);
      if (option) {
        linkSearchQueries.value[fieldname] = option.label;
        filterLinkOptions(fieldname);
      }
    }
  };
  
  const closeLinkSearchDelayed = (fieldname) => {
    setTimeout(() => {
      // If there's a selected value, update the filter
      if (linkSearchQueries.value[fieldname]) {
        const options = filteredLinkOptions.value[fieldname] || [];
        if (options.length > 0) {
          // Select the first matching option
          updateCustomFilter(fieldname, options[0].value);
        }
      }
      
      showLinkSearch.value[fieldname] = false;
    }, 200);
  };
  
  const updateCustomFilter = (fieldname, value) => {
    const newFilters = { ...props.customFilters, [fieldname]: value };
    emit('update:custom-filters', newFilters);
  };
  
  const updateDateFilter = (fieldname, type, value) => {
    const currentDateFilter = props.dateFilters[fieldname] || { from: '', to: '' };
    const newDateFilter = { ...currentDateFilter, [type]: value };
    
    const newDateFilters = { ...props.dateFilters, [fieldname]: newDateFilter };
    emit('update:date-filters', newDateFilters);
  };
  </script>
  
  <style scoped>
  /* Mobile styles */
  @media (max-width: 640px) {
    .filter-dropdown {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      top: auto;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      margin: 0;
      border-radius: 1rem 1rem 0 0;
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 100;
    }
    
    .filter-dropdown::before {
      content: '';
      display: block;
      width: 40px;
      height: 4px;
      background-color: #cbd5e0;
      border-radius: 2px;
      margin: 0.5rem auto 1rem;
    }
  }
  </style>