<template>
  <div class="edit-form">
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else>
      <!-- Main content with padding at bottom for fixed buttons -->
      <div class="pb-20">
        <div class="space-y-6">
          <template v-for="(section, sectionIndex) in nonEmptySections" :key="sectionIndex">
            <div :class="{ 'border-t border-gray-200 pt-6 mt-6': sectionIndex > 0 }">
              <h3 v-if="section.label" class="text-lg font-medium text-gray-900 mb-4">
                {{ section.label }}
              </h3>
  
              <!-- Render fields in this section -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <template v-for="(column, columnIndex) in section.columns" :key="columnIndex">
                  <div class="space-y-4">
                    <template v-for="field in column" :key="field.fieldname">
                      <div 
                        v-if="shouldDisplayField(field)" 
                        class="mb-4"
                      >
                        <div class="text-sm font-medium text-gray-500 mb-1">
                          {{ field.label }}
                          <span v-if="field.reqd" class="text-red-500">*</span>
                        </div>
  
                        <!-- Link fields with search -->
                        <div v-if="field.fieldtype === 'Link'" class="relative">
                          <div class="relative">
                            <input
                              v-model="linkSearchQueries[field.fieldname]"
                              type="text"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              @focus="openLinkDropdown(field.fieldname)"
                              @blur="closeLinkDropdownDelayed(field.fieldname)"
                              placeholder="Search..."
                              :disabled="isFieldReadonly(field)"
                            />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </div>
                          </div>
  
                          <!-- Dropdown for link options -->
                          <div
                            v-if="activeLinkDropdown === field.fieldname && !isFieldReadonly(field)"
                            class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                          >
                            <div
                              v-for="option in getFilteredLinkOptions(field)"
                              :key="option.value"
                              class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                              @mousedown="selectLinkOption(field.fieldname, option.value)"
                            >
                              <span
                                class="block truncate"
                                :class="{
                                  'font-semibold': editedRecord[field.fieldname] === option.value,
                                }"
                              >
                                {{ option.label }}
                              </span>
                              <span
                                v-if="editedRecord[field.fieldname] === option.value"
                                class="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600"
                              >
                                <svg
                                  class="h-5 w-5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div
                              v-if="getFilteredLinkOptions(field).length === 0"
                              class="py-2 px-3 text-gray-500 italic"
                            >
                              No results found
                            </div>
                          </div>
                        </div>
  
                        <!-- Select fields -->
                        <select
                          v-else-if="field.fieldtype === 'Select'"
                          v-model="editedRecord[field.fieldname]"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          :disabled="isFieldReadonly(field)"
                        >
                          <option value="">Select an option</option>
                          <option
                            v-for="option in getSelectOptions(field)"
                            :key="option"
                            :value="option"
                          >
                            {{ option }}
                          </option>
                        </select>
  
                        <!-- Text Editor fields -->
                        <div v-else-if="field.fieldtype === 'Text Editor'" class="mt-1">
                          <textarea
                            v-model="editedRecord[field.fieldname]"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            :disabled="isFieldReadonly(field)"
                          ></textarea>
                        </div>
  
                        <!-- Small Text fields -->
                        <div v-else-if="field.fieldtype === 'Small Text'" class="mt-1">
                          <textarea
                            v-model="editedRecord[field.fieldname]"
                            rows="2"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            :disabled="isFieldReadonly(field)"
                          ></textarea>
                        </div>
  
                        <!-- Checkbox fields -->
                        <div v-else-if="field.fieldtype === 'Check'" class="mt-1">
                          <label class="inline-flex items-center">
                            <input
                              type="checkbox"
                              v-model="editedRecord[field.fieldname]"
                              class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              :disabled="isFieldReadonly(field)"
                            />
                            <span class="ml-2 text-gray-700">{{ field.label }}</span>
                          </label>
                        </div>
  
                        <!-- Color fields -->
                        <div v-else-if="field.fieldtype === 'Color'" class="mt-1 flex items-center">
                          <input
                            type="color"
                            v-model="editedRecord[field.fieldname]"
                            class="h-8 w-12 rounded border border-gray-300 mr-2"
                            :disabled="isFieldReadonly(field)"
                          />
                          <input
                            type="text"
                            v-model="editedRecord[field.fieldname]"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="#RRGGBB"
                            :disabled="isFieldReadonly(field)"
                          />
                        </div>
  
                        <!-- Image fields -->
                        <div v-else-if="field.fieldtype === 'Attach Image'" class="mt-1">
                          <div v-if="editedRecord[field.fieldname]" class="mb-2">
                            <img
                              :src="editedRecord[field.fieldname]"
                              alt="Attached Image"
                              class="h-24 w-auto rounded-lg object-cover"
                            />
                          </div>
                          <input
                            v-if="!isFieldReadonly(field)"
                            type="file"
                            @change="handleFileUpload($event, field.fieldname)"
                            accept="image/*"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
  
                        <!-- Attachment fields -->
                        <div v-else-if="field.fieldtype === 'Attach'" class="mt-1">
                          <div v-if="editedRecord[field.fieldname]" class="mb-2 flex items-center">
                            <a
                              :href="editedRecord[field.fieldname]"
                              target="_blank"
                              class="text-blue-600 hover:underline mr-2"
                            >
                              Current File
                            </a>
                            <button
                              v-if="!isFieldReadonly(field)"
                              @click="editedRecord[field.fieldname] = ''"
                              class="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            v-if="!isFieldReadonly(field)"
                            type="file"
                            @change="handleFileUpload($event, field.fieldname)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
  
                        <!-- Date fields -->
                        <input
                          v-else-if="field.fieldtype === 'Date'"
                          type="date"
                          v-model="editedRecord[field.fieldname]"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          :disabled="isFieldReadonly(field)"
                        />
  
                        <!-- Datetime fields -->
                        <input
                          v-else-if="field.fieldtype === 'Datetime'"
                          type="datetime-local"
                          v-model="editedRecord[field.fieldname]"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          :disabled="isFieldReadonly(field)"
                        />
  
                        <!-- Table fields -->
                        <div v-else-if="field.fieldtype === 'Table'" class="mt-1">
                          <div class="border rounded-md overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                              <thead class="bg-gray-50">
                                <tr>
                                  <th 
                                    v-for="childField in getVisibleChildTableFields(field)" 
                                    :key="childField.fieldname" 
                                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    {{ childField.label }}
                                  </th>
                                  <th v-if="!isFieldReadonly(field)" class="px-3 py-2 text-right w-10">
                                    <button @click="addChildRow(field)" class="text-blue-600 hover:text-blue-800">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </th>
                                </tr>
                              </thead>
                              <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="(row, rowIndex) in getChildTableData(field)" :key="rowIndex">
                                  <td 
                                    v-for="childField in getVisibleChildTableFields(field)" 
                                    :key="childField.fieldname" 
                                    class="px-3 py-2"
                                  >
                                    <!-- Different input types for child table fields -->
                                    <template v-if="!isFieldReadonly(field)">
                                      <!-- Select field -->
                                      <select 
                                        v-if="childField.fieldtype === 'Select'"
                                        v-model="row[childField.fieldname]" 
                                        class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        <option value="">Select</option>
                                        <option 
                                          v-for="option in getSelectOptions(childField)" 
                                          :key="option" 
                                          :value="option"
                                        >
                                          {{ option }}
                                        </option>
                                      </select>
                                      
                                      <!-- Check field -->
                                      <input 
                                        v-else-if="childField.fieldtype === 'Check'"
                                        type="checkbox"
                                        v-model="row[childField.fieldname]" 
                                        class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                      />
                                      
                                      <!-- Color field -->
                                      <div v-else-if="childField.fieldtype === 'Color'" class="flex items-center">
                                        <input
                                          type="color"
                                          v-model="row[childField.fieldname]"
                                          class="h-6 w-8 rounded border border-gray-300 mr-1"
                                        />
                                        <input
                                          type="text"
                                          v-model="row[childField.fieldname]"
                                          class="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          placeholder="#RRGGBB"
                                        />
                                      </div>
                                      
                                      <!-- Default text input -->
                                      <input 
                                        v-else
                                        type="text"
                                        v-model="row[childField.fieldname]" 
                                        class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </template>
                                    
                                    <!-- Read-only display -->
                                    <template v-else>
                                      <!-- Check field display -->
                                      <span v-if="childField.fieldtype === 'Check'">
                                        <svg v-if="row[childField.fieldname]" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg v-else class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </span>
                                      
                                      <!-- Color field display -->
                                      <div v-else-if="childField.fieldtype === 'Color'" class="flex items-center">
                                        <div 
                                          class="h-4 w-4 rounded mr-1" 
                                          :style="{ backgroundColor: row[childField.fieldname] || '#FFFFFF' }"
                                        ></div>
                                        <span>{{ row[childField.fieldname] }}</span>
                                      </div>
                                      
                                      <!-- Default text display -->
                                      <span v-else>{{ row[childField.fieldname] }}</span>
                                    </template>
                                  </td>
                                  <td v-if="!isFieldReadonly(field)" class="px-3 py-2 text-right">
                                    <button @click="removeChildRow(field, rowIndex)" class="text-red-600 hover:text-red-800">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-5 0h10" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                                <tr v-if="!getChildTableData(field).length">
                                  <td :colspan="getVisibleChildTableFields(field).length + (isFieldReadonly(field) ? 0 : 1)" class="px-3 py-2 text-center text-gray-500">
                                    {{ isFieldReadonly(field) ? 'No items' : 'No items. Click + to add a row.' }}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
  
                        <!-- Default field input -->
                        <input
                          v-else
                          type="text"
                          v-model="editedRecord[field.fieldname]"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          :disabled="isFieldReadonly(field)"
                        />
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Fixed Action Buttons -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between gap-3">
            <button
              @click="cancel"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="save"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              :disabled="isSaving"
            >
              <div v-if="isSaving" class="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getFieldConfig, shouldHideField, isReadonlyField } from '../config/field-config';
  
const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  recordId: {
    type: String,
    required: true,
  },
  record: {
    type: Object,
    required: true,
  },
  formFields: {
    type: Array,
    required: true,
  },
  linkFieldOptions: {
    type: Object,
    required: true,
  },
  childTableFields: {
    type: Object,
    default: () => ({})
  }
});
  
const emit = defineEmits(['save', 'cancel', 'upload-file']);
  
const editedRecord = ref({});
const loading = ref(false);
const isSaving = ref(false);
const linkSearchQueries = ref({});
const activeLinkDropdown = ref(null);
const activeTab = ref(0); // For mobile section tabs
const dynamicLinkOptions = ref({});

// Check if this is a new record
const isNewRecord = computed(() => {
  return props.recordId === 'new' || !props.recordId;
});
  
// Initialize edited record
onMounted(() => {
  editedRecord.value = JSON.parse(JSON.stringify(props.record));
  
  // Initialize link search queries with current values
  initializeLinkSearchQueries();
});
  
// Watch for record changes
watch(() => props.record, (newRecord) => {
  editedRecord.value = JSON.parse(JSON.stringify(newRecord));
  initializeLinkSearchQueries();
}, { deep: true });
  
// Initialize link search queries with current values
const initializeLinkSearchQueries = () => {
  const linkFields = props.formFields.filter(field => field.fieldtype === 'Link');
  
  linkFields.forEach(field => {
    const fieldname = field.fieldname;
    const currentValue = editedRecord.value[fieldname];
    
    if (currentValue) {
      const options = props.linkFieldOptions[fieldname] || [];
      const option = options.find(opt => opt.value === currentValue);
      
      if (option) {
        linkSearchQueries.value[fieldname] = option.label;
      } else {
        linkSearchQueries.value[fieldname] = currentValue;
      }
    }
  });
};
  
// Get child table fields
const getChildTableFields = (field) => {
  return props.childTableFields[field.options] || [];
};

// Get visible child table fields (filtering out hidden fields)
const getVisibleChildTableFields = (field) => {
  const allFields = getChildTableFields(field);
  return allFields.filter(childField => 
    !childField.hidden && 
    !shouldHideField(field.options, childField.fieldname)
  );
};
  
// Get child table data
const getChildTableData = (field) => {
  if (!editedRecord.value[field.fieldname]) {
    editedRecord.value[field.fieldname] = [];
  }
  return editedRecord.value[field.fieldname];
};
  
// Add a new row to child table
const addChildRow = (field) => {
  if (!editedRecord.value[field.fieldname]) {
    editedRecord.value[field.fieldname] = [];
  }
  
  const newRow = {};
  getChildTableFields(field).forEach(childField => {
    newRow[childField.fieldname] = '';
  });
  
  editedRecord.value[field.fieldname].push(newRow);
};
  
// Remove a row from child table
const removeChildRow = (field, index) => {
  editedRecord.value[field.fieldname].splice(index, 1);
};
  
// Organize fields into sections and columns
const fieldSections = computed(() => {
  const sections = [];
  let currentSection = { label: '', columns: [[]] };
  let currentColumn = 0;

  // Filter out system fields
  const systemFields = [
    'name',
    'owner',
    'creation',
    'modified',
    'modified_by',
    'docstatus',
    'idx',
  ];
  
  const visibleFields = props.formFields
    .filter(
      (field) =>
        field &&
        field.fieldname &&
        !field.hidden &&
        !systemFields.includes(field.fieldname) &&
        !shouldHideField(props.doctype, field.fieldname)
    )
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  // Group fields into sections and columns
  for (const field of visibleFields) {
    if (field.fieldtype === 'Section Break') {
      // Start a new section
      if (currentSection.columns[0].length > 0 || sections.length === 0) {
        sections.push(currentSection);
        currentSection = {
          label: field.label || '',
          columns: [[]],
        };
        currentColumn = 0;
      } else {
        currentSection.label = field.label || '';
      }
    } else if (field.fieldtype === 'Column Break') {
      currentColumn++;
      if (!currentSection.columns[currentColumn]) {
        currentSection.columns[currentColumn] = [];
      }
    } else {
      currentSection.columns[currentColumn].push(field);
    }
  }

  // Add the last section if it has fields
  if (currentSection.columns.some((col) => col.length > 0)) {
    sections.push(currentSection);
  }

  return sections;
});
  
// Check if a field is a metadata field
const isMetadataField = (fieldname) => {
  const metadataFields = [
    'owner',
    'creation',
    'modified',
    'modified_by',
    'docstatus',
  ];
  return metadataFields.includes(fieldname);
};

// Check if a field should be displayed
const shouldDisplayField = (field) => {
  // Don't display metadata fields
  if (isMetadataField(field.fieldname)) return false;
  
  // Don't display hidden fields
  if (field.hidden) return false;
  
  // Don't display fields configured to be hidden for this doctype
  if (shouldHideField(props.doctype, field.fieldname)) return false;
  
  return true;
};

// Check if a field should be readonly
const isFieldReadonly = (field) => {
  // Check if field is configured as readonly for this doctype
  return field.read_only || isReadonlyField(props.doctype, field.fieldname);
};
  
// Link field search functionality
const openLinkDropdown = async (fieldname) => {
  activeLinkDropdown.value = fieldname;

  // Load all options for this field if not already loaded
  const field = props.formFields.find((f) => f.fieldname === fieldname);
  if (field && field.fieldtype === 'Link' && !dynamicLinkOptions.value[fieldname]) {
    await loadAllLinkOptions(field);
  }

  // Initialize search query with current value's label if it exists
  if (editedRecord.value[fieldname]) {
    if (field && field.fieldtype === 'Link') {
      const options = dynamicLinkOptions.value[fieldname] || props.linkFieldOptions[fieldname] || [];
      const option = options.find(
        (opt) => opt.value === editedRecord.value[fieldname]
      );
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
  
const selectLinkOption = (fieldname, value) => {
  editedRecord.value[fieldname] = value;

  // Update search query with selected option's label
  const field = props.formFields.find((f) => f.fieldname === fieldname);
  if (field && field.fieldtype === 'Link') {
    const options = dynamicLinkOptions.value[fieldname] || props.linkFieldOptions[fieldname] || [];
    const option = options.find((opt) => opt.value === value);
    if (option) {
      linkSearchQueries.value[fieldname] = option.label;
    }
  }

  activeLinkDropdown.value = null;
};
  
const getFilteredLinkOptions = (field) => {
  // Use dynamic options if available, otherwise fall back to props
  const options = dynamicLinkOptions.value[field.fieldname] || props.linkFieldOptions[field.fieldname] || [];
  const searchQuery = linkSearchQueries.value[field.fieldname] || '';

  // Filter first
  let filteredOptions = options;
  if (searchQuery) {
    filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Then sort alphabetically by label
  return filteredOptions.sort((a, b) => {
    const labelA = a.label?.toLowerCase() || '';
    const labelB = b.label?.toLowerCase() || '';
    return labelA.localeCompare(labelB);
  });
};
  
const getSelectOptions = (field) => {
  if (field.options) {
    return field.options.split('\n');
  }
  return [];
};

// Get the title field for a doctype
const getTitleFields = (doctype) => {
  // Common title fields for different doctypes
  const commonTitleFields = ['project_name', 'title', 'subject', 'name1', 'customer_name', 'item_name', 'description'];
  
  // Specific mappings for known doctypes
  const doctypeSpecificFields = {
    'Project': ['project_name'],
    'Customer': ['customer_name'],
    'Item': ['item_name', 'description'],
    'Task': ['subject'],
    'Lead': ['lead_name', 'company_name'],
    'Contact': ['first_name', 'last_name'],
    // Add more mappings as needed
  };
  
  // Return specific fields if we have them, otherwise return common fields
  return doctypeSpecificFields[doctype] || commonTitleFields;
};

const loadAllLinkOptions = async (field) => {
  try {
    const doctype = field.options;
    
    // Get potential title fields for this doctype
    const titleFields = getTitleFields(doctype);
    
    // First fetch just the name to ensure we get results
    const initialResults = await fetchLinkOptions(doctype, ['name'], {});
    
    // If we have results, try to fetch with additional fields
    let results = initialResults;
    if (initialResults.length > 0) {
      try {
        // Try to fetch with additional fields
        const fieldsToFetch = ['name', ...titleFields];
        const enhancedResults = await fetchLinkOptions(doctype, fieldsToFetch, {});
        if (enhancedResults.length > 0) {
          results = enhancedResults;
        }
      } catch (error) {
        console.error(`Error fetching enhanced options for ${doctype}:`, error);
        // Fall back to initial results with just names
      }
    }
    
    // Transform the results into the expected format
    const options = results.map(item => {
      // Start with just the name/ID as the label
      let label = item.name;
      
      // Check if any of our title fields exist and have values
      for (const field of titleFields) {
        if (item[field] && item[field] !== item.name) {
          // Add the descriptive field to the label
          label = `${item[field]}`;
          break;
        }
      }
      
      return {
        value: item.name,
        label: label
      };
    });
    
    // Store the options in our dynamic options ref
    dynamicLinkOptions.value[field.fieldname] = options;
    
    return options;
  } catch (error) {
    console.error(`Error loading options for ${field.fieldname}:`, error);
    return [];
  }
};
  
const handleFileUpload = async (event, fieldname) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    emit('upload-file', { file, fieldname, callback: (fileUrl) => {
      editedRecord.value[fieldname] = fileUrl;
    }});
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};
  
const save = () => {
  isSaving.value = true;
  emit('save', editedRecord.value);
};
  
const cancel = () => {
  emit('cancel');
};

// Filter out empty sections
const nonEmptySections = computed(() => {
  return fieldSections.value.filter(section => {
    return section.columns.some(column => column.length > 0);
  });
});

async function fetchLinkOptions(doctype, fields = ['name'], filters = {}) {
  try {
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype,
        fields,
        filters,
        limit_page_length: 999, // Set to 999 to fetch all records
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }
    return []
  } catch (error) {
    console.error(`Error fetching options for ${doctype}:`, error)
    return []
  }
}
</script>

<style>
/* Add any additional styles here */
.color-field-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  margin-right: 8px;
  vertical-align: middle;
}

/* Improve table field display */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  border: 1px solid #e2e8f0;
}

th {
  background-color: #f9fafb;
  font-weight: 600;
}

/* Make table responsive */
.overflow-x-auto {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.form-checkbox,.form-radio{
  height: 0rem;
}
</style>

