<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Header -->
    <div class="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center min-w-0 flex-1">
            <Button variant="ghost" class="mr-3 p-2 -ml-2" @click="handleCancel">
              <FeatherIcon name="chevron-left" class="h-5 w-5" />
            </Button>
            <h1 class="text-lg font-semibold text-gray-900 truncate">{{ headerTitle }}</h1>
          </div>
          
          <!-- Action buttons for edit mode -->
          <div v-if="mode === 'edit' && docname" class="flex items-center gap-2 ml-3">
            <Button variant="ghost" @click="confirmDelete" class="p-2 text-red-600 hover:bg-red-50">
              <FeatherIcon name="trash-2" class="h-5 w-5" />
            </Button>
          </div>
        </div>

        <!-- Connected Records Tabs - Only show in edit mode if there are connections -->
        <div v-if="mode === 'edit' && docname && hasConnectedRecords" class="mt-3">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 overflow-x-auto">
              <button
                @click="activeTab = 'form'"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                Form
              </button>
              <button
                v-for="(records, doctype) in connectedRecords"
                :key="doctype"
                @click="activeTab = doctype"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeTab === doctype
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                {{ doctype }} ({{ records.length }})
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="pt-16" :class="{ 'pt-28': mode === 'edit' && docname && hasConnectedRecords }">
      <!-- Quick Entry Dialog -->
      <Dialog v-model="showQuickEntryDialog">
        <template #body-title>
          <h2 class="text-xl font-bold">Quick Add {{ doctype }}</h2>
        </template>
        <template #body-content>
          <div class="space-y-4 max-h-[60vh] overflow-y-auto">
            <FormField
              v-for="field in quickEntryFields"
              :key="field.fieldname"
              :fieldtype="field.fieldtype"
              :fieldname="field.fieldname"
              v-model="quickEntryData[field.fieldname]"
              :default="field.default"
              :label="field.label"
              :options="field.options"
              :linkFilters="field.linkFilters"
              :documentList="getOptionsForField(field)"
              :readOnly="isFieldReadOnly(field)"
              :reqd="Boolean(field.reqd)"
              :hidden="Boolean(field.hidden)"
              :errorMessage="fieldErrors[field.fieldname]"
              :description="field.description"
            />
          </div>
        </template>
        <template #actions>
          <div class="flex gap-3">
            <Button variant="outline" class="flex-1" @click="openFullForm">
              Full Form
            </Button>
            <Button variant="solid" class="flex-1" @click="submitQuickEntry" :loading="submitting">
              Save
            </Button>
          </div>
        </template>
      </Dialog>

      <!-- Form Content -->
      <div v-if="!showQuickEntryDialog" class="pb-20">
        <!-- Form Tab Content -->
        <div v-if="!mode === 'edit' || !hasConnectedRecords || activeTab === 'form'">
          <!-- Assignment Section for Edit Mode -->
          <div v-if="mode === 'edit' && docname" class="mx-4 mt-4 bg-white rounded-lg p-4 shadow-sm border">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 min-w-0 flex-1">
                <FeatherIcon name="users" class="h-4 w-4 flex-shrink-0 text-gray-500" />
                <h3 class="text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</h3>
                <AssignmentList 
                  ref="assignmentListRef"
                  class="flex-shrink-0"
                  :doctype="doctype" 
                  :docname="docname" 
                  @assignment-removed="handleAssignmentRemoved" 
                  @assignment-error="handleAssignmentError"
                />
              </div>
              <AssignmentDialog 
                class="flex-shrink-0 ml-2"
                :doctype="doctype" 
                :docname="docname" 
                @assignment-added="handleAssignmentAdded" 
                @assignment-error="handleAssignmentError"
              />
            </div>
          </div>

          <!-- Connected Records Section - Separate from assignments -->
          <div v-if="mode === 'edit' && docname && hasConnectedRecords" class="mx-4 mt-4 bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b">
              <h3 class="text-lg font-medium text-gray-900 flex items-center">
                <FeatherIcon name="link" class="h-5 w-5 mr-2 text-blue-600" />
                Connected Records
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                Records linked to this {{ doctype }}
              </p>
            </div>
            
            <div class="p-4">
              <div class="space-y-4">
                <div v-for="(records, linkedDoctype) in connectedRecords" :key="linkedDoctype" class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="font-medium text-gray-700 mb-3 flex items-center">
                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    {{ linkedDoctype }} ({{ records.length }})
                  </h4>
                  <div class="space-y-2">
                    <div 
                      v-for="record in records.slice(0, 3)" 
                      :key="record.name" 
                      class="bg-white p-3 rounded border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      @click="navigateToRecord(linkedDoctype, record.name)"
                    >
                      <div class="flex justify-between items-center">
                        <div class="flex items-center min-w-0 flex-1">
                          <FeatherIcon name="file-text" class="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                          <div class="min-w-0 flex-1">
                            <div class="font-medium text-gray-900 truncate">{{ record.name }}</div>
                            <div v-if="record.title || record.subject" class="text-sm text-gray-600 truncate">
                              {{ record.title || record.subject }}
                            </div>
                          </div>
                        </div>
                        <FeatherIcon name="chevron-right" class="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                    
                    <div v-if="records.length > 3" class="text-center">
                      <Button variant="ghost" size="sm" @click="activeTab = linkedDoctype">
                        View all {{ records.length }} {{ linkedDoctype }} records →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Form -->
          <div class="mx-4 mt-4 bg-white rounded-lg shadow-sm border">
            <div class="p-4 md:p-6">
              <!-- Error Messages -->
              <ErrorMessage v-if="formErrorMessage" :message="formErrorMessage" class="mb-4" />

              <!-- Form Fields -->
              <div class="space-y-6">
                <template v-for="(field, index) in processedFields" :key="field.fieldname">
                  <FormField
                    :fieldtype="field.fieldtype"
                    :fieldname="field.fieldname"
                    v-model="formModel[field.fieldname]"
                    :default="field.default"
                    :label="field.label"
                    :options="field.options"
                    :linkFilters="field.linkFilters"
                    :documentList="getOptionsForField(field)"
                    :readOnly="isFieldReadOnly(field)"
                    :reqd="Boolean(field.reqd)"
                    :hidden="Boolean(field.hidden)"
                    :errorMessage="fieldErrors[field.fieldname]"
                    :description="field.description"
                    :collapsible="Boolean(field.collapsible)"
                    :parentCollapsedSections="collapsedSections"
                    :currentSectionName="getCurrentSectionName(field, index)"
                    @update:modelValue="(value) => handleFieldUpdate(field.fieldname, value)"
                    @file-upload="(data) => handleFileUpload(data)"
                    @file-remove="(fieldname) => handleFileRemove(fieldname)"
                    @link-search="(data) => handleLinkSearch(data)"
                    @section-toggle="(data) => handleSectionToggle(data)"
                  />
                </template>
              </div>

              <!-- File Upload Section -->
              <div v-if="showAttachmentView" class="mt-6">
                <FileUploaderView
                  v-model="fileAttachments"
                  @handle-file-select="handleFileSelect"
                  @handle-file-delete="handleFileDelete"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Connected Records Tab Content -->
        <div v-else-if="activeTab && activeTab !== 'form'" class="mx-4 mt-4">
          <ConnectedRecords 
            :doctype="activeTab"
            :records="connectedRecords[activeTab] || []"
            @navigate-to-record="navigateToRecord"
          />
        </div>
      </div>
    </div>

    <!-- Fixed Bottom Action Bar -->
    <div v-if="!showQuickEntryDialog" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div class="p-4 pb-safe">
        <div class="flex gap-3 max-w-md mx-auto">
          <Button variant="outline" class="flex-1" @click="handleCancel" :disabled="submitting">
            Cancel
          </Button>
          <Button variant="solid" class="flex-1" @click="handleSubmit" :loading="submitting">
            {{ mode === 'edit' ? 'Update' : 'Create' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model="showDeleteDialog">
      <template #body-title>
        <h2 class="text-xl font-bold">Confirm Delete</h2>
      </template>
      <template #body-content>
        <div v-if="deleteError" class="mb-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <FeatherIcon name="alert-circle" class="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="text-sm font-medium text-red-800">Cannot Delete Document</h3>
                <div class="mt-2 text-sm text-red-700" v-html="deleteError"></div>
              </div>
            </div>
          </div>
        </div>
        <p v-else>Are you sure you want to delete this {{ doctype }}? This action cannot be undone.</p>
      </template>
      <template #actions>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="showDeleteDialog = false">
            {{ deleteError ? 'Close' : 'Cancel' }}
          </Button>
          <Button 
            v-if="!deleteError" 
            variant="solid" 
            theme="red" 
            class="flex-1" 
            @click="handleDelete" 
            :loading="deleting"
          >
            Delete
          </Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick, provide } from 'vue'
import { useRouter } from 'vue-router'
import { Button, FeatherIcon, ErrorMessage, Dialog, toast } from 'frappe-ui'
import FormField from './FormField.vue'
import FileUploaderView from './FileUploaderView.vue'
import AssignmentDialog from './AssignmentDialog.vue'
import AssignmentList from './AssignmentList.vue'
import ConnectedRecords from './ConnectedRecords.vue'
import { getHiddenFields } from '@/config/form-config'

const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
  docname: {
    type: String,
    required: false,
  },
  mode: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit'].includes(value)
  },
  showAttachmentView: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['validateForm', 'update:modelValue'])
const router = useRouter()

// State
const activeTab = ref('form')
const fileAttachments = ref([])
const formErrorMessage = ref('')
const fieldErrors = ref({})
const showDeleteDialog = ref(false)
const deleteError = ref('')
const deleting = ref(false)
const submitting = ref(false)
const connectedRecords = ref({})
const linkFieldOptions = ref({})
const assignmentListRef = ref(null)
const collapsedSections = ref({})
const showQuickEntryDialog = ref(false)
const quickEntryFields = ref([])
const quickEntryData = ref({})
const currentSectionNames = ref({})

// Provide link field options to child components
provide('linkFieldOptions', linkFieldOptions)

// Computed
const formModel = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})

const headerTitle = computed(() => {
  if (props.mode === 'add') {
    return `New ${props.doctype}`
  } else if (props.docname) {
    return `${props.doctype} ${props.docname}`
  } else {
    return `Edit ${props.doctype}`
  }
})

const hasConnectedRecords = computed(() => {
  return Object.keys(connectedRecords.value).length > 0 && 
         Object.values(connectedRecords.value).some(records => records.length > 0)
})

const hiddenFieldsList = computed(() => {
  return getHiddenFields(props.doctype)
})

const processedFields = computed(() => {
  const systemFields = ['name', 'owner', 'creation', 'modified', 'modified_by', 'docstatus', 'idx']
  
  const fields = props.fields
    .filter(field => {
      if (!field || !field.fieldname) return false
      if (systemFields.includes(field.fieldname)) return false
      if (field.hidden === 1 || field.hidden === true || field.hidden === '1') return false
      if (hiddenFieldsList.value.includes(field.fieldname)) return false
      return true
    })
    .sort((a, b) => (a.idx || 0) - (b.idx || 0))

  // Track section names for collapsible functionality
  let currentSection = ''
  fields.forEach((field, index) => {
    if (field.fieldtype === 'Section Break') {
      currentSection = field.fieldname
      // Mark section as collapsible if it has the collapsible property
      if (field.collapsible) {
        // Initialize collapsed state as true by default
        if (!(field.fieldname in collapsedSections.value)) {
          collapsedSections.value[field.fieldname] = true // Changed from false to true
        }
      }
    }
    currentSectionNames.value[index] = currentSection
  })

  return fields
})

// Methods
const getOptionsForField = (field) => {
  if (field.fieldtype === 'Link' && linkFieldOptions.value[field.fieldname]) {
    return linkFieldOptions.value[field.fieldname]
  }
  return []
}

const isFieldReadOnly = (field) => {
  return Boolean(field.read_only) || (props.mode === 'edit' && formModel.value.docstatus !== 0)
}

const getCurrentSectionName = (field, index) => {
  return currentSectionNames.value[index] || ''
}

const isFieldInCollapsedSection = (field) => {
  const sectionName = getCurrentSectionName(field, processedFields.value.indexOf(field))
  return sectionName && collapsedSections.value[sectionName]
}

const handleFieldUpdate = (fieldname, value) => {
  formModel.value[fieldname] = value
  
  // Clear field errors
  if (fieldErrors.value[fieldname]) {
    delete fieldErrors.value[fieldname]
  }
}

const handleFileUpload = (data) => {
  // Handle file upload logic
  console.log('File upload:', data)
}

const handleFileRemove = (fieldname) => {
  formModel.value[fieldname] = null
}

const handleLinkSearch = async (data) => {
  const { fieldname, query } = data
  
  if (!query || query.length < 2) return
  
  try {
    const field = processedFields.value.find(f => f.fieldname === fieldname)
    if (!field || !field.options) return

    // Get the title field from meta first
    const metaResponse = await fetch("/api/method/frappe.client.get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: "DocType",
        name: field.options,
        fields: ["title_field"]
      }),
      credentials: "include",
    })
    
    const metaData = await metaResponse.json()
    const titleField = metaData.message?.title_field || "name"

    // Determine search fields
    const searchFields = [titleField, 'name']
    if (field.options === 'Project') searchFields.push('project_name')
    if (field.options === 'Contact' || field.options === 'User') searchFields.push('full_name')

    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: field.options,
        fields: ['name', titleField, ...(field.options === 'Project' ? ['project_name'] : [])],
        filters: searchFields.map(field => [field, 'like', `%${query}%`]),
        limit_page_length: 20,
      }),
      credentials: "include",
    })

    const data = await response.json()
    if (data.message) {
      const searchResults = data.message.map(item => {
        const displayValue = item[titleField] || item.name
        const secondaryValue = field.options === 'Project' ? item.project_name : null
        
        return {
          value: item.name,
          label: secondaryValue ? `${secondaryValue} (${item.name})` : displayValue,
          description: secondaryValue || displayValue
        }
      })
      
      // Update the options for this field
      linkFieldOptions.value[fieldname] = [
        ...searchResults,
        ...(linkFieldOptions.value[fieldname] || []).filter(
          existing => !searchResults.some(result => result.value === existing.value)
        )
      ]
    }
  } catch (error) {
    console.error(`Error searching ${fieldname}:`, error)
  }
}

const handleSectionToggle = (data) => {
  collapsedSections.value[data.fieldname] = data.collapsed
}

const handleFileSelect = (e) => {
  if (props.docname) {
    // Upload files immediately for existing documents
    uploadFiles([...e.target.files])
  } else {
    // Store files for upload after document creation
    fileAttachments.value.push(...e.target.files)
  }
}

const handleFileDelete = (file) => {
  fileAttachments.value = fileAttachments.value.filter(f => f !== file)
}

const uploadFiles = async (files) => {
  // File upload implementation
  console.log('Uploading files:', files)
}

const validateForm = () => {
  const errors = {}
  const requiredFields = processedFields.value.filter(field => field.reqd)
  
  for (const field of requiredFields) {
    const value = formModel.value[field.fieldname]
    if (!value && value !== 0 && value !== false) {
      errors[field.fieldname] = `${field.label} is required`
    }
  }
  
  fieldErrors.value = errors
  
  if (Object.keys(errors).length > 0) {
    formErrorMessage.value = 'Please fill in all required fields'
    return false
  }
  
  formErrorMessage.value = ''
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast({
      title: 'Validation Error',
      text: 'Please fill in all required fields',
      icon: 'alert-circle',
      iconClasses: 'text-red-500',
    })
    return
  }
  
  submitting.value = true
  
  try {
    emit('validateForm')
    
    // Handle form submission based on mode
    if (props.mode === 'add') {
      await createDocument()
    } else {
      await updateDocument()
    }
    
    toast({
      title: 'Success',
      text: `${props.doctype} ${props.mode === 'add' ? 'created' : 'updated'} successfully!`,
      icon: 'check-circle',
      iconClasses: 'text-green-500',
    })
    
  } catch (error) {
    console.error('Form submission error:', error)
    formErrorMessage.value = error.message || 'An error occurred while saving'
    
    toast({
      title: 'Error',
      text: error.message || 'An error occurred while saving',
      icon: 'alert-circle',
      iconClasses: 'text-red-500',
    })
  } finally {
    submitting.value = false
  }
}

const createDocument = async () => {
  const response = await fetch('/api/method/frappe.client.insert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc: formModel.value }),
    credentials: 'include'
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create document')
  }
  
  // Navigate to edit mode using the correct route name
  const routeName = `${props.doctype.replace(/\s+/g, '')}DetailView`
  
  try {
    await router.push({
      name: routeName,
      params: { id: data.message.name }
    })
  } catch (routeError) {
    // Fallback to a generic route pattern
    const doctypeRoute = props.doctype.toLowerCase().replace(/\s+/g, '-')
    await router.push(`/${doctypeRoute}/${data.message.name}`)
  }
}

const updateDocument = async () => {
  const response = await fetch('/api/method/frappe.client.save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc: formModel.value }),
    credentials: 'include'
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update document')
  }
}

const handleCancel = () => {
  router.back()
}

const confirmDelete = () => {
  deleteError.value = ''
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  deleting.value = true
  deleteError.value = ''
  
  try {
    const response = await fetch('/api/method/frappe.client.delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: props.doctype,
        name: props.docname
      }),
      credentials: 'include'
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      // Handle link exists error specially
      if (data.exc_type === 'LinkExistsError') {
        const message = data._server_messages ? 
          JSON.parse(data._server_messages)[0] : 
          { message: data.exception || 'This document is linked to other documents and cannot be deleted.' }
        
        const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message
        deleteError.value = parsedMessage.message || 'This document is linked to other documents and cannot be deleted.'
        return
      }
      
      throw new Error(data.message || 'Failed to delete document')
    }
    
    toast({
      title: 'Success',
      text: `${props.doctype} deleted successfully!`,
      icon: 'check-circle',
      iconClasses: 'text-green-500',
    })
    
    showDeleteDialog.value = false
    router.back()
    
  } catch (error) {
    console.error('Delete error:', error)
    deleteError.value = error.message || 'Failed to delete document'
  } finally {
    deleting.value = false
  }
}

const navigateToRecord = (doctype, docname) => {
  const route = doctype.toLowerCase().replace(/\s+/g, '-')
  router.push(`/${route}/${docname}`)
}

const handleAssignmentAdded = (assignment) => {
  if (assignmentListRef.value) {
    assignmentListRef.value.addAssignment(assignment)
  }
  
  toast({
    title: 'Success',
    text: 'Assignment added successfully!',
    icon: 'check-circle',
    iconClasses: 'text-green-500',
  })
}

const handleAssignmentRemoved = () => {
  toast({
    title: 'Success',
    text: 'Assignment removed successfully!',
    icon: 'check-circle',
    iconClasses: 'text-green-500',
  })
}

const handleAssignmentError = (error) => {
  toast({
    title: 'Error',
    text: error,
    icon: 'alert-circle',
    iconClasses: 'text-red-500',
  })
}

const fetchConnectedRecords = async () => {
  if (!props.docname || props.mode !== 'edit') return
  
  try {
    // Fetch fields that link to this doctype
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        doctype: 'DocField',
        fields: ['parent', 'fieldname', 'options'],
        filters: {
          fieldtype: 'Link',
          options: props.doctype
        },
        limit_page_length: 0
      })
    })
    
    if (!response.ok) {
      console.warn('Could not fetch connected records - insufficient permissions')
      return
    }
    
    const fieldsData = await response.json()
    const linkFields = fieldsData.message || []
    
    const linkedRecordsByDoctype = {}
    
    for (const field of linkFields) {
      try {
        const linkedResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            doctype: field.parent,
            fields: ['name', 'creation', 'modified', 'title', 'subject', 'status'],
            filters: {
              [field.fieldname]: props.docname
            },
            limit_page_length: 100
          })
        })
        
        if (linkedResponse.ok) {
          const linkedData = await linkedResponse.json()
          if (linkedData.message && linkedData.message.length > 0) {
            linkedRecordsByDoctype[field.parent] = linkedData.message
          }
        }
      } catch (error) {
        console.error(`Error fetching linked records for ${field.parent}:`, error)
      }
    }
    
    connectedRecords.value = linkedRecordsByDoctype
  } catch (error) {
    console.error('Error fetching connected records:', error)
  }
}

// const fetchLinkFieldOptions = async () => {
//   const linkFields = processedFields.value.filter(field => field.fieldtype === 'Link')
  
//   for (const field of linkFields) {
//     try {
//       if (!field.options) continue
      
//       const metaResponse = await fetch("/api/method/frappe.client.get", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           doctype: "DocType",
//           name: field.options,
//           fields: ["title_field"]
//         }),
//         credentials: "include",
//       })
      
//       const metaData = await metaResponse.json()
//       const titleField = metaData.message?.title_field || "name"
      
//       const fieldsResponse = await fetch("/api/method/frappe.client.get_list", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           doctype: "DocField",
//           fields: ["fieldname", "fieldtype"],
//           filters: { parent: field.options },
//           limit_page_length: 0
//         }),
//         credentials: "include",
//       })
      
//       const fieldsData = await fieldsResponse.json()
//       const fieldNames = fieldsData.message || []
      
//       const fieldsToFetch = new Set(["name", titleField, "creation"])
      
//       const commonNameFields = [
//         "first_name", "last_name", "full_name",
//         "project_name", "subject", "title",
//         "customer_name", "employee_name"
//       ]
      
//       commonNameFields.forEach(fieldName => {
//         if (fieldNames.some(f => f.fieldname === fieldName)) {
//           fieldsToFetch.add(fieldName)
//         }
//       })
      
//       if (fieldNames.some(f => f.fieldname === "status")) {
//         fieldsToFetch.add("status")
//       }
      
//       const response = await fetch("/api/method/frappe.client.get_list", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           doctype: field.options,
//           fields: Array.from(fieldsToFetch),
//           limit_page_length: 0,
//           order_by: "creation desc"
//         }),
//         credentials: "include",
//       })

//       if (!response.ok) throw new Error(`Failed to fetch options for ${field.fieldname}`)

//       const data = await response.json()

//       if (data.message) {
//         linkFieldOptions.value[field.fieldname] = data.message.map(item => {
//           let label = item[titleField] || item.name
          
//           if (label === item.name) {
//             if (item.first_name && item.last_name) {
//               label = `${item.first_name} ${item.last_name}`.trim()
//             } 
//             else if (item.full_name) {
//               label = item.full_name
//             }
//             else if (item.project_name) {
//               label = item.project_name
//             }
//             else if (item.subject) {
//               label = item.subject
//             }
//             else if (item.title) {
//               label = item.title
//             }
//             else if (item.customer_name) {
//               label = item.customer_name
//             }
//             else if (item.employee_name) {
//               label = item.employee_name
//             }
//           }
          
//           return {
//             value: item.name,
//             label: label || item.name,
//             description: item.name !== label ? `${item.name}` : undefined,
//             creation: item.creation,
//             ...(item.status && { status: item.status })
//           }
//         })
//       }
//     } catch (error) {
//       console.error(`Error fetching options for ${field.fieldname}:`, error)
//       const fallbackResponse = await fetch("/api/method/frappe.client.get_list", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           doctype: field.options,
//           fields: ["name"],
//           limit_page_length: 500,
//         }),
//         credentials: "include",
//       })
      
//       const fallbackData = await fallbackResponse.json()
//       linkFieldOptions.value[field.fieldname] = fallbackData.message?.map(item => ({
//         value: item.name,
//         label: item.name
//       })) || []
//     }
//   }
// }


const fetchLinkFieldOptions = async () => {
  const linkFields = processedFields.value.filter(field => field.fieldtype === 'Link')
  
  for (const field of linkFields) {
    try {
      if (!field.options) continue
      
      // Get the title field from meta
      const metaResponse = await fetch("/api/method/frappe.client.get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: "DocType",
          name: field.options,
          fields: ["title_field"]
        }),
        credentials: "include",
      })
      
      const metaData = await metaResponse.json()
      const titleField = metaData.message?.title_field || "name"
      
      // Get common name fields based on doctype
      const commonFields = {
        'Project': ['project_name'],
        'Contact': ['full_name'],
        'User': ['full_name'],
        // Add other doctype-specific fields as needed
      }
      
      const fieldsToFetch = [
        'name', 
        titleField,
        ...(commonFields[field.options] || [])
      ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
      
      const response = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: field.options,
          fields: fieldsToFetch,
          limit_page_length: 0,
          order_by: "modified desc"
        }),
        credentials: "include",
      })

      if (!response.ok) throw new Error(`Failed to fetch options for ${field.fieldname}`)

      const data = await response.json()

      if (data.message) {
      linkFieldOptions.value[field.fieldname] = data.message.map(item => {
        // For Projects specifically
        if (field.options === 'Project') {
          return {
            value: item.name, // Stores PROJ-0024
            label: item.project_name, // Shows "Wave" in dropdown
            description: item.name // Shows "PROJ-0024" as description
          }
        }
        // Default for other doctypes
        return {
          value: item.name,
          label: item[titleField] || item.name,
          description: item.name
        }
      })
    }
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error)
      // Fallback to basic names
      const fallbackResponse = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: field.options,
          fields: ["name"],
          limit_page_length: 20,
        }),
        credentials: "include",
      })
      
      const fallbackData = await fallbackResponse.json()
      linkFieldOptions.value[field.fieldname] = fallbackData.message?.map(item => ({
        value: item.name,
        label: item.name,
        description: item.name
      })) || []
    }
  }
}

const prepareQuickEntryFields = () => {
  if (props.mode !== 'add') return
  
  // Get fields marked for quick entry
  const quickFields = processedFields.value.filter(field => 
    field.allow_in_quick_entry === 1 || field.reqd === 1
  ).slice(0, 5) // Limit to 5 fields
  
  if (quickFields.length > 0) {
    quickEntryFields.value = quickFields
    quickEntryData.value = {}
    
    // Initialize quick entry data
    quickFields.forEach(field => {
      quickEntryData.value[field.fieldname] = field.default || ''
    })
    
    showQuickEntryDialog.value = true
  }
}

const submitQuickEntry = async () => {
  // Validate quick entry fields
  const errors = {}
  const requiredFields = quickEntryFields.value.filter(field => field.reqd)
  
  for (const field of requiredFields) {
    const value = quickEntryData.value[field.fieldname]
    if (!value && value !== 0 && value !== false) {
      errors[field.fieldname] = `${field.label} is required`
    }
  }
  
  if (Object.keys(errors).length > 0) {
    fieldErrors.value = errors
    return
  }
  
  // Copy quick entry data to main form
  Object.assign(formModel.value, quickEntryData.value)
  
  // Submit the form
  showQuickEntryDialog.value = false
  await handleSubmit()
}

const openFullForm = () => {
  // Copy quick entry data to main form
  Object.assign(formModel.value, quickEntryData.value)
  showQuickEntryDialog.value = false
}

// Lifecycle
onMounted(async () => {
  await fetchLinkFieldOptions()
  
  if (props.mode === 'edit' && props.docname) {
    await fetchConnectedRecords()
  } else if (props.mode === 'add') {
    prepareQuickEntryFields()
  }
})

watch(() => props.mode, async (newMode) => {
  if (newMode === 'edit' && props.docname) {
    await fetchConnectedRecords()
  } else if (newMode === 'add') {
    prepareQuickEntryFields()
  }
})

watch(() => processedFields.value, async () => {
  await fetchLinkFieldOptions()
}, { deep: true })
</script>

<style scoped>
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
