<template>
  <div class="enhanced-table-container">
    <!-- Table Header with title and count -->
    <div class="flex justify-between items-center mb-2">
      <h4 class="text-sm font-medium text-gray-700">
        {{ label }} <span class="text-gray-500 text-xs">({{ rows.length }} items)</span>
      </h4>
      <button 
        v-if="isCollapsible && rows.length > 0" 
        @click="isCollapsed = !isCollapsed"
        class="text-blue-600 text-sm flex items-center"
      >
        <span v-if="isCollapsed">Show</span>
        <span v-else>Hide</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-4 w-4 ml-1" 
          :class="{'transform rotate-180': !isCollapsed}"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="rows.length === 0" class="text-gray-500 italic text-sm p-3 bg-gray-50 rounded-lg">
      No items
    </div>

    <!-- Table View -->
    <div v-else-if="!isCollapsed" class="overflow-hidden rounded-lg border border-gray-200">
      <!-- Card View for Mobile -->
      <div class="md:hidden">
        <div 
          v-for="(row, rowIndex) in rows" 
          :key="rowIndex"
          class="border-b border-gray-200 last:border-b-0 p-3 hover:bg-gray-50 cursor-pointer"
          @click="openRowDetails(row, rowIndex)"
        >
          <div class="flex justify-between items-center">
            <!-- Primary column (first visible field) -->
            <div class="font-medium text-blue-800">
              {{ getPrimaryColumnValue(row) }}
            </div>
            
            <!-- Secondary info (second visible field if available) -->
            <div v-if="getSecondaryColumnValue(row)" class="text-gray-500 text-sm">
              {{ getSecondaryColumnValue(row) }}
            </div>
          </div>
          
          <!-- Preview of other fields (up to 2) -->
          <div class="mt-1 text-sm text-gray-600 grid grid-cols-2 gap-2">
            <div v-for="(field, fieldIndex) in getPreviewFields()" :key="fieldIndex" class="flex items-center">
              <span class="text-gray-500 mr-1">{{ field.label }}:</span>
              <span>{{ formatFieldValue(field, row[field.fieldname]) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View for Desktop -->
      <table class="min-w-full divide-y divide-gray-200 hidden md:table">
        <thead class="bg-gray-50">
          <tr>
            <th 
              v-for="field in visibleFields" 
              :key="field.fieldname" 
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              :style="getColumnStyle(field)"
            >
              {{ field.label }}
            </th>
            <th class="w-10 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="(row, rowIndex) in rows" 
            :key="rowIndex"
            class="hover:bg-gray-50 cursor-pointer"
            @click="openRowDetails(row, rowIndex)"
          >
            <td 
              v-for="field in visibleFields" 
              :key="field.fieldname" 
              class="px-3 py-2 text-sm"
              :style="getColumnStyle(field)"
            >
              <!-- Different display formats based on field type -->
              <template v-if="field.fieldtype === 'Check'">
                <span
                  v-if="row[field.fieldname]"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  <svg
                    class="-ml-0.5 mr-1 h-2 w-2 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Yes
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  <svg
                    class="-ml-0.5 mr-1 h-2 w-2 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  No
                </span>
              </template>
              
              <template v-else-if="field.fieldtype === 'Color'">
                <div class="flex items-center">
                  <div 
                    class="h-4 w-4 rounded mr-1" 
                    :style="{ backgroundColor: row[field.fieldname] || '#FFFFFF' }"
                  ></div>
                  <span>{{ row[field.fieldname] }}</span>
                </div>
              </template>
              
              <template v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                {{ formatDate(row[field.fieldname]) }}
              </template>

              <template v-else-if="field.fieldtype === 'Currency' || field.fieldtype === 'Float'">
                <span class="font-medium">{{ formatNumber(row[field.fieldname]) }}</span>
              </template>
              
              <template v-else-if="field.fieldtype === 'Link'">
                <span class="text-blue-600">{{ row[field.fieldname] }}</span>
              </template>
              
              <template v-else>
                {{ row[field.fieldname] || '-' }}
              </template>
            </td>
            <td class="px-3 py-2 text-right">
              <button 
                class="text-blue-600 hover:text-blue-800"
                @click.stop="openRowDetails(row, rowIndex)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Row Details Modal -->
    <teleport to="body">
      <div 
        v-if="showRowDetails && selectedRow" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-[9999]"
        @click.self="showRowDetails = false"
      >
        <div class="bg-white rounded-t-lg md:rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 class="text-lg font-medium text-gray-900">{{ label }} Details</h3>
            <button @click="showRowDetails = false" class="text-gray-400 hover:text-gray-500">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
            <div class="space-y-4">
              <template v-for="field in allFields" :key="field.fieldname">
                <div class="border-b border-gray-100 pb-3 last:border-b-0">
                  <div class="text-sm font-medium text-gray-500 mb-1">
                    {{ field.label || field.fieldname }}
                  </div>
                  
                  <div class="text-blue-800 font-medium">
                    <template v-if="field.fieldtype === 'Check'">
                      <span v-if="selectedRow[field.fieldname]" class="text-green-600">Yes</span>
                      <span v-else class="text-red-600">No</span>
                    </template>
                    
                    <template v-else-if="field.fieldtype === 'Color'">
                      <div class="flex items-center">
                        <div 
                          class="h-5 w-5 rounded mr-2" 
                          :style="{ backgroundColor: selectedRow[field.fieldname] || '#FFFFFF' }"
                        ></div>
                        <span>{{ selectedRow[field.fieldname] || '-' }}</span>
                      </div>
                    </template>
                    
                    <template v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                      {{ formatDate(selectedRow[field.fieldname]) || '-' }}
                    </template>

                    <template v-else-if="field.fieldtype === 'Currency' || field.fieldtype === 'Float'">
                      {{ selectedRow[field.fieldname] ? formatNumber(selectedRow[field.fieldname]) : '-' }}
                    </template>
                    
                    <template v-else-if="field.fieldtype === 'Small Text' || field.fieldtype === 'Text' || field.fieldtype === 'Long Text'">
                      <div class="whitespace-pre-wrap bg-gray-50 p-2 rounded-md text-sm">
                        {{ selectedRow[field.fieldname] || '-' }}
                      </div>
                    </template>
                    
                    <template v-else>
                      {{ selectedRow[field.fieldname] || '-' }}
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </div>
          
          <div class="px-4 py-3 bg-gray-50 flex justify-end border-t">
            <button 
              @click="showRowDetails = false" 
              class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
    required: true
  },
  fields: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: 'Items'
  },
  isCollapsible: {
    type: Boolean,
    default: false
  }
});

// State
const isCollapsed = ref(false);
const showRowDetails = ref(false);
const selectedRow = ref(null);
const selectedRowIndex = ref(-1);

// Computed properties
const allFields = computed(() => {
  // If fields are provided, use them (filtering out system fields)
  if (props.fields && props.fields.length > 0) {
    return props.fields.filter(field => 
      !field.hidden && 
      ![
        "name", "owner", "creation", "modified", 
        "modified_by", "docstatus", "idx",
        "parent", "parentfield", "parenttype"
      ].includes(field.fieldname)
    ).sort((a, b) => (a.idx || 0) - (b.idx || 0));
  }
  
  // If no fields provided but we have rows, infer fields from first row
  if (props.rows.length > 0 && typeof props.rows[0] === 'object') {
    return Object.keys(props.rows[0]).map(fieldname => ({
      fieldname,
      label: fieldname.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      fieldtype: 'Data' // Default type
    }));
  }
  
  return [];
});

const visibleFields = computed(() => {
  // Get fields marked for list view
  const inListViewFields = allFields.value.filter(field => 
    field.in_list_view === true || 
    field.in_list_view === 1 || 
    field.in_list_view === '1'
  );
  
  if (inListViewFields.length > 0) {
    return inListViewFields;
  }
  
  // Otherwise return first 4 fields
  return allFields.value.slice(0, 4);
});

// Methods
const getColumnStyle = (field) => {
  const style = {};
  if (field.fieldtype === 'Check') style.width = '80px';
  else if (field.fieldtype === 'Int' || field.fieldtype === 'Float') style.width = '100px';
  else if (field.fieldtype === 'Date') style.width = '120px';
  else if (field.fieldtype === 'Color') style.width = '120px';
  else if (field.fieldtype === 'Small Text') style.minWidth = '200px';
  return style;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatNumber = (value) => {
  if (value === undefined || value === null || value === '') return '';
  try {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch {
    return value;
  }
};

const formatFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '-';
  switch (field.fieldtype) {
    case 'Check': return value ? 'Yes' : 'No';
    case 'Date':
    case 'Datetime': return formatDate(value);
    case 'Currency':
    case 'Float':
    case 'Percent': return formatNumber(value);
    default: return value;
  }
};

const getPrimaryColumnValue = (row) => {
  if (visibleFields.value.length > 0) {
    const field = visibleFields.value[0];
    return formatFieldValue(field, row[field.fieldname]);
  }
  return '';
};

const getSecondaryColumnValue = (row) => {
  if (visibleFields.value.length > 1) {
    const field = visibleFields.value[1];
    return formatFieldValue(field, row[field.fieldname]);
  }
  return '';
};

const getPreviewFields = () => {
  if (visibleFields.value.length > 2) {
    return visibleFields.value.slice(2, 4);
  }
  return [];
};

const openRowDetails = (row, index) => {
  console.log('Opening row details:', row);
  selectedRow.value = { ...row }; // Create a shallow copy
  selectedRowIndex.value = index;
  showRowDetails.value = true;
  
  // Debug logs
  console.log('All fields:', allFields.value);
  console.log('Selected row data:', selectedRow.value);
};
</script>

<style scoped>
.enhanced-table-container {
  margin-bottom: 1rem;
  position: relative;
}

@media (max-width: 768px) {
  .enhanced-table-container {
    margin-left: -1rem;
    margin-right: -1rem;
    width: calc(100% + 2rem);
  }
}

.max-h-\[90vh\] {
  max-height: 90vh;
}

.max-h-\[calc\(90vh-4rem\)\] {
  max-height: calc(90vh - 4rem);
}
</style>