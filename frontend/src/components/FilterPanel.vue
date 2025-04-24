<template>
  <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-3 border filter-dropdown">
    <div v-if="statusField" class="mb-3">
      <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
      <select
        v-model="statusFilterValue"
        class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @change="emitStatusFilter"
      >
        <option value="">All Status</option>
        <option v-for="option in getStatusOptions()" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
    
    <!-- Additional Filters -->
    <div v-for="field in filterableFields" :key="field.fieldname" class="mb-3">
      <label class="block text-xs font-medium text-gray-700 mb-1">{{ field.label }}</label>
      
      <!-- Link field filter -->
      <select
        v-if="field.fieldtype === 'Link'"
        v-model="customFiltersValue[field.fieldname]"
        class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @change="emitCustomFilters"
      >
        <option value="">All {{ field.label }}</option>
        <option v-for="option in getLinkOptions(field)" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      
      <!-- Select field filter -->
      <select
        v-else-if="field.fieldtype === 'Select'"
        v-model="customFiltersValue[field.fieldname]"
        class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @change="emitCustomFilters"
      >
        <option value="">All {{ field.label }}</option>
        <option v-for="option in getSelectOptions(field)" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      
      <!-- Date field filter -->
      <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'" class="flex gap-2">
        <input
          v-model="dateFiltersValue[field.fieldname].from"
          type="date"
          class="w-1/2 border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="From"
          @change="emitDateFilters"
        />
        <input
          v-model="dateFiltersValue[field.fieldname].to"
          type="date"
          class="w-1/2 border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="To"
          @change="emitDateFilters"
        />
      </div>
      
      <!-- Text field filter -->
      <input
        v-else
        v-model="customFiltersValue[field.fieldname]"
        type="text"
        class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        :placeholder="`Filter by ${field.label}`"
        @input="emitCustomFilters"
      />
    </div>
    
    <!-- Assignment filter -->
    <div class="mb-3">
      <label class="block text-xs font-medium text-gray-700 mb-1">Assignment</label>
      <select
        v-model="assignmentFilterValue"
        class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @change="emitAssignmentFilter"
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
        v-model="sortOptionValue"
        class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @change="emitSortOption"
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
        @click="resetFilters" 
        class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
      >
        Reset
      </button>
      <button 
        @click="applyFilters" 
        class="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  statusField: {
    type: Object,
    default: null
  },
  filterableFields: {
    type: Array,
    required: true
  },
  sortableFields: {
    type: Array,
    required: true
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
  }
});

const emit = defineEmits([
  'update:statusFilter', 
  'update:customFilters', 
  'update:dateFilters', 
  'update:assignmentFilter', 
  'update:sortOption',
  'reset',
  'apply'
]);

// Local copies of the filter values
const statusFilterValue = ref(props.statusFilter);
const customFiltersValue = ref({ ...props.customFilters });
const dateFiltersValue = ref({ ...props.dateFilters });
const assignmentFilterValue = ref(props.assignmentFilter);
const sortOptionValue = ref(props.sortOption);

// Watch for prop changes to update local values
watch(() => props.statusFilter, (newValue) => {
  statusFilterValue.value = newValue;
});

watch(() => props.customFilters, (newValue) => {
  customFiltersValue.value = { ...newValue };
}, { deep: true });

watch(() => props.dateFilters, (newValue) => {
  dateFiltersValue.value = { ...newValue };
}, { deep: true });

watch(() => props.assignmentFilter, (newValue) => {
  assignmentFilterValue.value = newValue;
});

watch(() => props.sortOption, (newValue) => {
  sortOptionValue.value = newValue;
});

// Methods to emit updates
const emitStatusFilter = () => {
  emit('update:statusFilter', statusFilterValue.value);
};

const emitCustomFilters = () => {
  emit('update:customFilters', { ...customFiltersValue.value });
};

const emitDateFilters = () => {
  emit('update:dateFilters', { ...dateFiltersValue.value });
};

const emitAssignmentFilter = () => {
  emit('update:assignmentFilter', assignmentFilterValue.value);
};

const emitSortOption = () => {
  emit('update:sortOption', sortOptionValue.value);
};

// Helper methods
const getStatusOptions = () => {
  if (props.statusField && props.statusField.options) {
    return props.statusField.options.split('\n');
  }
  return ['Open', 'Closed', 'Resolved', 'On Hold', 'Replied'];
};

const getLinkOptions = (field) => {
  return props.linkFieldOptions[field.fieldname] || [];
};

const getSelectOptions = (field) => {
  if (field.options) {
    return field.options.split('\n');
  }
  return [];
};

// Action methods
const resetFilters = () => {
  statusFilterValue.value = '';
  customFiltersValue.value = {};
  
  // Reset date filters
  const resetDateFilters = {};
  for (const key in dateFiltersValue.value) {
    resetDateFilters[key] = { from: '', to: '' };
  }
  dateFiltersValue.value = resetDateFilters;
  
  assignmentFilterValue.value = '';
  sortOptionValue.value = 'creation desc';
  
  // Emit all updates
  emit('update:statusFilter', '');
  emit('update:customFilters', {});
  emit('update:dateFilters', resetDateFilters);
  emit('update:assignmentFilter', '');
  emit('update:sortOption', 'creation desc');
  
  // Emit reset event
  emit('reset');
};

const applyFilters = () => {
  // Emit all current values to ensure parent component has the latest
  emit('update:statusFilter', statusFilterValue.value);
  emit('update:customFilters', { ...customFiltersValue.value });
  emit('update:dateFilters', { ...dateFiltersValue.value });
  emit('update:assignmentFilter', assignmentFilterValue.value);
  emit('update:sortOption', sortOptionValue.value);
  
  // Emit apply event
  emit('apply');
};
</script>

<style scoped>
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