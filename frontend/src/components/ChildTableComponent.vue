<template>
  <div class="mb-6">
    <!-- Label and description section -->
    <label class="block text-sm font-medium text-gray-700 mb-1 group relative">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
      <span v-if="description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
          {{ description }}
        </div>
      </span>
    </label>

    <!-- Debug Info -->
    <div v-if="debug" class="bg-gray-100 p-2 mb-2 text-xs rounded">
      <div>Child Doctype: {{ childDoctype }}</div>
      <div>Fields loaded: {{ fields.length }}</div>
      <div>Visible fields: {{ visibleFields.length }}</div>
      <div>List view fields: {{ listViewFields.length }}</div>
      <div v-if="error" class="text-red-500">Error: {{ error }}</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-4 bg-white rounded-lg border border-gray-200">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      <p>{{ error }}</p>
      <button 
        @click="retryFetch" 
        class="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded"
      >
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="(modelValue || []).length === 0" class="bg-white rounded-lg border border-gray-200 p-4 text-center">
      <div class="flex flex-col items-center justify-center py-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-gray-500 mb-4">No {{ label.toLowerCase() }} added yet</p>
        <button 
          v-if="!isReadOnly" 
          @click="openAddRowModal" 
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add {{ label }}
        </button>
      </div>
    </div>

    <!-- Table Display -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <!-- Table Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">{{ label }}</h3>
        <button 
          v-if="!isReadOnly" 
          @click.stop="openAddRowModal" 
          class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th v-for="field in listViewFields" :key="field.fieldname" 
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  :style="getColumnStyle(field)">
                {{ field.label }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sticky right-0 bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(row, index) in modelValue" :key="index" class="hover:bg-gray-50 cursor-pointer" @click="viewRow(index)">
              <td v-for="field in listViewFields" :key="field.fieldname" 
                  class="px-4 py-3 text-sm text-gray-900"
                  :style="getColumnStyle(field)">
                <!-- Different display formats based on field type -->
                <template v-if="field.fieldtype === 'Check'">
                  <div class="flex items-center">
                    <span 
                      class="relative flex items-center justify-center h-5 w-5 rounded-full border-2 transition-all"
                      :class="{
                        'border-blue-600 bg-blue-600': isChecked(row[field.fieldname]),
                        'border-gray-300': !isChecked(row[field.fieldname])
                      }"
                    >
                      <!-- Inner circle (visible when checked) -->
                      <span 
                        v-if="isChecked(row[field.fieldname])"
                        class="h-2.5 w-2.5 rounded-full bg-white"
                      ></span>
                    </span>
                  </div>
                </template>
                <template v-else-if="field.fieldtype === 'Link'">
                  <span v-if="row[field.fieldname]" class="text-blue-600">{{ getLinkDisplayValue(field, row[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'">
                  <span v-if="row[field.fieldname]">{{ formatDate(row[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Small Text'">
                  <div v-if="row[field.fieldname]" class="whitespace-pre-line max-h-20 overflow-y-auto">{{ row[field.fieldname] }}</div>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Color'">
                  <div v-if="row[field.fieldname]" class="flex items-center">
                    <div class="h-4 w-4 rounded mr-1" :style="{ backgroundColor: row[field.fieldname] }"></div>
                    <span>{{ row[field.fieldname] }}</span>
                  </div>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else-if="field.fieldtype === 'Currency' || field.fieldtype === 'Float'">
                  <span v-if="row[field.fieldname] !== undefined && row[field.fieldname] !== null && row[field.fieldname] !== ''" class="font-medium">{{ formatNumber(row[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
                <template v-else>
                  <span v-if="row[field.fieldname] !== undefined && row[field.fieldname] !== null && row[field.fieldname] !== ''">{{ row[field.fieldname] }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </template>
              </td>
              <td class="px-4 py-3 text-sm text-right whitespace-nowrap sticky right-0 bg-white" @click.stop>
                <div class="flex justify-end space-x-2">
                  <!-- <button @click="viewRow(index)" class="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button> -->
                  <!-- <button @click="editRow(index)" class="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button> -->
                  <button @click="deleteRow(index)" class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-5 0h10" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal for Add/Edit/View -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">
            <span v-if="modalMode === 'view'">View</span>
            <span v-else-if="modalMode === 'edit'">Edit</span>
            <span v-else>Add</span>
            {{ label }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <template v-for="field in visibleModalFields" :key="field.fieldname">
              <!-- Section Break -->
              <div v-if="field.fieldtype === 'Section Break'" class="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-2">
                <h4 v-if="field.label" class="text-base font-medium text-gray-900 mb-4">{{ field.label }}</h4>
              </div>

              <!-- Column Break -->
              <div v-else-if="field.fieldtype === 'Column Break'" class="hidden md:block">
                <!-- Column break marker -->
              </div>

              <!-- Regular fields -->
              <div v-else class="col-span-1" :class="{'md:col-span-2': field.fieldtype === 'Text Editor' || field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'}">
                <label class="block text-sm font-medium text-gray-700 mb-1 group relative">
                  {{ field.label }} <span v-if="field.reqd" class="text-red-500">*</span>
                  <span v-if="field.description" class="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="absolute hidden group-hover:block bg-black text-white text-xs rounded p-2 z-50 w-48 -mt-1 ml-4">
                      <span>{{ field.description }}</span>
                    </div>
                  </span>
                </label>

                <!-- Link fields -->
                <div v-if="field.fieldtype === 'Link'" class="relative">
                  <input
                    v-if="modalMode !== 'view' && !isFieldReadOnly(field)"
                    v-model="linkSearchQueries[field.fieldname]"
                    type="text"
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    :placeholder="`Search ${field.label}...`"
                    @focus="openLinkDropdown(field)"
                    @blur="closeLinkDropdownDelayed(field.fieldname)"
                  />
                  <div v-else class="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span v-if="currentRow[field.fieldname]">{{ getLinkDisplayValue(field, currentRow[field.fieldname]) }}</span>
                    <span v-else class="text-gray-400 italic">—</span>
                  </div>

                  <!-- Enhanced Dropdown with better display -->
                  <div 
                    v-if="activeLinkDropdown === field.fieldname && modalMode !== 'view' && !isFieldReadOnly(field)"
                    class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                  >
                    <div 
                      v-for="option in getFilteredOptionsForField(field)" 
                      :key="option.value"
                      class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                      @mousedown="selectLinkOption(field.fieldname, option.value, option.label)"
                    >
                      <span class="block truncate font-medium">{{ option.label }}</span>
                      <span v-if="option.description" class="block text-xs text-gray-500 truncate">{{ option.description }}</span>
                      <span 
                        v-if="currentRow[field.fieldname] === option.value" 
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

                <!-- Checkbox fields - Circular styling -->
                <div v-else-if="field.fieldtype === 'Check'" class="flex items-center">
                  <div v-if="modalMode !== 'view' && !isFieldReadOnly(field)" class="flex items-center">
                    <!-- Hidden actual checkbox -->
                    <input
                      v-model="currentRow[field.fieldname]"
                      type="checkbox"
                      class="absolute opacity-0 w-0 h-0"
                    />
                    <!-- Custom circular checkbox -->
                    <span 
                      @click="toggleCheckbox(field.fieldname)"
                      class="relative flex items-center justify-center h-5 w-5 rounded-full border-2 transition-all cursor-pointer"
                      :class="{
                        'border-blue-600 bg-blue-600': isChecked(currentRow[field.fieldname]),
                        'border-gray-300': !isChecked(currentRow[field.fieldname])
                      }"
                    >
                      <!-- Inner circle (visible when checked) -->
                      <span 
                        v-if="isChecked(currentRow[field.fieldname])"
                        class="h-2.5 w-2.5 rounded-full bg-white"
                      ></span>
                    </span>
                    <span class="ml-2 text-sm text-gray-700">{{ field.label }}</span>
                  </div>
                  <div v-else class="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center">
                    <span 
                      class="relative flex items-center justify-center h-5 w-5 rounded-full border-2 transition-all mr-2"
                      :class="{
                        'border-blue-600 bg-blue-600': isChecked(currentRow[field.fieldname]),
                        'border-gray-300': !isChecked(currentRow[field.fieldname])
                      }"
                    >
                      <!-- Inner circle (visible when checked) -->
                      <span 
                        v-if="isChecked(currentRow[field.fieldname])"
                        class="h-2.5 w-2.5 rounded-full bg-white"
                      ></span>
                    </span>
                    {{ isChecked(currentRow[field.fieldname]) ? 'Yes' : 'No' }}
                  </div>
                </div>

                <!-- Select fields -->
                <select 
                  v-else-if="field.fieldtype === 'Select' && modalMode !== 'view' && !isFieldReadOnly(field)"
                  v-model="currentRow[field.fieldname]"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select an option</option>
                  <option 
                    v-for="option in getSelectOptions(field)" 
                    :key="option" 
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
                <div v-else-if="field.fieldtype === 'Select'" class="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span v-if="currentRow[field.fieldname]">{{ currentRow[field.fieldname] }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>

                <!-- Date fields -->
                <input 
                  v-else-if="field.fieldtype === 'Date' && modalMode !== 'view' && !isFieldReadOnly(field)"
                  v-model="currentRow[field.fieldname]"
                  type="date"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div v-else-if="field.fieldtype === 'Date'" class="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span v-if="currentRow[field.fieldname]">{{ formatDate(currentRow[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>

                <!-- Datetime fields -->
                <input 
                  v-else-if="field.fieldtype === 'Datetime' && modalMode !== 'view' && !isFieldReadOnly(field)"
                  v-model="currentRow[field.fieldname]"
                  type="datetime-local"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div v-else-if="field.fieldtype === 'Datetime'" class="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span v-if="currentRow[field.fieldname]">{{ formatDate(currentRow[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>

                <!-- Color fields -->
                <div v-else-if="field.fieldtype === 'Color' && modalMode !== 'view' && !isFieldReadOnly(field)" class="flex items-center">
                  <input 
                    v-model="currentRow[field.fieldname]"
                    type="color"
                    class="h-8 w-8 rounded border-gray-300 mr-2"
                  />
                  <input 
                    v-model="currentRow[field.fieldname]"
                    type="text"
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="#RRGGBB"
                  />
                </div>
                <div v-else-if="field.fieldtype === 'Color'" class="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center">
                  <div v-if="currentRow[field.fieldname]" class="h-4 w-4 rounded mr-2" :style="{ backgroundColor: currentRow[field.fieldname] }"></div>
                  <span v-if="currentRow[field.fieldname]">{{ currentRow[field.fieldname] }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>

                <!-- Text area fields -->
                <textarea 
                  v-else-if="(field.fieldtype === 'Small Text' || field.fieldtype === 'Long Text') && modalMode !== 'view' && !isFieldReadOnly(field)"
                  v-model="currentRow[field.fieldname]"
                  :rows="field.fieldtype === 'Long Text' ? 4 : 2"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
                <div v-else-if="field.fieldtype === 'Small Text' || field.fieldtype === 'Long Text'" class="p-2 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-line">
                  <span v-if="currentRow[field.fieldname]">{{ currentRow[field.fieldname] }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>

                <!-- Number fields -->
                <input 
                  v-else-if="(field.fieldtype === 'Int' || field.fieldtype === 'Float' || field.fieldtype === 'Currency' || field.fieldtype === 'Percent') && modalMode !== 'view' && !isFieldReadOnly(field)"
                  v-model="currentRow[field.fieldname]"
                  :type="field.fieldtype === 'Int' ? 'number' : 'text'"
                  :step="field.fieldtype === 'Int' ? '1' : '0.01'"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div v-else-if="field.fieldtype === 'Int' || field.fieldtype === 'Float' || field.fieldtype === 'Currency' || field.fieldtype === 'Percent'" class="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span v-if="currentRow[field.fieldname] !== undefined && currentRow[field.fieldname] !== null && currentRow[field.fieldname] !== ''">{{ formatNumber(currentRow[field.fieldname]) }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>

                <!-- Default text input -->
                <input 
                  v-else-if="modalMode !== 'view' && !isFieldReadOnly(field)"
                  v-model="currentRow[field.fieldname]"
                  type="text"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div v-else class="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span v-if="currentRow[field.fieldname] !== undefined && currentRow[field.fieldname] !== null && currentRow[field.fieldname] !== ''">{{ currentRow[field.fieldname] }}</span>
                  <span v-else class="text-gray-400 italic">—</span>
                </div>
              </div>
            </template>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 text-right">
          <button 
            @click="closeModal" 
            class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
          >
            {{ modalMode === 'view' ? 'Close' : 'Cancel' }}
          </button>
          <button 
            v-if="modalMode === 'view'"
            @click="switchToEditMode" 
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Edit
          </button>
          <button 
            v-else-if="modalMode !== 'view'"
            @click="saveRow" 
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {{ modalMode === 'edit' ? 'Update' : 'Add' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue';
import { getHiddenFields } from '@/config/form-config';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  fieldname: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  childDoctype: {
    type: String,
    required: true,
  },
  parentDoctype: {
    type: String,
    required: true,
  },
  debug: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Inject formData from parent component if available
const formData = inject('formData', ref({}));

// State
const fields = ref([]);
const loading = ref(true);
const showModal = ref(false);
const currentRow = ref({});
const currentRowIndex = ref(-1);
const modalMode = ref('add');
const linkOptions = ref({});
const linkSearchQueries = ref({});
const activeLinkDropdown = ref(null);
const error = ref(null);
const fetchAttempts = ref(0);
const MAX_FETCH_ATTEMPTS = 3;

// Computed properties
const visibleFields = computed(() => {
  // Get the list of hidden fields from the config
  const hiddenFieldsList = getHiddenFields(props.childDoctype);
  
  return fields.value.filter(
    (field) =>
      !field.hidden &&
      field.fieldtype !== "Section Break" &&
      field.fieldtype !== "Column Break" &&
      field.fieldtype !== "HTML" &&
      field.fieldtype !== "Button" &&
      ![
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "docstatus",
        "idx",
        "parent",
        "parentfield",
        "parenttype",
      ].includes(field.fieldname) &&
      !hiddenFieldsList.includes(field.fieldname)
  );
});

const visibleModalFields = computed(() => {
  // Get the list of hidden fields from the config
  const hiddenFieldsList = getHiddenFields(props.childDoctype);
  
  return fields.value.filter(
    (field) =>
      ![
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "docstatus",
        "idx",
        "parent",
        "parentfield",
        "parenttype",
      ].includes(field.fieldname) &&
      !hiddenFieldsList.includes(field.fieldname)
  ).sort((a, b) => (a.idx || 0) - (b.idx || 0));
});

const listViewFields = computed(() => {
  const inListViewFields = visibleFields.value.filter(field => {
    return field.in_list_view === true || field.in_list_view === 1 || field.in_list_view === '1';
  });
  
  if (inListViewFields.length === 0) {
    return visibleFields.value.slice(0, 5);
  }
  
  return inListViewFields;
});

const allFields = computed(() => {
  return fields.value
    .filter(field => 
      !field.hidden &&
      ![
        "name",
        "owner",
        "creation",
        "modified",
        "modified_by",
        "docstatus",
        "idx",
        "parent",
        "parentfield",
        "parenttype",
      ].includes(field.fieldname)
    )
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));
});

// Methods
const fetchChildTableFields = async () => {
  try {
    fetchAttempts.value++;

    // Get standard fields
    const doctypeResponse = await fetch('/api/method/frappe.client.get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'DocType',
        name: props.childDoctype
      }),
      credentials: 'include'
    });
    
    const doctypeData = await doctypeResponse.json();
    const standardFields = doctypeData.message?.fields || [];

    // Get custom fields
    const customFieldsResponse = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Custom Field',
        filters: { dt: props.childDoctype },
        fields: ['*'],
        limit_page_length: 500
      }),
      credentials: 'include'
    });

    const customFieldsData = await customFieldsResponse.json();
    const customFields = customFieldsData.message || [];

    // Combine fields
    fields.value = [
      ...standardFields.map(f => ({ ...f, is_custom_field: false })),
      ...customFields.map(f => ({ 
        ...f, 
        is_custom_field: true,
        fieldname: f.fieldname,
        fieldtype: f.fieldtype,
        label: f.label,
        reqd: f.reqd === 1,
        options: f.options,
        description: f.description,
        idx: f.idx,
        hidden: f.hidden === 1,
        read_only: f.read_only === 1,
        in_list_view: f.in_list_view === 1,
        allow_in_quick_entry: f.allow_in_quick_entry === 1
      }))
    ];

    // Sort fields
    fields.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));

  } catch (error) {
    console.error('Error fetching fields:', error);
    
    if (fetchAttempts.value < MAX_FETCH_ATTEMPTS) {
      return await fetchChildTableFields();
    }
    
    error.value = `Could not fetch fields for ${props.childDoctype}`;
    
    // Fallback fields
    fields.value = [
      { fieldname: 'description', label: 'Description', fieldtype: 'Small Text' },
      { fieldname: 'qty', label: 'Quantity', fieldtype: 'Float' },
      { fieldname: 'rate', label: 'Rate', fieldtype: 'Currency' },
      { fieldname: 'amount', label: 'Amount', fieldtype: 'Currency' }
    ];
  }
};

const fetchLinkFieldOptions = async () => {
  const linkFields = fields.value.filter(field => field.fieldtype === 'Link');

  for (const field of linkFields) {
    try {
      if (!field.options) continue;
      
      // Get title field from meta
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
      
      // Get all fields from the doctype to check for common name fields
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
      
      // Determine additional fields to fetch based on common patterns
      const fieldsToFetch = new Set(["name", titleField, "creation"]);
      
      // Add common name fields if they exist
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
      
      // Add status field if it exists
      if (fieldNames.some(f => f.fieldname === "status")) {
        fieldsToFetch.add("status");
      }
      
      // Fetch the actual data
      const response = await fetch("/api/method/frappe.client.get_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctype: field.options,
          fields: Array.from(fieldsToFetch),
          limit_page_length: 0, // Get all records
          order_by: "creation desc" // Newest first
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Failed to fetch options for ${field.fieldname}`);

      const data = await response.json();

      if (data.message) {
        linkOptions.value[field.fieldname] = data.message.map(item => {
          // Determine the best label based on available fields
          let label = item[titleField] || item.name;
          
          // Try to build a better label if title field is just the name
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
      // Fallback to just name if anything fails
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
      linkOptions.value[field.fieldname] = fallbackData.message?.map(item => ({
        value: item.name,
        label: item.name
      })) || [];
    }
  }
};

// Helper function to check if a value is checked (handles different checkbox value formats)
const isChecked = (value) => {
  return value === true || value === 1 || value === '1' || value === 'Yes';
};

// Toggle checkbox value
const toggleCheckbox = (fieldname) => {
  currentRow.value[fieldname] = !isChecked(currentRow.value[fieldname]);
};

const getColumnStyle = (field) => {
  const style = {};
  if (field.fieldtype === 'Check') style.width = '80px';
  else if (field.fieldtype === 'Int' || field.fieldtype === 'Float') style.width = '100px';
  else if (field.fieldtype === 'Date') style.width = '120px';
  else if (field.fieldtype === 'Color') style.width = '120px';
  else if (field.fieldtype === 'Small Text') style.minWidth = '200px';
  return style;
};

const formatFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '';
  
  switch (field.fieldtype) {
    case 'Check':
      return isChecked(value) ? 'Yes' : 'No';
    case 'Link':
      return getLinkDisplayValue(field, value);
    case 'Date':
    case 'Datetime':
      return formatDate(value);
    case 'Currency':
    case 'Float':
    case 'Percent':
      return formatNumber(value);
    default:
      return value;
  }
};

const getLinkDisplayValue = (field, value) => {
  if (!value) return '';
  const options = linkOptions.value[field.fieldname] || [];
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

const getSelectOptions = (field) => {
  return field.options?.split('\n').filter(Boolean) || [];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatNumber = (value) => {
  try {
    return parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch {
    return value;
  }
};

// Check if a field should be read-only based on its properties
const isFieldReadOnly = (field) => {
  return props.isReadOnly || field.read_only === 1 || field.read_only === true || field.read_only === '1';
};

const openAddRowModal = (event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  currentRow.value = {};
  linkSearchQueries.value = {};

  // Initialize fields with default values
  fields.value.forEach(field => {
    if (field.fieldtype === 'Check') {
      currentRow.value[field.fieldname] = false;
    } else if (field.default) {
      currentRow.value[field.fieldname] = field.default;
    } else {
      currentRow.value[field.fieldname] = '';
    }
  });

  // Set parent fields
  currentRow.value.parentfield = props.fieldname;
  currentRow.value.parenttype = props.parentDoctype;
  delete currentRow.value.parent;
  delete currentRow.value.name;

  // Auto-set project from parent if available
  if (props.childDoctype === 'Timesheet Detail' && formData.value?.parent_project) {
    currentRow.value.project = formData.value.parent_project;
    
    // Also set the project in the search query for display
    const projectField = fields.value.find(f => f.fieldname === 'project');
    if (projectField) {
      linkSearchQueries.value.project = formData.value.parent_project_name || formData.value.parent_project;
    }
  }

  currentRowIndex.value = -1;
  modalMode.value = 'add';
  showModal.value = true;
};

const viewRow = (index) => {
  currentRow.value = JSON.parse(JSON.stringify(props.modelValue[index]));
  linkSearchQueries.value = {};

  fields.value.filter(f => f.fieldtype === 'Link').forEach(field => {
    const value = currentRow.value[field.fieldname];
    if (value) {
      const options = linkOptions.value[field.fieldname] || [];
      const option = options.find(opt => opt.value === value);
      linkSearchQueries.value[field.fieldname] = option ? option.label : value;
    }
  });

  currentRowIndex.value = index;
  modalMode.value = 'view';
  showModal.value = true;
};

const editRow = (index) => {
  currentRow.value = JSON.parse(JSON.stringify(props.modelValue[index]));
  linkSearchQueries.value = {};

  fields.value.filter(f => f.fieldtype === 'Link').forEach(field => {
    const value = currentRow.value[field.fieldname];
    if (value) {
      const options = linkOptions.value[field.fieldname] || [];
      const option = options.find(opt => opt.value === value);
      linkSearchQueries.value[field.fieldname] = option ? option.label : value;
    }
  });

  currentRowIndex.value = index;
  modalMode.value = 'edit';
  showModal.value = true;
};

const switchToEditMode = () => {
  modalMode.value = 'edit';
};

const saveRow = () => {
  // Validate required fields
  const missingFields = allFields.value.filter(field => 
    field.reqd && !currentRow.value[field.fieldname]
  );

  if (missingFields.length > 0) {
    alert(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
    return;
  }

  // For Timesheet Detail, ensure project matches parent
  if (props.childDoctype === 'Timesheet Detail' && formData.value?.parent_project) {
    if (currentRow.value.project && currentRow.value.project !== formData.value.parent_project) {
      alert(`Project must be same as the one set in the Timesheet: ${formData.value.parent_project}`);
      return;
    }
    currentRow.value.project = formData.value.parent_project;
  }

  // Convert numeric fields to numbers
  allFields.value.forEach(field => {
    if (['Int', 'Float', 'Currency', 'Percent'].includes(field.fieldtype) && 
        currentRow.value[field.fieldname] !== undefined && 
        currentRow.value[field.fieldname] !== null && 
        currentRow.value[field.fieldname] !== '') {
      // Convert string to number
      currentRow.value[field.fieldname] = parseFloat(currentRow.value[field.fieldname]);
    }
  });

  const newValue = [...(props.modelValue || [])];
  const rowToSave = { ...currentRow.value };
  delete rowToSave.parent;

  if (modalMode.value === 'edit') {
    newValue[currentRowIndex.value] = rowToSave;
  } else {
    newValue.push(rowToSave);
  }

  emit('update:modelValue', newValue);
  emit('change', newValue);
  closeModal();
};

const deleteRow = (index) => {
  if (confirm('Are you sure you want to delete this entry?')) {
    const newValue = [...props.modelValue];
    newValue.splice(index, 1);
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
};

const closeModal = () => {
  showModal.value = false;
  currentRow.value = {};
  currentRowIndex.value = -1;
  linkSearchQueries.value = {};
  activeLinkDropdown.value = null;
};

// Link field dropdown methods
const openLinkDropdown = (field) => {
  activeLinkDropdown.value = field.fieldname;
  
  // Initialize search query with current value's label if it exists
  if (formData.value[field.fieldname]) {
    const currentField = fields.value.find(f => f.fieldname === field.fieldname);
    if (currentField && currentField.fieldtype === 'Link') {
      const options = linkOptions.value[currentField.fieldname] || [];
      const option = options.find(opt => opt.value === formData.value[currentField.fieldname]);
      if (option) {
        linkSearchQueries.value[field.fieldname] = option.label;
      } else if (formData.value[field.fieldname]) {
        // If we have a value but no matching option, use the value as the search query
        linkSearchQueries.value[field.fieldname] = formData.value[field.fieldname];
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

const getFilteredOptionsForField = (field) => {
  const options = linkOptions.value[field.fieldname] || [];
  const searchQuery = linkSearchQueries.value[field.fieldname] || '';
  
  return searchQuery 
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;
};

const selectLinkOption = (fieldname, value, label) => {
  currentRow.value[fieldname] = value;
  linkSearchQueries.value[fieldname] = label;
  activeLinkDropdown.value = null;
};

const retryFetch = async () => {
  loading.value = true;
  error.value = null;
  fetchAttempts.value = 0;
  
  try {
    await fetchChildTableFields();
    await fetchLinkFieldOptions();
  } catch (err) {
    error.value = err.message || 'Failed to load child table fields';
  } finally {
    loading.value = false;
  }
};

// Initialize
onMounted(async () => {
  try {
    loading.value = true;
    await fetchChildTableFields();
    await fetchLinkFieldOptions();
  } catch (err) {
    error.value = err.message || 'Failed to load child table fields';
  } finally {
    loading.value = false;
  }
});

// Watch for changes in childDoctype
watch(() => props.childDoctype, async () => {
  loading.value = true;
  fields.value = [];
  linkOptions.value = {};
  fetchAttempts.value = 0;
  error.value = null;
  
  try {
    await fetchChildTableFields();
    await fetchLinkFieldOptions();
  } catch (error) {
    console.error('Error when childDoctype changed:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Custom checkbox styling */
.custom-checkbox {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  position: relative;
}

.custom-checkbox:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.custom-checkbox:checked::after {
  content: '';
  position: absolute;
  width: 0.625rem;
  height: 0.625rem;
  background-color: white;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.table-field-container {
  position: relative;
}

.table-field-error {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>