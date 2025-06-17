<template>
  <div class="bg-white rounded-lg shadow-sm form-view" @click.stop>
    <!-- Scrollable Content Area -->
    <div class="p-4 md:p-6 overflow-y-auto form-content">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <LoadingText text="Loading form..." />
      </div>

      <!-- Form (Add/Edit Mode) -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6" @click.stop>
        <!-- Error Alert -->
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-red-800">
                {{ getErrorTitle() }}
              </h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ formatErrorMessage(errorMessage) }}</p>
                <!-- Show missing required fields -->
                <div v-if="invalidFields.length > 0" class="mt-3">
                  <p class="font-medium mb-2">Missing required fields:</p>
                  <ul class="list-disc list-inside space-y-1">
                    <li v-for="fieldname in invalidFields" :key="fieldname" class="text-sm">
                      {{ getFieldLabel(fieldname) }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="ml-4">
              <button @click.stop="clearError" class="text-red-400 hover:text-red-600 transition-colors">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Success Alert -->
        <div v-if="successMessage" class="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
            </div>
            <div class="ml-4">
              <button @click.stop="successMessage = ''" class="text-green-400 hover:text-green-600 transition-colors">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Assignment Section (Edit Mode Only) -->
        <div v-if="mode === 'edit' && docname" class="bg-gray-50 rounded-lg p-4 mb-6" @click.stop>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-gray-900">Assignments</h3>
            <AssignmentDialog 
              :doctype="doctype" 
              :docname="docname"
              @assignment-added="handleAssignmentAdded"
              @assignment-error="handleAssignmentError"
              @click.stop
            />
          </div>
          <AssignmentList 
            ref="assignmentListRef"
            :doctype="doctype" 
            :docname="docname"
            @assignment-removed="handleAssignmentRemoved"
            @assignment-error="handleAssignmentError"
            @click.stop
          />
        </div>

        <!-- Dynamic Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" @click.stop>
          <template v-for="(field, index) in visibleFields" :key="field.fieldname">
            <!-- Section Break -->
            <div v-if="field.fieldtype === 'Section Break'" class="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-6 first:border-t-0 first:pt-0 first:mt-0">
              <!-- Collapsible Section Header -->
              <div v-if="field.label" 
                   :class="{'cursor-pointer hover:bg-gray-50 p-3 rounded-lg flex items-center justify-between transition-colors': field.collapsible === 1, 'mb-6': !field.collapsible}"
                   @click.stop="field.collapsible === 1 ? toggleSection(field.fieldname) : null">
                <h3 class="text-lg font-semibold" :class="{'text-gray-900': !field.collapsible, 'text-blue-700': field.collapsible === 1}">
                  <div class="flex items-center">
                    <svg v-if="field.collapsible === 1" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    {{ field.label }}
                  </div>
                </h3>
                <svg v-if="field.collapsible === 1" 
                     class="h-5 w-5 text-blue-600 transition-transform duration-200" 
                     :class="isSectionCollapsed(field.fieldname) ? '' : 'transform rotate-180'"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- Column Break -->
            <div v-else-if="field.fieldtype === 'Column Break'" class="hidden md:block">
              <!-- This creates a new column in the grid -->
            </div>

            <!-- Regular fields - Only show if not in a collapsed section -->
            <div v-else-if="!isFieldInCollapsedSection(field, index)" class="field-container" :class="getColumnClass(index)" :data-fieldname="field.fieldname" @click.stop>
              
              <!-- Table fields -->
              <div v-if="field.fieldtype === 'Table'" @click.stop>
                <ChildTableComponent
                  :model-value="formData[field.fieldname]"
                  :fieldname="field.fieldname"
                  :label="field.label"
                  :description="field.description"
                  :required="field.reqd"
                  :is-read-only="field.read_only || isReadOnly"
                  :child-doctype="field.options"
                  :parent-doctype="field.parent || 'Unknown'"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val)"
                  @click.stop
                />
              </div>

              <!-- Link fields with Autocomplete -->
              <div v-else-if="field.fieldtype === 'Link'" class="relative group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <div class="relative" @click.stop>
                  <Autocomplete
                    :value="formData[field.fieldname]"
                    :options="getOptionsForField(field)"
                    :placeholder="field.placeholder || `Select ${field.label}`"
                    :disabled="field.read_only || isReadOnly"
                    size="sm"
                    variant="subtle"
                    :class="{ 'field-error': isFieldInvalid(field.fieldname) }"
                    @update:value="(value) => handleLinkFieldUpdate(field.fieldname, value)"
                    @update:query="(query) => handleLinkSearch(field.fieldname, query)"
                    @click.stop
                    @focus.stop
                    @blur.stop
                  />
                </div>
              </div>

              <!-- Select fields -->
              <div v-else-if="field.fieldtype === 'Select'" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <FormControl
                  type="select"
                  :model-value="formData[field.fieldname]"
                  :options="getOptionsForField(field)"
                  size="sm"
                  variant="subtle"
                  :placeholder="field.placeholder || `Select ${field.label}`"
                  :disabled="field.read_only || isReadOnly"
                  :class="{ 'field-error': isFieldInvalid(field.fieldname) }"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val)"
                  @click.stop
                  @focus.stop
                />
              </div>

              <!-- Text Editor -->
              <div v-else-if="field.fieldtype === 'Text Editor'" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <div class="border rounded-lg overflow-hidden" :class="{ 'border-red-500': isFieldInvalid(field.fieldname) }" @click.stop>
                  <TextEditor
                    :content="formData[field.fieldname] || ''"
                    :editor-class="'prose-sm min-h-[8rem] border-0 p-3'"
                    :placeholder="`Write ${field.label.toLowerCase()}...`"
                    :read-only="field.read_only || isReadOnly"
                    @change="(val) => updateFieldValue(field.fieldname, val)"
                    @click.stop
                    @focus.stop
                    @blur.stop
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
              <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <TextInput
                  :type="field.fieldtype === 'Date' ? 'date' : 'datetime-local'"
                  :model-value="formData[field.fieldname]"
                  size="sm"
                  variant="subtle"
                  :placeholder="field.placeholder || field.label"
                  :disabled="field.read_only || isReadOnly"
                  :class="{ 'field-error': isFieldInvalid(field.fieldname) }"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val)"
                  @click.stop
                  @focus.stop
                />
              </div>

              <!-- Checkbox fields -->
              <div v-else-if="field.fieldtype === 'Check'" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <FormControl
                  type="checkbox"
                  :model-value="formData[field.fieldname] === 1 || formData[field.fieldname] === true || formData[field.fieldname] === '1'"
                  size="sm"
                  variant="subtle"
                  :disabled="field.read_only || isReadOnly"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val ? 1 : 0)"
                  @click.stop
                />
              </div>

              <!-- Number fields (Int, Float, Currency, Percent) -->
              <div v-else-if="isNumberField(field)" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <FormControl
                  type="number"
                  :model-value="formData[field.fieldname]"
                  size="sm"
                  variant="subtle"
                  :placeholder="field.placeholder || field.label"
                  :disabled="field.read_only || isReadOnly"
                  :step="field.fieldtype === 'Int' ? '1' : '0.01'"
                  :min="field.min_value"
                  :max="field.max_value"
                  :class="{ 'field-error': isFieldInvalid(field.fieldname) }"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val)"
                  @click.stop
                  @focus.stop
                />
              </div>

              <!-- Long Text and Small Text fields -->
              <div v-else-if="field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <FormControl
                  type="textarea"
                  :model-value="formData[field.fieldname]"
                  size="sm"
                  variant="subtle"
                  :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}`"
                  :disabled="field.read_only || isReadOnly"
                  :rows="field.fieldtype === 'Long Text' ? 6 : 3"
                  :class="{ 'field-error': isFieldInvalid(field.fieldname) }"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val)"
                  @click.stop
                  @focus.stop
                />
              </div>

              <!-- File Upload fields (Attach Image, Attach) -->
              <div v-else-if="field.fieldtype === 'Attach Image' || field.fieldtype === 'Attach'" class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                
                <!-- File preview -->
                <div v-if="getFilePreview(field.fieldname)" class="mb-3">
                  <div v-if="field.fieldtype === 'Attach Image'" class="relative inline-block">
                    <img :src="getFilePreview(field.fieldname)" alt="Preview" class="h-32 w-auto rounded-lg object-cover border shadow-sm" />
                    <Button
                      v-if="!field.read_only && !isReadOnly"
                      variant="ghost"
                      size="sm"
                      class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                      @click.stop="removeFile(field.fieldname)"
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
                      <span class="text-sm text-gray-700 font-medium">{{ getAttachmentName(field.fieldname) }}</span>
                    </div>
                    <Button
                      v-if="!field.read_only && !isReadOnly"
                      variant="ghost"
                      size="sm"
                      class="text-red-500 hover:text-red-600"
                      @click.stop="removeFile(field.fieldname)"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <!-- File upload area using Frappe UI FileUploader -->
                <div v-if="!getFilePreview(field.fieldname) && !field.read_only && !isReadOnly" @click.stop>
                  <FileUploader
                    :file-types="field.fieldtype === 'Attach Image' ? ['image/*'] : ['*']"
                    :validate-file="(file) => validateFile(file, field)"
                    @success="(file) => handleFileSuccess(file, field.fieldname)"
                    @error="(error) => handleFileError(error, field.fieldname)"
                  >
                    <template #default="{ file, uploading, progress, uploaded, message, error, total, success, openFileSelector }">
                      <div
                        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                        :class="{ 'border-red-500': isFieldInvalid(field.fieldname), 'border-blue-500': uploading }"
                        @click.stop="openFileSelector"
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
              <div v-else class="group" @click.stop>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ field.label }} 
                  <span v-if="field.reqd" class="text-red-500 ml-1">*</span>
                  <FieldDescription :description="field.description" />
                </label>
                <FormControl
                  :type="getInputType(field)"
                  :model-value="formData[field.fieldname]"
                  size="sm"
                  variant="subtle"
                  :placeholder="field.placeholder || field.label"
                  :disabled="field.read_only || isReadOnly"
                  :maxlength="field.length || 140"
                  :class="{ 'field-error': isFieldInvalid(field.fieldname) }"
                  @update:model-value="(val) => updateFieldValue(field.fieldname, val)"
                  @click.stop
                  @focus.stop
                />
              </div>

            </div>
          </template>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { Button, LoadingText, FormControl, Autocomplete, TextEditor, TextInput, FileUploader } from 'frappe-ui';
import api from '@/utils/api';
import { getHiddenFields } from '@/config/form-config';
import { useRouter } from 'vue-router';
import ChildTableComponent from './ChildTableComponent.vue';
import FieldDescription from './FieldDescription.vue';
import AssignmentDialog from './AssignmentDialog.vue';
import AssignmentList from './AssignmentList.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  fieldOptions: {
    type: Object,
    default: () => ({})
  },
  isReadOnly: {
    type: Boolean,
    default: false
  },
  submitText: {
    type: String,
    default: 'Save'
  },
  submittingText: {
    type: String,
    default: 'Saving...'
  },
  doctype: {
    type: String,
    required: true
  },
  docname: {
    type: String,
    default: null
  },
  mode: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit', 'view'].includes(value)
  },
  titleField: {
    type: String,
    default: 'name'
  },
  debug: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:modelValue', 
  'submit', 
  'validate', 
  'field-change', 
  'delete', 
  'cancel',
  'load'
]);

// State variables
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fileAttachments = ref({});
const filePreviewUrls = ref({});
const isEditing = ref(false);
const originalData = ref({});
const linkFieldOptions = ref({});
const invalidFields = ref([]);
const linkSearchQueries = ref({});
const activeLinkDropdown = ref(null);
const userPermissions = ref([]);
const tempFileUrls = ref({});
const router = useRouter();
const collapsedSections = ref({});
const fieldErrors = ref({});
const assignmentListRef = ref(null);

// Computed properties
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const docTitle = computed(() => {
  if (formData.value[props.titleField]) {
    return formData.value[props.titleField];
  }
  return `${props.doctype} ${props.docname || ''}`;
});

const hiddenFieldsList = computed(() => {
  return getHiddenFields(props.doctype);
});

const visibleFields = computed(() => {
  return props.fields
    .filter(field => 
      field && 
      field.fieldname && 
      !field.hidden &&
      field.hidden !== 1 &&
      !hiddenFieldsList.value.includes(field.fieldname)
    )
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
});

// Helper functions
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

const getColumnClass = (index) => {
  const field = visibleFields.value[index];
  const prevField = index > 0 ? visibleFields.value[index - 1] : null;
  const nextField = index < visibleFields.value.length - 1 ? visibleFields.value[index + 1] : null;

  if (field.fieldtype === 'Section Break') {
    return 'col-span-1 md:col-span-2';
  }

  if (prevField && prevField.fieldtype === 'Section Break' || 
      prevField && prevField.fieldtype === 'Column Break') {
    return 'col-span-1';
  }

  if (nextField && nextField.fieldtype === 'Column Break') {
    return 'col-span-1';
  }

  // For Long Text, Text Editor, and Table fields, use full width
  if (field.fieldtype === 'Long Text' || field.fieldtype === 'Text Editor' || field.fieldtype === 'Table') {
    return 'col-span-1 md:col-span-2';
  }

  return 'col-span-1';
};

const getOptionsForField = (field) => {
  if (props.fieldOptions[field.fieldname]) {
    return props.fieldOptions[field.fieldname];
  }
  
  if (field.fieldtype === 'Link' && linkFieldOptions.value[field.fieldname]) {
    return linkFieldOptions.value[field.fieldname];
  }
  
  if (field.fieldtype === 'Select') {
    if (field.options) {
      return field.options.split('\n').map(option => ({
        value: option,
        label: option
      }));
    }
  }

  return [];
};

const getFilePreview = (fieldname) => {
  if (filePreviewUrls.value[fieldname]) {
    return filePreviewUrls.value[fieldname];
  }
  
  if (tempFileUrls.value[fieldname]) {
    return tempFileUrls.value[fieldname];
  }
  
  if (formData.value[fieldname]) {
    return formData.value[fieldname];
  }
  
  return null;
};

const getAttachmentName = (fieldname) => {
  if (fileAttachments.value[fieldname]) {
    return fileAttachments.value[fieldname].name;
  }
  
  if (formData.value[fieldname]) {
    const url = formData.value[fieldname];
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
  
  return null;
};

const getFieldLabel = (fieldname) => {
  const field = props.fields.find(f => f.fieldname === fieldname);
  return field ? field.label || field.fieldname : fieldname;
};

const isFieldInvalid = (fieldname) => {
  return invalidFields.value.includes(fieldname);
};

const getErrorTitle = () => {
  if (invalidFields.value.length > 0) {
    return 'Validation Error';
  }
  return 'Error';
};

const formatErrorMessage = (message) => {
  if (typeof message !== 'string') return 'An error occurred';
  
  // Handle common error patterns
  if (message.includes('Please fill in all required fields')) {
    return 'Please complete all required fields before proceeding.';
  }
  
  if (message.includes('Attached To Name must be a string or an integer')) {
    return 'Unable to attach file to this document. Please save the document first.';
  }
  
  if (message.includes('ValidationError')) {
    const match = message.match(/ValidationError: (.*?)($|\n)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  if (message.includes('File size exceeded')) {
    return 'The file is too large. Please upload a smaller file (maximum 5MB).';
  }
  
  if (message.includes('Failed to upload file')) {
    return 'Unable to upload the file. Please try again or use a different file.';
  }
  
  // Clean up technical error messages
  return message.replace(/^\[.*?\]\s*/, '').replace(/\n.*$/, '');
};

const clearError = () => {
  errorMessage.value = '';
  invalidFields.value = [];
  fieldErrors.value = {};
};

// Section collapsing functions
const toggleSection = (sectionFieldname) => {
  collapsedSections.value[sectionFieldname] = !collapsedSections.value[sectionFieldname];
};

const isSectionCollapsed = (sectionFieldname) => {
  return collapsedSections.value[sectionFieldname] !== false;
};

const isFieldInCollapsedSection = (field, index) => {
  if (field.fieldtype === 'Section Break' || field.fieldtype === 'Column Break') {
    return false;
  }
  
  let currentSectionIndex = -1;
  for (let i = index - 1; i >= 0; i--) {
    if (visibleFields.value[i].fieldtype === 'Section Break') {
      currentSectionIndex = i;
      break;
    }
  }
  
  if (currentSectionIndex >= 0) {
    const sectionField = visibleFields.value[currentSectionIndex];
    if (sectionField.collapsible === 1 && isSectionCollapsed(sectionField.fieldname)) {
      return true;
    }
  }
  
  return false;
};

// FIXED: Centralized field update function that prevents auto-save
const updateFieldValue = (fieldname, value) => {
  console.log(`Updating field ${fieldname} with value:`, value);
  
  // Update the form data
  formData.value[fieldname] = value;
  
  // Clear field from invalid list if it was previously invalid
  if (invalidFields.value.includes(fieldname)) {
    invalidFields.value = invalidFields.value.filter(f => f !== fieldname);
  }
  
  // Clear field error if it exists
  if (fieldErrors.value[fieldname]) {
    delete fieldErrors.value[fieldname];
  }
  
  // Clear general error if this was the only invalid field
  if (invalidFields.value.length === 0 && errorMessage.value.includes('required fields')) {
    errorMessage.value = '';
  }
  
  // Only emit field-change, DO NOT trigger any save operations
  emit('field-change', { fieldname, value });
};

// FIXED: Link field specific handler that prevents auto-save
const handleLinkFieldUpdate = (fieldname, value) => {
  console.log(`Link field ${fieldname} updated with value:`, value);
  
  // Update the form data without triggering save
  updateFieldValue(fieldname, value);
  
  // Update the search query display
  const field = props.fields.find(f => f.fieldname === fieldname);
  if (field && field.fieldtype === 'Link') {
    const options = getOptionsForField(field);
    const option = options.find(opt => opt.value === value);
    if (option) {
      linkSearchQueries.value[fieldname] = option.label;
    } else {
      linkSearchQueries.value[fieldname] = value;
    }
  }
};

// FIXED: Link search handler that doesn't trigger save
const handleLinkSearch = (fieldname, query) => {
  console.log(`Link search for ${fieldname}:`, query);
  linkSearchQueries.value[fieldname] = query;
  // Don't update the actual field value during search, only the display query
};

// File handling functions
const validateFile = (fileObject, field) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  if (fileObject.size > MAX_FILE_SIZE) {
    handleFieldError(field.fieldname, 'File size must be less than 5MB');
    return false;
  }
  
  if (field.fieldtype === 'Attach Image' && !fileObject.type.startsWith('image/')) {
    handleFieldError(field.fieldname, 'Please upload an image file');
    return false;
  }
  
  return true;
};

const handleFileSuccess = (file, fieldname) => {
  console.log(`File uploaded for ${fieldname}:`, file);
  
  const field = props.fields.find(f => f.fieldname === fieldname);
  const isImageField = field?.fieldtype === 'Attach Image';
  
  if (isImageField) {
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreviewUrls.value[fieldname] = e.target.result;
      fileAttachments.value[fieldname] = file;
      updateFieldValue(fieldname, null); // Clear the URL, file will be uploaded on save
    };
    reader.readAsDataURL(file);
  } else {
    fileAttachments.value[fieldname] = file;
    updateFieldValue(fieldname, null); // Clear the URL, file will be uploaded on save
  }
  
  // Clear any previous errors for this field
  if (fieldErrors.value[fieldname]) {
    delete fieldErrors.value[fieldname];
  }
};

const handleFileError = (error, fieldname) => {
  console.error(`File error for ${fieldname}:`, error);
  handleFieldError(fieldname, error.message || 'File upload failed');
};

const removeFile = (fieldname) => {
  delete filePreviewUrls.value[fieldname];
  delete fileAttachments.value[fieldname];
  delete tempFileUrls.value[fieldname];
  updateFieldValue(fieldname, null);
  
  // Clear any errors for this field
  if (fieldErrors.value[fieldname]) {
    delete fieldErrors.value[fieldname];
  }
};

const handleFieldError = (fieldname, message) => {
  fieldErrors.value[fieldname] = message;
  console.error(`Field error for ${fieldname}:`, message);
};

// Assignment handlers
const handleAssignmentAdded = (assignment) => {
  if (assignmentListRef.value) {
    assignmentListRef.value.addAssignment(assignment);
  }
  successMessage.value = 'Assignment added successfully!';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

const handleAssignmentRemoved = (todoName) => {
  successMessage.value = 'Assignment removed successfully!';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

const handleAssignmentError = (error) => {
  errorMessage.value = `Assignment error: ${error}`;
};

// Process default values for date fields
const processDateDefaults = () => {
  visibleFields.value.forEach(field => {
    if ((field.fieldtype === 'Date' || field.fieldtype === 'Datetime') && 
        formData.value[field.fieldname] === 'Today') {
      const today = new Date();
      
      if (field.fieldtype === 'Date') {
        formData.value[field.fieldname] = today.toISOString().split('T')[0];
      } else {
        formData.value[field.fieldname] = today.toISOString().slice(0, 16);
      }
    }
  });

  if (formData.value.opening_date === 'Today') {
    formData.value.opening_date = new Date().toISOString().split('T')[0];
  }
};

// Fetch user permissions
const fetchUserPermissions = async () => {
  try {
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
      console.log('User permissions loaded:', userPermissions.value);
      
      if (props.mode !== 'edit') {
        applyUserPermissionsToFormData();
      }
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
  }
};

const applyUserPermissionsToFormData = () => {
  if (props.mode === 'edit') return;
  
  userPermissions.value.forEach(permission => {
    const linkFields = props.fields.filter(field => 
      field.fieldtype === 'Link' && field.options === permission.allow
    );
    
    linkFields.forEach(field => {
      formData.value[field.fieldname] = permission.for_value;
      linkSearchQueries.value[field.fieldname] = permission.for_value;
      
      const fieldIndex = props.fields.findIndex(f => f.fieldname === field.fieldname);
      if (fieldIndex !== -1) {
        props.fields[fieldIndex].read_only = 1;
        props.fields[fieldIndex].read_only_depends_on = `User Permission for ${permission.allow}`;
      }
    });
  });
};

// Upload files to temporary location first
const uploadFilesToTemp = async () => {
  const uploadedFiles = {};
  
  for (const [fieldname, file] of Object.entries(fileAttachments.value)) {
    try {
      const fileUrl = await api.uploadFileToTemp(file);
      tempFileUrls.value[fieldname] = fileUrl;
      uploadedFiles[fieldname] = fileUrl;
    } catch (error) {
      console.error(`Error uploading file for ${fieldname}:`, error);
      handleFieldError(fieldname, formatErrorMessage(error.message) || `Error uploading file: ${file.name}`);
      throw error;
    }
  }
  
  return uploadedFiles;
};

const attachFilesToDoc = async (docname) => {
  if (!docname) return {};
  
  const attachedFiles = {};
  
  for (const [fieldname, fileUrl] of Object.entries(tempFileUrls.value)) {
    try {
      const attachedUrl = await api.attachFileToDoc(fileUrl, props.doctype, docname, fieldname);
      attachedFiles[fieldname] = attachedUrl;
      formData.value[fieldname] = attachedUrl;
    } catch (error) {
      console.error(`Error attaching file for ${fieldname}:`, error);
      handleFieldError(fieldname, formatErrorMessage(error.message) || `Error attaching file to document`);
    }
  }
  
  return attachedFiles;
};

// Form validation
const validateForm = () => {
  const missingFields = [];
  const errors = {};
  
  visibleFields.value.forEach(field => {
    if (field.reqd && field.fieldtype !== 'Section Break' && field.fieldtype !== 'Column Break') {
      const value = formData.value[field.fieldname];
      const hasFile = fileAttachments.value[field.fieldname];
      
      // Check if field is empty
      if (!value && !hasFile && value !== 0 && value !== false) {
        missingFields.push(field.fieldname);
        errors[field.fieldname] = `${field.label || field.fieldname} is required`;
      }
    }
  });
  
  return { missingFields, errors };
};

// FIXED: Form submission handler that only runs when explicitly called
const handleSubmit = async () => {
  console.log('EXPLICIT FORM SUBMIT: Form submission started explicitly by user action');
  clearError();
  
  processDateDefaults();
  
  const validation = validateForm();
  
  if (validation.missingFields.length > 0) {
    errorMessage.value = `Please fill in all required fields`;
    invalidFields.value = validation.missingFields;
    fieldErrors.value = validation.errors;
    
    // Scroll to first invalid field
    const firstInvalidField = document.querySelector(`[data-fieldname="${validation.missingFields[0]}"]`);
    if (firstInvalidField) {
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return;
  }

  emit('validate');

  if (!errorMessage.value) {
    submitting.value = true;
    
    try {
      const isNew = props.mode === 'add';
      const hasFiles = Object.keys(fileAttachments.value).length > 0;
      
      if (hasFiles) {
        await uploadFilesToTemp();
      }
      
      emit('submit', { 
        formData: formData.value, 
        files: fileAttachments.value,
        isNew,
        doctype: props.doctype,
        docname: props.docname,
        tempFileUrls: tempFileUrls.value,
        attachFilesToDoc: hasFiles ? attachFilesToDoc : null
      });
      
      // Show success message
      successMessage.value = `${props.doctype} ${isNew ? 'created' : 'updated'} successfully!`;
      
    } catch (error) {
      submitting.value = false;
      errorMessage.value = formatErrorMessage(error.message) || 'An error occurred while saving';
    }
  }
};

const handleCancel = () => {
  if (props.mode === 'edit' || isEditing.value) {
    Object.assign(formData.value, JSON.parse(JSON.stringify(originalData.value)));
    isEditing.value = false;
    
    if (props.docname) {
      router.push(`/${props.doctype.toLowerCase().replace(/\s+/g, '-')}/${props.docname}`);
    } else {
      router.push(`/${props.doctype.toLowerCase().replace(/\s+/g, '-')}`);
    }
  } else {
    router.push(`/${props.doctype.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  emit('cancel', {
    mode: props.mode,
    doctype: props.doctype,
    docname: props.docname
  });
};

const loadDocument = async () => {
  if (props.mode !== 'edit' && props.mode !== 'view') return;
  if (!props.docname) return;
  
  try {
    loading.value = true;
    
    const data = await api.fetchDocument(props.doctype, props.docname);
    
    Object.assign(formData.value, data);
    originalData.value = JSON.parse(JSON.stringify(data));
    
    // Fetch link field options after document is loaded
    await fetchLinkFieldOptions();
    initializeLinkSearchQueries();
    emit('load', data);
  } catch (error) {
    console.error(`Error loading ${props.doctype}:`, error);
    errorMessage.value = formatErrorMessage(error.message) || `Error loading ${props.doctype}`;
  } finally {
    loading.value = false;
  }
};

const initializeLinkSearchQueries = () => {
  const linkFields = visibleFields.value.filter(field => field.fieldtype === 'Link');
  
  for (const field of linkFields) {
    if (formData.value[field.fieldname]) {
      const options = getOptionsForField(field);
      const option = options.find(opt => opt.value === formData.value[field.fieldname]);
      if (option) {
        linkSearchQueries.value[field.fieldname] = option.label;
      } else {
        linkSearchQueries.value[field.fieldname] = formData.value[field.fieldname];
      }
    }
  }
};

const fetchLinkFieldOptions = async () => {
  const linkFields = visibleFields.value.filter(field => field.fieldtype === 'Link');
  
  for (const field of linkFields) {
    try {
      if (!field.options) continue;
      
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
      
      const fieldsResponse = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: "DocField",
          fields: ["fieldname", "fieldtype"],
          filters: { parent: field.options },
          limit_page_length: 0
        }),
        credentials: "include",
      });
      
      const fieldsData = await fieldsResponse.json();
      const fieldNames = fieldsData.message || [];
      
      const fieldsToFetch = new Set(["name", titleField, "creation"]);
      
      const commonNameFields = [
        "first_name", "last_name", "full_name",
        "project_name", "subject", "title",
        "customer_name", "employee_name"
      ];
      
      commonNameFields.forEach(fieldName => {
        if (fieldNames.some(f => f.fieldname === fieldName)) {
          fieldsToFetch.add(fieldName);
        }
      });
      
      if (fieldNames.some(f => f.fieldname === "status")) {
        fieldsToFetch.add("status");
      }
      
      const response = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: field.options,
          fields: Array.from(fieldsToFetch),
          limit_page_length: 0,
          order_by: "creation desc"
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Failed to fetch options for ${field.fieldname}`);

      const data = await response.json();

      if (data.message) {
        linkFieldOptions.value[field.fieldname] = data.message.map(item => {
          let label = item[titleField] || item.name;
          
          if (label === item.name) {
            if (item.first_name && item.last_name) {
              label = `${item.first_name} ${item.last_name}`.trim();
            } 
            else if (item.full_name) {
              label = item.full_name;
            }
            else if (item.project_name) {
              label = item.project_name;
            }
            else if (item.subject) {
              label = item.subject;
            }
            else if (item.title) {
              label = item.title;
            }
            else if (item.customer_name) {
              label = item.customer_name;
            }
            else if (item.employee_name) {
              label = item.employee_name;
            }
          }
          
          return {
            value: item.name,
            label: label || item.name,
            description: item.name !== label ? `${item.name}` : undefined,
            creation: item.creation,
            ...(item.status && { status: item.status })
          };
        });
      }
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
      const fallbackResponse = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: field.options,
          fields: ["name"],
          limit_page_length: 500,
        }),
        credentials: "include",
      });
      
      const fallbackData = await fallbackResponse.json();
      linkFieldOptions.value[field.fieldname] = fallbackData.message?.map(item => ({
        value: item.name,
        label: item.name
      })) || [];
    }
  }
};

const processCollapsibleSections = () => {
  visibleFields.value.forEach(field => {
    if (field.fieldtype === 'Section Break' && field.collapsible === 1) {
      if (collapsedSections.value[field.fieldname] === undefined) {
        collapsedSections.value[field.fieldname] = true;
      }
    }
  });
};

defineExpose({
  setSubmitting(value) {
    submitting.value = value;
  },
  setErrorMessage(message) {
    errorMessage.value = message;
  },
  setSuccessMessage(message) {
    successMessage.value = message;
  },
  getFiles() {
    return fileAttachments.value;
  },
  uploadFilesToTemp,
  attachFilesToDoc,
  loadDocument,
  handleSubmit,
  validateForm,
  fetchLinkFieldOptions,
  initializeLinkSearchQueries
});

watch(() => props.mode, (newMode) => {
  if (newMode === 'edit' || newMode === 'view') {
    loadDocument();
  }
});

watch(() => props.docname, (newDocname) => {
  if (newDocname && (props.mode === 'edit' || props.mode === 'view')) {
    loadDocument();
  }
});

watch(userPermissions, () => {
  if (props.mode !== 'edit') {
    applyUserPermissionsToFormData();
  }
}, { deep: true });

onMounted(async () => {
  console.log(`FormView mounted for ${props.doctype} in ${props.mode} mode`);
  
  await fetchUserPermissions();
  await fetchLinkFieldOptions();
  processCollapsibleSections();
  
  if ((props.mode === 'edit' || props.mode === 'view') && props.docname) {
    await loadDocument();
  } else {
    nextTick(() => {
      processDateDefaults();
      applyUserPermissionsToFormData();
    });
  }
});
</script>

<style>
.form-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100vh;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 130px);
}

.field-container {
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.field-container[data-fieldname] {
  scroll-margin-top: 2rem;
}

@media (max-width: 640px) {
  .field-container {
    margin-bottom: 1rem;
  }
  
  .form-content {
    max-height: calc(100vh - 140px);
  }
}

.collapsible-section {
  border-left: 3px solid #3b82f6;
  padding-left: 0.75rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.collapsible-section.collapsed {
  border-left-color: #e5e7eb;
}

/* Enhanced error styling */
.field-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 1px #ef4444 !important;
}

/* Success message animation */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-message {
  animation: slideInDown 0.3s ease-out;
}

/* Prevent event bubbling issues */
.group {
  position: relative;
}

/* Better click handling for interactive elements */
button, .cursor-pointer {
  position: relative;
  z-index: 1;
}

/* Ensure form controls don't trigger unwanted events */
input, select, textarea {
  position: relative;
  z-index: 1;
}
</style>
