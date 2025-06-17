<template>
  <div>
    <!-- List View -->
    <ListView 
      v-if="mode === 'list'"
      :doctype="doctype"
      :titleField="titleField"
      :listFields="listFields"
      :showOnlyOwnRecords="showOnlyOwnRecords"
      :standardFilters="standardFilters"
      :filters="filters"
    />
    
    <!-- Form View (Add/Edit Mode) -->
    <FormView
      v-else
      :doctype="doctype"
      :docname="recordId"
      :fields="processedFields"
      :modelValue="formData"
      :mode="mode"
      :showAttachmentView="true"
      @update:modelValue="updateFormData"
      @validateForm="validateForm"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListView from '@/components/ListView.vue'
import FormView from '@/components/FormView.vue'
import api from '@/utils/api'
import { getHiddenFields } from '@/config/form-config'
import { usePermissions } from '../composables/usePermissions'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  doctype: {
    type: String,
    required: true
  },
  titleField: {
    type: String,
    default: 'name'
  },
  listFields: {
    type: Array,
    default: () => []
  },
  detailFields: {
    type: Array,
    default: () => []
  },
  defaultValues: {
    type: Object,
    default: () => ({})
  },
  showOnlyOwnRecords: {
    type: Boolean,
    default: false
  },
  standardFilters: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['record-deleted', 'form-submitted', 'record-updated'])

const doctypeFields = ref([])
const formData = ref({})
const loading = ref(true)

const { 
  currentUser, 
  canCreate, 
  canRead, 
  canWrite, 
  canDelete, 
  userPermissions, 
  checkPermissions 
} = usePermissions()

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-')
})

const mode = computed(() => {
  const path = route.path
  const baseRoute = `/${doctypeRoute.value}`
  
  if (path === baseRoute) {
    return 'list'
  } else if (path === `${baseRoute}/new`) {
    return 'add'
  } else {
    return 'edit'
  }
})

const recordId = computed(() => {
  if (route.path === `/${doctypeRoute.value}/new`) {
    return null
  } else {
    return route.params.id
  }
})

const hiddenFieldsList = computed(() => {
  return getHiddenFields(props.doctype)
})

const processedFields = computed(() => {
  const systemFields = ['name', 'owner', 'creation', 'modified', 'modified_by', 'docstatus', 'idx']
  
  return doctypeFields.value
    .filter(field => {
      if (!field || !field.fieldname) return false
      if (systemFields.includes(field.fieldname)) return false
      if (field.hidden === 1 || field.hidden === true || field.hidden === '1') return false
      if (hiddenFieldsList.value.includes(field.fieldname)) return false
      return true
    })
    .sort((a, b) => (a.idx || 0) - (b.idx || 0))
    .map(field => ({
      ...field,
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
    }))
})

const enhancedDefaultValues = computed(() => {
  const defaults = { 
    doctype: props.doctype,
    ...props.defaultValues 
  }
  
  // Apply user permissions
  userPermissions.value.forEach(permission => {
    const linkFields = processedFields.value.filter(field => 
      field.fieldtype === 'Link' && field.options === permission.allow
    )
    
    linkFields.forEach(field => {
      if (!defaults[field.fieldname]) {
        defaults[field.fieldname] = permission.for_value
      }
    })
  })
  
  return defaults
})

const fetchDoctypeFields = async () => {
  try {
    loading.value = true
    console.log(`Fetching doctype fields for ${props.doctype}...`)
    
    const result = await api.fetchDoctypeFields(props.doctype)
    
    if (result && result.fields) {
      doctypeFields.value = result.fields
      console.log(`Successfully fetched ${result.fields.length} fields for ${props.doctype}`)
    } else if (Array.isArray(result)) {
      doctypeFields.value = result
      console.log(`Successfully fetched ${result.length} fields for ${props.doctype}`)
    } else {
      throw new Error('Invalid fields data in response')
    }
    
    // Initialize form data for new records
    if (mode.value === 'add') {
      initializeFormData()
    } else if (mode.value === 'edit' && recordId.value) {
      await loadExistingRecord()
    }
    
  } catch (error) {
    console.error(`Error fetching fields for ${props.doctype}:`, error)
  } finally {
    loading.value = false
  }
}

const initializeFormData = () => {
  const initialData = { ...enhancedDefaultValues.value }
  
  // Set default values from field definitions
  processedFields.value.forEach(field => {
    if (field.default && !initialData[field.fieldname]) {
      if (field.fieldtype === 'Date' && field.default === 'Today') {
        initialData[field.fieldname] = new Date().toISOString().split('T')[0]
      } else if (field.fieldtype === 'Check') {
        initialData[field.fieldname] = field.default === '1' || field.default === true
      } else {
        initialData[field.fieldname] = field.default
      }
    }
  })
  
  formData.value = initialData
  console.log('Initialized form data:', formData.value)
}

const loadExistingRecord = async () => {
  try {
    console.log(`Loading existing record: ${props.doctype} ${recordId.value}`)
    
    const data = await api.fetchDocument(props.doctype, recordId.value)
    formData.value = { ...data, doctype: props.doctype }
    
    console.log('Loaded record data:', formData.value)
  } catch (error) {
    console.error(`Error loading ${props.doctype} ${recordId.value}:`, error)
  }
}

const updateFormData = (newData) => {
  formData.value = { ...newData }
}

const validateForm = () => {
  console.log('Form validation triggered')
  // Add any custom validation logic here
}

const checkPermissionsAndFetchFields = async () => {
  await checkPermissions(props.doctype)
  await fetchDoctypeFields()
}

onMounted(() => {
  checkPermissionsAndFetchFields()
})

watch(() => props.doctype, (newDoctype) => {
  if (newDoctype) {
    checkPermissionsAndFetchFields()
  }
})

watch(
  () => mode.value,
  (newMode) => {
    if (newMode === 'add') {
      initializeFormData()
    } else if (newMode === 'edit' && recordId.value) {
      loadExistingRecord()
    }
  },
  { immediate: true }
)

watch(
  () => recordId.value,
  (newRecordId) => {
    if (newRecordId && mode.value === 'edit') {
      loadExistingRecord()
    }
  },
  { immediate: true }
)
</script>
