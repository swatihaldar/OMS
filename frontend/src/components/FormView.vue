<template>
  <div class="bg-white rounded-lg shadow-sm form-view">
    <!-- Scrollable Content Area -->
    <div class="p-4 md:p-6 overflow-y-auto form-content">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- View Mode -->
      <div v-else-if="mode === 'view' && !isEditing" class="space-y-6">
        <!-- Document Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <template v-for="(field, index) in visibleFields" :key="field.fieldname">

            <!-- Section Break -->
            <div v-if="field.fieldtype === 'Section Break'" class="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-6">
              <h3 v-if="field.label" class="text-lg font-medium text-gray-900 mb-4">{{ field.label }}</h3>
            </div>

            <!-- Column Break -->
            <div v-else-if="field.fieldtype === 'Column Break'" class="hidden md:block">
              <!-- Column break marker -->
            </div>

            <!-- Regular fields -->
            <div v-else class="field-container" :class="getColumnClass(index)">
              <div class="mb-4">
                <div class="text-sm font-medium text-gray-500 mb-1">{{ field.label }}</div>
                
                <!-- Link fields -->
                <div v-if="field.fieldtype === 'Link'" class="text-gray-900">
                  {{ getFieldDisplayValue(field.fieldname) }}
                </div>
                
                <!-- Select fields -->
                <div v-else-if="field.fieldtype === 'Select'" class="text-gray-900">
                  {{ formData[field.fieldname] }}
                </div>
                
                <!-- Text Editor fields -->
                <div v-else-if="field.fieldtype === 'Text Editor'" class="prose max-w-none">
                  <div v-html="formData[field.fieldname]"></div>
                </div>
                
                <!-- Long Text fields -->
                <div v-else-if="field.fieldtype === 'Long Text'" class="text-gray-900 whitespace-pre-line">
                  {{ formData[field.fieldname] }}
                </div>
                
                <!-- Small Text fields with line breaks -->
                <div v-else-if="field.fieldtype === 'Small Text'" class="text-gray-900 whitespace-pre-line">
                  {{ formData[field.fieldname] }}
                </div>
                
                <!-- Checkbox fields -->
                <div v-else-if="field.fieldtype === 'Check'" class="text-gray-900">
                  <span v-if="formData[field.fieldname]" class="text-green-600">Yes</span>
                  <span v-else class="text-red-600">No</span>
                </div>
                
                <!-- Image fields -->
                <div v-else-if="field.fieldtype === 'Attach Image' && formData[field.fieldname]" class="mt-1">
                  <img :src="formData[field.fieldname]" alt="Attached Image" class="h-48 w-auto rounded-lg" />
                </div>
                
                <!-- Attachment fields -->
                <div v-else-if="field.fieldtype === 'Attach' && formData[field.fieldname]" class="mt-1 flex items-center">
                  <a :href="formData[field.fieldname]" target="_blank" class="text-blue-600 hover:underline flex items-center">
                    <svg class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Download Attachment
                  </a>
                </div>
                
                <!-- Default field display -->
                <div v-else class="text-gray-900">
                  {{ formData[field.fieldname] }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Form (Add/Edit Mode) -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span class="block sm:inline">{{ errorMessage }}</span>
          <button @click="errorMessage = ''" class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" 
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
          clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Dynamic Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <template v-for="(field, index) in visibleFields" :key="field.fieldname">
            <!-- Section Break -->
            <div v-if="field.fieldtype === 'Section Break'" class="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-6">
              <h3 v-if="field.label" class="text-lg font-medium text-gray-900 mb-4">{{ field.label }}</h3>
            </div>

            <!-- Column Break -->
            <div v-else-if="field.fieldtype === 'Column Break'" class="hidden md:block">
              <!-- This creates a new column in the grid -->
            </div>

            <!-- Regular fields -->
            <div v-else class="field-container" :class="getColumnClass(index)">

              <!-- Link fields with search -->
              <div v-if="field.fieldtype === 'Link'" class="relative">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                
                <!-- Search input for link field -->
                <div class="relative">
                  <input
                    v-model="linkSearchQueries[field.fieldname]"
                    type="text"
                    class="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    :class="{
                      'bg-gray-100': field.read_only || isReadOnly,
                      'border-red-500': isFieldInvalid(field.fieldname) && field.reqd
                    }"
                    :disabled="field.read_only || isReadOnly"
                    @focus="openLinkDropdown(field.fieldname)"
                    @blur="closeLinkDropdownDelayed(field.fieldname)"
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <!-- Dropdown for link options -->
                <div 
                  v-if="activeLinkDropdown === field.fieldname"
                  class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                >
                  <div 
                    v-for="option in getFilteredOptionsForField(field)" 
                    :key="option.value"
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                    @mousedown="selectLinkOption(field.fieldname, option.value)"
                  >
                    <span class="block truncate" :class="{'font-semibold': formData[field.fieldname] === option.value}">
                      {{ option.label }}
                    </span>
                    <span 
                      v-if="formData[field.fieldname] === option.value" 
                      class="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div v-if="getFilteredOptionsForField(field).length === 0" class="py-2 px-3 text-gray-500 italic">
                    No results found
                  </div>
                </div>
              </div>

              <!-- Select fields -->
              <div v-else-if="field.fieldtype === 'Select'">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <select
                  v-model="formData[field.fieldname]"
                  :required="field.reqd"
                  :disabled="field.read_only || isReadOnly"
                  class="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{
                    'bg-gray-100': field.read_only || isReadOnly,
                    'border-red-500': isFieldInvalid(field.fieldname) && field.reqd
                  }"
                  @change="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                >
                  <option 
                    v-for="option in getOptionsForField(field)" 
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <!-- Text fields -->
              <div v-else-if="isTextInputField(field)">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <input
                  v-model="formData[field.fieldname]"
                  :type="getInputType(field)"
                  :required="field.reqd"
                  :disabled="field.read_only || isReadOnly"
                  :maxlength="field.length || 140"
                  class="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{
                    'bg-gray-100': field.read_only || isReadOnly,
                    'border-red-500': isFieldInvalid(field.fieldname) && field.reqd
                  }"
                  @input="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                />
                <!-- <div v-if="field.length || field.fieldtype === 'Data'" class="text-xs text-gray-500 mt-1">
                  {{ formData[field.fieldname] ? formData[field.fieldname].length : 0 }}/{{ field.length || 140 }} characters
                </div> -->
              </div>

              <!-- Long Text fields -->
              <div v-else-if="field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <textarea
                  v-model="formData[field.fieldname]"
                  :required="field.reqd"
                  :disabled="field.read_only || isReadOnly"
                  :rows="field.fieldtype === 'Long Text' ? 6 : 3"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{
                    'bg-gray-100': field.read_only || isReadOnly,
                    'border-red-500': isFieldInvalid(field.fieldname) && field.reqd
                  }"
                  @input="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                ></textarea>
              </div>

              <!-- Text Editor -->
              <div v-else-if="field.fieldtype === 'Text Editor'">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <div 
                  class="border rounded-lg overflow-hidden"
                  :class="{'border-red-500': isFieldInvalid(field.fieldname) && field.reqd}"
                >
                  <QuillEditor
                    v-model:content="formData[field.fieldname]"
                    toolbar="full"
                    theme="snow"
                    contentType="html"
                    :readOnly="field.read_only || isReadOnly"
                    class="min-h-[200px] max-h-[400px]"
                    @update:content="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                  />
                </div>
              </div>

              <!-- Date fields -->
              <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <input
                  v-model="formData[field.fieldname]"
                  :type="field.fieldtype === 'Date' ? 'date' : 'datetime-local'"
                  :required="field.reqd"
                  :disabled="field.read_only || isReadOnly"
                  class="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{
                    'bg-gray-100': field.read_only || isReadOnly,
                    'border-red-500': isFieldInvalid(field.fieldname) && field.reqd
                  }"
                  @input="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                />
              </div>

              <!-- Checkbox fields -->
              <div v-else-if="field.fieldtype === 'Check'">
                <div class="flex items-center">
                  <input
                    v-model="formData[field.fieldname]"
                    type="checkbox"
                    :disabled="field.read_only || isReadOnly"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    :class="{'bg-gray-100': field.read_only || isReadOnly}"
                    @change="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                  />
                  <label 
                    class="ml-2 block text-sm text-gray-700 group relative"
                  >
                    {{ field.label }}
                    <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                  </label>
                </div>
              </div>

              <!-- Number fields -->
              <div v-else-if="isNumberField(field)">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <input
                  v-model="formData[field.fieldname]"
                  :type="field.fieldtype === 'Int' ? 'number' : 'text'"
                  :step="field.fieldtype === 'Int' ? '1' : '0.01'"
                  :required="field.reqd"
                  :disabled="field.read_only || isReadOnly"
                  :min="field.min_value !== undefined ? field.min_value : undefined"
                  :max="field.max_value !== undefined ? field.max_value : undefined"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  :class="{
                    'bg-gray-100': field.read_only || isReadOnly,
                    'border-red-500': isFieldInvalid(field.fieldname) && field.reqd
                  }"
                  @input="() => handleFieldChange({ fieldname: field.fieldname, value: formData[field.fieldname] })"
                />
              </div>

              <!-- Attach Image -->
              <div v-else-if="field.fieldtype === 'Attach Image'">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <div
                  v-if="!getImagePreview(field.fieldname) && !(field.read_only || isReadOnly)"
                  class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg"
                  :class="{'border-red-500': isFieldInvalid(field.fieldname) && field.reqd}"
                  @dragover.prevent
                  @drop.prevent="(e) => handleDrop(e, field.fieldname)"
                >
                  <div class="space-y-1 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="flex text-sm text-gray-600">
                      <label class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          class="sr-only"
                          accept="image"
                          @change="(e) => handleFileUpload(e, field.fieldname)"
                        />
                        
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>

                <div v-else-if="getImagePreview(field.fieldname)" class="mt-1 relative">
                  <img :src="getImagePreview(field.fieldname)" alt="Preview" class="h-48 w-auto rounded-lg" />
                  <button 
                    v-if="!(field.read_only || isReadOnly)"
                    type="button" 
                    @click="removeFile(field.fieldname)" 
                    class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Attach -->
              <div v-else-if="field.fieldtype === 'Attach'">
                <label 
                  class="block text-sm font-medium text-gray-700 mb-1 group relative"
                >
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      {{ field.description }}
                    </div>
                  </span>
                </label>
                <div
                  v-if="!getAttachmentName(field.fieldname) && !(field.read_only || isReadOnly)"
                  class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg"
                  :class="{'border-red-500': isFieldInvalid(field.fieldname) && field.reqd}"
                  @dragover.prevent
                  @drop.prevent="(e) => handleDrop(e, field.fieldname)"
                >
                  <div class="space-y-1 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div class="flex text-sm text-gray-600">
                      <label class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          class="sr-only"
                          @change="(e) => handleFileUpload(e, field.fieldname)"
                        />
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs text-gray-500">Any file type up to 5MB</p>
                  </div>
                </div>
                <div v-else-if="getAttachmentName(field.fieldname)" class="mt-1 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div class="flex items-center">
                    <svg class="h-6 w-6 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm text-gray-700">{{ getAttachmentName(field.fieldname) }}</span>
                  </div>
                  <button 
                    v-if="!(field.read_only || isReadOnly)"
                    type="button" 
                    @click="removeFile(field.fieldname)" 
                    class="text-red-500 hover:text-red-600"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </form>
    </div>

    <!-- Fixed Footer with Actions -->
    <div class="sticky bottom-0 z-10 bg-white p-4 md:p-6 border-t">
      <slot name="actions">
        <div class="flex flex-wrap gap-3">
          <button
            v-if="mode === 'edit' && !isReadOnly"
            type="button"
            @click="confirmDelete"
            class="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            @click="handleSubmit"
            :disabled="submitting || isReadOnly"
            class="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-800"
          >
            <span v-if="submitting" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submittingText || 'Saving...' }}
            </span>
            <span v-else>{{ submitText || 'Save' }}</span>
          </button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import api from '@/utils/api';
import { getHiddenFields } from '@/config/form-config';

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
const fileAttachments = ref({});
const filePreviewUrls = ref({});
const isEditing = ref(false);
const originalData = ref({});
const linkFieldOptions = ref({});
const invalidFields = ref([]);
const linkSearchQueries = ref({});
const activeLinkDropdown = ref(null);
const userPermissions = ref([]);

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

const visibleFields = computed(() => {
  // Get the list of hidden fields from the config
  const hiddenFieldsList = getHiddenFields();
  
  return props.fields
    .filter(field => 
      field && 
      field.fieldname && 
      !field.hidden &&
      !hiddenFieldsList.includes(field.fieldname) // Filter out fields in the hidden fields list
    )
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
});

const isTextInputField = (field) => {
  return ['Data', 'Small Text', 'Phone', 'Email', 'Password'].includes(field.fieldtype);
};

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

  // For Long Text and Text Editor fields, use full width
  if (field.fieldtype === 'Long Text' || field.fieldtype === 'Text Editor') {
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

// Filtered options for link fields with search
const getFilteredOptionsForField = (field) => {
  const options = getOptionsForField(field);
  const searchQuery = linkSearchQueries.value[field.fieldname] || '';
  
  if (!searchQuery) {
    return options;
  }
  
  return options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

const getFieldDisplayValue = (fieldname) => {
  const field = props.fields.find(f => f.fieldname === fieldname);
  if (!field) return formData.value[fieldname] || '';
  
  if (field.fieldtype === 'Link') {
    const options = props.fieldOptions[fieldname] || linkFieldOptions.value[fieldname] || [];
    const option = options.find(opt => opt.value === formData.value[fieldname]);
    return option ? option.label : formData.value[fieldname] || '';
  }
  
  return formData.value[fieldname] || '';
};

const getImagePreview = (fieldname) => {
  // If we have a preview URL, use that
  if (filePreviewUrls.value[fieldname]) {
    return filePreviewUrls.value[fieldname];
  }
  
  // Otherwise, if we have a file URL in the form data, use that
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
    // Extract filename from URL
    const url = formData.value[fieldname];
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
  
  return null;
};

// Link field dropdown handling
const openLinkDropdown = (fieldname) => {
  activeLinkDropdown.value = fieldname;
  
  // Initialize search query with current value's label if it exists
  if (formData.value[fieldname]) {
    const field = props.fields.find(f => f.fieldname === fieldname);
    if (field && field.fieldtype === 'Link') {
      const options = getOptionsForField(field);
      const option = options.find(opt => opt.value === formData.value[fieldname]);
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

// Improve the selectLinkOption function to handle user permission fields
const selectLinkOption = (fieldname, value) => {
  // Check if this field is controlled by user permissions
  const field = props.fields.find(f => f.fieldname === fieldname);
  const isUserPermissionField = field && userPermissions.value.some(p => 
    p.allow === field.options
  );
  
  // Only allow changing if not controlled by user permissions
  if (!isUserPermissionField || field.read_only !== 1) {
    formData.value[fieldname] = value;
    
    // Update search query with selected option's label
    if (field && field.fieldtype === 'Link') {
      const options = getOptionsForField(field);
      const option = options.find(opt => opt.value === value);
      if (option) {
        linkSearchQueries.value[fieldname] = option.label;
      }
    }
    
    handleFieldChange({ fieldname, value });
  }
  
  activeLinkDropdown.value = null;
};

// Check if a field is invalid (for validation styling)
const isFieldInvalid = (fieldname) => {
  return invalidFields.value.includes(fieldname);
};

// File handling
const handleFileUpload = (event, fieldname) => {
  const file = event.target.files[0];
  handleFile(file, fieldname);
};

const handleDrop = (event, fieldname) => {
  const file = event.dataTransfer.files[0];
  handleFile(file, fieldname);
};

const handleFile = (file, fieldname) => {
  if (!file) return;

  // Check file size (5MB limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = 'File size must be less than 5MB';
    return;
  }

  // Check if it's an image field
  if (fieldname.includes('image') || props.fields.find(f => f.fieldname === fieldname && f.fieldtype === 'Attach Image')) {
    if (!file.type.startsWith('image/')) {
      errorMessage.value = 'Please upload an image file';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreviewUrls.value[fieldname] = e.target.result;
      fileAttachments.value[fieldname] = file;
      formData.value[fieldname] = null; 
      emit('field-change', { fieldname, value: null, file });
    };
    reader.readAsDataURL(file);
  } else {
    // For other attachments
    fileAttachments.value[fieldname] = file;
    formData.value[fieldname] = null; 
    emit('field-change', { fieldname, value: null, file });
  }
};

const removeFile = (fieldname) => {
  delete filePreviewUrls.value[fieldname];
  delete fileAttachments.value[fieldname];
  formData.value[fieldname] = null;
  emit('field-change', { fieldname, value: null, file: null });
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
        // Format: YYYY-MM-DDThh:mm
        formData.value[field.fieldname] = today.toISOString().slice(0, 16);
      }
    }
  });
};

// Fetch user permissions
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
      console.log('User permissions loaded:', userPermissions.value);
      
      // Apply user permissions to form data immediately
      if (props.mode !== 'edit') {
        applyUserPermissionsToFormData();
      }
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
  }
};

// Apply user permissions to form data
const applyUserPermissionsToFormData = () => {
  if (props.mode === 'edit') return;
  
  userPermissions.value.forEach(permission => {
    const linkFields = props.fields.filter(field => 
      field.fieldtype === 'Link' && field.options === permission.allow
    );
    
    linkFields.forEach(field => {
      // Set the default value from user permission
      formData.value[field.fieldname] = permission.for_value;
      
      // Also set the search query to match the selected value
      linkSearchQueries.value[field.fieldname] = permission.for_value;
      
      // Mark field as read-only
      const fieldIndex = props.fields.findIndex(f => f.fieldname === field.fieldname);
      if (fieldIndex !== -1) {
        props.fields[fieldIndex].read_only = 1;
        props.fields[fieldIndex].read_only_depends_on = `User Permission for ${permission.allow}`;
      }
    });
  });
};

// Form actions
const handleSubmit = () => {
  errorMessage.value = '';
  invalidFields.value = [];
  
  // Process date defaults before submission
  processDateDefaults();
  
  const missingFields = visibleFields.value
    .filter(field => field.reqd && !formData.value[field.fieldname] && !fileAttachments.value[field.fieldname])
    .map(field => field.fieldname);

  if (missingFields.length > 0) {
    errorMessage.value = `Please fill in all required fields`;
    invalidFields.value = missingFields;
    return;
  }

  emit('validate');

  if (!errorMessage.value) {
    submitting.value = true;
    
    const isNew = props.mode === 'add';
    
    emit('submit', { 
      formData: formData.value, 
      files: fileAttachments.value,
      isNew,
      doctype: props.doctype,
      docname: props.docname
    });
  }
};

const cancelForm = () => {
  if (props.mode === 'edit' || isEditing.value) {
    Object.assign(formData.value, originalData.value);
    isEditing.value = false;
  } else {
    emit('cancel');
  }
};

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete this ${props.doctype}?`)) {
    deleteDocument();
  }
};

const deleteDocument = async () => {
  if (!props.docname) return;
  
  try {
    submitting.value = true;
    
    await api.deleteDocument(props.doctype, props.docname);
    
    emit('delete', props.docname);
  } catch (error) {
    console.error(`Error deleting ${props.doctype}:`, error);
    errorMessage.value = `Error deleting ${props.doctype}: ${error.message}`;
  } finally {
    submitting.value = false;
  }
};

const loadDocument = async () => {
  if (props.mode !== 'edit' && props.mode !== 'view') return;
  if (!props.docname) return;
  
  try {
    loading.value = true;
    
    const data = await api.fetchDocument(props.doctype, props.docname);
    
    // Update form data
    Object.assign(formData.value, data);
    
    // Store original data for reverting changes
    originalData.value = { ...data };
    
    // Emit load event
    emit('load', data);
  } catch (error) {
    console.error(`Error loading ${props.doctype}:`, error);
    errorMessage.value = `Error loading ${props.doctype}: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// Fetch options for link fields - Modified to fetch ALL records
const fetchLinkFieldOptions = async () => {
  const linkFields = visibleFields.value.filter(field => field.fieldtype === 'Link');
  
  for (const field of linkFields) {
    try {
      console.log(`Auto-fetching options for ${field.fieldname} (${field.options})`);
      
      let options = [];
      
      // Special handling for common doctypes
      if (field.options === 'Project') {
        const projects = await api.fetchLinkOptions('Project', ['name', 'project_name', 'creation']);
        options = projects.map(item => ({
          value: item.name,
          label: item.project_name || item.name,
          creation: item.creation
        }));
      } else if (field.options === 'Contact') {
        const contacts = await api.fetchLinkOptions('Contact', ['name', 'first_name', 'last_name', 'creation']);
        options = contacts.map(item => ({
          value: item.name,
          label: `${item.first_name || ''} ${item.last_name || ''} (${item.name})`,
          creation: item.creation
        }));
      } else {
        // Fetch all records with limit 0
        const items = await api.fetchLinkOptions(field.options, ['name', 'creation']);
        options = items.map(item => ({
          value: item.name,
          label: item.name,
          creation: item.creation
        }));
      }
      
      // Sort by creation date (newest first) if available
      if (options.length > 0 && options[0].creation) {
        options.sort((a, b) => {
          if (!a.creation) return 1;
          if (!b.creation) return -1;
          return new Date(b.creation) - new Date(a.creation);
        });
      }
      
      linkFieldOptions.value[field.fieldname] = options;
      
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
    }
  }
};

const uploadFiles = async () => {
  const uploadedFiles = {};
  
  for (const [fieldname, file] of Object.entries(fileAttachments.value)) {
    try {
      const fileUrl = await api.uploadFile(file, props.doctype, fieldname, props.docname);
      uploadedFiles[fieldname] = fileUrl;
    } catch (error) {
      console.error(`Error uploading file for ${fieldname}:`, error);
      throw error;
    }
  }
  
  return uploadedFiles;
};

// Handle field changes
const handleFieldChange = (payload) => {
  // Remove field from invalid fields list if it was previously invalid
  if (invalidFields.value.includes(payload.fieldname)) {
    invalidFields.value = invalidFields.value.filter(f => f !== payload.fieldname);
  }
  
  emit('field-change', payload);
};

// Watch for changes in individual fields
watch(() => props.modelValue, (newValue, oldValue) => {
  if (!oldValue) return;

  // Find which field changed
  for (const key in newValue) {
    if (newValue[key] !== oldValue[key]) {
      // Emit field change event
      emit('field-change', { 
        fieldname: key, 
        value: newValue[key],
        file: fileAttachments.value[key] || null
      });
    }
  }
}, { deep: true });

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

// Add a watch for userPermissions to ensure values are applied when permissions change
watch(userPermissions, () => {
  if (props.mode !== 'edit') {
    applyUserPermissionsToFormData();
  }
}, { deep: true });

defineExpose({
  setSubmitting(value) {
    submitting.value = value;
  },
  setErrorMessage(message) {
    errorMessage.value = message;
  },
  getFiles() {
    return fileAttachments.value;
  },
  uploadFiles,
  loadDocument,
  deleteDocument
});

onMounted(async () => {
  console.log(`FormView mounted for ${props.doctype} in ${props.mode} mode`);
  
  // Fetch user permissions first
  await fetchUserPermissions();
  
  // Then fetch link field options
  await fetchLinkFieldOptions();
  
  if ((props.mode === 'edit' || props.mode === 'view') && props.docname) {
    await loadDocument();
  } else {
    // Apply user permissions again after everything is loaded
    nextTick(() => {
      processDateDefaults();
      applyUserPermissionsToFormData(); // Apply again to ensure values are set
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

.ql-editor {
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
}

.field-container {
  margin-bottom: 1.25rem;
  transition: all 0.2s ease;
}

/* Improve date input styling */
input[type="date"],
input[type="datetime-local"] {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  background: white;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

input,
select,
textarea,
.ql-toolbar {
  min-height: 2.5rem;
}

@media (max-width: 640px) {
  input,
  select,
  textarea,
  .ql-toolbar {
    min-height: 2.75rem;
    font-size: 16px; 
  }

  .field-container {
    margin-bottom: 1rem;
  }

  label {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  button {
    min-height: 2.75rem;
  }
}

.ql-snow.ql-toolbar button svg, .ql-snow .ql-toolbar button svg {
    float: left;
    height: 100%;
}

@media (max-width: 640px) {
  .ql-snow.ql-toolbar button svg, .ql-snow .ql-toolbar button svg  {
        height: 50%;
    }
}
</style>