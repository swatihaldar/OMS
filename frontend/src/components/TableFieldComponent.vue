<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
      <span v-if="description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="hidden group-hover:block absolute bg-black text-white text-xs rounded p-2 z-50 w-48">
          {{ description }}
        </span>
      </span>
    </label>

    <!-- Table Display -->
    <div class="border rounded-lg overflow-hidden mb-2">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th v-for="field in visibleFields" :key="field.fieldname" 
                class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ field.label }}
            </th>
            <th v-if="!isReadOnly" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(row, index) in modelValue || []" :key="index">
            <td v-for="field in visibleFields" :key="field.fieldname" class="px-3 py-2 text-sm text-gray-900">
              <!-- Different display formats based on field type -->
              <template v-if="field.fieldtype === 'Check'">
                <span v-if="row[field.fieldname]" class="text-green-600">Yes</span>
                <span v-else class="text-red-600">No</span>
              </template>
              <template v-else-if="field.fieldtype === 'Link'">
                {{ getLinkDisplayValue(field, row[field.fieldname]) }}
              </template>
              <template v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                {{ formatDate(row[field.fieldname]) }}
              </template>
              <template v-else-if="field.fieldtype === 'Small Text'">
                <div class="whitespace-pre-line max-h-20 overflow-y-auto">{{ row[field.fieldname] }}</div>
              </template>
              <template v-else>
                {{ row[field.fieldname] }}
              </template>
            </td>
            <td v-if="!isReadOnly" class="px-3 py-2 text-sm text-right">
              <button @click="editRow(index)" class="text-blue-600 hover:text-blue-800 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="deleteRow(index)" class="text-red-600 hover:text-red-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-5 0h10" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!(modelValue || []).length">
            <td :colspan="visibleFields.length + (!isReadOnly ? 1 : 0)" class="px-3 py-4 text-center text-gray-500">
              No items added
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Button -->
    <button 
      v-if="!isReadOnly" 
      @click="openAddRowModal" 
      class="mt-2 inline-flex items-center px-3 py-2 border border-blue-600 text-sm leading-4 font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Row
    </button>

    <!-- Modal for Add/Edit -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Edit Row' : 'Add New Row' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <template v-for="(field, index) in visibleFields" :key="field.fieldname">
              <!-- Section Break -->
              <div v-if="field.fieldtype === 'Section Break'" class="col-span-1 md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                <h4 v-if="field.label" class="text-base font-medium text-gray-900 mb-2">{{ field.label }}</h4>
              </div>

              <!-- Column Break -->
              <div v-else-if="field.fieldtype === 'Column Break'" class="hidden md:block">
                <!-- Column break marker -->
              </div>

              <!-- Regular fields -->
              <div v-else class="col-span-1" :class="{'md:col-span-2': field.fieldtype === 'Text Editor' || field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'}">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                </label>

                <!-- Link fields -->
                <select 
                  v-if="field.fieldtype === 'Link'"
                  v-model="currentRow[field.fieldname]"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select {{ field.label }}</option>
                  <option 
                    v-for="option in linkOptions[field.fieldname] || []" 
                    :key="option.value" 
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>

                <!-- Select fields -->
                <select 
                  v-else-if="field.fieldtype === 'Select'"
                  v-model="currentRow[field.fieldname]"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select {{ field.label }}</option>
                  <option 
                    v-for="option in getSelectOptions(field)" 
                    :key="option" 
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>

                <!-- Date fields -->
                <input 
                  v-else-if="field.fieldtype === 'Date'"
                  v-model="currentRow[field.fieldname]"
                  type="date"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />

                <!-- Datetime fields -->
                <input 
                  v-else-if="field.fieldtype === 'Datetime'"
                  v-model="currentRow[field.fieldname]"
                  type="datetime-local"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />

                <!-- Checkbox fields -->
                <div v-else-if="field.fieldtype === 'Check'" class="flex items-center">
                  <input 
                    v-model="currentRow[field.fieldname]"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700">{{ field.label }}</span>
                </div>

                <!-- Text area fields -->
                <textarea 
                  v-else-if="field.fieldtype === 'Small Text' || field.fieldtype === 'Long Text'"
                  v-model="currentRow[field.fieldname]"
                  :rows="field.fieldtype === 'Long Text' ? 4 : 2"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>

                <!-- Number fields -->
                <input 
                  v-else-if="field.fieldtype === 'Int' || field.fieldtype === 'Float' || field.fieldtype === 'Currency' || field.fieldtype === 'Percent'"
                  v-model="currentRow[field.fieldname]"
                  :type="field.fieldtype === 'Int' ? 'number' : 'text'"
                  :step="field.fieldtype === 'Int' ? '1' : '0.01'"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />

                <!-- Default text input -->
                <input 
                  v-else
                  v-model="currentRow[field.fieldname]"
                  type="text"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </template>
          </div>
        </div>
        
        <div class="px-4 py-3 bg-gray-50 text-right">
          <button 
            @click="closeModal" 
            class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
          >
            Cancel
          </button>
          <button 
            @click="saveRow" 
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {{ isEditing ? 'Update' : 'Add' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchChildTableFields, fetchLinkOption } from '@/utils/api';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  fieldname: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  childDoctype: {
    type: String,
    required: true,
  },
  parentDoctype: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

// State
const fields = ref([]);
const visibleFields = computed(() => {
  return fields.value.filter(
    (field) =>
      !field.hidden &&
      ![
        'name',
        'owner',
        'creation',
        'modified',
        'modified_by',
        'docstatus',
        'idx',
        'parent',
        'parentfield',
        'parenttype',
      ].includes(field.fieldname)
  );
});
const showModal = ref(false);
const currentRow = ref({});
const currentRowIndex = ref(-1);
const isEditing = computed(() => currentRowIndex.value !== -1);
const linkOptions = ref({});
const loading = ref(false);

// Fetch child table fields
onMounted(async () => {
  try {
    loading.value = true;
    // Fetch fields for the child doctype
    const childFields = await fetchChildTableFields(props.childDoctype);
    fields.value = childFields;

    // Fetch options for Link fields
    await fetchLinkFieldOptions();
    loading.value = false;
  } catch (error) {
    console.error('Error fetching child table fields:', error);
    loading.value = false;
  }
});

// Methods
const fetchLinkFieldOptions = async () => {
  const linkFields = fields.value.filter((field) => field.fieldtype === 'Link');

  for (const field of linkFields) {
    try {
      const options = await fetchLinkOption(field.options, ['name']);
      linkOptions.value[field.fieldname] = options.map((item) => ({
        value: item.name,
        label: item.name,
      }));
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
    }
  }
};

const getLinkDisplayValue = (field, value) => {
  if (!value) return '';

  const options = linkOptions.value[field.fieldname] || [];
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : value;
};

const getSelectOptions = (field) => {
  if (field.options) {
    return field.options.split('\n');
  }
  return [];
};

const formatDate = (dateString) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
};

const openAddRowModal = () => {
  // Initialize a new row with empty values
  currentRow.value = {};
  fields.value.forEach((field) => {
    if (field.fieldtype === 'Check') {
      currentRow.value[field.fieldname] = false;
    } else {
      currentRow.value[field.fieldname] = '';
    }
  });

  currentRowIndex.value = -1;
  showModal.value = true;
};

const editRow = (index) => {
  // Clone the row to avoid direct mutation
  currentRow.value = JSON.parse(JSON.stringify(props.modelValue[index]));
  currentRowIndex.value = index;
  showModal.value = true;
};

const saveRow = () => {
  // Validate required fields
  const requiredFields = visibleFields.value.filter((field) => field.reqd);
  const missingFields = requiredFields.filter((field) => !currentRow.value[field.fieldname]);

  if (missingFields.length > 0) {
    alert(`Please fill in all required fields: ${missingFields.map((f) => f.label).join(', ')}`);
    return;
  }

  // Create a new array to trigger reactivity
  const newValue = [...(props.modelValue || [])];

  if (isEditing.value) {
    // Update existing row
    newValue[currentRowIndex.value] = { ...currentRow.value };
  } else {
    // Add new row
    newValue.push({ ...currentRow.value });
  }

  emit('update:modelValue', newValue);
  emit('change', newValue);
  closeModal();
};

const deleteRow = (index) => {
  if (confirm('Are you sure you want to delete this entry?')) {
    const newValue = [...props.modelValue];
    newValue.splice(index, 1);
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
};

const closeModal = () => {
  showModal.value = false;
  currentRow.value = {};
  currentRowIndex.value = -1;
};

// Watch for changes in the modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      emit('update:modelValue', []);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Add any component-specific styles here */
</style>