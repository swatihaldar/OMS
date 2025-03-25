<template>
  <div class="p-4 max-w-4xl mx-auto">
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
    <div v-else>
      <!-- Header with Actions -->
      <div class="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 class="text-xl md:text-2xl font-semibold text-gray-900">
              <span v-if="!isEditing">{{ recordTitle }}</span>
              <input 
                v-else 
                v-model="editedRecord[titleField]" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </h2>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span class="text-sm text-gray-500">{{ doctype }} ID: {{ recordId }}</span>
              <span v-if="record.status" class="px-2 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(record.status)">
                {{ record.status }}
              </span>
            </div>
          </div>
          <div class="flex gap-2 self-start">
            <button 
              v-if="!isEditing && canEdit"
              @click="startEditing" 
              class="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button 
              v-if="isEditing"
              @click="saveChanges" 
              class="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              :disabled="isSaving"
            >
              <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div v-else class="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></div>
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
            <button 
              v-if="isEditing"
              @click="cancelEditing" 
              class="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button 
              v-if="!isEditing && canDelete"
              @click="confirmDelete" 
              class="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-5 0h10" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Record Details -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <!-- Tabs for mobile view -->
        <div class="md:hidden border-b">
          <div class="flex overflow-x-auto">
            <button 
              v-for="(section, index) in nonEmptySections" 
              :key="index"
              @click="activeTab = index"
              class="px-4 py-3 text-sm font-medium whitespace-nowrap"
              :class="activeTab === index ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'"
            >
              {{ section.label || `Section ${index + 1}` }}
            </button>
            <!-- Mobile view: Metadata section as last tab -->
            <button 
              @click="activeTab = nonEmptySections.length"
              class="px-4 py-3 text-sm font-medium whitespace-nowrap"
              :class="activeTab === nonEmptySections.length ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'"
            >
              Metadata
            </button>
          </div>
        </div>

        <!-- Desktop view: All sections -->
        <div class="hidden md:block p-6">
          <template v-for="(section, sectionIndex) in nonEmptySections" :key="sectionIndex">
            <div :class="{'border-t border-gray-200 pt-6 mt-6': sectionIndex > 0}">
              <h3 v-if="section.label" class="text-lg font-medium text-gray-900 mb-4">{{ section.label }}</h3>
              
              <!-- Render fields in this section -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <template v-for="(column, columnIndex) in section.columns" :key="columnIndex">
                  <div class="space-y-4">
                    <template v-for="field in column" :key="field.fieldname">
                      <div v-if="shouldDisplayField(field) && !isMetadataField(field.fieldname)" class="mb-4">
                        <div class="text-sm font-medium text-gray-500 mb-1">{{ field.label }}</div>
                        
                        <!-- View Mode -->
                        <template v-if="!isEditing">
                          <!-- Link fields -->
                          <div v-if="field.fieldtype === 'Link'" class="text-gray-900">
                            {{ getFieldDisplayValue(field) }}
                          </div>
                          
                          <!-- Select fields -->
                          <div v-else-if="field.fieldtype === 'Select'" class="text-gray-900">
                            {{ record[field.fieldname] }}
                          </div>
                          
                          <!-- Text Editor fields -->
                          <div v-else-if="field.fieldtype === 'Text Editor'" class="prose max-w-none bg-gray-50 p-3 rounded-lg">
                            <div v-html="record[field.fieldname]"></div>
                          </div>
                          
                          <!-- Checkbox fields -->
                          <div v-else-if="field.fieldtype === 'Check'" class="text-gray-900">
                            <span v-if="record[field.fieldname]" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Yes
                            </span>
                            <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              No
                            </span>
                          </div>
                          
                          <!-- Image fields -->
                          <div v-else-if="field.fieldtype === 'Attach Image' && record[field.fieldname]" class="mt-1">
                            <img :src="record[field.fieldname]" alt="Attached Image" class="h-48 w-auto rounded-lg object-cover" />
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
                        </template>
                        
                        <!-- Edit Mode -->
                        <template v-else>
                          <!-- Link fields -->
                          <select 
                            v-if="field.fieldtype === 'Link'" 
                            v-model="editedRecord[field.fieldname]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select {{ field.label }}</option>
                            <option v-for="option in getLinkOptions(field)" :key="option.value" :value="option.value">
                              {{ option.label }}
                            </option>
                          </select>
                          
                          <!-- Select fields -->
                          <select 
                            v-else-if="field.fieldtype === 'Select'" 
                            v-model="editedRecord[field.fieldname]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select {{ field.label }}</option>
                            <option v-for="option in getSelectOptions(field)" :key="option" :value="option">
                              {{ option }}
                            </option>
                          </select>
                          
                          <!-- Text Editor fields -->
                          <div v-else-if="field.fieldtype === 'Text Editor'" class="mt-1">
                            <textarea 
                              v-model="editedRecord[field.fieldname]" 
                              rows="4"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            ></textarea>
                          </div>
                          
                          <!-- Checkbox fields -->
                          <div v-else-if="field.fieldtype === 'Check'" class="mt-1">
                            <label class="inline-flex items-center">
                              <input 
                                type="checkbox" 
                                v-model="editedRecord[field.fieldname]"
                                class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              >
                              <span class="ml-2 text-gray-700">{{ field.label }}</span>
                            </label>
                          </div>
                          
                          <!-- Image fields -->
                          <div v-else-if="field.fieldtype === 'Attach Image'" class="mt-1">
                            <div v-if="editedRecord[field.fieldname]" class="mb-2">
                              <img :src="editedRecord[field.fieldname]" alt="Attached Image" class="h-24 w-auto rounded-lg object-cover" />
                            </div>
                            <input 
                              type="file" 
                              @change="handleFileUpload($event, field.fieldname)"
                              accept="image/*"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                          </div>
                          
                          <!-- Attachment fields -->
                          <div v-else-if="field.fieldtype === 'Attach'" class="mt-1">
                            <div v-if="editedRecord[field.fieldname]" class="mb-2 flex items-center">
                              <a :href="editedRecord[field.fieldname]" target="_blank" class="text-blue-600 hover:underline mr-2">
                                Current File
                              </a>
                              <button 
                                @click="editedRecord[field.fieldname] = ''" 
                                class="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                            <input 
                              type="file" 
                              @change="handleFileUpload($event, field.fieldname)"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                          </div>
                          
                          <!-- Date fields -->
                          <input 
                            v-else-if="field.fieldtype === 'Date'" 
                            type="date" 
                            v-model="editedRecord[field.fieldname]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                          
                          <!-- Datetime fields -->
                          <input 
                            v-else-if="field.fieldtype === 'Datetime'" 
                            type="datetime-local" 
                            v-model="editedRecord[field.fieldname]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                          
                          <!-- Default field input -->
                          <input 
                            v-else 
                            type="text" 
                            v-model="editedRecord[field.fieldname]"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                        </template>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Mobile view: Active tab section -->
        <div class="md:hidden p-4">
          <div v-if="nonEmptySections[activeTab]">
            <div class="space-y-4">
              <template v-for="column in nonEmptySections[activeTab].columns" :key="column">
                <template v-for="field in column" :key="field.fieldname">
                  <div v-if="shouldDisplayField(field) && !isMetadataField(field.fieldname)" class="mb-4 border-b pb-4">
                    <div class="text-sm font-medium text-gray-500 mb-1">{{ field.label }}</div>
                    
                    <!-- View Mode -->
                    <template v-if="!isEditing">
                      <!-- Link fields -->
                      <div v-if="field.fieldtype === 'Link'" class="text-gray-900">
                        {{ getFieldDisplayValue(field) }}
                      </div>
                      
                      <!-- Select fields -->
                      <div v-else-if="field.fieldtype === 'Select'" class="text-gray-900">
                        {{ record[field.fieldname] }}
                      </div>
                      
                      <!-- Text Editor fields -->
                      <div v-else-if="field.fieldtype === 'Text Editor'" class="prose max-w-none bg-gray-50 p-3 rounded-lg">
                        <div v-html="record[field.fieldname]"></div>
                      </div>
                      
                      <!-- Checkbox fields -->
                      <div v-else-if="field.fieldtype === 'Check'" class="text-gray-900">
                        <span v-if="record[field.fieldname]" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Yes
                        </span>
                        <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          No
                        </span>
                      </div>
                      
                      <!-- Image fields -->
                      <div v-else-if="field.fieldtype === 'Attach Image' && record[field.fieldname]" class="mt-1">
                        <img :src="record[field.fieldname]" alt="Attached Image" class="h-48 w-auto rounded-lg object-cover" />
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
                    </template>
                    
                    <!-- Edit Mode -->
                    <template v-else>
                      <!-- Link fields -->
                      <select 
                        v-if="field.fieldtype === 'Link'" 
                        v-model="editedRecord[field.fieldname]"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select {{ field.label }}</option>
                        <option v-for="option in getLinkOptions(field)" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                      
                      <!-- Select fields -->
                      <select 
                        v-else-if="field.fieldtype === 'Select'" 
                        v-model="editedRecord[field.fieldname]"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select {{ field.label }}</option>
                        <option v-for="option in getSelectOptions(field)" :key="option" :value="option">
                          {{ option }}
                        </option>
                      </select>
                      
                      <!-- Text Editor fields -->
                      <div v-else-if="field.fieldtype === 'Text Editor'" class="mt-1">
                        <textarea 
                          v-model="editedRecord[field.fieldname]" 
                          rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                      </div>
                      
                      <!-- Checkbox fields -->
                      <div v-else-if="field.fieldtype === 'Check'" class="mt-1">
                        <label class="inline-flex items-center">
                          <input 
                            type="checkbox" 
                            v-model="editedRecord[field.fieldname]"
                            class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          >
                          <span class="ml-2 text-gray-700">{{ field.label }}</span>
                        </label>
                      </div>
                      
                      <!-- Image fields -->
                      <div v-else-if="field.fieldtype === 'Attach Image'" class="mt-1">
                        <div v-if="editedRecord[field.fieldname]" class="mb-2">
                          <img :src="editedRecord[field.fieldname]" alt="Attached Image" class="h-24 w-auto rounded-lg object-cover" />
                        </div>
                        <input 
                          type="file" 
                          @change="handleFileUpload($event, field.fieldname)"
                          accept="image/*"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                      </div>
                      
                      <!-- Attachment fields -->
                      <div v-else-if="field.fieldtype === 'Attach'" class="mt-1">
                        <div v-if="editedRecord[field.fieldname]" class="mb-2 flex items-center">
                          <a :href="editedRecord[field.fieldname]" target="_blank" class="text-blue-600 hover:underline mr-2">
                            Current File
                          </a>
                          <button 
                            @click="editedRecord[field.fieldname] = ''" 
                            class="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        <input 
                          type="file" 
                          @change="handleFileUpload($event, field.fieldname)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                      </div>
                      
                      <!-- Date fields -->
                      <input 
                        v-else-if="field.fieldtype === 'Date'" 
                        type="date" 
                        v-model="editedRecord[field.fieldname]"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                      
                      <!-- Datetime fields -->
                      <input 
                        v-else-if="field.fieldtype === 'Datetime'" 
                        type="datetime-local" 
                        v-model="editedRecord[field.fieldname]"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                      
                      <!-- Default field input -->
                      <input 
                        v-else 
                        type="text" 
                        v-model="editedRecord[field.fieldname]"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                    </template>
                  </div>
                </template>
              </template>
            </div>
          </div>
          <!-- Metadata tab for mobile view -->
          <div v-if="activeTab === nonEmptySections.length" class="space-y-4 p-4">
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">Created By</div>
              <div class="text-gray-900">{{ record.owner || 'Unknown' }}</div>
            </div>
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">Created On</div>
              <div class="text-gray-900">{{ formatDate(record.creation) }}</div>
            </div>
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">Last Modified By</div>
              <div class="text-gray-900">{{ record.modified_by || 'Unknown' }}</div>
            </div>
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">Last Modified On</div>
              <div class="text-gray-900">{{ formatDate(record.modified) }}</div>
            </div>
          </div>
        </div>

        <!-- Metadata section for desktop view -->
        <!-- <div class="border-t border-gray-200 p-4 md:p-6 bg-gray-50">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Metadata</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">Created By</div>
              <div class="text-gray-900">{{ record.owner || 'Unknown' }}</div>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">Created On</div>
              <div class="text-gray-900">{{ formatDate(record.creation) }}</div>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">Last Modified By</div>
              <div class="text-gray-900">{{ record.modified_by || 'Unknown' }}</div>
            </div>
            <div>
              <div class="text-xs font-medium text-gray-500 mb-1">Last Modified On</div>
              <div class="text-gray-900">{{ formatDate(record.modified) }}</div>
            </div>
          </div>
        </div> -->

        <!-- Back Button -->
        <div class="p-4 md:p-6 border-t border-gray-200">
          <button 
            @click="$router.push(`/${doctypeRoute}`)" 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </button>
        </div>
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

    <!-- Permission Error Modal -->
    <div v-if="showPermissionError" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-red-600 mb-4">Permission Denied</h3>
        <p class="text-gray-600 mb-6">{{ permissionErrorMessage }}</p>
        <div class="flex justify-end">
          <button 
            @click="showPermissionError = false" 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getDocTypePermissions, getCurrentUser } from '../utils/permissions';

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

const emit = defineEmits(['record-deleted', 'record-updated']);

const router = useRouter();
const record = ref({});
const editedRecord = ref({});
const formFields = ref([]);
const loading = ref(true);
const error = ref(null);
const linkFieldOptions = ref({});
const showDeleteConfirm = ref(false);
const clientScripts = ref([]);
const eventHandlers = ref({});
const userPermissions = ref({});
const activeTab = ref(0);
const isEditing = ref(false);
const isSaving = ref(false);
const canEdit = ref(false);
const canDelete = ref(false);
const currentUser = ref(null);

// Permission error modal
const showPermissionError = ref(false);
const permissionErrorMessage = ref('');

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
  
  // Filter out system fields
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
      // Start a new section
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
  
  // Add the last section if it has fields
  if (currentSection.columns.some(col => col.length > 0)) {
    sections.push(currentSection);
  }
  
  return sections;
});

// Filter out empty sections and metadata fields
const nonEmptySections = computed(() => {
  return fieldSections.value.filter(section => {
    // Check if any column in this section has displayable fields that are not metadata
    return section.columns.some(column => {
      return column.some(field => 
        shouldDisplayField(field) && !isMetadataField(field.fieldname)
      );
    });
  });
});

// Check if a field is a metadata field
const isMetadataField = (fieldname) => {
  const metadataFields = ['owner', 'creation', 'modified', 'modified_by', 'docstatus'];
  return metadataFields.includes(fieldname);
};

// API Methods directly integrated
async function fetchDocument(doctype, name) {
  try {
    const response = await fetch('/api/method/frappe.client.get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData.message || `Error fetching ${doctype}`);
    }
    
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    throw new Error(`${doctype} not found`);
  } catch (error) {
    console.error(`Error fetching ${doctype}:`, error);
    throw error;
  }
}

// Add this method to the component to update the document
async function updateDocument(doctype, name, data) {
  try {
    console.log(`Updating ${doctype} ${name} with data:`, data);
    
    const response = await fetch('/api/method/frappe.client.set_value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype,
        name,
        fieldname: data
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Update failed with response:', errorData);
      throw new Error(errorData.exception || errorData.message || `Error updating ${doctype}`);
    }
    
    const responseData = await response.json();
    console.log('Update successful with response:', responseData);
    
    if (responseData.message) {
      return responseData.message;
    }
    throw new Error(`Failed to update ${doctype}`);
  } catch (error) {
    console.error(`Error updating ${doctype}:`, error);
    throw error;
  }
}

async function fetchDoctypeFields(doctype) {
  try {
    // First try using custom API endpoint
    try {
      const response = await fetch('/api/method/oms.api.get_doctype_fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctype })
      });
      
      const data = await response.json();
      
      if (data.message && Array.isArray(data.message) && data.message.length > 0) {
        console.log(`Successfully fetched ${data.message.length} fields using custom API`);
        return data.message;
      } else {
        console.log('Custom API returned no fields, falling back to standard API');
      }
    } catch (error) {
      console.error('Error using custom API, falling back to standard API:', error);
    }
    
 
    const response = await fetch('/api/method/frappe.desk.form.load.getdoctype', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype })
    });
    
    const data = await response.json();
    
    if (data.message && data.message.docs && data.message.docs[0]) {
      const doctypeDef = data.message.docs[0];
      console.log(`Successfully fetched ${doctypeDef.fields.length} fields using standard API`);
      
      return {
        fields: doctypeDef.fields || [],
        clientScripts: data.message.__client_scripts || []
      };
    } else {
      throw new Error('Failed to get fields from standard API');
    }
  } catch (error) {
    console.error('Error fetching doctype fields:', error);
    throw error;
  }
}

async function fetchLinkOptions(doctype, fields = ['name'], filters = {}) {
  try {
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype,
        fields,
        filters,
        limit: 50
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching options for ${doctype}:`, error);
    return [];
  }
}

async function deleteDocument(doctype, name) {
  try {
    const response = await fetch('/api/method/frappe.client.delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData.message || `Error deleting ${doctype}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting ${doctype}:`, error);
    throw error;
  }
}

async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctype', props.doctype);
    formData.append('docname', props.recordId);
    formData.append('fieldname', 'file_url');
    
    const response = await fetch('/api/method/upload_file', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData.message || 'Error uploading file');
    }
    
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    throw new Error('Failed to upload file');
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function fetchClientScripts(doctype) {
  try {
    console.log(`Fetching client scripts for ${doctype}...`);
    
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Client Script',
        filters: {
          dt: doctype,
          enabled: 1
        },
        fields: ['name', 'script', 'dt', 'enabled', 'view']
      })
    });
    
    const data = await response.json();
    
    if (data.message && Array.isArray(data.message)) {
      return data.message;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching client scripts for ${doctype}:`, error);
    return [];
  }
}

// Methods
const fetchRecord = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Get current user
    currentUser.value = await getCurrentUser();
    console.log('Current user:', currentUser.value);
    
    try {
      const data = await fetchDocument(props.doctype, props.recordId);
      console.log('Fetched document:', data);
      
      // Check if user can edit/delete this document - use direct API calls for reliability
      try {
        // Get doctype permissions directly from Frappe
        const response = await fetch('/api/method/frappe.client.get_permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctype: props.doctype })
        });
        
        if (response.ok) {
          const permData = await response.json();
          if (permData.message) {
            canEdit.value = permData.message.write || false;
            canDelete.value = permData.message.delete || false;
            console.log(`Direct permissions for ${props.doctype}:`, permData.message);
          }
        } else {
          // Fallback to our utility function
          const permissions = await getDocTypePermissions(props.doctype);
          canEdit.value = permissions.write;
          canDelete.value = permissions.delete;
          
          // If permissions are based on ownership, check if user is the owner
          if (permissions.if_owner && !permissions.read_all) {
            canEdit.value = canEdit.value && (data.owner === currentUser.value);
            canDelete.value = canDelete.value && (data.owner === currentUser.value);
          }
          
          console.log(`Utility permissions for ${props.doctype}:`, {
            canEdit: canEdit.value,
            canDelete: canDelete.value
          });
        }
      } catch (permError) {
        console.error('Error checking permissions:', permError);
        // Fallback to checking if user is owner
        canEdit.value = data.owner === currentUser.value;
        canDelete.value = data.owner === currentUser.value;
      }
      
      record.value = data;
      // Create a deep copy for editing
      editedRecord.value = JSON.parse(JSON.stringify(data));
      
      triggerEvent('onload');
      
    } catch (err) {
      console.error(`Error fetching ${props.doctype}:`, err);
      
      // Check if it's a permission error
      if (err.message && err.message.includes('Permission')) {
        error.value = `You don't have permission to view this ${props.doctype}. Please contact your administrator.`;
      } else {
        error.value = `Failed to load ${props.doctype}: ${err.message || 'Unknown error'}`;
      }
    }
  } finally {
    loading.value = false;
  }
};

const fetchDoctypeFieldsAndProcess = async () => {
  try {
    const result = await fetchDoctypeFields(props.doctype);
    
    if (Array.isArray(result)) {
      formFields.value = result;
    } else if (result && result.fields) {
      formFields.value = result.fields;
    } else {
      throw new Error('Invalid response format');
    }
    
    await fetchLinkFieldOptions();
    
    // Fetch client scripts
    await fetchClientScriptsAndProcess();
    
  } catch (error) {
    console.error('Error fetching doctype fields:', error);
    error.value = 'Failed to load doctype fields';
  }
};

const fetchClientScriptsAndProcess = async () => {
  try {
    console.log(`Fetching client scripts for ${props.doctype}...`);
    
    const scripts = await fetchClientScripts(props.doctype);
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
      permissionErrorMessage.value = typeof message === 'object' ? message.message : message;
      showPermissionError.value = true;
    },
    throw: (message) => {
      console.log('THROW:', message);
      error.value = typeof message === 'object' ? message.message : message;
    },
    show_alert: (message, seconds = 3) => {
      console.log('SHOW_ALERT:', message);
      permissionErrorMessage.value = typeof message === 'object' ? message.message : message;
      showPermissionError.value = true;
      setTimeout(() => {
        showPermissionError.value = false;
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
          // Implementation for model events
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
        const projects = await fetchLinkOptions('Project', ['name', 'project_name']);
        options = projects.map(item => ({
          value: item.name,
          label: item.project_name || item.name
        }));
      } else if (field.options === 'Contact') {
        const contacts = await fetchLinkOptions('Contact', ['name', 'first_name', 'last_name']);
        options = contacts.map(item => ({
          value: item.name,
          label: `${item.first_name || ''} ${item.last_name || ''} (${item.name})`
        }));
      } else {
        // Default handling for other doctypes
        const items = await fetchLinkOptions(field.options, ['name']);
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
  
  // In edit mode, show all fields
  if (isEditing.value) return true;
  
  // In view mode, only show fields with values
  const value = record.value[field.fieldname];
  return field.fieldtype === 'Check' || (value !== undefined && value !== null && value !== '');
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

const getSelectOptions = (field) => {
  if (field.options) {
    return field.options.split('\n');
  }
  return [];
};

const getLinkOptions = (field) => {
  return linkFieldOptions.value[field.fieldname] || [];
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

const startEditing = () => {
  console.log('Attempting to start editing mode');
  
  if (!canEdit.value) {
    permissionErrorMessage.value = `You don't have permission to edit this ${props.doctype}`;
    showPermissionError.value = true;
    return;
  }
  
  editedRecord.value = JSON.parse(JSON.stringify(record.value));
  isEditing.value = true;
  console.log('Edit mode activated');
  
  // Trigger onEdit event
  triggerEvent('onedit');
};

const cancelEditing = () => {
  isEditing.value = false;
  // Reset edited record
  editedRecord.value = JSON.parse(JSON.stringify(record.value));
};

const saveChanges = async () => {
  try {
    isSaving.value = true;
    console.log('Starting save operation...');
    
    // Prepare data for update
    const updateData = {};
    for (const [key, value] of Object.entries(editedRecord.value)) {
      // Only include fields that have changed
      if (JSON.stringify(value) !== JSON.stringify(record.value[key])) {
        updateData[key] = value;
        console.log(`Field ${key} changed from`, record.value[key], 'to', value);
      }
    }
    
    // If no changes, just exit edit mode
    if (Object.keys(updateData).length === 0) {
      console.log('No changes detected, exiting edit mode');
      isEditing.value = false;
      isSaving.value = false;
      return;
    }
    
    console.log('Sending update with data:', updateData);
    
    // Update the document
    const updatedRecord = await updateDocument(props.doctype, props.recordId, updateData);
    console.log('Update successful, received:', updatedRecord);
    
    // Update the local record
    record.value = updatedRecord;
    
    // Exit edit mode
    isEditing.value = false;
    
    // Trigger onUpdate event
    triggerEvent('onupdate');
    
    // Emit record-updated event
    emit('record-updated', updatedRecord);
    
  } catch (error) {
    console.error(`Error updating ${props.doctype}:`, error);
    
    // If we get a permission error, update the canEdit flag and show modal
    if (error.message && error.message.includes('Permission')) {
      console.log('User does not have permission to edit this document');
      canEdit.value = false;
      permissionErrorMessage.value = `Error updating ${props.doctype}: You don't have permission to edit this document`;
      showPermissionError.value = true;
    } else {
      permissionErrorMessage.value = `Error updating ${props.doctype}: ${error.message}`;
      showPermissionError.value = true;
    }
  } finally {
    isSaving.value = false;
  }
};

const handleFileUpload = async (event, fieldname) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const fileData = await uploadFile(file);
    editedRecord.value[fieldname] = fileData.file_url;
  } catch (error) {
    console.error('Error uploading file:', error);
    permissionErrorMessage.value = `Error uploading file: ${error.message}`;
    showPermissionError.value = true;
  }
};

const confirmDelete = () => {
  if (!canDelete.value) {
    permissionErrorMessage.value = `You don't have permission to delete this ${props.doctype}`;
    showPermissionError.value = true;
    return;
  }
  
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  try {
    loading.value = true;
    showDeleteConfirm.value = false;
    
    await deleteDocument(props.doctype, props.recordId);
    
    emit('record-deleted', props.recordId);
    
    // Navigate back to list view
    router.push(`/${doctypeRoute.value}`);
    
  } catch (error) {
    console.error(`Error deleting ${props.doctype}:`, error);
    
    if (error.message && error.message.includes('Permission')) {
      permissionErrorMessage.value = `Error deleting ${props.doctype}: You don't have permission to delete this document`;
      showPermissionError.value = true;
    } else {
      permissionErrorMessage.value = `Error deleting ${props.doctype}: ${error.message}`;
      showPermissionError.value = true;
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  console.log(`DetailView component mounted for ${props.doctype} ${props.recordId}`);
  
  try {
    // Fetch doctype fields first
    await fetchDoctypeFieldsAndProcess();
    
    // Then fetch the record
    await fetchRecord();
  } catch (error) {
    console.error('Error initializing component:', error);
    error.value = 'Failed to initialize component';
  }
});

watch(() => props.recordId, async (newId) => {
  if (newId) {
    // Exit edit mode if changing records
    isEditing.value = false;
    await fetchRecord();
  }
});

watch(() => props.doctype, async () => {
  loading.value = true;
  formFields.value = [];
  record.value = {};
  editedRecord.value = {};
  isEditing.value = false;
  
  try {
    await fetchDoctypeFieldsAndProcess();
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

/* Improved mobile styling */
@media (max-width: 640px) {
  .prose {
    font-size: 0.875rem;
  }
}
</style>

