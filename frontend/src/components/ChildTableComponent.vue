<template>
  <div class="mb-6">
    <!-- Label and description section -->
    <div class="flex items-center mb-2">
      <!-- <label class="block text-sm font-medium text-gray-700">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label> -->
      <Tooltip v-if="description" :text="description" class="ml-1">
        <FeatherIcon name="help-circle" class="h-4 w-4 text-gray-400" />
      </Tooltip>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-4 bg-white rounded-lg border border-gray-200">
      <FeatherIcon name="loader" class="h-6 w-6 animate-spin text-blue-600" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      <p>{{ error }}</p>
      <Button 
        @click="retryFetch" 
        variant="ghost"
        size="sm"
        theme="red"
        class="mt-2"
      >
        Retry
      </Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="(modelValue || []).length === 0" class="bg-white rounded-lg border border-gray-200 p-4 text-center">
      <div class="flex flex-col items-center justify-center py-6">
        <FeatherIcon name="file-text" class="h-12 w-12 text-gray-300 mb-2" />
        <p class="text-gray-500 mb-4">No {{ label.toLowerCase() }} added yet</p>
        <Button 
          v-if="!isReadOnly" 
          @click="openAddRowModal" 
          variant="solid"
          size="sm"
        >
          <FeatherIcon name="plus" class="h-4 w-4 mr-2" />
          Add {{ label }}
        </Button>
      </div>
    </div>

    <!-- Table Display -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <!-- Table Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">{{ label }}</h3>
        <Button 
          v-if="!isReadOnly" 
          @click.stop="openAddRowModal" 
          variant="solid"
          size="sm"
        >
          <FeatherIcon name="plus" class="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th v-for="field in listViewFields" :key="field.fieldname" 
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  :style="getColumnStyle(field)">
                {{ field.label }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sticky right-0 bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(row, index) in modelValue" :key="index" class="hover:bg-gray-50 cursor-pointer" @click="viewRow(index)">
              <td v-for="field in listViewFields" :key="field.fieldname" 
                  class="px-4 py-3 text-sm text-gray-900"
                  :style="getColumnStyle(field)">
                <!-- Different display formats based on field type -->
                <template v-if="field.fieldtype === 'Check'">
                  <div class="flex items-center">
                    <Checkbox :modelValue="isChecked(row[field.fieldname])" :disabled="true" />
                  </div>
                </template>
                <template v-else-if="field.fieldtype === 'Link'">
                  <span v-if="row[field.fieldname]" class="text-blue-600">{{ getLinkDisplayValue(field, row[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                  <span v-if="row[field.fieldname]">{{ formatDate(row[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Small Text'">
                  <div v-if="row[field.fieldname]" class="whitespace-pre-line max-h-20 overflow-y-auto">{{ row[field.fieldname] }}</div>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Color'">
                  <div v-if="row[field.fieldname]" class="flex items-center">
                    <div class="h-4 w-4 rounded mr-1" :style="{ backgroundColor: row[field.fieldname] }"></div>
                    <span>{{ row[field.fieldname] }}</span>
                  </div>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Currency' || field.fieldtype === 'Float'">
                  <span v-if="row[field.fieldname] !== undefined && row[field.fieldname] !== null && row[field.fieldname] !== ''" class="font-medium">{{ formatNumber(row[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else>
                  <span v-if="row[field.fieldname] !== undefined && row[field.fieldname] !== null && row[field.fieldname] !== ''">{{ row[field.fieldname] }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
              </td>
              <td class="px-4 py-3 text-sm text-right whitespace-nowrap sticky right-0 bg-white" @click.stop>
                <div class="flex justify-end space-x-2">
                  <Button 
                    @click="deleteRow(index)" 
                    variant="ghost"
                    size="sm"
                    theme="red"
                  >
                    <FeatherIcon name="trash-2" class="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal for Add/Edit/View -->
    <Dialog v-model="showModal" size="2xl">
      <template #body-title>
        <h3 class="text-lg font-medium text-gray-900">
          <span v-if="modalMode === 'view'">View</span>
          <span v-else-if="modalMode === 'edit'">Edit</span>
          <span v-else>Add</span>
          {{ label }}
        </h3>
      </template>
      
      <template #body-content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <template v-for="field in visibleModalFields" :key="field.fieldname">
            <!-- Section Break -->
            <div v-if="field.fieldtype === 'Section Break'" class="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-2">
              <h4 v-if="field.label" class="text-base font-medium text-gray-900 mb-4">{{ field.label }}</h4>
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
              
              <!-- Link Field -->
              <Autocomplete
                v-if="field.fieldtype === 'Link'"
                :options="getFilteredLinkOptions(field)"
                :modelValue="getLinkDisplayValue(field, currentRow[field.fieldname])"
                :placeholder="`Select ${field.label}`"
                :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                @update:modelValue="(val) => handleLinkSelect(field, val)"
                @update:query="(query) => handleLinkSearch(field, query)"
                class="w-full"
              />

              <!-- Select Field -->
              <Select
                v-else-if="field.fieldtype === 'Select'"
                :options="getSelectOptions(field)"
                :modelValue="currentRow[field.fieldname]"
                :placeholder="`Select ${field.label}`"
                :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                @update:modelValue="(val) => currentRow[field.fieldname] = val"
                class="w-full"
              />

              <!-- Checkbox Field -->
              <div v-else-if="field.fieldtype === 'Check'" class="flex items-center">
                <Checkbox
                  :modelValue="currentRow[field.fieldname]"
                  :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                  @update:modelValue="(val) => currentRow[field.fieldname] = val"
                  class="mr-2"
                />
                <span class="text-sm text-gray-700">{{ field.label }}</span>
              </div>

              <!-- Date Field -->
              <Input
                v-else-if="field.fieldtype === 'Date'"
                type="date"
                :modelValue="currentRow[field.fieldname]"
                :placeholder="`Select ${field.label}`"
                :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                @update:modelValue="(val) => currentRow[field.fieldname] = val"
                class="w-full"
              />

              <!-- Datetime Field -->
              <DateTimePicker
                v-else-if="field.fieldtype === 'Datetime'"
                :modelValue="currentRow[field.fieldname]"
                :placeholder="`Select ${field.label}`"
                :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                @update:modelValue="(val) => currentRow[field.fieldname] = val"
                class="w-full"
              />

              <!-- Text Editor -->
              <TextEditor
                v-else-if="field.fieldtype === 'Text Editor'"
                :content="currentRow[field.fieldname] || ''"
                :placeholder="`Enter ${field.label}`"
                :editable="modalMode !== 'view' && !isFieldReadOnly(field)"
                @change="(content) => currentRow[field.fieldname] = content"
                class="w-full"
              />

              <!-- Long Text / Small Text -->
              <Input
                v-else-if="['Long Text', 'Small Text'].includes(field.fieldtype)"
                type="textarea"
                :modelValue="currentRow[field.fieldname]"
                :placeholder="`Enter ${field.label}`"
                :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                :rows="field.fieldtype === 'Long Text' ? 4 : 2"
                @update:modelValue="(val) => currentRow[field.fieldname] = val"
                class="w-full"
              />

              <!-- Default Input -->
              <Input
                v-else
                :modelValue="currentRow[field.fieldname]"
                :placeholder="`Enter ${field.label}`"
                :disabled="modalMode === 'view' || isFieldReadOnly(field)"
                @update:modelValue="(val) => currentRow[field.fieldname] = val"
                class="w-full"
              />

              <ErrorMessage v-if="fieldErrors[field.fieldname]" :message="fieldErrors[field.fieldname]" class="mt-1" />
            </div>
          </template>
        </div>
      </template>
      
      <template #actions>
        <Button 
          @click="closeModal" 
          variant="outline"
          class="mr-2"
        >
          {{ modalMode === 'view' ? 'Close' : 'Cancel' }}
        </Button>
        <Button 
          v-if="modalMode === 'view'"
          @click="switchToEditMode" 
          variant="solid"
        >
          Edit
        </Button>
        <Button 
          v-else-if="modalMode !== 'view'"
          @click="saveRow" 
          variant="solid"
          :loading="saving"
        >
          {{ modalMode === 'edit' ? 'Update' : 'Add' }}
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue';
import { 
  Autocomplete, 
  DateTimePicker, 
  ErrorMessage, 
  Input, 
  Button, 
  FeatherIcon, 
  TextEditor,
  Select,
  Checkbox,
  Dialog,
  Tooltip
} from 'frappe-ui';
import { getHiddenFields } from '@/config/form-config';

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

// Inject formData from parent component
const formData = inject('formData', ref({}));

// State
const fields = ref([]);
const loading = ref(true);
const showModal = ref(false);
const currentRow = ref({});
const currentRowIndex = ref(-1);
const modalMode = ref('add');
const linkOptions = ref({});
const taskOptions = ref([]);
const issueOptions = ref([]);
const linkSearchQueries = ref({});
const activeLinkDropdown = ref(null);
const error = ref(null);
const saving = ref(false);
const fieldErrors = ref({});
const fetchAttempts = ref(0);
const MAX_FETCH_ATTEMPTS = 3;

// Computed properties
const visibleFields = computed(() => {
  const hiddenFieldsList = getHiddenFields(props.childDoctype);
  const systemFields = [
    "name",
    "owner",
    "creation",
    "modified",
    "modified_by",
    "docstatus",
    "idx",
    "parent",
    "parentfield",
    "parenttype"
  ];
  
  return fields.value.filter(
    (field) =>
      !field.hidden &&
      field.fieldtype !== "Section Break" &&
      field.fieldtype !== "Column Break" &&
      field.fieldtype !== "HTML" &&
      field.fieldtype !== "Button" &&
      !systemFields.includes(field.fieldname) &&
      !hiddenFieldsList.includes(field.fieldname)
  );
});

const visibleModalFields = computed(() => {
  const hiddenFieldsList = getHiddenFields(props.childDoctype);
  const systemFields = [
    "name",
    "owner",
    "creation",
    "modified",
    "modified_by",
    "docstatus",
    "idx",
    "parent",
    "parentfield",
    "parenttype"
  ];
  
  return fields.value
    .filter(field => !systemFields.includes(field.fieldname))
    .filter(field => !hiddenFieldsList.includes(field.fieldname))
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
});

const listViewFields = computed(() => {
  const inListViewFields = visibleFields.value.filter(field => {
    return field.in_list_view === true || field.in_list_view === 1 || field.in_list_view === '1';
  });
  
  if (inListViewFields.length === 0) {
    return visibleFields.value.slice(0, 5);
  }
  
  return inListViewFields;
});

// Methods
const fetchChildTableFields = async () => {
  try {
    fetchAttempts.value++;
    const response = await fetch('/api/method/frappe.client.get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'DocType',
        name: props.childDoctype
      }),
      credentials: 'include'
    });
    
    const data = await response.json();
    fields.value = data.message?.fields || [];
    fields.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));

  } catch (error) {
    console.error('Error fetching fields:', error);
    if (fetchAttempts.value < MAX_FETCH_ATTEMPTS) {
      return await fetchChildTableFields();
    }
    error.value = `Could not fetch fields for ${props.childDoctype}`;
    fields.value = []; // Fallback to empty array
  }
};

const fetchLinkFieldOptions = async () => {
  const linkFields = fields.value.filter(field => field.fieldtype === 'Link');
  
  for (const field of linkFields) {
    try {
      if (!field.options) continue;
      
      // Special handling for Task and Issue fields
      if (field.options === 'Task') {
        taskOptions.value = await fetchTasks();
        continue;
      }
      
      if (field.options === 'Issue') {
        issueOptions.value = await fetchIssues();
        continue;
      }
      
      // First try to get the title field from the doctype meta
      const metaResponse = await fetch("/api/method/frappe.client.get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: "DocType",
          name: field.options,
          fields: ["title_field"]
        }),
        credentials: "include",
      });
      
      const metaData = await metaResponse.json();
      const titleField = metaData.message?.title_field || "name";
      
      // Determine safe fields to request
      const fieldsToRequest = ["name", titleField];
      
      // Try to fetch with the title field
      const response = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: field.options,
          fields: fieldsToRequest,
          limit_page_length: 0
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        linkOptions.value[field.fieldname] = data.message.map(item => ({
          value: item.name,
          label: item[titleField] || item.name,
          description: item.name
        }));
      } else {
        // Fallback to just name if the first attempt fails
        const fallbackResponse = await fetch("/api/method/frappe.client.get_list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctype: field.options,
            fields: ["name"],
            limit_page_length: 0
          }),
          credentials: "include",
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          linkOptions.value[field.fieldname] = fallbackData.message.map(item => ({
            value: item.name,
            label: item.name,
            description: item.name
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
      linkOptions.value[field.fieldname] = [];
    }
  }
};

const fetchTasks = async (project = null) => {
  try {
    const filters = project ? { project } : {};
    const fields = ["name", "subject", "project"];
    
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: "Task",
        fields: fields,
        filters: filters,
        limit_page_length: 0
      }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.message.map(task => ({
        value: task.name,
        label: task.subject || task.name,
        description: task.name,
        project: task.project
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

const fetchIssues = async (project = null) => {
  try {
    const filters = project ? { project } : {};
    const fields = ["name", "subject", "project"];
    
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: "Issue",
        fields: fields,
        filters: filters,
        limit_page_length: 0
      }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.message.map(issue => ({
        value: issue.name,
        label: issue.subject || issue.name,
        description: issue.name,
        project: issue.project
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
};

const getFilteredLinkOptions = (field) => {
  // Special handling for Task and Issue fields based on selected project
  if (field.options === 'Task') {
    const project = currentRow.value.project || formData.value.project;
    if (project) {
      return taskOptions.value.filter(task => task.project === project);
    }
    return taskOptions.value;
  }
  
  if (field.options === 'Issue') {
    const project = currentRow.value.project || formData.value.project;
    if (project) {
      return issueOptions.value.filter(issue => issue.project === project);
    }
    return issueOptions.value;
  }
  
  // Default handling for other link fields
  const options = linkOptions.value[field.fieldname] || [];
  const query = linkSearchQueries.value[field.fieldname] || '';
  
  return query 
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(query.toLowerCase()) ||
        opt.value.toLowerCase().includes(query.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(query.toLowerCase()))
      )
    : options;
};

const handleLinkSearch = async (field, query) => {
  linkSearchQueries.value[field.fieldname] = query;
  
  // If this is a Task or Issue field and we have a project selected
  if ((field.options === 'Task' || field.options === 'Issue') && 
      (currentRow.value.project || formData.value.project)) {
    const project = currentRow.value.project || formData.value.project;
    
    if (field.options === 'Task') {
      taskOptions.value = await fetchTasks(project);
    } else if (field.options === 'Issue') {
      issueOptions.value = await fetchIssues(project);
    }
  }
};

const handleLinkSelect = (field, value) => {
  currentRow.value[field.fieldname] = value;
};

const getSelectOptions = (field) => {
  return field.options?.split('\n').filter(Boolean) || [];
};

const isChecked = (value) => {
  return value === true || value === 1 || value === '1' || value === 'Yes';
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

const getLinkDisplayValue = (field, value) => {
  if (!value) return '';
  
  if (field.options === 'Task') {
    const task = taskOptions.value.find(t => t.value === value);
    return task ? task.label : value;
  }
  
  if (field.options === 'Issue') {
    const issue = issueOptions.value.find(i => i.value === value);
    return issue ? issue.label : value;
  }
  
  const options = linkOptions.value[field.fieldname] || [];
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatNumber = (value) => {
  try {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch {
    return value;
  }
};

const isFieldReadOnly = (field) => {
  return props.isReadOnly || field.read_only === 1 || field.read_only === true || field.read_only === '1';
};

const openAddRowModal = (event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  currentRow.value = {};
  linkSearchQueries.value = {};

  // Initialize fields with default values
  fields.value.forEach(field => {
    if (field.fieldtype === 'Check') {
      currentRow.value[field.fieldname] = false;
    } else if (field.default) {
      currentRow.value[field.fieldname] = field.default;
    } else {
      currentRow.value[field.fieldname] = '';
    }
  });

  // Set parent fields
  currentRow.value.parentfield = props.fieldname;
  currentRow.value.parenttype = props.parentDoctype;
  delete currentRow.value.parent;
  delete currentRow.value.name;

  // If parent has a project, set it by default
  if (formData.value.project) {
    currentRow.value.project = formData.value.project;
  }

  currentRowIndex.value = -1;
  modalMode.value = 'add';
  showModal.value = true;
};

const viewRow = (index) => {
  currentRow.value = JSON.parse(JSON.stringify(props.modelValue[index]));
  currentRowIndex.value = index;
  modalMode.value = 'view';
  showModal.value = true;
};

const switchToEditMode = () => {
  modalMode.value = 'edit';
};

const saveRow = async () => {
  saving.value = true;
  fieldErrors.value = {};
  
  try {
    // Validate required fields
    let hasErrors = false;
    visibleModalFields.value.forEach(field => {
      if (field.reqd && !currentRow.value[field.fieldname]) {
        fieldErrors.value[field.fieldname] = `${field.label} is required`;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      throw new Error('Please fill in all required fields');
    }

    // Convert numeric fields to numbers
    visibleModalFields.value.forEach(field => {
  if (['Int', 'Float', 'Currency', 'Percent'].includes(field.fieldtype)) {
    const value = currentRow.value[field.fieldname];
    if (value !== undefined && value !== null && value !== '') {
      currentRow.value[field.fieldname] = parseFloat(value);
    }
  }
});

    const newValue = [...(props.modelValue || [])];
    const rowToSave = { ...currentRow.value };
    delete rowToSave.parent;

    if (modalMode.value === 'edit') {
      newValue[currentRowIndex.value] = rowToSave;
    } else {
      newValue.push(rowToSave);
    }

    emit('update:modelValue', newValue);
    emit('change', newValue);
    closeModal();
  } catch (error) {
    console.error('Error saving row:', error);
  } finally {
    saving.value = false;
  }
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
  fieldErrors.value = {};
};

const retryFetch = async () => {
  loading.value = true;
  error.value = null;
  fetchAttempts.value = 0;
  
  try {
    await fetchChildTableFields();
    await fetchLinkFieldOptions();
  } catch (err) {
    error.value = err.message || 'Failed to load child table fields';
  } finally {
    loading.value = false;
  }
};

// Watch for project changes to update task/issue options
watch(() => currentRow.value.project, async (newProject) => {
  if (!showModal.value) return;
  
  // Find Task and Issue fields in the form
  const taskField = fields.value.find(f => f.fieldtype === 'Link' && f.options === 'Task');
  const issueField = fields.value.find(f => f.fieldtype === 'Link' && f.options === 'Issue');
  
  if (taskField) {
    taskOptions.value = await fetchTasks(newProject);
  }
  
  if (issueField) {
    issueOptions.value = await fetchIssues(newProject);
  }
});

// Initialize
onMounted(async () => {
  try {
    loading.value = true;
    await fetchChildTableFields();
    await fetchLinkFieldOptions();
  } catch (err) {
    error.value = err.message || 'Failed to load child table fields';
  } finally {
    loading.value = false;
  }
});

// Watch for changes in childDoctype
watch(() => props.childDoctype, async () => {
  loading.value = true;
  fields.value = [];
  linkOptions.value = {};
  taskOptions.value = [];
  issueOptions.value = [];
  fetchAttempts.value = 0;
  error.value = null;
  
  try {
    await fetchChildTableFields();
    await fetchLinkFieldOptions();
  } catch (error) {
    console.error('Error when childDoctype changed:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
table {
  border-collapse: separate;
  border-spacing: 0;
}

th {
  position: sticky;
  top: 0;
  z-index: 10;
}

td, th {
  padding: 0.75rem 1rem;
}

tr:hover {
  background-color: #f9fafb;
}

.sticky {
  position: sticky;
  right: 0;
  z-index: 5;
}
</style>