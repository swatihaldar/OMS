<template>
  <div class="max-w-4xl mx-auto p-4">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <button @click="$router.back()" class="mr-4 text-gray-600 hover:text-gray-800 transition-colors">
        <ChevronLeftIcon class="h-6 w-6" />
      </button>
      <h2 class="text-xl font-semibold">{{ isEditMode ? 'Edit' : 'New' }} {{ doctype }}</h2>
    </div>

    <!-- Alert Messages -->
    <div v-if="alertMessage" class="mb-4 p-4 rounded-lg" :class="alertType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg v-if="alertType === 'error'" class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">{{ alertMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button @click="alertMessage = ''" class="inline-flex rounded-md p-1.5" :class="alertType === 'error' ? 'text-red-500 hover:bg-red-100' : 'text-green-500 hover:bg-green-100'">
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Form -->
    <FormView
      v-else
      ref="formViewRef"
      v-model="formData"
      :fields="processedFields"
      :field-options="fieldOptions"
      @validate="validateForm"
      @submit="submitForm"
      @field-change="handleFieldChange"
      @delete="handleDelete"
      :submit-text="isEditMode ? 'Update' : 'Create'"
      :submitting-text="isEditMode ? 'Updating...' : 'Creating...'"
      :doctype="doctype"
      :docname="recordId"
      :mode="isEditMode ? 'edit' : 'add'"
      :titleField="titleField"
    >
      <!-- Custom actions -->
      <template #actions>
        <div class="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            @click="$router.back()"
            class="w-full sm:w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-2/3 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
          >
            <span v-if="submitting" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditMode ? 'Updating...' : 'Creating...' }}
            </span>
            <span v-else>{{ isEditMode ? 'Update' : 'Create' }}</span>
          </button>
        </div>
      </template>
    </FormView>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeftIcon } from '@heroicons/vue/24/outline';
import FormView from '@/components/FormView.vue';
import api from '@/utils/api';

const props = defineProps({
  doctype: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    default: null
  },
  defaultValues: {
    type: Object,
    default: () => ({})
  },
  titleField: {
    type: String,
    default: 'name'
  }
});

const emit = defineEmits(['form-submitted']);

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const submitting = ref(false);
const formFields = ref([]);
const processedFields = ref([]);
const fieldOptions = ref({});
const formData = ref({});
const formViewRef = ref(null);
const alertMessage = ref('');
const alertType = ref('info');
const clientScripts = ref([]);
const eventHandlers = ref({});
const userPermissions = ref([]);

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const isEditMode = computed(() => {
  return !!props.recordId && props.recordId !== 'new';
});

// Methods
const fetchDoctypeFields = async () => {
  try {
    console.log(`Fetching doctype fields for ${props.doctype}...`);
    
    const result = await api.fetchDoctypeFields(props.doctype);
    
    if (Array.isArray(result)) {
      formFields.value = result;
    } else if (result && result.fields) {
      formFields.value = result.fields;
      
      if (result.clientScripts) {
        clientScripts.value = result.clientScripts;
      } else {
        await fetchClientScripts();
      }
    } else {
      throw new Error('Invalid response format');
    }
    
    processFields();
    await fetchUserPermissions();
    await applyUserPermissionsToFormData();
    
  } catch (error) {
    console.error('Error fetching doctype fields:', error);
    alertMessage.value = 'Failed to load doctype fields';
    alertType.value = 'error';
  } finally {
    loading.value = false;
  }
};

const processFields = () => {
  const systemFields = ['name', 'owner', 'creation', 'modified', 'modified_by', 'docstatus', 'idx'];
  
  processedFields.value = formFields.value
    .filter(field => {
      if (!field || !field.fieldname) return false;
      if (systemFields.includes(field.fieldname)) return false;
      if (field.hidden) return false;
      return true;
    })
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
};

const fetchClientScripts = async () => {
  try {
    console.log(`Fetching client scripts for ${props.doctype}...`);
    
    clientScripts.value = await api.fetchClientScripts(props.doctype);
    console.log(`Successfully fetched ${clientScripts.value.length} client scripts`);
    
    parseClientScripts();
  } catch (error) {
    console.error('Error fetching client scripts:', error);
  }
};

const fetchUserPermissions = async () => {
  try {
    // Fetch user permissions
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

const applyUserPermissionsToFormData = () => {

  if (isEditMode.value) return;
  
  userPermissions.value.forEach(permission => {

    const linkFields = processedFields.value.filter(field => 
      field.fieldtype === 'Link' && field.options === permission.allow
    );
    
    linkFields.forEach(field => {
      if (!formData.value[field.fieldname]) {
        formData.value[field.fieldname] = permission.for_value;
        
        const fieldIndex = processedFields.value.findIndex(f => f.fieldname === field.fieldname);
        if (fieldIndex !== -1) {
          processedFields.value[fieldIndex] = {
            ...processedFields.value[fieldIndex],
            read_only: 1,
            read_only_depends_on: `User Permission for ${permission.allow}`
          };
        }
      }
    });
  });
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
      alertMessage.value = `Error in client script: ${error.message}`;
      alertType.value = 'error';
    }
  }

  triggerEvent('onload');
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
      alertMessage.value = typeof message === 'object' ? message.message : message;
      alertType.value = 'info';
      setTimeout(() => {
        alertMessage.value = '';
      }, 5000);
    },
    throw: (message) => {
      console.log('THROW:', message);
      alertMessage.value = typeof message === 'object' ? message.message : message;
      alertType.value = 'error';
    },
    show_alert: (message, seconds = 3) => {
      console.log('SHOW_ALERT:', message);
      alertMessage.value = typeof message === 'object' ? message.message : message;
      alertType.value = 'info';
      setTimeout(() => {
        alertMessage.value = '';
      }, seconds * 1000);
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
        return processedFields.value.find(f => f.fieldname === fieldname) || {};
      }
    }
  };
  
  return frappeContext;
};

const triggerEvent = (event, fieldname = null) => {
  console.log(`Triggering event: ${event}, field: ${fieldname || 'none'}`);
  
  const frm = {
    doc: formData.value,
    doctype: props.doctype,
    get_field: (fieldname) => {
      return processedFields.value.find(f => f.fieldname === fieldname) || {};
    },
    set_value: (field, value) => {
      formData.value[field] = value;
      return Promise.resolve();
    },
    refresh_field: (fieldname) => {
      const temp = { ...formData.value };
      formData.value = temp;
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
        alertMessage.value = `Error in client script: ${error.message}`;
        alertType.value = 'error';
      }
    }
  }
  
  // Execute field-specific handlers
  if (fieldname && eventHandlers.value[fieldname]) {
    for (const handler of eventHandlers.value[fieldname]) {
      try {
        handler(frm);
      } catch (error) {
        console.error(`Error executing handler for ${fieldname} field:`, error);
        alertMessage.value = `Error in client script: ${error.message}`;
        alertType.value = 'error';
      }
    }
  }
};


const fetchRecord = async () => {
  try {
    loading.value = true;
    
    const data = await api.fetchDocument(props.doctype, props.recordId);
    
  
    if (!hasPermissionForRecord(data)) {
      alertMessage.value = `You don't have permission to access this ${props.doctype}`;
      alertType.value = 'error';
      router.push(`/${doctypeRoute.value}`);
      return;
    }
    
    formData.value = { ...data, doctype: props.doctype };
    console.log('Loaded record data:', formData.value);
  } catch (err) {
    console.error(`Error fetching ${props.doctype}:`, err);
    alertMessage.value = `Failed to load ${props.doctype}`;
    alertType.value = 'error';
  } finally {
    loading.value = false;
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

const initializeFormData = () => {
  formData.value = { 
    doctype: props.doctype,
    ...props.defaultValues
  };
  

  for (const field of processedFields.value) {
    if (field.default && !formData.value[field.fieldname]) {
      formData.value[field.fieldname] = field.default;
    }
  }
  
  applyUserPermissionsToFormData();
};

const handleFieldChange = ({ fieldname, value, file }) => {
  console.log(`Field ${fieldname} changed:`, value, file);
  triggerEvent('change', fieldname);
  triggerEvent(fieldname);
};

const validateForm = () => {
  triggerEvent('validate');
  console.log('Validating form...');
};

const submitForm = async ({ formData: submittedData, files }) => {
  try {
    triggerEvent('before_save');
    
    submitting.value = true;
    console.log(`Submitting ${props.doctype} with data:`, submittedData);
    console.log('Files to upload:', files);
    
    const submissionData = { ...submittedData, doctype: props.doctype };
    
    // Upload files
    for (const [fieldname, file] of Object.entries(files)) {
      try {
        console.log(`Uploading file for ${fieldname}:`, file.name);
        const fileUrl = await api.uploadFile(file, props.doctype, fieldname, props.recordId);
        submissionData[fieldname] = fileUrl;
        console.log(`File uploaded successfully, URL:`, fileUrl);
      } catch (error) {
        console.error(`Error uploading file for ${fieldname}:`, error);
        if (formViewRef.value) {
          formViewRef.value.setErrorMessage(`Error uploading ${file.name}: ${error.message}`);
        }
        submitting.value = false;
        return;
      }
    }
    
    // Save the document
    const savedDoc = await api.saveDocument(submissionData, !isEditMode.value);
    
    triggerEvent('after_save');
    
    alertMessage.value = `${props.doctype} ${isEditMode.value ? 'updated' : 'created'} successfully!`;
    alertType.value = 'success';
    
    emit('form-submitted', savedDoc);
    
    setTimeout(() => {
      router.push(`/${doctypeRoute.value}/${savedDoc.name}`);
    }, 1500);
    
  } catch (error) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'creating'} ${props.doctype}:`, error);
    alertMessage.value = `Error ${isEditMode.value ? 'updating' : 'creating'} ${props.doctype}: ${error.message || 'Unknown error'}`;
    alertType.value = 'error';
    
    submitting.value = false;
    if (formViewRef.value) {
      formViewRef.value.setErrorMessage(error.message || `Error ${isEditMode.value ? 'updating' : 'creating'} ${props.doctype}`);
    }
  }
};

const handleDelete = async (docname) => {
  try {
    submitting.value = true;
    
    await api.deleteDocument(props.doctype, docname);
    
    alertMessage.value = `${props.doctype} deleted successfully!`;
    alertType.value = 'success';
    
    setTimeout(() => {
      router.push(`/${doctypeRoute.value}`);
    }, 1500);
    
  } catch (error) {
    console.error(`Error deleting ${props.doctype}:`, error);
    alertMessage.value = `Error deleting ${props.doctype}: ${error.message || 'Unknown error'}`;
    alertType.value = 'error';
  } finally {
    submitting.value = false;
  }
};

// Initialize component
onMounted(async () => {
  console.log(`FormHandler component mounted for ${props.doctype}`);
  
  try {
    await fetchDoctypeFields();
    
    if (isEditMode.value) {
      await fetchRecord();
    } else {
      initializeFormData();
      
      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser && processedFields.value.find(f => f.fieldname === 'raised_by')) {
          formData.value.raised_by = currentUser;
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing component:', error);
    alertMessage.value = 'Failed to initialize component';
    alertType.value = 'error';
  } finally {
    loading.value = false;
  }
});


watch([() => props.doctype, () => props.recordId], async () => {
  loading.value = true;
  
  try {
    if (props.doctype !== formData.value?.doctype) {
      formFields.value = [];
      processedFields.value = [];
      fieldOptions.value = {};
      await fetchDoctypeFields();
    }
    
    if (isEditMode.value) {
      await fetchRecord();
    } else {
      initializeFormData();
    }
  } catch (error) {
    console.error('Error when props changed:', error);
    alertMessage.value = 'Error loading data';
    alertType.value = 'error';
  } finally {
    loading.value = false;
  }
});


watch(() => formData.value, (newValue, oldValue) => {
  if (!oldValue) return;
  
  const changedField = Object.keys(newValue).find(key => 
    newValue[key] !== oldValue[key]
  );
  
  if (changedField) {
    triggerEvent('change', changedField);
    triggerEvent(changedField);
  }
}, { deep: true });
</script>

<style>
@media (max-width: 640px) {
  .form-view {
    padding: 1rem 0.75rem;
  }
}

@media (min-width: 1024px) {
  button[type="submit"] {
    height: 48px;
    font-size: 1rem;
  }
}
</style>