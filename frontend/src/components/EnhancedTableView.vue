<template>
  <div class="enhanced-table-container">
    <!-- Table Header with title and count -->
    <div class="flex justify-between items-center mb-2">
      <h4 class="text-sm font-medium text-gray-700">
        {{ label }} <span class="text-gray-500 text-xs">({{ filteredRows.length }} items)</span>
      </h4>
      <button 
        v-if="isCollapsible && filteredRows.length > 0" 
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
    <div v-if="filteredRows.length === 0" class="text-gray-500 italic text-sm p-3 bg-gray-50 rounded-lg">
      No items
    </div>

    <!-- Table View -->
    <div v-else-if="!isCollapsed" class="overflow-hidden rounded-lg border border-gray-200">
      <!-- Card View for Mobile -->
      <div class="md:hidden">
        <div 
          v-for="(row, rowIndex) in filteredRows" 
          :key="rowIndex"
          class="border-b border-gray-200 last:border-b-0 p-3 hover:bg-gray-50 cursor-pointer"
          @click="openRowDetails(row, rowIndex)"
        >
          <div class="flex justify-between items-center">
            <div class="font-medium text-blue-800">
              {{ getPrimaryColumnValue(row) }}
            </div>
            <div v-if="getSecondaryColumnValue(row)" class="text-gray-500 text-sm">
              {{ getSecondaryColumnValue(row) }}
            </div>
          </div>
          
          <div v-if="getPreviewFields().length > 0" class="mt-1 text-sm text-gray-600 grid grid-cols-2 gap-2">
            <div v-for="(field, fieldIndex) in getPreviewFields()" :key="fieldIndex" class="flex items-center">
              <!-- <span class="text-gray-500 mr-1">{{ field.label }}:</span> -->
              <!-- <span>{{ formatFieldValue(field, row[field.fieldname]) }}</span> -->
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
            v-for="(row, rowIndex) in filteredRows" 
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
              <template v-if="field.fieldtype === 'Check'">
                <span v-if="row[field.fieldname]" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg class="-ml-0.5 mr-1 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Yes
                </span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <svg class="-ml-0.5 mr-1 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  No
                </span>
              </template>
              
              <template v-else-if="field.fieldtype === 'Color'">
                <div class="flex items-center">
                  <div class="h-4 w-4 rounded mr-1" :style="{ backgroundColor: row[field.fieldname] || '#FFFFFF' }"></div>
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
              <button class="text-blue-600 hover:text-blue-800" @click.stop="openRowDetails(row, rowIndex)">
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
            <div v-if="!selectedRow || Object.keys(filteredDetailFields).length === 0" class="text-center py-8 text-gray-500">
              No data available for this item.
            </div>
            
            <div v-else class="space-y-4">
              <div 
                v-for="(value, fieldname) in filteredDetailFields" 
                :key="fieldname"
                class="border-b border-gray-100 pb-3 last:border-b-0"
              >
                <div class="text-sm font-medium text-gray-500 mb-1">
                  {{ getFieldLabel(fieldname) }}
                </div>
                <div class="text-blue-800 font-medium">
                  <template v-if="getFieldType(fieldname) === 'Check'">
                    <span v-if="value" class="text-green-600">Yes</span>
                    <span v-else class="text-red-600">No</span>
                  </template>
                  <template v-else-if="getFieldType(fieldname) === 'Color'">
                    <div class="flex items-center">
                      <div class="h-5 w-5 rounded mr-2" :style="{ backgroundColor: value || '#FFFFFF' }"></div>
                      <span>{{ value || '-' }}</span>
                    </div>
                  </template>
                  <template v-else-if="getFieldType(fieldname) === 'Date' || getFieldType(fieldname) === 'Datetime'">
                    {{ formatDate(value) || '-' }}
                  </template>
                  <template v-else-if="getFieldType(fieldname) === 'Currency' || getFieldType(fieldname) === 'Float'">
                    {{ value ? formatNumber(value) : '-' }}
                  </template>
                  <template v-else-if="getFieldType(fieldname) === 'Small Text' || getFieldType(fieldname) === 'Text' || getFieldType(fieldname) === 'Long Text'">
                    <div class="whitespace-pre-wrap bg-gray-50 p-2 rounded-md text-sm">
                      {{ value || '-' }}
                    </div>
                  </template>
                  <template v-else>
                    {{ value || '-' }}
                  </template>
                </div>
              </div>
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
import { shouldHideViewField } from '../config/field-config';

const props = defineProps({
  rows: { type: Array, default: () => [], required: true },
  fields: { type: Array, default: () => [] },
  label: { type: String, default: 'Items' },
  isCollapsible: { type: Boolean, default: false },
  doctype: { type: String, default: '' }
});

const isCollapsed = ref(false);
const showRowDetails = ref(false);
const selectedRow = ref(null);

const systemFields = [
  "name", "owner", "creation", "modified", 
  "modified_by", "docstatus", "idx",
  "parent", "parentfield", "parenttype"
];

const formatFieldLabel = (fieldname) => {
  return fieldname
    .replace(/^custom_/, '')
    .replace(/_/g, ' ')
    .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
    .trim();
};

const allFields = computed(() => {
  let fields = [];
  
  if (props.fields?.length > 0) {
    fields = props.fields.map(f => ({
      ...f,
      label: f.label || formatFieldLabel(f.fieldname)
    }));
  } else if (props.rows.length > 0 && typeof props.rows[0] === 'object') {
    fields = Object.keys(props.rows[0])
      .map(fieldname => ({
        fieldname,
        label: formatFieldLabel(fieldname),
        fieldtype: 'Data'
      }));
  }

  return fields
    .filter(field => !field.hidden)
    .filter(field => !systemFields.includes(field.fieldname))
    .filter(field => !shouldHideViewField(props.doctype, field.fieldname))
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
});

const filteredRows = computed(() => {
  return props.rows.map(row => {
    const filteredRow = {};
    for (const [fieldname, value] of Object.entries(row)) {
      if (!shouldHideViewField(props.doctype, fieldname) && !systemFields.includes(fieldname)) {
        filteredRow[fieldname] = value;
      }
    }
    return filteredRow;
  });
});

const visibleFields = computed(() => {
  const inListViewFields = allFields.value.filter(field => 
    field.in_list_view === true || 
    field.in_list_view === 1 || 
    field.in_list_view === '1'
  );
  return inListViewFields.length > 0 ? inListViewFields : allFields.value.slice(0, 4);
});

const filteredDetailFields = computed(() => {
  if (!selectedRow.value) return {};
  
  const result = {};
  for (const [fieldname, value] of Object.entries(selectedRow.value)) {
    if (!systemFields.includes(fieldname) && !shouldHideViewField(props.doctype, fieldname)) {
      const fieldType = getFieldType(fieldname);
      if (fieldType === 'Check' || value) {
        result[fieldname] = value;
      }
    }
  }
  return result;
});

const getFieldLabel = (fieldname) => {
  const field = allFields.value.find(f => f.fieldname === fieldname);
  return field?.label || formatFieldLabel(fieldname);
};

const getFieldType = (fieldname) => {
  const field = allFields.value.find(f => f.fieldname === fieldname);
  return field?.fieldtype || 'Data';
};

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
  selectedRow.value = JSON.parse(JSON.stringify(row));
  showRowDetails.value = true;
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
</style>