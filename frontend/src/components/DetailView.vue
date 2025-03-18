<template>
  <div class="p-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{{ error }}</p>
      <button @click="$router.back()" class="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg">
        Go Back
      </button>
    </div>

    <!-- Detail View -->
    <div v-else class="bg-white rounded-lg shadow-md p-6">
    
      <!-- Header with Actions -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900">{{ recordTitle }} </h2>
          <div class="flex items-center mt-1">
            <span class="text-sm text-gray-500">{{ doctype }} ID: {{ recordId }}</span>
            <span v-if="record.status" class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(record.status)">
              {{ record.status }}
            </span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button 
            @click="$router.push(`/${doctypeRoute}/edit/${recordId}`)" 
            class="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
          <button 
            @click="confirmDelete" 
            class="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Record Details -->
      <div class="space-y-6">
        <template v-for="(section, sectionIndex) in fieldSections" :key="sectionIndex">
          <div :class="{'border-t border-gray-200 pt-6 mt-6': sectionIndex > 0}">
            <h3 v-if="section.label" class="text-lg font-medium text-gray-900 mb-4">{{ section.label }}</h3>
            
            <!-- Render fields in this section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <template v-for="(column, columnIndex) in section.columns" :key="columnIndex">
                <div class="space-y-4">
                  <template v-for="field in column" :key="field.fieldname">
                    <div v-if="shouldDisplayField(field)" class="mb-4">
                      <div class="text-sm font-medium text-gray-500 mb-1">{{ field.label }}</div>
                      
                      <!-- Link fields -->
                      <div v-if="field.fieldtype === 'Link'" class="text-gray-900">
                        {{ getFieldDisplayValue(field) }}
                      </div>
                      
                      <!-- Select fields -->
                      <div v-else-if="field.fieldtype === 'Select'" class="text-gray-900">
                        {{ record[field.fieldname] }}
                      </div>
                      
                      <!-- Text Editor fields -->
                      <div v-else-if="field.fieldtype === 'Text Editor'" class="prose max-w-none">
                        <div v-html="record[field.fieldname]"></div>
                      </div>
                      
                      <!-- Checkbox fields -->
                      <div v-else-if="field.fieldtype === 'Check'" class="text-gray-900">
                        <span v-if="record[field.fieldname]" class="text-green-600">Yes</span>
                        <span v-else class="text-red-600">No</span>
                      </div>
                      
                      <!-- Image fields -->
                      <div v-else-if="field.fieldtype === 'Attach Image' && record[field.fieldname]" class="mt-1">
                        <img :src="record[field.fieldname]" alt="Attached Image" class="h-48 w-auto rounded-lg" />
                      </div>
                      
                      <!-- Attachment fields -->
                      <div v-else-if="field.fieldtype === 'Attach' && record[field.fieldname]" class="mt-1 flex items-center">
                        <a :href="record[field.fieldname]" target="_blank" class="text-blue-600 hover:underline flex items-center">
                          <svg class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Download Attachment
                        </a>
                      </div>
                      
                      <!-- Date fields -->
                      <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'" class="text-gray-900">
                        {{ formatDate(record[field.fieldname]) }}
                      </div>
                      
                      <!-- Default field display -->
                      <div v-else class="text-gray-900">
                        {{ record[field.fieldname] }}
                      </div>
                    </div>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- Metadata -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">Created By</div>
            <div class="text-gray-900">{{ record.owner || 'Unknown' }}</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">Created On</div>
            <div class="text-gray-900">{{ formatDate(record.creation) }}</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">Last Modified By</div>
            <div class="text-gray-900">{{ record.modified_by || 'Unknown' }}</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">Last Modified On</div>
            <div class="text-gray-900">{{ formatDate(record.modified) }}</div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="mt-8">
        <button 
          @click="$router.push(`/${doctypeRoute}`)" 
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Back to List
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
        <p class="text-gray-600 mb-6">Are you sure you want to delete this {{ doctype }}? This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button 
            @click="showDeleteConfirm = false" 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleDelete" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';

const props = defineProps({
  doctype: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
  },
  titleField: {
    type: String,
    default: 'subject'
  },
  detailFields: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['record-deleted']);

const router = useRouter();
const record = ref({});
const formFields = ref([]);
const loading = ref(true);
const error = ref(null);
const linkFieldOptions = ref({});
const showDeleteConfirm = ref(false);
const clientScripts = ref([]);
const eventHandlers = ref({});
const userPermissions = ref([]);

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const recordTitle = computed(() => {
  if (record.value && record.value[props.titleField]) {
    return record.value[props.titleField];
  }
  return `${props.doctype} ${props.recordId}`;
});

// Organize fields into sections and columns
const fieldSections = computed(() => {
  const sections = [];
  let currentSection = { label: '', columns: [[]] };
  let currentColumn = 0;

  const systemFields = ['name', 'owner', 'creation', 'modified', 'modified_by', 'docstatus', 'idx'];
  const visibleFields = formFields.value.filter(field => 
    field && 
    field.fieldname && 
    !field.hidden && 
    !systemFields.includes(field.fieldname)
  ).sort((a, b) => (a.idx || 0) - (b.idx || 0));
  
  // Group fields into sections and columns
  for (const field of visibleFields) {
    if (field.fieldtype === 'Section Break') {

      if (currentSection.columns[0].length > 0 || sections.length === 0) {
        sections.push(currentSection);
        currentSection = { 
          label: field.label || '', 
          columns: [[]] 
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
  

  if (currentSection.columns.some(col => col.length > 0)) {
    sections.push(currentSection);
  }
  
  return sections;
});

// Methods
const fetchRecord = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    await fetchUserPermissions();
    const data = await api.fetchDocument(props.doctype, props.recordId);
    
    // Check user permissions for this record
    if (!hasPermissionForRecord(data)) {
      error.value = `You don't have permission to access this ${props.doctype}`;
      router.push(`/${doctypeRoute.value}`);
      return;
    }
    
    record.value = data;
    
    triggerEvent('onload');
    
  } catch (err) {
    console.error(`Error fetching ${props.doctype}:`, err);
    error.value = `Failed to load ${props.doctype}`;
  } finally {
    loading.value = false;
  }
};

const fetchUserPermissions = async () => {
  try {
    // Fetch user permissions from Frappe
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'User Permission',
        fields: ['name', 'user', 'allow', 'for_value'],
        filters: {
          user: ['=', await api.getCurrentUser()]
        }
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      userPermissions.value = data.message;
      console.log('User permissions:', userPermissions.value);
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
  }
};

const hasPermissionForRecord = (record) => {
 
  const doctypePermissions = userPermissions.value.filter(p => p.allow === props.doctype);
  
  if (doctypePermissions.length === 0) {
    return true;
  }

  for (const permission of doctypePermissions) {
    for (const [fieldname, value] of Object.entries(record)) {
      if (value === permission.for_value) {
        return true;
      }
    }
  }
  
  return false;
};

const fetchDoctypeFields = async () => {
  try {
    const result = await api.fetchDoctypeFields(props.doctype);
    
    if (Array.isArray(result)) {
      formFields.value = result;
    } else if (result && result.fields) {
      formFields.value = result.fields;
    } else {
      throw new Error('Invalid response format');
    }
    
    await fetchLinkFieldOptions();
    
    // Fetch client scripts
    await fetchClientScripts();
    
  } catch (error) {
    console.error('Error fetching doctype fields:', error);
    error.value = 'Failed to load doctype fields';
  }
};

const fetchClientScripts = async () => {
  try {
    console.log(`Fetching client scripts for ${props.doctype}...`);
    
    const scripts = await api.fetchClientScripts(props.doctype);
    clientScripts.value = scripts;
    
    console.log(`Successfully fetched ${clientScripts.value.length} client scripts`);
    
    parseClientScripts();
  } catch (error) {
    console.error('Error fetching client scripts:', error);
  }
};

const parseClientScripts = () => {
  if (!window.frappe) {
    window.frappe = createFrappeContext();
  }
  
  for (const script of clientScripts.value) {
    try {
      console.log(`Parsing client script: ${script.name}`);
      const scriptFn = new Function(script.script);
      scriptFn();
      console.log(`Successfully parsed client script: ${script.name}`);
    } catch (error) {
      console.error(`Error parsing client script ${script.name}:`, error);
    }
  }
};

// Create a Frappe context for client scripts
const createFrappeContext = () => {
  const frappeContext = {
    ui: {
      form: {
        on: (doctype, events) => {
          console.log(`Registering events for ${doctype}:`, events);
          
          for (const [event, handler] of Object.entries(events)) {
            if (!eventHandlers.value[event]) {
              eventHandlers.value[event] = [];
            }
            
            eventHandlers.value[event].push(handler);
            console.log(`Registered handler for ${event} event`);
          }
        }
      }
    },
    msgprint: (message) => {
      console.log('MSGPRINT:', message);
      alert(typeof message === 'object' ? message.message : message);
    },
    throw: (message) => {
      console.log('THROW:', message);
      error.value = typeof message === 'object' ? message.message : message;
    },
    show_alert: (message, seconds = 3) => {
      console.log('SHOW_ALERT:', message);
      alert(typeof message === 'object' ? message.message : message);
    },
    confirm: (message, callback) => {
      if (confirm(message)) {
        callback();
      }
    },
    prompt: (options, callback) => {
      const result = prompt(options.message || 'Please enter a value', options.default || '');
      if (result !== null) {
        callback(result);
      }
    },
    format: (value, df) => {
      return value; 
    },
    datetime: {
      now_date: () => new Date().toISOString().split('T')[0]
    },
    model: {
      events: {
        on: (doctype, fieldname, fn) => {
    
        }
      }
    },
    meta: {
      get_docfield: (doctype, fieldname) => {
        return formFields.value.find(f => f.fieldname === fieldname) || {};
      }
    }
  };
  
  return frappeContext;
};

const triggerEvent = (event, fieldname = null) => {
  console.log(`Triggering event: ${event}, field: ${fieldname || 'none'}`);
  
  const frm = {
    doc: record.value,
    doctype: props.doctype,
    docname: props.recordId,
    fields_dict: {},
    get_field: (fieldname) => {
      return formFields.value.find(f => f.fieldname === fieldname) || {};
    },
    set_value: (field, value) => {
      record.value[field] = value;
      return Promise.resolve();
    },
    refresh_field: (fieldname) => {
      const temp = { ...record.value };
      record.value = temp;
    },
    trigger: (event) => {
      triggerEvent(event);
    }
  };
  
  if (eventHandlers.value[event]) {
    for (const handler of eventHandlers.value[event]) {
      try {
        handler(frm);
      } catch (error) {
        console.error(`Error executing handler for ${event} event:`, error);
      }
    }
  }
  
  if (fieldname && eventHandlers.value[fieldname]) {
    for (const handler of eventHandlers.value[fieldname]) {
      try {
        handler(frm);
      } catch (error) {
        console.error(`Error executing handler for ${fieldname} field:`, error);
      }
    }
  }
};

const fetchLinkFieldOptions = async () => {
  const linkFields = formFields.value.filter(field => field.fieldtype === 'Link');
  
  for (const field of linkFields) {
    try {
      console.log(`Fetching options for ${field.fieldname} (${field.options})`);
      
      let options = [];
      
      if (field.options === 'Project') {
        const projects = await api.fetchLinkOptions('Project', ['name', 'project_name']);
        options = projects.map(item => ({
          value: item.name,
          label: item.project_name || item.name
        }));
      } else if (field.options === 'Contact') {
        const contacts = await api.fetchLinkOptions('Contact', ['name', 'first_name', 'last_name']);
        options = contacts.map(item => ({
          value: item.name,
          label: `${item.first_name || ''} ${item.last_name || ''} (${item.name})`
        }));
      } else {
        // Default handling for other doctypes
        const items = await api.fetchLinkOptions(field.options, ['name']);
        options = items.map(item => ({
          value: item.name,
          label: item.name
        }));
      }
      
      linkFieldOptions.value[field.fieldname] = options;
      
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
    }
  }
};

const shouldDisplayField = (field) => {
  if (!record.value) return false;
  
  // Check if the field has a value or is a checkbox
  const value = record.value[field.fieldname];
  return field.fieldtype === 'Check' || value !== undefined && value !== null && value !== '';
};

const getFieldDisplayValue = (field) => {
  if (!field || !record.value) return '';

  const value = record.value[field.fieldname];
  if (!value) return '';

  if (field.fieldtype === 'Link') {
    const options = linkFieldOptions.value[field.fieldname] || [];
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  return value;
};

const getStatusClass = (status) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-yellow-100 text-yellow-800';
    case 'closed':
      return 'bg-green-100 text-green-800';
    case 'resolved':
      return 'bg-blue-100 text-blue-800';
    case 'on hold':
    case 'hold':
      return 'bg-orange-100 text-orange-800';
    case 'replied':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const confirmDelete = () => {
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  try {
    loading.value = true;
    showDeleteConfirm.value = false;
    
    await api.deleteDocument(props.doctype, props.recordId);
    
    emit('record-deleted', props.recordId);
    
    // Navigate back to list view
    router.push(`/${doctypeRoute.value}`);
    
  } catch (error) {
    console.error(`Error deleting ${props.doctype}:`, error);
    error.value = `Error deleting ${props.doctype}: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  console.log(`DetailView component mounted for ${props.doctype} ${props.recordId}`);
  
  try {
    await fetchDoctypeFields();
    
    await fetchRecord();
  } catch (error) {
    console.error('Error initializing component:', error);
    error.value = 'Failed to initialize component';
  }
});

watch(() => props.recordId, async (newId) => {
  if (newId) {
    await fetchRecord();
  }
});

watch(() => props.doctype, async () => {
  loading.value = true;
  formFields.value = [];
  record.value = {};
  
  try {
    await fetchDoctypeFields();
    await fetchRecord();
  } catch (error) {
    console.error('Error when doctype changed:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style>
.field-container {
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .field-container.w-full {
    width: 100%;
  }
}
</style>