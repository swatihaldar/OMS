<template>
  <div class="max-w-4xl mx-auto">
    <!-- Fixed Header -->
    <div class="sticky top-0 z-30 bg-white p-2 md:p-4 border-b">
      <div class="flex items-center pl-10 md:pl-0">
        <button @click="$router.back()" class="mr-4 text-gray-600 hover:text-gray-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="text-xl font-semibold">{{ isEditMode ? 'Edit' : 'New' }} {{ doctype }}</h2>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="alertMessage" class="m-4 p-4 rounded-lg" :class="alertType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
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

    <!-- Quick Entry Dialog -->
    <div v-if="showQuickEntryDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-medium">Quick Add {{ doctype }}</h3>
          <button @click="closeQuickEntryDialog" class="text-gray-500 hover:text-gray-700">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <!-- Use the same FetchFieldProp component for quick entry, but with filtered fields -->
          <FetchFieldProp
            ref="quickEntryFormRef"
            v-model="quickEntryData"
            :fields="quickEntryFields"
            :field-options="fieldOptions"
            @validate="validateQuickEntryForm"
            @submit="submitForm"
            :submit-text="'Save'"
            :doctype="doctype"
            :mode="'add'"
          >
            <template #actions>
              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  @click="openFullForm"
                  class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Full Form
                </button>
                <button
                  @click="submitQuickEntryForm"
                  :disabled="submitting"
                  class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-800"
                >
                  <span v-if="submitting" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                  <span v-else>Save</span>
                </button>
              </div>
            </template>
          </FetchFieldProp>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div v-else-if="!loading" class="form-container">
      <FetchFieldProp
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
      </FetchFieldProp>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import FetchFieldProp from './FetchFieldProp.vue';
import api from '@/utils/api';
import { getHiddenFields } from '@/config/form-config';

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

// Quick Entry related refs
const showQuickEntryDialog = ref(false);
const quickEntryFields = ref([]);
const quickEntryData = ref({});
const quickEntryFormRef = ref(null);
const doctypeMeta = ref(null);

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const isEditMode = computed(() => {
  return !!props.recordId && props.recordId !== 'new';
});

// Check if the doctype has quick entry enabled
const hasQuickEntry = computed(() => {
  if (!doctypeMeta.value) return false;
  
  // Check if doctype has quick_entry enabled
  if (doctypeMeta.value.quick_entry === 1) return true;
  
  // Check if any fields are explicitly marked for quick entry
  return formFields.value.some(field => {
    return field.allow_in_quick_entry === 1 || 
           field.allow_in_quick_entry === true || 
           field.allow_in_quick_entry === '1';
  });
});

// Methods
const fetchDoctypeFields = async () => {
  try {
    console.log(`Fetching doctype fields for ${props.doctype}...`);
    
    // Use the improved API function that combines multiple sources
    const result = await api.fetchDoctypeFields(props.doctype);
    
    if (result && result.fields) {
      // Store the doctype metadata
      doctypeMeta.value = result.meta || {};
      
      // Store all fields
      formFields.value = result.fields;
      console.log(`Successfully fetched ${result.fields.length} fields for ${props.doctype}`);
      
      // Debug log to check field properties
      const sampleField = result.fields.find(f => f.fieldtype === 'Section Break' && (f.collapsible === 1 || f.collapsible === true || f.collapsible === '1'));
      if (sampleField) {
        console.log('Sample collapsible section:', sampleField);
      }
      
      const quickEntryField = result.fields.find(f => f.allow_in_quick_entry === 1 || f.allow_in_quick_entry === true || f.allow_in_quick_entry === '1');
      if (quickEntryField) {
        console.log('Sample quick entry field:', quickEntryField);
      }
      
      const fieldWithDesc = result.fields.find(f => f.description && f.description.trim() !== '');
      if (fieldWithDesc) {
        console.log('Sample field with description:', fieldWithDesc);
      }
    } else {
      throw new Error('Invalid fields data in response');
    }
    
    processFields();
    prepareQuickEntryFields();
    await fetchUserPermissions();
    await applyUserPermissionsToFormData();
    
    // Show quick entry dialog if not in edit mode and quick entry is enabled
    if (!isEditMode.value && hasQuickEntry.value) {
      showQuickEntryDialog.value = true;
    }
    
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
  const hiddenFieldsList = getHiddenFields(props.doctype);
  
  processedFields.value = formFields.value
    .filter(field => {
      if (!field || !field.fieldname) return false;
      if (systemFields.includes(field.fieldname)) return false;
      if (field.hidden === 1 || field.hidden === true || field.hidden === '1') return false;
      if (hiddenFieldsList.includes(field.fieldname)) return false;
      return true;
    })
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
    
  // Ensure all fields have the required properties
  processedFields.value = processedFields.value.map(field => {
    return {
      fieldname: field.fieldname || '',
      fieldtype: field.fieldtype || 'Data',
      label: field.label || field.fieldname || '',
      reqd: field.reqd || 0,
      hidden: field.hidden || 0,
      read_only: field.read_only || 0,
      options: field.options || '',
      default: field.default || '',
      description: field.description || '',
      idx: field.idx || 0,
      allow_in_quick_entry: field.allow_in_quick_entry || 0,
      collapsible: field.collapsible || 0,
      ...field // Keep any other properties
    };
  });
};

// Prepare fields for quick entry dialog
const prepareQuickEntryFields = () => {
  if (!formFields.value || formFields.value.length === 0) return;

  // Get fields that are marked for quick entry
  quickEntryFields.value = formFields.value
    .filter(field => {
      // Include if explicitly marked for quick entry
      const isQuickEntry = field.allow_in_quick_entry === 1 || 
                         field.allow_in_quick_entry === true || 
                         field.allow_in_quick_entry === '1';
      
      // Exclude layout fields
      const isLayoutField = ['Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype);
      
      return isQuickEntry && !isLayoutField;
    })
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  // If no fields are marked for quick entry, check if doctype has quick_entry enabled
  if (quickEntryFields.value.length === 0 && doctypeMeta.value?.quick_entry === 1) {
    // First include mandatory fields
    const mandatoryFields = formFields.value.filter(field => {
      const isMandatory = field.reqd === 1 || field.reqd === true || field.reqd === '1';
      const isLayoutField = ['Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype);
      const isLargeField = ['Long Text', 'Text Editor', 'Table'].includes(field.fieldtype);
      
      return isMandatory && !isLayoutField && !isLargeField && !field.hidden;
    });
    
    quickEntryFields.value = mandatoryFields;
    
    // If we still don't have enough fields, add some common field types
    if (quickEntryFields.value.length < 3) {
      const commonFields = formFields.value.filter(field => {
        const isCommonField = ['Data', 'Link', 'Select', 'Date', 'Check'].includes(field.fieldtype);
        const isExcludedType = ['Long Text', 'Text Editor', 'Table', 'Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype);
        
        return isCommonField && !isExcludedType && !field.hidden && 
               !quickEntryFields.value.some(qf => qf.fieldname === field.fieldname);
      }).slice(0, 5 - quickEntryFields.value.length);
      
      quickEntryFields.value = [...quickEntryFields.value, ...commonFields];
    }
  }

  // Initialize quick entry data
  quickEntryData.value = {};
  quickEntryFields.value.forEach(field => {
    quickEntryData.value[field.fieldname] = field.default || '';
  });

  console.log('Quick entry fields:', quickEntryFields.value);
};

// Submit quick entry form
const submitQuickEntryForm = async () => {
  if (quickEntryFormRef.value) {
    quickEntryFormRef.value.handleSubmit();
  }
};

// Validate quick entry form
const validateQuickEntryForm = () => {
  // Validation is handled by the FetchFieldProp component
};

// Open full form
const openFullForm = () => {
  // Merge quick entry data with form data
  Object.assign(formData.value, quickEntryData.value);
  
  // Close the dialog
  closeQuickEntryDialog();
};

// Close quick entry dialog
const closeQuickEntryDialog = () => {
  showQuickEntryDialog.value = false;
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
  
  // Set default values from field definitions
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

const submitForm = async ({ formData: submittedData, files, tempFileUrls, attachFilesToDoc }) => {
  try {
    triggerEvent('before_save');
    
    submitting.value = true;
    console.log(`Submitting ${props.doctype} with data:`, submittedData);
    
    const submissionData = { ...submittedData, doctype: props.doctype };
    
    // Save the document
    const savedDoc = await api.saveDocument(submissionData, !isEditMode.value);
    
    // If we have files to attach, do that now
    if (attachFilesToDoc && typeof attachFilesToDoc === 'function') {
      await attachFilesToDoc(savedDoc.name);
    }
    
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

watch(
  () => props.doctype,
  async (newDoctype) => {
    loading.value = true;

    try {
      formFields.value = [];
      processedFields.value = [];
      fieldOptions.value = {};
      await fetchDoctypeFields();

      if (!isEditMode.value) {
        initializeFormData();
      } else {
        await fetchRecord();
      }
    } catch (error) {
      console.error('Error when doctype prop changed:', error);
      alertMessage.value = 'Error loading data';
      alertType.value = 'error';
    } finally {
      loading.value = false;
    }
  },
  { immediate: false }
);

watch(
  () => props.recordId,
  async (newRecordId) => {
    if (newRecordId === 'new') {
      initializeFormData();
    } else if (newRecordId) {
      loading.value = true;
      try {
        await fetchRecord();
      } catch (error) {
        console.error('Error when recordId prop changed:', error);
        alertMessage.value = 'Error loading data';
        alertType.value = 'error';
      } finally {
        loading.value = false;
      }
    }
  },
  { immediate: false }
);

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
.form-container {
  padding: 0;
}

@media (max-width: 640px) {
  .form-container {
    padding: 0;
  }
  
  button[type="submit"],
  button[type="button"] {
    min-height: 48px;
  }
}

@media (min-width: 1024px) {
  button[type="submit"],
  button[type="button"] {
    height: 48px;
    font-size: 1rem;
  }
}
</style>