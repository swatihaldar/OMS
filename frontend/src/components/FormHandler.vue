<template>
  <div class="min-h-screen bg-gray-50" @click.stop>
    <!-- Fixed Header -->
    <div class="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b">
      <!-- Main Header -->
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center min-w-0 flex-1">
            <button @click.stop="handleCancel" class="mr-3 p-2 -ml-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-lg font-semibold text-gray-900 truncate">{{ headerTitle }}</h1>
          </div>
          
          <!-- Action buttons for edit mode -->
          <div v-if="isEditMode && recordId" class="flex items-center gap-2 ml-3">
            <!-- Delete Button -->
            <button 
              @click.stop="confirmDelete"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Connected Records Tabs - Only show in edit mode if there are connections -->
        <div v-if="isEditMode && recordId && hasSpecificLinkedRecords" class="mt-3">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 overflow-x-auto">
              <button
                @click.stop="activeLinkedTab = 'form'"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeLinkedTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                Form
              </button>
              <button
                v-for="(records, doctype) in specificLinkedRecords"
                :key="doctype"
                @click.stop="activeLinkedTab = doctype"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeLinkedTab === doctype
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

    <!-- Content Area with proper top padding to account for fixed header -->
    <div class="pt-16" :class="{ 'pt-28': isEditMode && recordId && hasSpecificLinkedRecords }">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Quick Entry Dialog -->
      <div v-if="showQuickEntryDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.stop>
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" @click.stop>
          <div class="p-4 border-b flex justify-between items-center">
            <h3 class="text-lg font-medium">Quick Add {{ doctype }}</h3>
            <button @click.stop="closeQuickEntryDialog" class="text-gray-500 hover:text-gray-700">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div class="p-4 overflow-y-auto max-h-[calc(90vh-140px)]" @click.stop>
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
              @click.stop
            />
          </div>
          <div class="p-4 border-t bg-gray-50">
            <div class="flex gap-3">
              <button
                type="button"
                @click.stop="openFullForm"
                class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Full Form
              </button>
              <button
                @click.stop="submitQuickEntryForm"
                :disabled="submitting"
                class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                <span v-if="submitting" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area with Tab-based Display -->
      <div v-else class="pb-32">
        <!-- Form Tab Content -->
        <div v-if="!isEditMode || !hasSpecificLinkedRecords || activeLinkedTab === 'form'">
          <!-- Main Form -->
          <div @click.stop>
            <FetchFieldProp
              ref="formViewRef"
              v-model="formData"
              :fields="processedFields"
              :field-options="fieldOptions"
              :is-read-only="false"
              @validate="validateForm"
              @submit="submitForm"
              @field-change="handleFieldChange"
              @delete="handleDelete"
              :submit-text="isEditMode ? 'Update' : 'Create'"
              :submitting-text="isEditMode ? 'Updating...' : 'Creating...'"
              :doctype="doctype"
              :docname="recordId"
              :mode="mode"
              :titleField="titleField"
              @open-image-viewer="openImageViewer"
              @navigate-to-link="navigateToLinkedRecord"
            />
          </div>

          <!-- Connected Records Section - Show in normal UI when in edit mode -->
          <div v-if="isEditMode && recordId && hasSpecificLinkedRecords" class="mx-4 mt-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm border">
              <div class="p-4 border-b">
                <h3 class="text-lg font-medium text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Connected Records
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  Records linked to this {{ doctype }}
                </p>
              </div>
              
              <div class="p-4">
                <div class="space-y-4">
                  <div v-for="(records, doctype) in specificLinkedRecords" :key="doctype" class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-700 mb-3 flex items-center">
                      <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      {{ doctype }} ({{ records.length }})
                    </h4>
                    <div class="space-y-2">
                      <div 
                        v-for="record in records.slice(0, 3)" 
                        :key="record.name" 
                        class="bg-white p-3 rounded border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        @click.stop="navigateToLinkedRecord(doctype, record.name)"
                      >
                        <div class="flex justify-between items-center">
                          <div class="flex items-center min-w-0 flex-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div class="min-w-0 flex-1">
                              <div class="font-medium text-gray-900 truncate">{{ record.name }}</div>
                              <div v-if="record.title || record.subject" class="text-sm text-gray-600 truncate">
                                {{ record.title || record.subject }}
                              </div>
                            </div>
                          </div>
                          <div class="flex items-center ml-2 flex-shrink-0">
                            <span v-if="record.status" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2"
                                  :class="getStatusClass(record.status)">
                              {{ record.status }}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Show more button if there are more than 3 records -->
                      <div v-if="records.length > 3" class="text-center">
                        <button 
                          @click.stop="activeLinkedTab = doctype"
                          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View all {{ records.length }} {{ doctype }} records →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Specific Linked Records Tab Content -->
        <div v-else-if="activeLinkedTab && activeLinkedTab !== 'form'" class="mx-4 mt-4">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b">
              <h3 class="text-lg font-medium text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connected {{ activeLinkedTab }} Records
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                {{ specificLinkedRecords[activeLinkedTab]?.length || 0 }} record(s) connected to this {{ doctype }}
              </p>
            </div>
            
            <div class="p-4">
              <div class="space-y-3">
                <div 
                  v-for="record in specificLinkedRecords[activeLinkedTab] || []" 
                  :key="record.name" 
                  class="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  @click.stop="navigateToLinkedRecord(activeLinkedTab, record.name)"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h4 class="font-medium text-gray-900 truncate">{{ record.name }}</h4>
                      </div>
                      
                      <div v-if="record.title || record.subject" class="text-sm text-gray-700 mb-2 truncate">
                        {{ record.title || record.subject }}
                      </div>
                      
                      <div class="flex items-center text-xs text-gray-500 space-x-4">
                        <span v-if="record.status" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              :class="getStatusClass(record.status)">
                          {{ record.status }}
                        </span>
                        <span>Created: {{ formatDate(record.creation, true) }}</span>
                        <span v-if="record.modified !== record.creation">
                          Modified: {{ formatDate(record.modified, true) }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="ml-4 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Empty state -->
              <div v-if="!specificLinkedRecords[activeLinkedTab] || specificLinkedRecords[activeLinkedTab].length === 0" 
                   class="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No connected {{ activeLinkedTab }} records found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Bottom Action Bar -->
    <div v-if="!loading && !showQuickEntryDialog && (!isEditMode || !hasSpecificLinkedRecords || activeLinkedTab === 'form')" 
         class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div class="p-4 pb-safe">
        <div class="flex gap-3 max-w-md mx-auto">
          <button
            type="button"
            @click.stop="handleCancel"
            class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center min-h-[48px] flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            @click.stop="handleExplicitSubmit"
            :disabled="submitting"
            class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 text-center min-h-[48px] flex items-center justify-center"
          >
            <span v-if="submitting" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEditMode ? 'Updating...' : 'Creating...' }}
            </span>
            <span v-else>{{ isEditMode ? 'Update' : 'Create' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.stop>
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
        <div class="flex items-center mb-4">
          <svg class="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900">Confirm Delete</h3>
        </div>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete this {{ doctype }}? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click.stop="showDeleteConfirm = false"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            @click.stop="handleDelete"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
          >
            <span v-if="deleting" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Enhanced Error Modal with Linked Records Display -->
    <div v-if="showErrorModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.stop>
      <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" @click.stop>
        <div class="flex items-center mb-4">
          <svg class="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 class="text-lg font-medium text-red-600">{{ errorModalTitle }}</h3>
        </div>
        
        <div v-if="isLinkExistsError" class="text-gray-700 mb-6">
          <p class="mb-3">
            Cannot delete this {{ doctype }} because it is connected to other records:
          </p>
          <div class="bg-gray-50 p-4 rounded-lg space-y-3">
            <div v-for="link in parsedLinkedRecords" :key="`${link.doctype}-${link.name}`" class="flex items-center justify-between bg-white p-3 rounded border">
              <div class="flex items-center min-w-0 flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-gray-900 truncate">{{ link.name }}</div>
                  <div class="text-sm text-gray-500">{{ link.doctype }}</div>
                </div>
              </div>
              <button 
                @click.stop="navigateToLinkedRecord(link.doctype, link.name)"
                class="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                title="View Record"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-600">
            To delete this {{ doctype }}, you must first remove or update these connected records.
          </p>
        </div>
        
        <div v-else class="text-gray-700 mb-6">
          <p>{{ errorModalMessage }}</p>
        </div>
        
        <div class="flex justify-end">
          <button
            @click.stop="showErrorModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Image Viewer Modal -->
    <div v-if="showImageViewer" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" @click.stop="closeImageViewer">
      <div class="relative max-w-full max-h-full">
        <button @click.stop="closeImageViewer" class="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img :src="currentImageUrl" alt="Full size image" class="max-w-full max-h-full object-contain rounded-lg" @click.stop />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import FetchFieldProp from './FetchFieldProp.vue';
import AssignmentDialog from './AssignmentDialog.vue';
import AssignmentList from './AssignmentList.vue';
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
  },
  mode: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit'].includes(value)
  }
});

const emit = defineEmits(['form-submitted', 'cancel', 'record-deleted', 'record-updated']);

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const submitting = ref(false);
const deleting = ref(false);
const formFields = ref([]);
const processedFields = ref([]);
const fieldOptions = ref({});
const formData = ref({});
const formViewRef = ref(null);
const alertMessage = ref('');
const alertType = ref('info');
const assignmentListRef = ref(null);
const showImageViewer = ref(false);
const currentImageUrl = ref('');
const record = ref(null);

// Specific linked records management
const specificLinkedRecords = ref({});
const activeLinkedTab = ref('form');

// Error handling
const showErrorModal = ref(false);
const errorModalTitle = ref('');
const errorModalMessage = ref('');
const isLinkExistsError = ref(false);
const parsedLinkedRecords = ref([]);

// Delete confirmation
const showDeleteConfirm = ref(false);

// Quick Entry
const showQuickEntryDialog = ref(false);
const quickEntryFields = ref([]);
const quickEntryData = ref({});
const quickEntryFormRef = ref(null);
const doctypeMeta = ref(null);
const userPermissions = ref([]);

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const isEditMode = computed(() => {
  return props.mode === 'edit' && !!props.recordId;
});

const headerTitle = computed(() => {
  if (props.mode === 'add') {
    return `New ${props.doctype}`;
  } else if (record.value) {
    return record.value.name || `${props.doctype} ${props.recordId}`;
  } else {
    return `${props.doctype} ${props.recordId}`;
  }
});

// Check if there are any specific linked records
const hasSpecificLinkedRecords = computed(() => {
  return Object.keys(specificLinkedRecords.value).length > 0 && 
         Object.values(specificLinkedRecords.value).some(records => records.length > 0);
});

// Check if the doctype has quick entry enabled
const hasQuickEntry = computed(() => {
  if (!doctypeMeta.value) return false;
  
  if (doctypeMeta.value.quick_entry === 1) return true;
  
  return formFields.value.some(field => {
    return field.allow_in_quick_entry === 1 || 
           field.allow_in_quick_entry === true || 
           field.allow_in_quick_entry === '1';
  });
});

const navigateToLinkedRecord = (doctype, docname) => {
  if (doctype && docname) {
    const route = getRouteFromDoctype(doctype);
    // Store current location for back navigation
    const currentPath = router.currentRoute.value.fullPath;
    sessionStorage.setItem('previousFormPath', currentPath);
    router.push(`/${route}/${docname}`);
  }
};

const getRouteFromDoctype = (doctype) => {
  return doctype.toLowerCase().replace(/\s+/g, '-');
};

const formatDate = (dateString, short = false) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (short) {
    return date.toLocaleDateString();
  }
  return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
};

const getStatusClass = (status) => {
  const statusClasses = {
    'Open': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Draft': 'bg-gray-100 text-gray-800',
    'Submitted': 'bg-blue-100 text-blue-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
};

// Enhanced error parsing for LinkExistsError
const parseLinkedRecordsFromError = (errorMessage) => {
  const linkedRecords = [];
  
  try {
    console.log('Parsing error message:', errorMessage);
    
    // Handle server messages format
    if (errorMessage.includes('_server_messages')) {
      const serverMsgMatch = errorMessage.match(/_server_messages['":\s]*\[([^\]]+)\]/);
      if (serverMsgMatch) {
        try {
          const messagesStr = serverMsgMatch[1];
          const cleanedStr = messagesStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          const messages = JSON.parse(`[${cleanedStr}]`);
          
          if (messages.length > 0) {
            const firstMessage = typeof messages[0] === 'string' ? JSON.parse(messages[0]) : messages[0];
            if (firstMessage.message) {
              errorMessage = firstMessage.message;
            }
          }
        } catch (e) {
          console.warn('Failed to parse server messages:', e);
        }
      }
    }

    // Extract linked records from various error patterns
    const patterns = [
      // Pattern: "Issue ISS-2025-00003 is linked with Task TASK-2025-00002"
      /(\w+)\s+([A-Z]+-\d+-\d+)\s+is linked with\s+(\w+)\s+([A-Z]+-\d+-\d+)/gi,
      // Pattern: "Cannot delete or cancel because Issue ISS-2025-00003 is linked with Task TASK-2025-00002"
      /Cannot delete.*?because\s+(\w+)\s+([A-Z]+-\d+-\d+)\s+is linked with\s+(\w+)\s+([A-Z]+-\d+-\d+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(errorMessage)) !== null) {
        if (pattern.source.includes('is linked with')) {
          // This pattern captures both source and target documents
          linkedRecords.push({
            doctype: match[3],
            name: match[4],
          });
        }
      }
    }

    // Remove duplicates
    const uniqueRecords = linkedRecords.filter((record, index, self) => 
      index === self.findIndex(r => r.doctype === record.doctype && r.name === record.name)
    );

    console.log('Parsed linked records:', uniqueRecords);
    return uniqueRecords;
  } catch (error) {
    console.error('Error parsing linked records from error message:', error);
    return [];
  }
};

// Fetch specific linked records for this document
const fetchSpecificLinkedRecords = async () => {
  if (!isEditMode.value || !props.recordId) {
    specificLinkedRecords.value = {};
    return;
  }
  
  try {
    console.log(`Fetching specific linked records for ${props.doctype} ${props.recordId}...`);
    
    // Get all link fields that reference this document
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'DocField',
        fields: ['parent', 'fieldname', 'options'],
        filters: {
          fieldtype: 'Link',
          options: props.doctype
        },
        limit_page_length: 0
      })
    });
    
    const fieldsData = await response.json();
    const linkFields = fieldsData.message || [];
    
    const linkedRecordsByDoctype = {};
    
    // For each doctype that has a link to this doctype
    for (const field of linkFields) {
      try {
        const linkedResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctype: field.parent,
            fields: ['name', 'creation', 'modified', 'title', 'subject', 'status'],
            filters: {
              [field.fieldname]: props.recordId
            },
            limit_page_length: 100
          })
        });
        
        const linkedData = await linkedResponse.json();
        if (linkedData.message && linkedData.message.length > 0) {
          if (!linkedRecordsByDoctype[field.parent]) {
            linkedRecordsByDoctype[field.parent] = [];
          }
          linkedRecordsByDoctype[field.parent].push(...linkedData.message);
        }
      } catch (error) {
        console.error(`Error fetching linked records for ${field.parent}:`, error);
      }
    }
    
    // Remove duplicates within each doctype
    Object.keys(linkedRecordsByDoctype).forEach(doctype => {
      const uniqueRecords = linkedRecordsByDoctype[doctype].filter((record, index, self) => 
        index === self.findIndex(r => r.name === record.name)
      );
      linkedRecordsByDoctype[doctype] = uniqueRecords;
    });
    
    specificLinkedRecords.value = linkedRecordsByDoctype;
    console.log('Fetched specific linked records:', linkedRecordsByDoctype);
    
  } catch (error) {
    console.error('Error fetching specific linked records:', error);
    specificLinkedRecords.value = {};
  }
};

// Methods
const fetchDoctypeFields = async () => {
  try {
    console.log(`Fetching doctype fields for ${props.doctype}...`);
    
    const result = await api.fetchDoctypeFields(props.doctype);
    
    if (result && result.fields) {
      doctypeMeta.value = result.meta || {};
      formFields.value = result.fields;
      console.log(`Successfully fetched ${result.fields.length} fields for ${props.doctype}`);
    } else {
      throw new Error('Invalid fields data in response');
    }
    
    processFields();
    prepareQuickEntryFields();
    await fetchUserPermissions();
    await applyUserPermissionsToFormData();
    
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
      ...field
    };
  });
};

// Prepare fields for quick entry dialog
const prepareQuickEntryFields = () => {
  if (!formFields.value || formFields.value.length === 0) return;

  const fieldsWithQuickEntry = formFields.value
    .filter(field => {
      const isQuickEntry = field.allow_in_quick_entry === 1 || 
                         field.allow_in_quick_entry === true || 
                         field.allow_in_quick_entry === '1';
      
      const isLayoutField = ['Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype);
      
      return isQuickEntry && !isLayoutField;
    })
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  if (fieldsWithQuickEntry.length > 0) {
    quickEntryFields.value = fieldsWithQuickEntry;
  } else if (doctypeMeta.value?.quick_entry === 1) {
    const mandatoryFields = formFields.value.filter(field => {
      const isMandatory = field.reqd === 1 || field.reqd === true || field.reqd === '1';
      const isLayoutField = ['Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype);
      const isLargeField = ['Long Text', 'Text Editor', 'Table'].includes(field.fieldtype);
      
      return isMandatory && !isLayoutField && !isLargeField && !field.hidden;
    });
    
    quickEntryFields.value = mandatoryFields;
    
    if (quickEntryFields.value.length < 3) {
      const commonFields = formFields.value.filter(field => {
        const isCommonField = ['Data', 'Link', 'Select', 'Date', 'Check'].includes(field.fieldtype);
        const isExcludedType = ['Long Text', 'Text Editor', 'Table', 'Section Break', 'Column Break', 'HTML', 'Button'].includes(field.fieldtype);
        
        return isCommonField && !isExcludedType && !field.hidden && 
               !quickEntryFields.value.some(qf => qf.fieldname === field.fieldname);
      }).slice(0, 5 - quickEntryFields.value.length);
      
      quickEntryFields.value = [...quickEntryFields.value, ...commonFields];
    }
  } else {
    quickEntryFields.value = [];
  }

  quickEntryData.value = {};
  quickEntryFields.value.forEach(field => {
    quickEntryData.value[field.fieldname] = field.default || '';
  });
};

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

const fetchRecord = async () => {
  try {
    loading.value = true;
    
    const data = await api.fetchDocument(props.doctype, props.recordId);
    
    record.value = data;
    formData.value = { ...data, doctype: props.doctype };
    console.log('Loaded record data:', formData.value);
    
    // Ensure link fields are properly initialized
    if (formViewRef.value) {
      await formViewRef.value.fetchLinkFieldOptions();
      formViewRef.value.initializeLinkSearchQueries();
    }
    
    await fetchSpecificLinkedRecords();
  } catch (err) {
    console.error(`Error fetching ${props.doctype}:`, err);
    alertMessage.value = `Failed to load ${props.doctype}`;
    alertType.value = 'error';
  } finally {
    loading.value = false;
  }
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

// FIXED: Field change handler that doesn't trigger auto-save
const handleFieldChange = ({ fieldname, value, file }) => {
  console.log(`Field ${fieldname} changed:`, value, file);
  // Only log the change, don't trigger any save operations
};

const validateForm = () => {
  console.log('Validating form...');
};

const validateQuickEntryForm = () => {
  // Validation is handled by the FetchFieldProp component
};

const submitForm = async ({ formData: submittedData, files, tempFileUrls, attachFilesToDoc }) => {
  try {
    submitting.value = true;
    console.log(`Submitting ${props.doctype} with data:`, submittedData);
    
    const submissionData = { ...submittedData, doctype: props.doctype };
    
    const savedDoc = await saveDocumentWithPermissionCheck(submissionData, !isEditMode.value);
    
    if (attachFilesToDoc && typeof attachFilesToDoc === 'function') {
      await attachFilesToDoc(savedDoc.name);
    }
    
    alertMessage.value = `${props.doctype} ${isEditMode.value ? 'updated' : 'created'} successfully!`;
    alertType.value = 'success';
    
    if (showQuickEntryDialog.value) {
      showQuickEntryDialog.value = false;
    }
    
    if (isEditMode.value) {
      emit('record-updated', savedDoc);
      await fetchRecord();
    } else {
      emit('form-submitted', savedDoc);
      setTimeout(() => {
        router.push(`/${doctypeRoute.value}/${savedDoc.name}`);
      }, 1500);
    }
    
  } catch (error) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'creating'} ${props.doctype}:`, error);
    
    showUserFriendlyError('Save Error', `Unable to ${isEditMode.value ? 'update' : 'create'} ${props.doctype}. ${error.message || 'Please try again.'}`);
    
    if (formViewRef.value) {
      formViewRef.value.setErrorMessage(error.message || `Error ${isEditMode.value ? 'updating' : 'creating'} ${props.doctype}`);
    }
  } finally {
    // Always reset submitting state
    submitting.value = false;
  }
};

const saveDocumentWithPermissionCheck = async (doc, isNew = false) => {
  try {
    // Only proceed if we're explicitly submitting the form
    if (!submitting.value) {
      console.log('Prevented auto-save attempt - submitting flag is false');
      return;
    }
    
    const method = isNew ? 'frappe.client.insert' : 'frappe.client.save';
    
    const response = await fetch(`/api/method/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.exception === 'frappe.exceptions.PermissionError' || data.message?.includes('permission')) {
        throw new Error('You do not have permission to save this document');
      }
      throw new Error(data.message || data._error_message || 'Failed to save document');
    }
    
    if (data.message) {
      return data.message;
    }
    
    throw new Error('Failed to save document');
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
};

const submitQuickEntryForm = async () => {
  if (quickEntryFormRef.value) {
    quickEntryFormRef.value.handleSubmit();
  }
};

const openFullForm = () => {
  Object.assign(formData.value, quickEntryData.value);
  closeQuickEntryDialog();
};

const closeQuickEntryDialog = () => {
  showQuickEntryDialog.value = false;
};

// FIXED: Explicit submit handler that only runs when user clicks submit button
const handleExplicitSubmit = async () => {
  console.log('EXPLICIT SUBMIT: User clicked submit button');
  
  // Set submitting flag to allow form submission
  submitting.value = true;
  
  try {
    if (formViewRef.value) {
      await formViewRef.value.handleSubmit();
    }
  } catch (error) {
    console.error('Error during explicit form submission:', error);
    submitting.value = false;
  }
  // Note: submitting.value is reset in submitForm function
};

const confirmDelete = () => {
  showDeleteConfirm.value = true;
};

// Enhanced delete handling with proper success/error detection
const handleDelete = async () => {
  try {
    deleting.value = true;
    showDeleteConfirm.value = false;
    
    const result = await deleteDocumentImproved(props.doctype, props.recordId);
    
    if (result.success) {
      alertMessage.value = `${props.doctype} deleted successfully!`;
      alertType.value = 'success';
      
      emit('record-deleted', props.recordId);
      
      setTimeout(() => {
        router.push(`/${doctypeRoute.value}`);
      }, 1500);
    } else {
      throw new Error(result.error || 'Failed to delete document');
    }
    
  } catch (error) {
    console.error(`Error deleting ${props.doctype}:`, error);
    
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('linked') || errorMessage.includes('Cannot delete') || errorMessage.includes('LinkExistsError')) {
      isLinkExistsError.value = true;
      parsedLinkedRecords.value = parseLinkedRecordsFromError(errorMessage);
      
      showUserFriendlyError(
        'Cannot Delete',
        errorMessage,
        true
      );
    } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
      showUserFriendlyError(
        'Permission Denied',
        `You don't have permission to delete this ${props.doctype}.`
      );
    } else {
      showUserFriendlyError(
        'Delete Error',
        `Unable to delete ${props.doctype}. ${errorMessage}`
      );
    }
  } finally {
    deleting.value = false;
  }
};

// Enhanced delete function that properly handles success/error responses
const deleteDocumentImproved = async (doctype, name) => {
  try {
    const response = await fetch("/api/method/frappe.client.delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctype: doctype,
        name: name,
      }),
    });

    const data = await response.json();
    
    // Check for successful response
    if (response.ok) {
      // Check if the response indicates success
      if (data.message === "ok" || data.message === null || data.message === undefined) {
        return { success: true };
      }
    }
    
    // Handle error responses
    let errorMessage = 'Failed to delete document';
    
    if (data.exc_type || data.exception) {
      // Handle Frappe exceptions
      if (data.exc_type === 'LinkExistsError' || (data.exception && data.exception.includes('LinkExistsError'))) {
        errorMessage = data.exception || data.message || 'Document is linked to other records';
      } else if (data._server_messages) {
        try {
          const messages = JSON.parse(data._server_messages);
          if (Array.isArray(messages) && messages.length > 0) {
            const firstMessage = JSON.parse(messages[0]);
            errorMessage = firstMessage.message || errorMessage;
          }
        } catch (e) {
          errorMessage = data._server_messages;
        }
      } else if (data.exception) {
        errorMessage = data.exception;
      } else if (data.message) {
        errorMessage = data.message;
      }
    }
    
    return { success: false, error: errorMessage };
    
  } catch (error) {
    console.error(`Error deleting document ${doctype} ${name}:`, error);
    return { success: false, error: error.message || 'Network error occurred' };
  }
};

const showUserFriendlyError = (title, message, isLinkError = false) => {
  errorModalTitle.value = title;
  errorModalMessage.value = message;
  isLinkExistsError.value = isLinkError;
  showErrorModal.value = true;
};

const handleCancel = () => {
  // Check if there's a previous path stored for back navigation
  const previousPath = sessionStorage.getItem('previousFormPath');
  if (previousPath) {
    sessionStorage.removeItem('previousFormPath');
    router.push(previousPath);
  } else {
    router.push(`/${doctypeRoute.value}`);
  }
  emit('cancel');
};

const handleAssignmentAdded = (assignment) => {
  if (assignmentListRef.value) {
    assignmentListRef.value.addAssignment(assignment);
  }
  alertMessage.value = 'Assignment added successfully!';
  alertType.value = 'success';
  setTimeout(() => {
    alertMessage.value = '';
  }, 3000);
};

const handleAssignmentRemoved = (todoName) => {
  alertMessage.value = 'Assignment removed successfully!';
  alertType.value = 'success';
  setTimeout(() => {
    alertMessage.value = '';
  }, 3000);
};

const handleAssignmentError = (error) => {
  showUserFriendlyError('Assignment Error', error);
};

const openImageViewer = (imageUrl) => {
  currentImageUrl.value = imageUrl;
  showImageViewer.value = true;
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  currentImageUrl.value = '';
};

// Initialize component
onMounted(async () => {
  console.log(`FormHandler component mounted for ${props.doctype} in ${props.mode} mode`);
  
  try {
    await fetchDoctypeFields();
    
    if (isEditMode.value) {
      await fetchRecord();
    } else {
      initializeFormData();
      
      try {
        const currentUserEmail = await api.getCurrentUser();
        if (currentUserEmail && processedFields.value.find(f => f.fieldname === 'raised_by')) {
          formData.value.raised_by = currentUserEmail;
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
      specificLinkedRecords.value = {};
      activeLinkedTab.value = 'form';
      
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
      specificLinkedRecords.value = {};
      activeLinkedTab.value = 'form';
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

defineExpose({
  saveDocumentWithPermissionCheck,
  handleExplicitSubmit,
  formViewRef,
  submitting
});
</script>

<style scoped>
/* Mobile-first responsive design */
@media (min-width: 768px) {
  .min-h-screen {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Fixed header positioning */
.fixed {
  position: fixed;
}

/* Proper spacing for fixed header */
.pt-16 {
  padding-top: 4rem;
}

.pt-28 {
  padding-top: 7rem;
}

/* Consistent spacing for different modes */
.pb-32 {
  padding-bottom: 8rem;
}

/* Safe area for devices with notches */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Smooth transitions */
* {
  transition: all 0.2s ease;
}

/* Better touch targets for mobile */
button {
  min-height: 44px;
  min-width: 44px;
}

/* Improved focus states */
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Prevent button content from wrapping */
button {
  white-space: nowrap;
}

/* Responsive text sizing */
@media (max-width: 640px) {
  h1 {
    font-size: 1rem;
  }
  
  .text-lg {
    font-size: 1rem;
  }
}

/* Ensure modals are above everything */
.z-50 {
  z-index: 50;
}

/* Better modal backdrop */
.bg-black.bg-opacity-50 {
  backdrop-filter: blur(2px);
}

/* Tab styling */
.nav-tabs {
  border-bottom: 1px solid #e5e7eb;
}

.nav-tab {
  padding: 0.5rem 1rem;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  color: #374151;
  border-bottom-color: #d1d5db;
}

.nav-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* Scrollable tabs on mobile */
.nav-tabs {
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.nav-tabs::-webkit-scrollbar {
  display: none;
}

/* Prevent content from scrolling under fixed header */
body {
  overflow-x: hidden;
}

/* Ensure proper z-index stacking */
.z-20 {
  z-index: 20;
}

.z-30 {
  z-index: 30;
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
