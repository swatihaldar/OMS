<template>
  <div v-if="showField" class="field-container" :data-fieldname="fieldname">
    <!-- Section Break -->
    <div v-if="fieldtype === 'Section Break'" class="section-break" :class="{ 'mt-6': addSectionPadding }">
      <div 
        v-if="label" 
        class="section-header"
        :class="{ 'cursor-pointer hover:bg-gray-100 p-3 rounded-lg': collapsible }"
        @click="collapsible ? toggleSection() : null"
      >
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <FeatherIcon 
            v-if="collapsible" 
            name="chevron-down" 
            class="h-5 w-5 mr-2 text-blue-600 transition-transform duration-200"
            :class="{ 'transform rotate-180': isCollapsed }"
          />
          {{ label }}
        </h3>
        <FieldDescription :description="description" />
      </div>
    </div>

    <!-- Column Break -->
    <div v-else-if="fieldtype === 'Column Break'" class="column-break"></div>

    <!-- Regular Fields - Show all fields, only hide if in collapsed section -->
    <div v-else-if="!isFieldHiddenByCollapse" class="field-wrapper">
      <!-- Field Label -->
      <label 
        v-if="!['Check'].includes(fieldtype)"
        class="block text-sm font-medium text-gray-700 mb-2"
        :class="{ [`after:content-['*'] after:text-red-500 after:ml-1`]: reqd }"
      >
        {{ label }}
        <FieldDescription :description="description" />
      </label>

      <!-- Link Field -->
      <Autocomplete
        v-if="fieldtype === 'Link'"
        :options="linkOptions"
        :modelValue="selectedOption"
        :placeholder="`Select ${label}`"
        :disabled="isReadOnly"
        @update:modelValue="handleLinkUpdate"
        @update:query="handleLinkSearch"
        class="w-full"
      />


      <!-- Select Field -->
      <Autocomplete
        v-else-if="fieldtype === 'Select'"
        :options="selectionList"
        :modelValue="modelValue"
        :placeholder="`Select ${label}`"
        :disabled="isReadOnly"
        @update:modelValue="(v) => emit('update:modelValue', v?.value || v)"
        class="w-full"
      />

      <!-- Text Editor -->
      <div v-else-if="fieldtype === 'Text Editor'" class="text-editor-wrapper">
        <TextEditor
          :content="modelValue || ''"
          :placeholder="`Write ${label.toLowerCase()}...`"
          :editable="!isReadOnly"
          @change="(content) => emit('update:modelValue', content)"
          :editor-class="'prose-sm min-h-[8rem] border-0 p-3'"
          :bubble-menu="true"
          :fixed-menu="true"
          :starterkit-options="{
            heading: {
              levels: [2, 3, 4],
            },
          }"
        />
      </div>

      <!-- Long Text / Small Text -->
      <Input
        v-else-if="['Long Text', 'Small Text', 'Text'].includes(fieldtype)"
        type="textarea"
        :value="modelValue"
        :placeholder="`Enter ${label}`"
        :disabled="isReadOnly"
        :rows="fieldtype === 'Long Text' ? 6 : 3"
        @input="(v) => emit('update:modelValue', v)"
        class="w-full"
      />

      <!-- Check Field -->
      <div v-else-if="fieldtype === 'Check'" class="flex items-center">
        <Input
          type="checkbox"
          :value="modelValue"
          :disabled="isReadOnly"
          @input="(v) => emit('update:modelValue', v)"
          class="mr-2"
        />
        <label class="text-sm font-medium text-gray-700" :class="{ [`after:content-['*'] after:text-red-500 after:ml-1`]: reqd }">
          {{ label }}
          <FieldDescription :description="description" />
        </label>
      </div>

      <!-- Date Field -->
      <Input
        v-else-if="fieldtype === 'Date'"
        type="date"
        :value="modelValue"
        :placeholder="`Select ${label}`"
        :disabled="isReadOnly"
        :min="minDate"
        :max="maxDate"
        @input="(v) => emit('update:modelValue', v)"
        class="w-full"
      />

      <!-- Datetime Field -->
      <DateTimePicker
        v-else-if="fieldtype === 'Datetime'"
        :value="modelValue"
        :placeholder="`Select ${label}`"
        :disabled="isReadOnly"
        @update:modelValue="(v) => emit('update:modelValue', v)"
        class="w-full"
      />

      <!-- Number Fields (Int, Float, Currency) -->
      <Input
        v-else-if="isNumberType"
        type="number"
        :value="modelValue"
        :placeholder="`Enter ${label}`"
        :disabled="isReadOnly"
        :step="fieldtype === 'Int' ? '1' : '0.01'"
        @input="(v) => emit('update:modelValue', v)"
        class="w-full"
      />

      <!-- File Upload Fields -->
      <div v-else-if="['Attach', 'Attach Image'].includes(fieldtype)" class="file-upload-field">
        <!-- File Preview -->
        <div v-if="filePreview" class="mb-3">
          <div v-if="fieldtype === 'Attach Image'" class="relative inline-block">
            <img :src="filePreview" alt="Preview" class="h-32 w-auto rounded-lg object-cover border shadow-sm" />
            <Button
              v-if="!isReadOnly"
              variant="ghost"
              size="sm"
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              @click="removeFile"
            >
              <FeatherIcon name="x" class="h-4 w-4" />
            </Button>
          </div>
          <div v-else class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
            <div class="flex items-center">
              <FeatherIcon name="file" class="h-6 w-6 text-gray-500 mr-3" />
              <span class="text-sm text-gray-700 font-medium">{{ attachmentName }}</span>
            </div>
            <Button
              v-if="!isReadOnly"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="removeFile"
            >
              <FeatherIcon name="x" class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- File Upload Area -->
        <div v-if="!filePreview && !isReadOnly" class="file-upload-area">
          <input
            ref="fileInputRef"
            type="file"
            :accept="fieldtype === 'Attach Image' ? 'image/*' : '*'"
            @change="handleFileUpload"
            class="hidden"
          />
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            :class="{ 'border-red-500': hasError }"
            @click="openFileSelector"
          >
            <FeatherIcon name="upload" class="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div class="text-sm text-gray-600">
              <span class="font-medium text-blue-600 hover:text-blue-500">Upload a file</span>
              <span> or drag and drop</span>
              <p class="text-xs text-gray-500 mt-1">
                {{ fieldtype === 'Attach Image' ? 'PNG, JPG, GIF up to 5MB' : 'Any file type up to 5MB' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Field -->
      <div v-else-if="fieldtype === 'Table'" class="table-field">
        <ChildTableComponent
          :modelValue="modelValue || []"
          :fieldname="fieldname"
          :label="label"
          :description="description"
          :required="reqd"
          :isReadOnly="isReadOnly"
          :childDoctype="options"
          @update:modelValue="(val) => emit('update:modelValue', val)"
        />
      </div>

      <!-- Default Data Field -->
      <Input
        v-else
        :type="getInputType()"
        :value="modelValue"
        :placeholder="`Enter ${label}`"
        :disabled="isReadOnly"
        :maxlength="maxLength || 140"
        @input="(v) => emit('update:modelValue', v)"
        class="w-full"
      />

      <!-- Error Message -->
      <ErrorMessage v-if="errorMessage" :message="errorMessage" class="mt-1" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, inject } from 'vue'
import { Autocomplete, DateTimePicker, ErrorMessage, Input, Button, FeatherIcon, TextEditor } from 'frappe-ui'
import FieldDescription from './FieldDescription.vue'
import ChildTableComponent from './ChildTableComponent.vue'

const props = defineProps({
  fieldtype: String,
  fieldname: String,
  modelValue: [String, Number, Boolean, Array, Object],
  default: [String, Number, Boolean, Array, Object],
  label: String,
  description: String,
  options: [String, Array],
  linkFilters: Object,
  documentList: Array,
  readOnly: [Boolean, Number],
  reqd: [Boolean, Number],
  hidden: {
    type: [Boolean, Number],
    default: false,
  },
  errorMessage: String,
  minDate: String,
  maxDate: String,
  maxLength: Number,
  addSectionPadding: {
    type: Boolean,
    default: true,
  },
  collapsible: {
    type: Boolean,
    default: false,
  },
  parentCollapsedSections: {
    type: Object,
    default: () => ({})
  },
  currentSectionName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'file-upload', 'file-remove', 'link-search', 'section-toggle'])

// Inject link field options from parent
const linkFieldOptions = inject('linkFieldOptions', ref({}))

// Refs
const fileInputRef = ref(null)
const isCollapsed = ref(false)
const filePreview = ref(null)
const attachmentName = ref('')

// Computed
const showField = computed(() => {
  // Always show fields unless explicitly hidden
  return !props.hidden
})

const isNumberType = computed(() => {
  return ['Int', 'Float', 'Currency', 'Percent'].includes(props.fieldtype)
})

const isLayoutField = computed(() => {
  return ['Section Break', 'Column Break'].includes(props.fieldtype)
})

const isReadOnly = computed(() => {
  return Boolean(props.readOnly)
})

const hasError = computed(() => {
  return Boolean(props.errorMessage)
})

const isFieldHiddenByCollapse = computed(() => {
  // Only hide if this field is specifically under a collapsed section
  if (props.fieldtype === 'Section Break' || props.fieldtype === 'Column Break') {
    return false
  }
  
  // Check if the current section is collapsed
  return props.currentSectionName && props.parentCollapsedSections[props.currentSectionName]
})

const linkOptions = computed(() => {
  if (props.fieldtype === 'Link' && props.fieldname) {
    return linkFieldOptions.value[props.fieldname] || []
  }
  return []
})

const selectionList = computed(() => {
  if (props.fieldtype === 'Select' && props.options) {
    const options = typeof props.options === 'string' ? props.options.split('\n') : props.options
    return options.map((option) => ({
      label: option,
      value: option,
    }))
  }
  return []
})

// Methods
const getInputType = () => {
  switch (props.fieldtype) {
    case 'Email':
      return 'email'
    case 'Password':
      return 'password'
    case 'Phone':
      return 'tel'
    case 'URL':
      return 'url'
    default:
      return 'text'
  }
}

const getLinkDisplayValue = () => {
  if (props.fieldtype === 'Link' && props.modelValue) {
    if (linkOptions.value.length > 0) {
      // Find exact match first
      const exactMatch = linkOptions.value.find(opt => opt.value === props.modelValue)
      if (exactMatch) return exactMatch.label
      
      // Fallback to partial match (case insensitive)
      const partialMatch = linkOptions.value.find(opt => 
        opt.value.toLowerCase() === props.modelValue.toLowerCase()
      )
      if (partialMatch) return partialMatch.label
    }
    return props.modelValue
  }
  return ''
}


const selectedOption = computed(() => {
  if (props.fieldtype === 'Link' && props.modelValue) {
    return linkOptions.value.find(opt => opt.value === props.modelValue) || null
  }
  return null
})


const handleLinkUpdate = (value) => {
  emit('update:modelValue', value?.value || value)
}


const handleLinkSearch = (query) => {
  emit('link-search', { fieldname: props.fieldname, query })
}

const toggleSection = () => {
  isCollapsed.value = !isCollapsed.value
  emit('section-toggle', { fieldname: props.fieldname, collapsed: isCollapsed.value })
}

const openFileSelector = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  
  if (file.size > MAX_FILE_SIZE) {
    emit('error', 'File size must be less than 5MB')
    return
  }
  
  if (props.fieldtype === 'Attach Image' && !file.type.startsWith('image/')) {
    emit('error', 'Please upload an image file')
    return
  }

  // Create preview for images
  if (props.fieldtype === 'Attach Image') {
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }

  attachmentName.value = file.name
  emit('file-upload', { file, fieldname: props.fieldname })
}

const removeFile = () => {
  filePreview.value = null
  attachmentName.value = ''
  emit('file-remove', props.fieldname)
  emit('update:modelValue', null)
}

const setDefaultValue = () => {
  if (props.modelValue !== undefined && props.modelValue !== null) return

  if (props.default) {
    if (props.fieldtype === 'Check') {
      emit('update:modelValue', props.default === '1' || props.default === true)
    } else if (props.fieldtype === 'Date' && props.default === 'Today') {
      emit('update:modelValue', new Date().toISOString().split('T')[0])
    } else if (isNumberType.value) {
      emit('update:modelValue', parseFloat(props.default || 0))
    } else {
      emit('update:modelValue', props.default)
    }
  } else {
    if (props.fieldtype === 'Check') {
      emit('update:modelValue', false)
    } else if (props.fieldtype === 'Table') {
      emit('update:modelValue', [])
    } else {
      emit('update:modelValue', '')
    }
  }
}

onMounted(() => {
  // Don't set default values if we already have a value (for edit mode)
  if (props.modelValue === undefined || props.modelValue === null || props.modelValue === '') {
    setDefaultValue()
  }
  
  // Start collapsed by default if section is collapsible
  if (props.fieldtype === 'Section Break' && props.collapsible) {
    isCollapsed.value = true // Changed from false to true
  }
})
</script>

<style scoped>
.field-container {
  margin-bottom: 1.5rem;
}

.section-break {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.section-break:first-child {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.section-header {
  margin-bottom: 1rem;
}

.field-wrapper {
  transition: all 0.2s ease;
}

.file-upload-area {
  transition: all 0.2s ease;
}
</style>
