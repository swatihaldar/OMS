<template>
  <div class="filter-dropdown-container">
    <div class="filter-dropdown bg-white rounded-lg shadow-lg p-3 border">
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
        
        <!-- Link field filter with search -->
        <div v-if="field.fieldtype === 'Link'" class="relative">
          <input
            v-model="linkSearchQueries[field.fieldname]"
            type="text"
            class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :placeholder="`Search ${field.label}...`"
            @focus="openLinkDropdown(field.fieldname)"
            @input="filterLinkOptions(field.fieldname)"
            @blur="closeLinkDropdownDelayed(field.fieldname)"
          />
          
          <!-- Dropdown for link options -->
          <div 
            v-if="activeLinkDropdown === field.fieldname"
            class="absolute z-[200] mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
          >
            <div 
              v-for="option in getFilteredLinkOptions(field)" 
              :key="option.value"
              class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
              @mousedown="selectLinkOption(field.fieldname, option.value, option.label)"
            >
              <span class="block truncate" :class="{'font-semibold': customFiltersValue[field.fieldname] === option.value}">
                {{ option.label }}
              </span>
              <span 
                v-if="customFiltersValue[field.fieldname] === option.value" 
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600"
              >
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
            </div>
            <div 
              v-if="getFilteredLinkOptions(field).length === 0" 
              class="py-2 px-3 text-gray-500 italic"
            >
              No results found
            </div>
            <div 
              class="py-2 px-3 text-blue-600 hover:bg-gray-100 cursor-pointer border-t"
              @mousedown="clearLinkOption(field.fieldname)"
            >
              Clear selection
            </div>
          </div>
        </div>
        
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"

const props = defineProps({
  statusField: {
    type: Object,
    default: null,
  },
  filterableFields: {
    type: Array,
    required: true,
  },
  sortableFields: {
    type: Array,
    required: true,
  },
  linkFieldOptions: {
    type: Object,
    default: () => ({}),
  },
  statusFilter: {
    type: String,
    default: "",
  },
  customFilters: {
    type: Object,
    default: () => ({}),
  },
  dateFilters: {
    type: Object,
    default: () => ({}),
  },
  assignmentFilter: {
    type: String,
    default: "",
  },
  sortOption: {
    type: String,
    default: "creation desc",
  },
})

const emit = defineEmits([
  "update:statusFilter",
  "update:customFilters",
  "update:dateFilters",
  "update:assignmentFilter",
  "update:sortOption",
  "reset",
  "apply",
])

// Local copies of the filter values
const statusFilterValue = ref(props.statusFilter)
const customFiltersValue = ref({ ...props.customFilters })
const dateFiltersValue = ref({ ...props.dateFilters })
const assignmentFilterValue = ref(props.assignmentFilter)
const sortOptionValue = ref(props.sortOption)

// For link field search functionality
const linkSearchQueries = ref({})
const activeLinkDropdown = ref(null)
const filteredLinkOptions = ref({})

// Initialize link search queries and filtered options
onMounted(() => {
  // Initialize link search queries with current values
  props.filterableFields.forEach(field => {
    if (field.fieldtype === 'Link' && customFiltersValue.value[field.fieldname]) {
      const options = props.linkFieldOptions[field.fieldname] || []
      const option = options.find(opt => opt.value === customFiltersValue.value[field.fieldname])
      if (option) {
        linkSearchQueries.value[field.fieldname] = option.label
      } else {
        linkSearchQueries.value[field.fieldname] = customFiltersValue.value[field.fieldname]
      }
    } else {
      linkSearchQueries.value[field.fieldname] = ''
    }
    
    // Initialize filtered options
    filteredLinkOptions.value[field.fieldname] = props.linkFieldOptions[field.fieldname] || []
  })
})

// Watch for prop changes to update local values
watch(
  () => props.statusFilter,
  (newValue) => {
    statusFilterValue.value = newValue
  },
)

watch(
  () => props.customFilters,
  (newValue) => {
    customFiltersValue.value = { ...newValue }
    
    // Update link search queries when custom filters change
    props.filterableFields.forEach(field => {
      if (field.fieldtype === 'Link' && newValue[field.fieldname]) {
        const options = props.linkFieldOptions[field.fieldname] || []
        const option = options.find(opt => opt.value === newValue[field.fieldname])
        if (option) {
          linkSearchQueries.value[field.fieldname] = option.label
        }
      }
    })
  },
  { deep: true },
)

watch(
  () => props.dateFilters,
  (newValue) => {
    dateFiltersValue.value = { ...newValue }
  },
  { deep: true },
)

watch(
  () => props.assignmentFilter,
  (newValue) => {
    assignmentFilterValue.value = newValue
  },
)

watch(
  () => props.sortOption,
  (newValue) => {
    sortOptionValue.value = newValue
  },
)

// Link field dropdown handling
const openLinkDropdown = (fieldname) => {
  activeLinkDropdown.value = fieldname
  filterLinkOptions(fieldname)
}

const closeLinkDropdownDelayed = (fieldname) => {
  setTimeout(() => {
    if (activeLinkDropdown.value === fieldname) {
      activeLinkDropdown.value = null
    }
  }, 200)
}

const filterLinkOptions = (fieldname) => {
  const searchQuery = linkSearchQueries.value[fieldname] || ''
  const options = props.linkFieldOptions[fieldname] || []
  
  if (!searchQuery) {
    filteredLinkOptions.value[fieldname] = options
  } else {
    filteredLinkOptions.value[fieldname] = options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
}

const getFilteredLinkOptions = (field) => {
  return filteredLinkOptions.value[field.fieldname] || []
}

const selectLinkOption = (fieldname, value, label) => {
  customFiltersValue.value[fieldname] = value
  linkSearchQueries.value[fieldname] = label
  emitCustomFilters()
  activeLinkDropdown.value = null
}

const clearLinkOption = (fieldname) => {
  customFiltersValue.value[fieldname] = ''
  linkSearchQueries.value[fieldname] = ''
  emitCustomFilters()
  activeLinkDropdown.value = null
}

// Methods to emit updates
const emitStatusFilter = () => {
  emit("update:statusFilter", statusFilterValue.value)
}

const emitCustomFilters = () => {
  emit("update:customFilters", { ...customFiltersValue.value })
}

const emitDateFilters = () => {
  emit("update:dateFilters", { ...dateFiltersValue.value })
}

const emitAssignmentFilter = () => {
  emit("update:assignmentFilter", assignmentFilterValue.value)
}

const emitSortOption = () => {
  emit("update:sortOption", sortOptionValue.value)
}

// Helper methods
const getStatusOptions = () => {
  if (props.statusField && props.statusField.options) {
    return props.statusField.options.split("\n")
  }
  return ["Open", "Closed", "Resolved", "On Hold", "Replied"]
}

const getLinkOptions = (field) => {
  return props.linkFieldOptions[field.fieldname] || []
}

const getSelectOptions = (field) => {
  if (field.options) {
    return field.options.split("\n")
  }
  return []
}

// Action methods
const resetFilters = () => {
  statusFilterValue.value = ""
  customFiltersValue.value = {}
  linkSearchQueries.value = {}

  // Reset date filters
  const resetDateFilters = {}
  for (const key in dateFiltersValue.value) {
    resetDateFilters[key] = { from: "", to: "" }
  }
  dateFiltersValue.value = resetDateFilters

  assignmentFilterValue.value = ""
  sortOptionValue.value = "creation desc"

  // Emit all updates
  emit("update:statusFilter", "")
  emit("update:customFilters", {})
  emit("update:dateFilters", resetDateFilters)
  emit("update:assignmentFilter", "")
  emit("update:sortOption", "creation desc")

  // Emit reset event
  emit("reset")
}

const applyFilters = () => {
  // Emit all current values to ensure parent component has the latest
  emit("update:statusFilter", statusFilterValue.value)
  emit("update:customFilters", { ...customFiltersValue.value })
  emit("update:dateFilters", { ...dateFiltersValue.value })
  emit("update:assignmentFilter", assignmentFilterValue.value)
  emit("update:sortOption", sortOptionValue.value)

  // Emit apply event
  emit("apply")
}

</script>

<style scoped>
.filter-dropdown-container {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  width: 16rem; /* w-64 */
  z-index: 9999; /* Much higher z-index to ensure it's above everything */
}

.filter-dropdown {
  width: 100%;
}

@media (max-width: 640px) {
  .filter-dropdown-container {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    margin: 0;
    z-index: 9999; /* Much higher z-index */
  }
  
  .filter-dropdown {
    max-height: 80vh;
    overflow-y: auto;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
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