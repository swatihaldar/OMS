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

    <!-- Debug Info -->
    <div v-if="debug" class="bg-gray-100 p-2 mb-2 text-xs rounded">
      <div>Child Doctype: {{ childDoctype }}</div>
      <div>Fields loaded: {{ fields.length }}</div>
      <div>Visible fields: {{ visibleFields.length }}</div>
      <div>Field names: {{ visibleFields.map(f => f.fieldname).join(', ') }}</div>
      <div v-if="error" class="text-red-500">Error: {{ error }}</div>
      <div v-if="apiResponse" class="mt-2">
        <details>
          <summary>API Response</summary>
          <pre class="text-xs overflow-auto max-h-40">{{ JSON.stringify(apiResponse, null, 2) }}</pre>
        </details>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      <p>{{ error }}</p>
      <button 
        @click="retryFetch" 
        class="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded"
      >
        Retry
      </button>
    </div>

    <!-- Table Display -->
    <div v-else-if="visibleFields.length > 0" class="border rounded-lg overflow-hidden mb-2">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th v-for="field in visibleFields" :key="field.fieldname" 
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  :style="getColumnStyle(field)">
                {{ field.label }}
              </th>
              <th v-if="!isReadOnly" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(row, index) in modelValue || []" :key="index">
              <td v-for="field in visibleFields" :key="field.fieldname" 
                  class="px-3 py-2 text-sm text-blue-800 font-medium"
                  :style="getColumnStyle(field)">
                <!-- Different display formats based on field type -->
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
                <template v-else-if="field.fieldtype === 'Link'">
                  {{ getLinkDisplayValue(field, row[field.fieldname]) }}
                </template>
                <template v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                  {{ formatDate(row[field.fieldname]) }}
                </template>
                <template v-else-if="field.fieldtype === 'Small Text'">
                  <div class="whitespace-pre-line max-h-20 overflow-y-auto">{{ row[field.fieldname] }}</div>
                </template>
                <template v-else-if="field.fieldtype === 'Color' && row[field.fieldname]">
                  <div class="flex items-center">
                    <div class="h-4 w-4 rounded mr-1" :style="{ backgroundColor: row[field.fieldname] || '#FFFFFF' }"></div>
                    <span>{{ row[field.fieldname] }}</span>
                  </div>
                </template>
                <template v-else-if="field.fieldtype === 'Currency' || field.fieldtype === 'Float'">
                  {{ formatNumber(row[field.fieldname]) }}
                </template>
                <template v-else>
                  {{ row[field.fieldname] }}
                </template>
              </td>
              <td v-if="!isReadOnly" class="px-3 py-2 text-sm text-right whitespace-nowrap">
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
    </div>
    <div v-else-if="!loading && !error" class="text-center py-4 text-gray-500">
      No fields found for {{ childDoctype }}
    </div>

    <!-- Add Button -->
    <button 
      v-if="!isReadOnly && !loading" 
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
            <template v-for="field in visibleFields" :key="field.fieldname">
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
                <div v-if="field.fieldtype === 'Link'" class="relative">
                  <input
                    v-model="linkSearchQueries[field.fieldname]"
                    type="text"
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    :placeholder="`Search ${field.label}...`"
                    @focus="openLinkDropdown(field.fieldname)"
                    @blur="closeLinkDropdownDelayed(field.fieldname)"
                  />
                  
                  <!-- Dropdown for link options -->
                  <div 
                    v-if="activeLinkDropdown === field.fieldname"
                    class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                  >
                    <div 
                      v-for="option in getFilteredOptionsForField(field)" 
                      :key="option.value"
                      class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                      @mousedown="selectLinkOption(field.fieldname, option.value, option.label)"
                    >
                      <span class="block truncate" :class="{'font-semibold': currentRow[field.fieldname] === option.value}">
                        {{ option.label }}
                      </span>
                      <span 
                        v-if="currentRow[field.fieldname] === option.value" 
                        class="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600"
                      >
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div v-if="getFilteredOptionsForField(field).length === 0" class="py-2 px-3 text-gray-500 italic">
                      No results found
                    </div>
                  </div>
                </div>

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

                <!-- Color fields -->
                <div v-else-if="field.fieldtype === 'Color'" class="flex items-center">
                  <input 
                    v-model="currentRow[field.fieldname]"
                    type="color"
                    class="h-8 w-8 rounded border-gray-300 mr-2"
                  />
                  <input 
                    v-model="currentRow[field.fieldname]"
                    type="text"
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="#RRGGBB"
                  />
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
  debug: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// State
const fields = ref([]);
const loading = ref(true);
const showModal = ref(false);
const currentRow = ref({});
const currentRowIndex = ref(-1);
const isEditing = computed(() => currentRowIndex.value !== -1);
const linkOptions = ref({});
const linkSearchQueries = ref({});
const activeLinkDropdown = ref(null);
const error = ref(null);
const apiResponse = ref(null);
const fetchAttempts = ref(0);
const MAX_FETCH_ATTEMPTS = 3;

// Computed properties
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

// Fetch child table fields
onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Fetch fields for the child doctype
    await fetchChildTableFields();
    
    // Fetch options for Link fields
    if (fields.value.length > 0) {
      await fetchLinkFieldOptions();
    }
    
    loading.value = false;
  } catch (err) {
    console.error('Error initializing table field component:', err);
    error.value = err.message || 'Failed to load child table fields';
    loading.value = false;
  }
});

// Methods
const fetchChildTableFields = async () => {
  try {
    console.log(`Fetching fields for child doctype: ${props.childDoctype}`);
    fetchAttempts.value++;
    
    // Try multiple methods to fetch the fields
    let success = false;
    
    // Method 1: Using the meta API (most reliable)
    try {
      const response = await fetch('/api/method/frappe.desk.form.meta.get_meta', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          doctype: props.childDoctype 
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      apiResponse.value = data; // Store for debugging
      
      if (data.message && data.message.fields) {
        fields.value = data.message.fields;
        console.log(`Successfully fetched ${fields.value.length} fields for ${props.childDoctype} using method 1`);
        
        // Sort fields by idx to maintain proper order
        fields.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));
        success = true;
      }
    } catch (error) {
      console.error('Method 1 failed:', error);
    }
    
    // Method 2: Using the doctype API
    if (!success) {
      try {
        const response = await fetch('/api/method/frappe.desk.form.load.getdoctype', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            doctype: props.childDoctype,
            with_parent: 1
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        apiResponse.value = data; // Store for debugging
        
        if (data.message && data.message.docs && data.message.docs[0]) {
          const doctypeDef = data.message.docs[0];
          fields.value = doctypeDef.fields || [];
          console.log(`Successfully fetched ${fields.value.length} fields for ${props.childDoctype} using method 2`);
          
          // Sort fields by idx to maintain proper order
          fields.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));
          success = true;
        }
      } catch (error) {
        console.error('Method 2 failed:', error);
      }
    }
    
    // Method 3: Using the form_dict API
    if (!success) {
      try {
        const response = await fetch('/api/method/frappe.desk.form.form_dict.get_doctype_meta', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            doctype: props.childDoctype 
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        apiResponse.value = data; // Store for debugging
        
        if (data.message && data.message.fields) {
          fields.value = data.message.fields;
          console.log(`Successfully fetched ${fields.value.length} fields for ${props.childDoctype} using method 3`);
          
          // Sort fields by idx to maintain proper order
          fields.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));
          success = true;
        }
      } catch (error) {
        console.error('Method 3 failed:', error);
      }
    }
    
    // Method 4: Using the client API to get docfield
    if (!success) {
      try {
        const response = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            doctype: 'DocField',
            filters: {
              parent: props.childDoctype
            },
            fields: ['*'],
            limit_page_length: 500,
            order_by: 'idx asc'
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        apiResponse.value = data; // Store for debugging
        
        if (data.message && data.message.length > 0) {
          fields.value = data.message;
          console.log(`Successfully fetched ${fields.value.length} fields for ${props.childDoctype} using method 4`);
          success = true;
        }
      } catch (error) {
        console.error('Method 4 failed:', error);
      }
    }
    
    // Method 5: Using the client API to get doctype
    if (!success) {
      try {
        const response = await fetch('/api/method/frappe.client.get', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            doctype: 'DocType',
            name: props.childDoctype
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        apiResponse.value = data; // Store for debugging
        
        if (data.message && data.message.fields) {
          fields.value = data.message.fields;
          console.log(`Successfully fetched ${fields.value.length} fields for ${props.childDoctype} using method 5`);
          
          // Sort fields by idx to maintain proper order
          fields.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));
          success = true;
        }
      } catch (error) {
        console.error('Method 5 failed:', error);
      }
    }
    
    // If all methods failed and we haven't reached max attempts, try again
    if (!success && fetchAttempts.value < MAX_FETCH_ATTEMPTS) {
      console.log(`Retrying fetch attempt ${fetchAttempts.value} of ${MAX_FETCH_ATTEMPTS}`);
      return await fetchChildTableFields();
    }
    
    // If all methods failed after max attempts, show error
    if (!success) {
      error.value = `Could not fetch fields for ${props.childDoctype} after multiple attempts`;
      
      // Use a minimal set of fields as fallback
      fields.value = [
        { fieldname: 'description', label: 'Description', fieldtype: 'Small Text' },
        { fieldname: 'qty', label: 'Quantity', fieldtype: 'Float' },
        { fieldname: 'rate', label: 'Rate', fieldtype: 'Currency' },
        { fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' }
      ];
      
      console.warn('Using fallback fields:', fields.value);
    }
    
    // If we still don't have fields, throw an error
    if (fields.value.length === 0) {
      throw new Error(`Could not fetch fields for ${props.childDoctype}`);
    }
  } catch (error) {
    console.error(`Error fetching fields for ${props.childDoctype}:`, error);
    throw error;
  }
};

const fetchLinkFieldOptions = async () => {
  const linkFields = fields.value.filter((field) => field.fieldtype === 'Link');
  
  for (const field of linkFields) {
    try {
      if (!field.options) continue;
      
      console.log(`Fetching options for ${field.fieldname} (${field.options})`);
      
      const response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: field.options,
          fields: ['name', 'title'],
          limit_page_length: 500 // Fetch more records
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch options for ${field.fieldname}`);
      }
      
      const data = await response.json();
      
      if (data.message) {
        linkOptions.value[field.fieldname] = data.message.map((item) => ({
          value: item.name,
          label: item.title || item.name,
        }));
        console.log(`Fetched ${linkOptions.value[field.fieldname].length} options for ${field.fieldname}`);
      }
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
      linkOptions.value[field.fieldname] = [];
    }
  }
};

// Retry fetching fields
const retryFetch = async () => {
  loading.value = true;
  error.value = null;
  fetchAttempts.value = 0;
  apiResponse.value = null;
  
  try {
    await fetchChildTableFields();
    
    if (fields.value.length > 0) {
      await fetchLinkFieldOptions();
    }
  } catch (err) {
    console.error('Error retrying fetch:', err);
    error.value = err.message || 'Failed to load child table fields';
  } finally {
    loading.value = false;
  }
};

// Get column style based on field type
const getColumnStyle = (field) => {
  const style = {};
  
  // Set width based on field type
  if (field.fieldtype === 'Check') {
    style.width = '80px';
  } else if (field.fieldtype === 'Int' || field.fieldtype === 'Float') {
    style.width = '100px';
  } else if (field.fieldtype === 'Date') {
    style.width = '120px';
  } else if (field.fieldtype === 'Color') {
    style.width = '120px';
  } else if (field.fieldtype === 'Small Text') {
    style.minWidth = '200px';
  }
  
  return style;
};

// Link field dropdown handling
const openLinkDropdown = (fieldname) => {
  activeLinkDropdown.value = fieldname;
  
  // Initialize search query with current value's label if it exists
  if (currentRow.value[fieldname]) {
    const field = fields.value.find(f => f.fieldname === fieldname);
    if (field && field.fieldtype === 'Link') {
      const options = linkOptions.value[fieldname] || [];
      const option = options.find(opt => opt.value === currentRow.value[fieldname]);
      if (option) {
        linkSearchQueries.value[fieldname] = option.label;
      }
    }
  }
};

const closeLinkDropdownDelayed = (fieldname) => {
  setTimeout(() => {
    if (activeLinkDropdown.value === fieldname) {
      activeLinkDropdown.value = null;
    }
  }, 200);
};

const getFilteredOptionsForField = (field) => {
  const options = linkOptions.value[field.fieldname] || [];
  const searchQuery = linkSearchQueries.value[field.fieldname] || '';
  
  if (!searchQuery) {
    return options;
  }
  
  return options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

const selectLinkOption = (fieldname, value, label) => {
  currentRow.value[fieldname] = value;
  linkSearchQueries.value[fieldname] = label;
  activeLinkDropdown.value = null;
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

const formatNumber = (value) => {
  if (value === undefined || value === null || value === '') return '';
  
  try {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (e) {
    return value;
  }
};

const openAddRowModal = () => {
  // Initialize a new row with empty values
  currentRow.value = {};
  linkSearchQueries.value = {};
  
  fields.value.forEach((field) => {
    if (field.fieldtype === 'Check') {
      currentRow.value[field.fieldname] = false;
    } else if (field.default) {
      // Set default values if specified in the field definition
      currentRow.value[field.fieldname] = field.default;
    } else {
      currentRow.value[field.fieldname] = '';
    }
  });

  // Set parent references but don't save yet
  currentRow.value.parent = '';
  currentRow.value.parentfield = props.fieldname;
  currentRow.value.parenttype = props.parentDoctype;
  
  currentRowIndex.value = -1;
  showModal.value = true;
};

const editRow = (index) => {
  // Clone the row to avoid direct mutation
  currentRow.value = JSON.parse(JSON.stringify(props.modelValue[index]));
  linkSearchQueries.value = {};
  
  // Initialize link search queries for existing values
  fields.value.filter(f => f.fieldtype === 'Link').forEach(field => {
    const value = currentRow.value[field.fieldname];
    if (value) {
      const options = linkOptions.value[field.fieldname] || [];
      const option = options.find(opt => opt.value === value);
      if (option) {
        linkSearchQueries.value[field.fieldname] = option.label;
      } else {
        linkSearchQueries.value[field.fieldname] = value;
      }
    }
  });
  
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
  linkSearchQueries.value = {};
  activeLinkDropdown.value = null;
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

// Watch for changes in childDoctype
watch(
  () => props.childDoctype,
  async (newDoctype) => {
    if (newDoctype) {
      loading.value = true;
      fields.value = [];
      linkOptions.value = {};
      fetchAttempts.value = 0;
      apiResponse.value = null;
      error.value = null;
      
      try {
        await fetchChildTableFields();
        if (fields.value.length > 0) {
          await fetchLinkFieldOptions();
        }
      } catch (error) {
        console.error(`Error when childDoctype changed:`, error);
      } finally {
        loading.value = false;
      }
    }
  }
);
</script>

<style scoped>
/* Add any component-specific styles here */
.table-field-container {
  position: relative;
}

.table-field-error {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>