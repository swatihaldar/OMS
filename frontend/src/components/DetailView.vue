<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8 bg-white">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-4 bg-white"
    >
      <p>{{ error }}</p>
      <button
        @click="$router.back()"
        class="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Go Back
      </button>
    </div>

    <!-- Detail View -->
    <div v-else class="bg-white">
      <!-- Header with Actions -->
      <template v-if="!isEditing">
        <div class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
    <div class="px-4 py-3 max-w-3xl mx-auto flex items-center justify-between">
      <div class="flex items-center">
        <button @click="$router.back()" class="mr-3 text-blue-600 pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl font-semibold text-gray-900">{{ recordTitle }}</h1>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          v-if="canEdit"
          @click="startEditing"
          class="flex items-center px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full border border-blue-600 hover:bg-blue-50 transition-colors"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        
        <button
          v-if="canDelete"
          @click="confirmDelete"
          class="p-2 bg-red-50 text-red-500 rounded-full border border-red-500 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-5 0h10" />
          </svg>
          <!-- Delete -->
        </button>
      </div>
    </div>
  </div>
</template>
      

      <!-- Mobile Tabs -->
      <div v-if="!isEditing" class="md:hidden border-b border-gray-200 mt-16">
        <div class="flex overflow-x-auto">
          <button
            v-for="(section, index) in nonEmptySections"
            :key="index"
            @click="activeTab = index"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap"
            :class="
              activeTab === index
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            "
          >
            {{ section.label || `Section ${index + 1}` }}
          </button>
          <button
            v-if="hasLinkedRecords"
            @click="activeTab = nonEmptySections.length"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap"
            :class="
              activeTab === nonEmptySections.length
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            "
          >
            Linked
          </button>
          <button
            @click="activeTab = nonEmptySections.length + (hasLinkedRecords ? 1 : 0)"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap"
            :class="
              activeTab === nonEmptySections.length + (hasLinkedRecords ? 1 : 0)
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            "
          >
            Metadata
          </button>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-if="isEditing" class="p-0 max-w-3xl mx-auto">
        <FormHandler 
          :doctype="doctype"
          :recordId="recordId"
          :defaultValues="record"
          :titleField="titleField"
          @form-submitted="handleFormSubmitted"
        />
      </div>

      <!-- View Mode -->
      <div v-else>
        <!-- Desktop View: All sections -->
        <div class="hidden md:block max-w-3xl mx-auto p-6">
          <div class="space-y-6">
            <!-- Assignment Information -->
            <div class="bg-blue-50 p-4 rounded-lg mb-6">
              <div class="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mr-2">Assigned To</h3>
                <AssignmentDialog 
                  :doctype="doctype" 
                  :docname="recordId" 
                  @assignment-added="handleAssignmentAdded" 
                  @assignment-error="handleAssignmentError"
                />
              </div>
              
              <AssignmentList 
                :doctype="doctype" 
                :docname="recordId" 
                @assignment-removed="handleAssignmentRemoved" 
                @assignment-error="handleAssignmentError"
              />
            </div>
            
            <template v-for="(section, sectionIndex) in nonEmptySections" :key="sectionIndex">
              <div :class="{ 'border-t border-gray-200 pt-6': sectionIndex > 0 }">
                <h3 v-if="section.label" class="text-lg font-medium text-gray-900 mb-4">
                  {{ section.label }}
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <template v-for="(column, columnIndex) in section.columns" :key="columnIndex">
                    <div class="space-y-4">
                      <template v-for="field in column" :key="field.fieldname">
                        <div
                          v-if="shouldDisplayField(field) && !isMetadataField(field.fieldname)"
                          class="mb-6"
                        >
                          <div class="text-sm font-medium text-gray-500 mb-1">
                            {{ field.label }}
                          </div>

                          <!-- Link fields -->
                          <div
                            v-if="field.fieldtype === 'Link'"
                            class="text-blue-800 font-medium"
                          >
                            {{ getFieldDisplayValue(field) }}
                          </div>

                          <!-- Select fields -->
                          <div
                            v-else-if="field.fieldtype === 'Select'"
                            class="text-blue-800 font-medium"
                          >
                            {{ record[field.fieldname] }}
                          </div>

                          <!-- Text Editor fields -->
                          <div
                            v-else-if="field.fieldtype === 'Text Editor'"
                            class="prose max-w-none bg-gray-50 p-3 rounded-lg"
                          >
                            <div v-html="record[field.fieldname]"></div>
                          </div>

                          <!-- Checkbox fields -->
                          <div
                            v-else-if="field.fieldtype === 'Check'"
                            class="text-blue-800 font-medium"
                          >
                            <span
                              v-if="record[field.fieldname]"
                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              <svg
                                class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Yes
                            </span>
                            <span
                              v-else
                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              <svg
                                class="-ml-0.5 mr-1.5 h-2 w-2 text-red-400"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              No
                            </span>
                          </div>

                          <!-- Image fields -->
                          <div
                            v-else-if="
                              field.fieldtype === 'Attach Image' &&
                              record[field.fieldname]
                            "
                            class="mt-1"
                          >
                            <img
                              :src="record[field.fieldname]"
                              alt="Attached Image"
                              class="h-48 w-auto rounded-lg object-cover cursor-pointer"
                              @click="openImageModal(record[field.fieldname])"
                            />
                          </div>

                          <!-- Attachment fields -->
                          <div
                            v-else-if="
                              field.fieldtype === 'Attach' &&
                              record[field.fieldname]
                            "
                            class="mt-1 flex items-center"
                          >
                            <a
                              :href="record[field.fieldname]"
                              target="_blank"
                              class="text-blue-800 hover:underline flex items-center font-medium"
                            >
                              <svg
                                class="h-5 w-5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              Download Attachment
                            </a>
                          </div>

                          <!-- Date fields -->
                          <div
                            v-else-if="
                              field.fieldtype === 'Date' ||
                              field.fieldtype === 'Datetime'
                            "
                            class="text-blue-800 font-medium"
                          >
                            {{ formatDate(record[field.fieldname]) }}
                          </div>

                          <!-- Color fields -->
                          <div
                            v-else-if="field.fieldtype === 'Color' && record[field.fieldname]"
                            class="flex items-center"
                          >
                            <div 
                              class="h-5 w-5 rounded mr-2" 
                              :style="{ backgroundColor: record[field.fieldname] }"
                            ></div>
                            <span class="text-blue-800 font-medium">{{ record[field.fieldname] }}</span>
                          </div>

                          <!-- Small Text fields -->
                          <div
                            v-else-if="field.fieldtype === 'Small Text'"
                            class="text-blue-800 font-medium whitespace-pre-wrap bg-gray-50 p-2 rounded-md text-sm"
                          >
                            {{ record[field.fieldname] }}
                          </div>

                          <!-- Table fields -->
                          <div v-else-if="field.fieldtype === 'Table'">
                            <EnhancedTableView
                              :rows="record[field.fieldname] || []"
                              :fields="getVisibleChildTableFields(field)"
                              :label="field.label"
                              :isCollapsible="true"
                            />
                          </div>


                          <div
                            v-else-if="field.fieldtype === 'Table' && (!record[field.fieldname] || record[field.fieldname].length === 0)"
                            class="text-gray-500 italic"
                          >
                            No items
                          </div>

                          <!-- Default field display -->
                          <div v-else class="text-blue-800 font-medium">
                            {{ record[field.fieldname] }}
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <!-- Linked Records Section - Only shown if there are linked records -->
            <div v-if="hasLinkedRecords" class="border-t border-gray-200 pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Linked Records
                </div>
              </h3>
              <div class="space-y-4">
                <div v-for="(group, doctype) in groupedLinkedRecords" :key="doctype" class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="font-medium text-gray-700 mb-2 flex items-center">
                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    {{ doctype }} ({{ group.length }})
                  </h4>
                  <div class="space-y-2">
                    <div v-for="record in group" :key="record.name" class="bg-white p-3 rounded border border-gray-200 hover:shadow-md transition-shadow">
                      <a 
                        :href="`/${getRouteFromDoctype(doctype)}/${record.name}`"
                        class="flex justify-between items-center text-blue-800 hover:text-blue-900 font-medium"
                        @click.prevent="navigateToLinkedRecord(doctype, record.name)"
                      >
                        <div class="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{{ record.title || record.name }}</span>
                        </div>
                        <div class="flex items-center">
                          <span class="hidden md:inline mr-2 text-xs text-gray-500">{{ formatDate(record.modified || record.creation).split(',')[0] }}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metadata Section -->
            <div class="border-t border-gray-200 pt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Metadata
                </div>
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="text-sm font-medium text-gray-500 mb-1">Created By</div>
                  <div class="text-blue-800 font-medium">{{ record.owner || 'Unknown' }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500 mb-1">Created On</div>
                  <div class="text-blue-800 font-medium">{{ formatDate(record.creation) }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500 mb-1">Last Modified By</div>
                  <div class="text-blue-800 font-medium">{{ record.modified_by || 'Unknown' }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-500 mb-1">Last Modified On</div>
                  <div class="text-blue-800 font-medium">{{ formatDate(record.modified) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile view: Active tab section -->
        <div class="md:hidden p-4">
          <!-- Assignment Information for mobile -->
          <div v-if="activeTab === 0" class="bg-blue-50 px-3 py-2 rounded-lg mb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 class="text-sm font-medium text-gray-900 whitespace-nowrap">Assigned To</h3>
                <AssignmentList 
                  class="flex-shrink-0"
                  :doctype="doctype" 
                  :docname="recordId" 
                  @assignment-removed="handleAssignmentRemoved" 
                  @assignment-error="handleAssignmentError"
                />
              </div>
              <AssignmentDialog 
                class="flex-shrink-0"
                :doctype="doctype" 
                :docname="recordId" 
                @assignment-added="handleAssignmentAdded" 
                @assignment-error="handleAssignmentError"
              />
            </div>
          </div>
          
          <!-- Section content for active tab -->
          <div v-if="activeTab < nonEmptySections.length">
            <div class="space-y-4">
              <template v-for="column in nonEmptySections[activeTab].columns" :key="column">
                <template v-for="field in column" :key="field.fieldname">
                  <div
                    v-if="shouldDisplayField(field) && !isMetadataField(field.fieldname)"
                    class="mb-4 border-b pb-4"
                  >
                    <div class="text-sm font-medium text-gray-500 mb-1">
                      {{ field.label }}
                    </div>

                    <!-- Link fields -->
                    <div
                      v-if="field.fieldtype === 'Link'"
                      class="text-blue-800 font-medium"
                    >
                      {{ getFieldDisplayValue(field) }}
                    </div>

                    <!-- Select fields -->
                    <div
                      v-else-if="field.fieldtype === 'Select'"
                      class="text-blue-800 font-medium"
                    >
                      {{ record[field.fieldname] }}
                    </div>

                    <!-- Text Editor fields -->
                    <div
                      v-else-if="field.fieldtype === 'Text Editor'"
                      class="prose max-w-none bg-gray-50 p-3 rounded-lg"
                    >
                      <div v-html="record[field.fieldname]"></div>
                    </div>

                    <!-- Checkbox fields -->
                    <div
                      v-else-if="field.fieldtype === 'Check'"
                      class="text-blue-800 font-medium"
                    >
                      <span
                        v-if="record[field.fieldname]"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <svg
                          class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 8 8"
                        >
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Yes
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        <svg
                          class="-ml-0.5 mr-1.5 h-2 w-2 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 8 8"
                        >
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        No
                      </span>
                    </div>

                    <!-- Image fields -->
                    <div
                      v-else-if="
                        field.fieldtype === 'Attach Image' &&
                        record[field.fieldname]
                      "
                      class="mt-1"
                    >
                      <img
                        :src="record[field.fieldname]"
                        alt="Attached Image"
                        class="h-48 w-auto rounded-lg object-cover cursor-pointer"
                        @click="openImageModal(record[field.fieldname])"
                      />
                    </div>

                    <!-- Attachment fields -->
                    <div
                      v-else-if="
                        field.fieldtype === 'Attach' &&
                        record[field.fieldname]
                      "
                      class="mt-1 flex items-center"
                    >
                      <a
                        :href="record[field.fieldname]"
                        target="_blank"
                        class="text-blue-800 hover:underline flex items-center font-medium"
                      >
                        <svg
                          class="h-5 w-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Download Attachment
                      </a>
                    </div>

                    <!-- Date fields -->
                    <div
                      v-else-if="
                        field.fieldtype === 'Date' ||
                        field.fieldtype === 'Datetime'
                      "
                      class="text-blue-800 font-medium"
                    >
                      {{ formatDate(record[field.fieldname]) }}
                    </div>

                    <!-- Color fields -->
                    <div
                      v-else-if="field.fieldtype === 'Color' && record[field.fieldname]"
                      class="flex items-center"
                    >
                      <div 
                        class="h-5 w-5 rounded mr-2" 
                        :style="{ backgroundColor: record[field.fieldname] }"
                      ></div>
                      <span class="text-blue-800 font-medium">{{ record[field.fieldname] }}</span>
                    </div>

                    <!-- Small Text fields -->
                    <div
                      v-else-if="field.fieldtype === 'Small Text'"
                      class="text-blue-800 font-medium whitespace-pre-wrap bg-gray-50 p-2 rounded-md text-sm"
                    >
                      {{ record[field.fieldname] }}
                    </div>

                    <!-- Table fields -->
                    <div v-else-if="field.fieldtype === 'Table'">
  <EnhancedTableView
    :rows="record[field.fieldname] || []"
    :fields="getChildTableFields(field)"
    :label="field.label"
    :isCollapsible="true"
  />
</div>

                    <div
                      v-else-if="field.fieldtype === 'Table' && (!record[field.fieldname] || record[field.fieldname].length === 0)"
                      class="text-gray-500 italic"
                    >
                      No items
                    </div>

                    <!-- Default field display -->
                    <div v-else class="text-blue-800 font-medium">
                      {{ record[field.fieldname] }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <!-- Linked Records tab for mobile view -->
          <div
            v-if="activeTab === nonEmptySections.length && hasLinkedRecords"
            class="space-y-4"
          >
            <div v-for="(group, doctype) in groupedLinkedRecords" :key="doctype" class="mb-6">
              <div class="text-sm font-medium text-gray-700 mb-2">{{ doctype }} ({{ group.length }})</div>
              <div class="space-y-3">
                <div v-for="record in group" :key="record.name" class="border rounded-lg p-3">
                  <a 
                    :href="`/${getRouteFromDoctype(doctype)}/${record.name}`" 
                    class="text-blue-800 hover:underline font-medium"
                    @click.prevent="navigateToLinkedRecord(doctype, record.name)"
                  >
                    {{ record.title || record.name }}
                  </a>
                  <div class="text-sm text-gray-500 mt-1">
                    {{ formatDate(record.modified || record.creation) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata tab for mobile view -->
          <div
            v-if="activeTab === nonEmptySections.length + (hasLinkedRecords ? 1 : 0)"
            class="space-y-4"
          >
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">
                Created By
              </div>
              <div class="text-blue-800 font-medium">{{ record.owner || 'Unknown' }}</div>
            </div>
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">
                Created On
              </div>
              <div class="text-blue-800 font-medium">{{ formatDate(record.creation) }}</div>
            </div>
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">
                Last Modified By
              </div>
              <div class="text-blue-800 font-medium">
                {{ record.modified_by || 'Unknown' }}
              </div>
            </div>
            <div class="mb-4 border-b pb-4">
              <div class="text-sm font-medium text-gray-500 mb-1">
                Last Modified On
              </div>
              <div class="text-blue-800 font-medium">{{ formatDate(record.modified) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div 
      v-if="showImageModal" 
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="showImageModal = false"
    >
      <div class="max-w-4xl max-h-screen p-4">
        <img 
          :src="modalImage" 
          alt="Full size image" 
          class="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete this {{ doctype }}? This action cannot
          be undone.
        </p>
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

    <!-- Error Modal with Formatted Error Message -->
    <div
      v-if="showPermissionError"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-red-600 mb-4">Error</h3>
        <div v-if="isLinkExistsError" class="text-gray-700 mb-6">
          <p class="mb-2">
            Cannot delete this {{ doctype }} because it is linked to other
            records:
          </p>
          <div
            class="bg-gray-100 p-3 rounded-lg text-sm"
            v-html="formattedErrorMessage"
          ></div>
        </div>
        <div v-else class="text-gray-700 mb-6">
          <p>{{ permissionErrorMessage }}</p>
        </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDocTypePermissions, getCurrentUser } from '../utils/permissions'
import { shouldHideViewField } from '../config/field-config'
import FormHandler from './FormHandler.vue'
import AssignmentDialog from './AssignmentDialog.vue'
import AssignmentList from './AssignmentList.vue'
import EnhancedTableView from './EnhancedTableView.vue'

const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  recordId: {
    type: String,
    required: true,
  },
  titleField: {
    type: String,
    default: 'subject',
  },
  detailFields: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['record-deleted', 'record-updated'])

const router = useRouter()
const record = ref({})
const editedRecord = ref({})
const formFields = ref([])
const loading = ref(true)
const error = ref(null)
const linkFieldOptions = ref({})
const showDeleteConfirm = ref(false)
const clientScripts = ref([])
const eventHandlers = ref({})
const userPermissions = ref({})
const isEditing = ref(false)
const isSaving = ref(false)
const canEdit = ref(false)
const canDelete = ref(false)
const currentUser = ref(null)
const linkedRecords = ref([])
const childTableFields = ref({})
const activeTab = ref(0) // For mobile section tabs
const assignedTo = ref(null) // Store the assigned user

// Image modal
const showImageModal = ref(false)
const modalImage = ref('')

// Permission error modal
const showPermissionError = ref(false)
const permissionErrorMessage = ref('')
const formattedErrorMessage = ref('')
const isLinkExistsError = ref(false)

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-')
})

const recordTitle = computed(() => {
  if (record.value) {
    if (record.value.name) {
      return record.value.name;
    }
    if (props.titleField && record.value[props.titleField]) {
      return record.value[props.titleField];
    }
  }
  return `${props.doctype} ${props.recordId}`;
})

// Check if there are any linked records
const hasLinkedRecords = computed(() => {
  return linkedRecords.value.length > 0
})

// Group linked records by doctype
const groupedLinkedRecords = computed(() => {
  const grouped = {}
  
  linkedRecords.value.forEach(record => {
    if (!grouped[record.doctype]) {
      grouped[record.doctype] = []
    }
    grouped[record.doctype].push(record)
  })
  
  return grouped
})

// Get route from doctype
const getRouteFromDoctype = (doctype) => {
  return doctype.toLowerCase().replace(/\s+/g, '-')
}

// Get column style based on field type
const getColumnStyle = (field) => {
  const style = {};
  
  // Set width based on field type
  if (field.fieldtype === 'Check') {
    style.width = '60px';
  } else if (field.fieldtype === 'Int' || field.fieldtype === 'Float') {
    style.width = '100px';
  } else if (field.fieldtype === 'Date') {
    style.width = '120px';
  } else if (field.fieldtype === 'Color') {
    style.width = '120px';
  } else if (field.fieldtype === 'Small Text') {
    style.minWidth = '200px';
  }
  
  return style;
};

// Get the initials of the assigned user
const getAssignedUserInitials = (email) => {
  if (!email) return '';
  
  // Extract initials from email (first two characters)
  return email.substring(0, 2).toUpperCase();
};

// Organize fields into sections and columns
const fieldSections = computed(() => {
  const sections = []
  let currentSection = { label: '', columns: [[]] }
  let currentColumn = 0

  // Filter out system fields
  const systemFields = [
    'name',
    'owner',
    'creation',
    'modified',
    'modified_by',
    'docstatus',
    'idx',
  ]

  const visibleFields = formFields.value
    .filter(
      (field) =>
        field &&
        field.fieldname &&
        !field.hidden &&
        !systemFields.includes(field.fieldname)
    )
    .sort((a, b) => (a.idx || 0) - (b.idx || 0))
    // debugger

  // Group fields into sections and columns
  for (const field of visibleFields) {
    if (field.fieldtype === 'Section Break') {
      // Start a new section
      if (currentSection.columns[0].length > 0 || sections.length === 0) {
        sections.push(currentSection)
        currentSection = {
          label: field.label || '',
          columns: [[]],
        }
        currentColumn = 0
      } else {
        currentSection.label = field.label || ''
      }
    } else if (field.fieldtype === 'Column Break') {
      currentColumn++
      if (!currentSection.columns[currentColumn]) {
        currentSection.columns[currentColumn] = []
      }
    } else {
      currentSection.columns[currentColumn].push(field)
    }
  }

  // Add the last section if it has fields
  if (currentSection.columns.some((col) => col.length > 0)) {
    sections.push(currentSection)
  }

  return sections
})

// Filter out empty sections and metadata fields
const nonEmptySections = computed(() => {
  return fieldSections.value.filter((section) => {
    // Check if any column in this section has displayable fields that are not metadata
    return section.columns.some((column) => {
      return column.some(
        (field) =>
          shouldDisplayField(field) && !isMetadataField(field.fieldname)
      )
    })
  })
})

// Check if a field is a metadata field
const isMetadataField = (fieldname) => {
  const metadataFields = [
    'owner',
    'creation',
    'modified',
    'modified_by',
    'docstatus',
  ]
  return metadataFields.includes(fieldname)
}

// Get child table fields
const getChildTableFields = (field) => {
  return childTableFields.value[field.options] || []
}

// Get visible child table fields (filtering out hidden fields)
const getVisibleChildTableFields = (field) => {
  const allFields = getChildTableFields(field);
  return allFields.filter(childField => 
    !childField.hidden && 
    !shouldHideViewField(field.options, childField.fieldname)
  );
};

// Open image modal
const openImageModal = (imageUrl) => {
  modalImage.value = imageUrl
  showImageModal.value = true
}

// API Methods directly integrated
async function fetchDocument(doctype, name) {
  try {
    const response = await fetch('/api/method/frappe.client.get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.exception || errorData.message || `Error fetching ${doctype}`
      )
    }

    const data = await response.json()

    if (data.message) {
      return data.message
    }
    throw new Error(`${doctype} not found`)
  } catch (error) {
    console.error(`Error fetching ${doctype}:`, error)
    throw error
  }
}

// Fetch assignment information
async function fetchAssignmentInfo(doctype, name) {
  try {
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'ToDo',
        fields: ['allocated_to'],
        filters: {
          reference_type: doctype,
          reference_name: name,
          status: 'Open'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.message && data.message.length > 0) {
      // Get the first assignment
      assignedTo.value = data.message[0].allocated_to;
      console.log(`Document is assigned to: ${assignedTo.value}`);
    } else {
      assignedTo.value = null;
    }
  } catch (error) {
    console.error(`Error fetching assignment info:`, error);
    assignedTo.value = null;
  }
}

// Add this method to the component to update the document
async function updateDocument(doctype, name, data) {
  try {
    console.log(`Updating ${doctype} ${name} with data:`, data)

    const response = await fetch('/api/method/frappe.client.set_value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype,
        name,
        fieldname: data,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Update failed with response:', errorData)
      throw new Error(
        errorData.exception || errorData.message || `Error updating ${doctype}`
      )
    }

    const responseData = await response.json()
    console.log('Update successful with response:', responseData)

    if (responseData.message) {
      return responseData.message
    }
    throw new Error(`Failed to update ${doctype}`)
  } catch (error) {
    console.error(`Error updating ${doctype}:`, error)
    throw error
  }
}

async function fetchDoctypeFields(doctype) {
  try {
    // First try using custom API endpoint
    try {
      const response = await fetch('/api/method/oms.api.get_doctype_fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctype }),
      })

      const data = await response.json()

      if (
        data.message &&
        Array.isArray(data.message) &&
        data.message.length > 0
      ) {
        console.log(
          `Successfully fetched ${data.message.length} fields using custom API`
        )
        return data.message
      } else {
        console.log(
          'Custom API returned no fields, falling back to standard API'
        )
      }
    } catch (error) {
      console.error(
        'Error using custom API, falling back to standard API:',
        error
      )
    }

    const response = await fetch(
      '/api/method/frappe.desk.form.load.getdoctype',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctype }),
      }
    )

    const data = await response.json()

    if (data.message && data.message.docs && data.message.docs[0]) {
      const doctypeDef = data.message.docs[0]
      console.log(
        `Successfully fetched ${doctypeDef.fields.length} fields using standard API`
      )

      return {
        fields: doctypeDef.fields || [],
        clientScripts: data.message.__client_scripts || [],
      }
    } else {
      throw new Error('Failed to get fields from standard API')
    }
  } catch (error) {
    console.error('Error fetching doctype fields:', error)
    throw error
  }
}

// Fetch child table fields
async function fetchChildTableFields(doctype) {
  try {
    const response = await fetch(
      '/api/method/frappe.desk.form.load.getdoctype',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctype }),
      }
    )

    const data = await response.json()

    if (data.message && data.message.docs && data.message.docs[0]) {
      const doctypeDef = data.message.docs[0]
      return doctypeDef.fields || []
    }
    
    return []
  } catch (error) {
    console.error(`Error fetching child table fields for ${doctype}:`, error)
    return []
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
        limit: 0, // Set to 0 to fetch all records
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }
    return []
  } catch (error) {
    console.error(`Error fetching options for ${doctype}:`, error)
    return []
  }
}

// Fetch linked records for the current document
async function fetchLinkedRecords(doctype, name) {
  try {
    console.log(`Fetching linked records for ${doctype} ${name}...`)
    
    // First, try to get linked doctypes
    const response = await fetch('/api/method/frappe.desk.form.linked_with.get_linked_doctypes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype }),
    })
    
    const data = await response.json()
    
    if (!data.message) {
      console.log('No linked doctypes found')
      return []
    }
    
    // Get all linked doctypes
    const linkedDoctypes = Object.keys(data.message)
    console.log('Linked doctypes:', linkedDoctypes)
    
    // For each linked doctype, fetch the linked documents
    const allLinkedRecords = []
    
    for (const linkedDoctype of linkedDoctypes) {
      try {
        // Skip common system doctypes
        if (['Version', 'Comment', 'Communication', 'File'].includes(linkedDoctype)) {
          continue
        }
        
        const linkedResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctype: linkedDoctype,
            fields: ['name', 'creation', 'modified'],
            filters: {
              // This is a simplification - in reality, the link field might have a different name
              [doctype.toLowerCase()]: name
            },
            limit: 0 // Get all records
          }),
        })
        
        const linkedData = await linkedResponse.json()
        
        if (linkedData.message && linkedData.message.length > 0) {
          console.log(`Found ${linkedData.message.length} linked ${linkedDoctype} records`)
          
          // Get title field for this doctype
          const titleField = await getTitleFieldForDoctype(linkedDoctype)
          
          // If we have a title field, fetch it for each record
          if (titleField && titleField !== 'name') {
            for (const record of linkedData.message) {
              try {
                const detailResponse = await fetch('/api/method/frappe.client.get', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    doctype: linkedDoctype,
                    name: record.name,
                  }),
                })
                
                const detailData = await detailResponse.json()
                
                if (detailData.message) {
                  record.title = detailData.message[titleField]
                }
              } catch (error) {
                console.error(`Error fetching details for ${linkedDoctype} ${record.name}:`, error)
              }
            }
          }
          
          // Add to our list with doctype information
          linkedData.message.forEach(record => {
            allLinkedRecords.push({
              ...record,
              doctype: linkedDoctype
            })
          })
        }
      } catch (error) {
        console.error(`Error fetching linked ${linkedDoctype} records:`, error)
      }
    }
    
    console.log('All linked records:', allLinkedRecords)
    return allLinkedRecords
    
  } catch (error) {
    console.error(`Error fetching linked records for ${doctype} ${name}:`, error)
    return []
  }
}

// Get the title field for a doctype
async function getTitleFieldForDoctype(doctype) {
  try {
    const response = await fetch('/api/method/frappe.desk.form.load.getdoctype', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype }),
    })
  
    const data = await response.json()
    // debugger
    
    if (data.message && data.message.docs && data.message.docs[0]) {
      // Check if there's a title field defined
      if (data.message.docs[0].title_field) {
        return data.message.docs[0].title_field
      }
      
      // Otherwise, look for common title fields
      const commonTitleFields = ['title', 'subject', 'name', 'description']
      const fields = data.message.docs[0].fields || []
      
      for (const fieldName of commonTitleFields) {
        if (fields.some(f => f.fieldname === fieldName)) {
          return fieldName
        }
      }
    }
    
    // Default to name
    return 'name'
  } catch (error) {
    console.error(`Error getting title field for ${doctype}:`, error)
    return 'name'
  }
}

async function deleteDocument(doctype, name) {
  try {
    const response = await fetch('/api/method/frappe.client.delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.exception || errorData.message || `Error deleting ${doctype}`
      )
    }

    return true
  } catch (error) {
    console.error(`Error deleting ${doctype}:`, error)
    throw error
  }
}

async function uploadFile(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('doctype', props.doctype)
    formData.append('docname', props.recordI , file)
    formData.append('doctype', props.doctype)
    formData.append('docname', props.recordId)
    formData.append('fieldname', 'file_url')

    const response = await fetch('/api/method/upload_file', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        errorData.exception || errorData.message || 'Error uploading file'
      )
    }

    const data = await response.json()

    if (data.message) {
      return data.message
    }
    throw new Error('Failed to upload file')
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

async function fetchClientScripts(doctype) {
  try {
    console.log(`Fetching client scripts for ${doctype}...`)

    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Client Script',
        filters: {
          dt: doctype,
          enabled: 1,
        },
        fields: ['name', 'script', 'dt', 'enabled', 'view'],
      }),
    })

    const data = await response.json()

    if (data.message && Array.isArray(data.message)) {
      return data.message
    }

    return []
  } catch (error) {
    console.error(`Error fetching client scripts for ${doctype}:`, error)
    return []
  }
}

// Methods
const fetchRecord = async () => {
  try {
    loading.value = true
    error.value = null

    // Get current user
    currentUser.value = await getCurrentUser()
    console.log('Current user:', currentUser.value)

    try {
      const data = await fetchDocument(props.doctype, props.recordId)
      console.log('Fetched document:', data)

      // Check if user can edit/delete this document - use direct API calls for reliability
      try {
        // Get doctype permissions directly from Frappe
        const response = await fetch(
          '/api/method/frappe.client.get_permissions',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctype: props.doctype }),
          }
        )

        if (response.ok) {
          const permData = await response.json()
          if (permData.message) {
            canEdit.value = permData.message.write || false
            canDelete.value = permData.message.delete || false
            console.log(
              `Direct permissions for ${props.doctype}:`,
              permData.message
            )
          }
        } else {
          // Fallback to our utility function
          const permissions = await getDocTypePermissions(props.doctype)
          canEdit.value = permissions.write
          canDelete.value = permissions.delete

          // If permissions are based on ownership, check if user is the owner
          if (permissions.if_owner && !permissions.read_all) {
            canEdit.value = canEdit.value && data.owner === currentUser.value
            canDelete.value =
              canDelete.value && data.owner === currentUser.value
          }

          console.log(`Utility permissions for ${props.doctype}:`, {
            canEdit: canEdit.value,
            canDelete: canDelete.value,
          })
        }
      } catch (permError) {
        console.error('Error checking permissions:', permError)
        // Fallback to checking if user is owner
        canEdit.value = data.owner === currentUser.value
        canDelete.value = data.owner === currentUser.value
      }

      record.value = data
      // Create a deep copy for editing
      editedRecord.value = JSON.parse(JSON.stringify(data))

      // Fetch assignment information
      await fetchAssignmentInfo(props.doctype, props.recordId)
      
      // Fetch linked records
      linkedRecords.value = await fetchLinkedRecords(props.doctype, props.recordId)

      triggerEvent('onload')
    } catch (err) {
      console.error(`Error fetching ${props.doctype}:`, err)

      // Check if it's a permission error
      if (err.message && err.message.includes('Permission')) {
        error.value = `You don't have permission to view this ${props.doctype}. Please contact your administrator.`
      } else {
        error.value = `Failed to load ${props.doctype}: ${
          err.message || 'Unknown error'
        }`
      }
    }
  } finally {
    loading.value = false
  }
}

const fetchDoctypeFieldsAndProcess = async () => {
  try {
    const result = await fetchDoctypeFields(props.doctype)

    if (Array.isArray(result)) {
      formFields.value = result
    } else if (result && result.fields) {
      formFields.value = result.fields
    } else {
      throw new Error('Invalid response format')
    }

    // Process table fields to fetch their child fields
    const tableFields = formFields.value.filter(field => field.fieldtype === 'Table');
    for (const field of tableFields) {
      if (field.options) {
        const childFields = await fetchChildTableFields(field.options);
        childTableFields.value[field.options] = childFields;
      }
    }

    await fetchLinkFieldOptions()

    // Fetch client scripts
    await fetchClientScriptsAndProcess()
  } catch (error) {
    console.error('Error fetching doctype fields:', error)
    error.value = 'Failed to load doctype fields'
  }
}

const fetchClientScriptsAndProcess = async () => {
  try {
    console.log(`Fetching client scripts for ${props.doctype}...`)

    const scripts = await fetchClientScripts(props.doctype)
    clientScripts.value = scripts

    console.log(
      `Successfully fetched ${clientScripts.value.length} client scripts`
    )

    parseClientScripts()
  } catch (error) {
    console.error('Error fetching client scripts:', error)
  }
}

const parseClientScripts = () => {
  if (!window.frappe) {
    window.frappe = createFrappeContext()
  }

  for (const script of clientScripts.value) {
    try {
      console.log(`Parsing client script: ${script.name}`)
      const scriptFn = new Function(script.script)
      scriptFn()
      console.log(`Successfully parsed client script: ${script.name}`)
    } catch (error) {
      console.error(`Error parsing client script ${script.name}:`, error)
    }
  }
}

// Create a Frappe context for client scripts
const createFrappeContext = () => {
  const frappeContext = {
    ui: {
      form: {
        on: (doctype, events) => {
          console.log(`Registering events for ${doctype}:`, events)

          for (const [event, handler] of Object.entries(events)) {
            if (!eventHandlers.value[event]) {
              eventHandlers.value[event] = []
            }

            eventHandlers.value[event].push(handler)
            console.log(`Registered handler for ${event} event`)
          }
        },
      },
    },
    msgprint: (message) => {
      console.log('MSGPRINT:', message)
      permissionErrorMessage.value =
        typeof message === 'object' ? message.message : message
      showPermissionError.value = true
    },
    throw: (message) => {
      console.log('THROW:', message)
      error.value = typeof message === 'object' ? message.message : message
    },
    show_alert: (message, seconds = 3) => {
      console.log('SHOW_ALERT:', message)
      permissionErrorMessage.value =
        typeof message === 'object' ? message.message : message
      showPermissionError.value = true
      setTimeout(() => {
        showPermissionError.value = false
      }, seconds * 1000)
    },
    confirm: (message, callback) => {
      if (confirm(message)) {
        callback()
      }
    },
    prompt: (options, callback) => {
      const result = prompt(
        options.message || 'Please enter a value',
        options.default || ''
      )
      if (result !== null) {
        callback(result)
      }
    },
    format: (value, df) => {
      return value
    },
    datetime: {
      now_date: () => new Date().toISOString().split('T')[0],
    },
    model: {
      events: {
        on: (doctype, fieldname, fn) => {
          // Implementation for model events
        },
      },
    },
    meta: {
      get_docfield: (doctype, fieldname) => {
        return formFields.value.find((f) => f.fieldname === fieldname) || {}
      },
    },
  }

  return frappeContext
}

const triggerEvent = (event, fieldname = null) => {
  console.log(`Triggering event: ${event}, field: ${fieldname || 'none'}`)

  const frm = {
    doc: record.value,
    doctype: props.doctype,
    docname: props.recordId,
    fields_dict: {},
    get_field: (fieldname) => {
      return formFields.value.find((f) => f.fieldname === fieldname) || {}
    },
    set_value: (field, value) => {
      record.value[field] = value
      return Promise.resolve()
    },
    refresh_field: (fieldname) => {
      const temp = { ...record.value }
      record.value = temp
    },
    trigger: (event) => {
      triggerEvent(event)
    },
  }

  if (eventHandlers.value[event]) {
    for (const handler of eventHandlers.value[event]) {
      try {
        handler(frm)
      } catch (error) {
        console.error(`Error executing handler for ${event} event:`, error)
      }
    }
  }

  if (fieldname && eventHandlers.value[fieldname]) {
    for (const handler of eventHandlers.value[fieldname]) {
      try {
        handler(frm)
      } catch (error) {
        console.error(`Error executing handler for ${fieldname} field:`, error)
      }
    }
  }
}

const fetchLinkFieldOptions = async () => {
  const linkFields = formFields.value.filter(
    (field) => field.fieldtype === 'Link'
  )

  for (const field of linkFields) {
    try {
      console.log(`Fetching options for ${field.fieldname} (${field.options})`)

      let options = []

      if (field.options === 'Project') {
        const projects = await fetchLinkOptions('Project', [
          'name',
          'project_name',
        ])
        options = projects.map((item) => ({
          value: item.name,
          label: item.project_name || item.name,
        }))
      } else if (field.options === 'Contact') {
        const contacts = await fetchLinkOptions('Contact', [
          'name',
          'first_name',
          'last_name',
        ])
        options = contacts.map((item) => ({
          value: item.name,
          label: `${item.first_name || ''} ${item.last_name || ''} (${
            item.name
          })`,
        }))
      } else {
        // Default handling for other doctypes - fetch all records
        const items = await fetchLinkOptions(field.options, ['name'])
        options = items.map((item) => ({
          value: item.name,
          label: item.name,
        }))
      }

      linkFieldOptions.value[field.fieldname] = options
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error)
    }
  }
}

const shouldDisplayField = (field) => {
  if (!record.value) return false

  // In edit mode, show all fields
  if (isEditing.value) return true

  // Check if field is configured to be hidden in view mode
  if (shouldHideViewField(props.doctype, field.fieldname)) return false

  // In view mode, only show fields with values
  const value = record.value[field.fieldname]
  return (
    field.fieldtype === 'Check' ||
    field.fieldtype === 'Table' ||
    (value !== undefined && value !== null && value !== '')
  )
}

const getFieldDisplayValue = (field) => {
  if (!field || !record.value) return ''

  const value = record.value[field.fieldname]
  if (!value) return ''

  if (field.fieldtype === 'Link') {
    const options = linkFieldOptions.value[field.fieldname] || []
    const option = options.find((opt) => opt.value === value)
    return option ? option.label : value
  }

  return value
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const startEditing = () => {
  console.log('Attempting to start editing mode')

  if (!canEdit.value) {
    permissionErrorMessage.value = `You don't have permission to edit this ${props.doctype}`
    showPermissionError.value = true
    return
  }

  editedRecord.value = JSON.parse(JSON.stringify(record.value))
  isEditing.value = true
  console.log('Edit mode activated')

  // Trigger onEdit event
  triggerEvent('onedit')
}

const cancelEditing = () => {
  isEditing.value = false
  // Reset edited record
  editedRecord.value = JSON.parse(JSON.stringify(record.value))
}

const handleFormSubmitted = (updatedRecord) => {
  // Update the local record with the new data
  record.value = updatedRecord
  
  // Exit edit mode
  isEditing.value = false
  
  // Emit record-updated event
  emit('record-updated', updatedRecord)
  
  // Trigger onUpdate event
  triggerEvent('onupdate')
}

const handleAssignmentAdded = () => {
  // Refresh assignment information
  fetchAssignmentInfo(props.doctype, props.recordId)
}

const handleAssignmentRemoved = () => {
  // Refresh assignment information
  fetchAssignmentInfo(props.doctype, props.recordId)
}

const handleAssignmentError = (error) => {
  permissionErrorMessage.value = error
  showPermissionError.value = true
}

const confirmDelete = () => {
  if (!canDelete.value) {
    permissionErrorMessage.value = `You don't have permission to delete this ${props.doctype}`
    showPermissionError.value = true
    return
  }

  showDeleteConfirm.value = true
}

// Parse and format error messages for better user understanding
const parseErrorMessage = (errorMsg) => {
  // Check if it's a LinkExistsError
  if (
    errorMsg.includes('LinkExistsError') ||
    errorMsg.includes('is linked with')
  ) {
    isLinkExistsError.value = true

    // Try to extract the formatted message from the error
    let formattedMsg = errorMsg

    // If it's a JSON string in _server_messages
    if (errorMsg.includes('_server_messages')) {
      try {
        const serverMsgMatch = errorMsg.match(/_server_messages\s*:\s*"(.+?)"/)
        if (serverMsgMatch && serverMsgMatch[1]) {
          const escapedJson = serverMsgMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
          const parsedMessages = JSON.parse(escapedJson)

          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            const firstMsg = JSON.parse(parsedMessages[0])
            formattedMsg = firstMsg.message || errorMsg
          }
        }
      } catch (e) {
        console.error('Error parsing server messages:', e)
      }
    }

    // Clean up the message and preserve HTML links
    formattedMsg = formattedMsg
      .replace(/frappe\.exceptions\.LinkExistsError:\s*/, '')
      .replace(/Cannot delete or cancel because/, 'Cannot delete because')

    return formattedMsg
  }

  // For other types of errors
  isLinkExistsError.value = false
  return errorMsg
}

const handleDelete = async () => {
  try {
    loading.value = true
    showDeleteConfirm.value = false

    await deleteDocument(props.doctype, props.recordId)

    emit('record-deleted', props.recordId)

    // Navigate back to list view
    router.push(`/${doctypeRoute.value}`)
  } catch (error) {
    console.error(`Error deleting ${props.doctype}:`, error)

    if (error.message && error.message.includes('Permission')) {
      permissionErrorMessage.value = `Error deleting ${props.doctype}: You don't have permission to delete this document`
    } else {
      // Format the error message for better readability
      formattedErrorMessage.value = parseErrorMessage(error.message)
      permissionErrorMessage.value = error.message
    }

    showPermissionError.value = true
  } finally {
    loading.value = false
  }
}

// Navigate to a linked record
const navigateToLinkedRecord = (doctype, name) => {
  const route = `/${getRouteFromDoctype(doctype)}/${name}`
  router.push(route)
}

onMounted(async () => {
  console.log(
    `DetailView component mounted for ${props.doctype} ${props.recordId}`
  )

  try {
    // Fetch doctype fields first
    await fetchDoctypeFieldsAndProcess()

    // Then fetch the record
    await fetchRecord()
  } catch (error) {
    console.error('Error initializing component:', error)
    error.value = 'Failed to initialize component'
  }
})

watch(
  () => props.recordId,
  async (newId) => {
    if (newId) {
      // Exit edit mode if changing records
      isEditing.value = false
      await fetchRecord()
    }
  }
)

watch(
  () => props.doctype,
  async () => {
    loading.value = true
    formFields.value = []
    record.value = {}
    editedRecord.value = {}
    isEditing.value = false
    childTableFields.value = {}

    try {
      await fetchDoctypeFieldsAndProcess()
      await fetchRecord()
    } catch (error) {
      console.error('Error when doctype changed:', error)
    } finally {
      loading.value = false
    }
  }
)
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

@media (max-width: 640px) {
  .prose {
    font-size: 0.875rem;
  }
}
</style>