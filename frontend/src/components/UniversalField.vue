<template>
  <div class="universal-field" :data-fieldname="field.fieldname">
    <!-- Table fields -->
    <div v-if="field.fieldtype === 'Table'">
      <ChildTableComponent
        :model-value="value"
        :fieldname="field.fieldname"
        :label="field.label"
        :description="field.description"
        :required="field.reqd"
        :is-read-only="field.read_only || isReadOnly"
        :child-doctype="field.options"
        :parent-doctype="field.parent || 'Unknown'"
        @update:model-value="(val) => $emit('update:value', val)"
      />
    </div>

    <!-- Link fields with Autocomplete -->
    <div v-else-if="field.fieldtype === 'Link'" class="relative group">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ field.label }} 
        <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
        <FieldDescription :description="field.description" />
      </label>
      <Autocomplete
        :value="value"
        :options="options"
        :placeholder="field.placeholder || `Select ${field.label}`"
        :disabled="isReadOnly"
        size="sm"
        variant="subtle"
        :class="{ 'field-error': isInvalid }"
        @update:value="handleLinkUpdate"
        @update:query="(query) => $emit('link-search', query)"
      />
    </div>

    <!-- Select fields -->
    <div v-else-if="field.fieldtype === 'Select'" class="group">
      <FormControl
        :type="'select'"
        :model-value="value"
        :options="options"
        size="sm"
        variant="subtle"
        :placeholder="field.placeholder || `Select ${field.label}`"
        :disabled="isReadOnly"
        :class="{ 'field-error': isInvalid }"
        @update:model-value="(val) => $emit('update:value', val)"
      >
        <template #label>
          {{ field.label }} 
          <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
          <FieldDescription :description="field.description" />
        </template>
      </FormControl>
    </div>

    <!-- Text Editor -->
    <div v-else-if="field.fieldtype === 'Text Editor'" class="group">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ field.label }} 
        <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
        <FieldDescription :description="field.description" />
      </label>
      <div class="border rounded-lg overflow-hidden" :class="{ 'border-red-500': isInvalid }">
        <TextEditor
          :content="value || ''"
          :editor-class="'prose-sm min-h-[8rem] border-0 p-3'"
          :placeholder="`Write ${field.label.toLowerCase()}...`"
          :read-only="isReadOnly"
          @change="(val) => $emit('update:value', val)"
          :bubble-menu="true"
          :fixed-menu="true"
          :starterkit-options="{
            heading: {
              levels: [2, 3, 4],
            },
          }"
        />
      </div>
    </div>

    <!-- Date and DateTime fields -->
    <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'" class="group">
      <TextInput
        :type="field.fieldtype === 'Date' ? 'date' : 'datetime-local'"
        :model-value="value"
        size="sm"
        variant="subtle"
        :placeholder="field.placeholder || field.label"
        :disabled="isReadOnly"
        :class="{ 'field-error': isInvalid }"
        @update:model-value="(val) => $emit('update:value', val)"
      >
        <template #label>
          {{ field.label }} 
          <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
          <FieldDescription :description="field.description" />
        </template>
      </TextInput>
    </div>

    <!-- Checkbox fields -->
    <div v-else-if="field.fieldtype === 'Check'" class="group">
      <FormControl
        :type="'checkbox'"
        :model-value="value === 1 || value === true || value === '1'"
        size="sm"
        variant="subtle"
        :disabled="isReadOnly"
        @update:model-value="(val) => $emit('update:value', val ? 1 : 0)"
      >
        <template #label>
          {{ field.label }}
          <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
          <FieldDescription :description="field.description" />
        </template>
      </FormControl>
    </div>

    <!-- Number fields (Int, Float, Currency, Percent) -->
    <div v-else-if="isNumberField(field)" class="group">
      <FormControl
        :type="'number'"
        :model-value="value"
        size="sm"
        variant="subtle"
        :placeholder="field.placeholder || field.label"
        :disabled="isReadOnly"
        :step="field.fieldtype === 'Int' ? '1' : '0.01'"
        :min="field.min_value"
        :max="field.max_value"
        :class="{ 'field-error': isInvalid }"
        @update:model-value="(val) => $emit('update:value', val)"
      >
        <template #label>
          {{ field.label }} 
          <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
          <FieldDescription :description="field.description" />
        </template>
      </FormControl>
    </div>

    <!-- Long Text and Small Text fields -->
    <div v-else-if="field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'" class="group">
      <FormControl
        :type="'textarea'"
        :model-value="value"
        size="sm"
        variant="subtle"
        :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}`"
        :disabled="isReadOnly"
        :rows="field.fieldtype === 'Long Text' ? 6 : 3"
        :class="{ 'field-error': isInvalid }"
        @update:model-value="(val) => $emit('update:value', val)"
      >
        <template #label>
          {{ field.label }} 
          <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
          <FieldDescription :description="field.description" />
        </template>
      </FormControl>
    </div>

    <!-- File Upload fields (Attach Image, Attach) -->
    <div v-else-if="field.fieldtype === 'Attach Image' || field.fieldtype === 'Attach'" class="group">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ field.label }} 
        <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
        <FieldDescription :description="field.description" />
      </label>
      
      <!-- File preview -->
      <div v-if="filePreview" class="mb-3">
        <div v-if="field.fieldtype === 'Attach Image'" class="relative inline-block">
          <img :src="filePreview" alt="Preview" class="h-32 w-auto rounded-lg object-cover border shadow-sm" />
          <Button
            v-if="!isReadOnly"
            variant="ghost"
            size="sm"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
            @click="$emit('file-remove')"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </Button>
        </div>
        <div v-else class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
          <div class="flex items-center">
            <svg class="h-6 w-6 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span class="text-sm text-gray-700 font-medium">{{ attachmentName }}</span>
          </div>
          <Button
            v-if="!isReadOnly"
            variant="ghost"
            size="sm"
            class="text-red-500 hover:text-red-600"
            @click="$emit('file-remove')"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      <!-- File upload area using Frappe UI FileUploader -->
      <div v-if="!filePreview && !isReadOnly">
        <FileUploader
          :file-types="field.fieldtype === 'Attach Image' ? ['image/*'] : ['*']"
          :validate-file="validateFile"
          @success="handleFileSuccess"
          @error="handleFileError"
        >
          <template #default="{ file, uploading, progress, uploaded, message, error, total, success, openFileSelector }">
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              :class="{ 'border-red-500': isInvalid, 'border-blue-500': uploading }"
              @click="openFileSelector"
            >
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path v-if="field.fieldtype === 'Attach Image'" d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path v-else d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              
              <div v-if="uploading" class="text-sm text-blue-600 font-medium">
                Uploading... {{ progress }}%
                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
                </div>
              </div>
              
              <div v-else-if="error" class="text-sm text-red-600">
                {{ error }}
              </div>
              
              <div v-else class="text-sm text-gray-600">
                <span class="font-medium text-blue-600 hover:text-blue-500">Upload a file</span>
                <span> or drag and drop</span>
                <p class="text-xs text-gray-500 mt-1">
                  {{ field.fieldtype === 'Attach Image' ? 'PNG, JPG, GIF up to 5MB' : 'Any file type up to 5MB' }}
                </p>
              </div>
            </div>
          </template>
        </FileUploader>
      </div>
    </div>

    <!-- Default text fields (Data, Email, Phone, Password, etc.) -->
    <div v-else class="group">
      <FormControl
        :type="getInputType(field)"
        :model-value="value"
        size="sm"
        variant="subtle"
        :placeholder="field.placeholder || field.label"
        :disabled="isReadOnly"
        :maxlength="field.length || 140"
        :class="{ 'field-error': isInvalid }"
        @update:model-value="(val) => $emit('update:value', val)"
      >
        <template #label>
          {{ field.label }} 
          <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
          <FieldDescription :description="field.description" />
        </template>
      </FormControl>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Button, FormControl, Autocomplete, TextEditor, TextInput, FileUploader } from 'frappe-ui';
import ChildTableComponent from './ChildTableComponent.vue';
import FieldDescription from './FieldDescription.vue';

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  value: {
    default: null
  },
  options: {
    type: Array,
    default: () => []
  },
  isReadOnly: {
    type: Boolean,
    default: false
  },
  isInvalid: {
    type: Boolean,
    default: false
  },
  filePreview: {
    type: String,
    default: null
  },
  attachmentName: {
    type: String,
    default: null
  }
});

const emit = defineEmits([
  'update:value',
  'file-upload',
  'file-remove',
  'link-search',
  'link-select',
  'error'
]);

const isNumberField = (field) => {
  return ['Int', 'Float', 'Currency', 'Percent'].includes(field.fieldtype);
};

const getInputType = (field) => {
  switch (field.fieldtype) {
    case 'Email':
      return 'email';
    case 'Password':
      return 'password';
    case 'Phone':
      return 'tel';
    case 'Int':
    case 'Float':
    case 'Currency':
    case 'Percent':
      return 'number';
    default:
      return 'text';
  }
};

const handleLinkUpdate = (value) => {
  // Only emit the select event if we have a valid value
  if (value) {
    emit('link-select', value);
  } else {
    emit('update:value', value);
  }
};

const validateFile = (fileObject) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  if (fileObject.size > MAX_FILE_SIZE) {
    emit('error', 'File size must be less than 5MB');
    return false;
  }
  
  if (props.field.fieldtype === 'Attach Image' && !fileObject.type.startsWith('image/')) {
    emit('error', 'Please upload an image file');
    return false;
  }
  
  return true;
};

const handleFileSuccess = (file) => {
  emit('file-upload', file);
};

const handleFileError = (error) => {
  emit('error', error.message || 'File upload failed');
};
</script>

<style scoped>
.universal-field {
  width: 100%;
}

.group {
  position: relative;
}

.field-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 1px #ef4444 !important;
}

/* File upload progress animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.uploading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
