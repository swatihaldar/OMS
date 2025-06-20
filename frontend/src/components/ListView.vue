<template>
  <div class="p-4">
    <!-- Search and Filter Bar -->
    <div class="bg-white rounded-xl shadow-md p-3 mb-4 sticky top-0 z-30">
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="`Search ${doctype}...`"
            class="w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @input="handleSearch"
          />
          <MagnifyingGlassIcon class="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
        </div>

        <!-- Filter Button -->
        <div class="relative">
          <button 
            @click="showFilterPanel = !showFilterPanel"
            class="p-2 border rounded-lg hover:bg-gray-50 relative filter-toggle-btn"
            :class="{'bg-blue-50 border-blue-300': activeFilters}"
          >
            <FunnelIcon class="h-5 w-5" :class="activeFilters ? 'text-blue-600' : 'text-gray-600'" />
            <span v-if="activeFilters" class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {{ filterCount }}
            </span>
          </button>
          
          <!-- Filter Panel Component -->
          <FilterPanel
            v-if="showFilterPanel"
            :status-field="statusField"
            :filterable-fields="filterableFields"
            :sortable-fields="sortableFields"
            :link-field-options="linkFieldOptions"
            :status-filter="statusFilter"
            :custom-filters="customFilters"
            :date-filters="dateFilters"
            :assignment-filter="assignmentFilter"
            :sort-option="sortOption"
            @update:status-filter="statusFilter = $event"
            @update:custom-filters="customFilters = $event"
            @update:date-filters="dateFilters = $event"
            @update:assignment-filter="assignmentFilter = $event"
            @update:sort-option="sortOption = $event"
            @reset="resetFilters"
            @apply="applyFilters"
          />
        </div>

        <button 
          v-if="canCreate"
          @click="$router.push(`/${doctypeRoute}/new`)" 
          class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md"
        >
          <PlusIcon class="h-5 w-5 mr-1" />
          New
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="records.length === 0" class="bg-white rounded-xl shadow-md p-6 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
        <ExclamationTriangleIcon class="h-8 w-8 text-blue-600" />
      </div>
      <p class="text-gray-600 mb-4">No {{ doctype }} found</p>
      <button 
        v-if="canCreate"
        @click="$router.push(`/${doctypeRoute}/new`)" 
        class="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md"
      >
        Create New {{ doctype }}
      </button>
    </div>

    <!-- Records List -->
    <div v-else class="space-y-4">
      <div
        v-for="record in records"
        :key="record.name"
        @click="navigateToRecord(record)"
        class="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-transparent hover:border-blue-100"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2 flex-wrap gap-2">
              <span class="text-sm text-gray-500">{{ record.name }}</span>
              <div v-if="record.status" :class="getStatusClass(record.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ record.status }}
              </div>
              
              <!-- Assignment indicators -->
              <div v-if="isAssignedToCurrentUser(record)" class="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <UserCircleIcon class="h-4 w-4 mr-1" />
                <span class="text-xs font-medium">Assigned to me</span>
              </div>
              
              <div v-else-if="isAssignedToOthers(record)" class="flex items-center text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                <UserCircleIcon class="h-4 w-4 mr-1" />
                <span class="text-xs font-medium">{{ getAssignedUserInitials(record) }}</span>
              </div>
            </div>
            <h3 class="font-semibold text-gray-800 mt-1 text-lg">{{ getRecordTitle(record) }}</h3>
            <div class="flex flex-wrap gap-4 mt-2">
              <div v-for="(field, index) in listDisplayFields" :key="index" class="flex items-center text-sm text-gray-500">
                <component :is="getFieldIcon(field)" class="h-4 w-4 mr-1 text-blue-500" />
                <span>{{ getFieldLabel(field) }}: {{ getFieldValue(record, field) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-between items-center">
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      <span class="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border">
        Page {{ currentPage }} of {{ totalPages }} 
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center"
      >
        Next
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  PlusIcon,
  ExclamationTriangleIcon,
  UserIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  FlagIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentIcon
} from '@heroicons/vue/24/outline';
import api from '@/utils/api';
import { getDocTypePermissions, getCurrentUser } from '../utils/permissions';
import FilterPanel from './FilterPanel.vue';

const props = defineProps({
  doctype: {
    type: String,
    required: true
  },
  titleField: {
    type: String,
    default: 'subject'
  },
  listFields: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  showOnlyOwnRecords: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['record-click']);

const router = useRouter();
const route = useRoute();
const records = ref([]);
const loading = ref(true);
const formFields = ref([]);
const error = ref(null);
const linkFieldOptions = ref({});
const userPermissions = ref([]);
const canCreate = ref(false);
const currentUser = ref(null);
const assignedRecords = ref({}); // Map of record names to assignment status
const assignedUsers = ref({}); // Map of record names to assigned users

// List view state
const searchQuery = ref('');
const statusFilter = ref('');
const customFilters = ref({});
const dateFilters = ref({});
const sortOption = ref('creation desc');
const assignmentFilter = ref(''); // New filter for assignments
const showFilterPanel = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);
const totalRecords = ref(0);
const allRecords = ref([]); // Store all fetched records

// State persistence key
const getStateKey = () => `${props.doctype.toLowerCase()}_list_state`;

// Save filter state to localStorage
const saveFilterState = () => {
  const state = {
    searchQuery: searchQuery.value,
    statusFilter: statusFilter.value,
    customFilters: customFilters.value,
    dateFilters: dateFilters.value,
    sortOption: sortOption.value,
    assignmentFilter: assignmentFilter.value,
    currentPage: currentPage.value
  };
  localStorage.setItem(getStateKey(), JSON.stringify(state));
};

// Load filter state from localStorage
const loadFilterState = () => {
  try {
    const savedState = localStorage.getItem(getStateKey());
    if (savedState) {
      const state = JSON.parse(savedState);
      searchQuery.value = state.searchQuery || '';
      statusFilter.value = state.statusFilter || '';
      customFilters.value = state.customFilters || {};
      dateFilters.value = state.dateFilters || {};
      sortOption.value = state.sortOption || 'creation desc';
      assignmentFilter.value = state.assignmentFilter || '';
      currentPage.value = state.currentPage || 1;
      return true;
    }
  } catch (error) {
    console.error('Error loading filter state:', error);
  }
  return false;
};

// Computed properties
const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const activeFilters = computed(() => {
  return statusFilter.value !== '' || 
         searchQuery.value !== '' || 
         assignmentFilter.value !== '' ||
         Object.values(customFilters.value).some(v => v !== '') ||
         Object.values(dateFilters.value).some(v => v.from || v.to);
});

const filterCount = computed(() => {
  let count = 0;
  if (statusFilter.value) count++;
  if (searchQuery.value) count++;
  if (assignmentFilter.value) count++;
  
  count += Object.values(customFilters.value).filter(v => v !== '').length;
  
  count += Object.values(dateFilters.value).filter(v => v.from || v.to).length;
  
  return count;
});

const statusField = computed(() => {
  return formFields.value.find(field => field.fieldname === 'status');
});

const sortableFields = computed(() => {
  return formFields.value.filter(field => 
    ['Data', 'Link', 'Select', 'Date', 'Datetime'].includes(field.fieldtype)
  );
});

const filterableFields = computed(() => {
  return formFields.value.filter(field => 
    ['Data', 'Link', 'Select', 'Date', 'Datetime', 'Int', 'Float'].includes(field.fieldtype) &&
    !['name', 'creation', 'modified', 'modified_by', 'owner'].includes(field.fieldname) &&
    field.fieldname !== 'status' 
  ).slice(0, 5); // Limit to 5 fields for simplicity
});

const listDisplayFields = computed(() => {
  if (props.listFields.length > 0) {
    return props.listFields.map(fieldname => 
      formFields.value.find(f => f.fieldname === fieldname)
    ).filter(Boolean);
  }
  
  const fieldsInListView = formFields.value.filter(field => 
    field.in_list_view === 1 || field.in_list_view === true || field.in_list_view === '1'
  );
  
  if (fieldsInListView.length > 0) {
    return fieldsInListView.slice(0, 4);
  }
  
  // Fallback to common fields
  const commonFields = ['name', 'title', 'subject', 'status', 'creation'];
  return formFields.value
    .filter(field => commonFields.includes(field.fieldname))
    .slice(0, 3);
});

// Methods
const checkPermissions = async () => {
  try {
    // For debugging purposes, default to true
    canCreate.value = true;
    
    // Log for debugging
    console.log(`Permission check for ${props.doctype}: canCreate = ${canCreate.value}`);
    
    // Try direct API call to Frappe for permissions
    const response = await fetch('/api/method/frappe.client.get_permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype: props.doctype })
    });
    
    if (response.ok) {
      const permData = await response.json();
      if (permData.message) {
        // Still default to true for debugging
        canCreate.value = true; 
        console.log(`Direct permissions for ${props.doctype}:`, permData.message);
      }
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
    // Default to true for debugging
    canCreate.value = true;
  }
};

const fetchDoctypeFields = async () => {
  try {
    const result = await api.fetchDoctypeFields(props.doctype);
    
    if (Array.isArray(result)) {
      formFields.value = result;
    } else if (result && result.fields) {
      formFields.value = result.fields;
    } else {
      throw new Error('Invalid response format');
    }
    
    formFields.value
      .filter(field => field.fieldtype === 'Date' || field.fieldtype === 'Datetime')
      .forEach(field => {
        dateFilters.value[field.fieldname] = { from: '', to: '' };
      });
    
    await fetchLinkFieldOptions();
    
  } catch (error) {
    console.error('Error fetching doctype fields:', error);
    error.value = 'Failed to load doctype fields';
  }
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
          user: ['=', await getCurrentUser()]
        }
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      userPermissions.value = data.message;
      console.log('User permissions:', userPermissions.value);
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
  }
};

const fetchLinkFieldOptions = async () => {
  const linkFields = [...listDisplayFields.value, ...filterableFields.value]
    .filter(field => field && field.fieldtype === 'Link')
    .reduce((unique, field) => {
      if (!unique.some(f => f.fieldname === field.fieldname)) {
        unique.push(field);
      }
      return unique;
    }, []);
  
  for (const field of linkFields) {
    try {
      console.log(`Fetching options for ${field.fieldname} (${field.options})`);
      
      let options = [];
      
      if (field.options === 'Project') {
        const projects = await api.fetchLinkOptions('Project', ['name', 'project_name']);
        options = projects.map(item => ({
          value: item.name,
          label: item.project_name || item.name
        }));
      } else if (field.options === 'Contact') {
        const contacts = await api.fetchLinkOptions('Contact', ['name', 'first_name', 'last_name']);
        options = contacts.map(item => ({
          value: item.name,
          label: `${item.first_name || ''} ${item.last_name || ''} (${item.name})`
        }));
      } else {
        // Default handling for other doctypes
        const items = await api.fetchLinkOptions(field.options, ['name']);
        options = items.map(item => ({
          value: item.name,
          label: item.name
        }));
      }
      
      // Store options
      linkFieldOptions.value[field.fieldname] = options;
      
    } catch (error) {
      console.error(`Error fetching options for ${field.fieldname}:`, error);
    }
  }
};

// Fetch assigned records for the current user
const fetchAssignedRecords = async () => {
  try {
    if (!currentUser.value) {
      currentUser.value = await getCurrentUser();
    }
    
    // Fetch assignments for the current doctype
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'ToDo',
        fields: ['reference_name', 'allocated_to'],
        filters: {
          reference_type: props.doctype,
          status: 'Open'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      // Create maps for assignments
      const assignedMap = {};
      const userMap = {};
      
      data.message.forEach(todo => {
        // Check if assigned to current user
        if (todo.allocated_to === currentUser.value) {
          assignedMap[todo.reference_name] = true;
        }
        
        // Store the assigned user for each record
        userMap[todo.reference_name] = todo.allocated_to;
      });
      
      assignedRecords.value = assignedMap;
      assignedUsers.value = userMap;
      
      console.log('Assigned records:', assignedRecords.value);
      console.log('Assigned users:', assignedUsers.value);
    }
  } catch (error) {
    console.error('Error fetching assigned records:', error);
  }
};

// Check if a record is assigned to the current user
const isAssignedToCurrentUser = (record) => {
  // Check if the record is in our assignedRecords map
  return assignedRecords.value[record.name] === true || 
         // Also check if allocated_to field matches current user (if it exists in the record)
         (record.allocated_to && record.allocated_to === currentUser.value);
};

// Check if a record is assigned to someone else
const isAssignedToOthers = (record) => {
  return assignedUsers.value[record.name] && 
         assignedUsers.value[record.name] !== currentUser.value;
};

// Get the initials of the assigned user
const getAssignedUserInitials = (record) => {
  const assignedUser = assignedUsers.value[record.name];
  if (!assignedUser) return '';
  
  // Extract initials from email (first two characters)
  return assignedUser.substring(0, 2).toUpperCase();
};

// Fetch all records first, then handle pagination locally
const fetchAllRecords = async () => {
  loading.value = true;
  try {
    const filters = { ...props.filters };
    
    // Apply user permissions as filters
    applyUserPermissionsToFilters(filters);

    // Get current user if not already set
    if (!currentUser.value) {
      currentUser.value = await getCurrentUser();
    }

    // Fetch assigned records for the current user
    await fetchAssignedRecords();

    // Create OR conditions for owner and assigned records
    let orFilters = [];
    
    // Apply assignment filter
    if (assignmentFilter.value) {
      if (assignmentFilter.value === 'assigned_to_me') {
        // Only show records assigned to current user
        const assignedNames = Object.keys(assignedRecords.value);
        if (assignedNames.length > 0) {
          orFilters.push(['name', 'in', assignedNames]);
        } else {
          // If no assignments, add a condition that will return no results
          orFilters.push(['name', '=', 'no-assignments-found']);
        }
        
        // Also check allocated_to field if it exists
        const hasAllocatedToField = formFields.value.some(field => field.fieldname === 'allocated_to');
        if (hasAllocatedToField) {
          orFilters.push(['allocated_to', '=', currentUser.value]);
        }
      } 
      else if (assignmentFilter.value === 'created_by_me') {
        // Only show records created by current user
        orFilters.push(['owner', '=', currentUser.value]);
      }
      else if (assignmentFilter.value === 'both') {
        // Show records either created by or assigned to current user
        const assignedNames = Object.keys(assignedRecords.value);
        
        if (assignedNames.length > 0) {
          orFilters.push(['name', 'in', assignedNames]);
        }
        
        // Also check allocated_to field if it exists
        const hasAllocatedToField = formFields.value.some(field => field.fieldname === 'allocated_to');
        if (hasAllocatedToField) {
          orFilters.push(['allocated_to', '=', currentUser.value]);
        }
        
        orFilters.push(['owner', '=', currentUser.value]);
      }
    }
    // Add filter to only show records owned by the current user if showOnlyOwnRecords is true
    else if (props.showOnlyOwnRecords && currentUser.value) {
      orFilters.push(['owner', '=', currentUser.value]);
      
      // Add condition for allocated_to field if it exists
      const hasAllocatedToField = formFields.value.some(field => field.fieldname === 'allocated_to');
      if (hasAllocatedToField) {
        orFilters.push(['allocated_to', '=', currentUser.value]);
      }
      
      // Also include records that are in our assignedRecords map
      if (Object.keys(assignedRecords.value).length > 0) {
        orFilters.push(['name', 'in', Object.keys(assignedRecords.value)]);
      }
    }
    
    if (statusFilter.value) {
      filters.status = statusFilter.value;
    }
    
    for (const [key, value] of Object.entries(customFilters.value)) {
      if (value) {
        filters[key] = value;
      }
    }
    
    for (const [key, value] of Object.entries(dateFilters.value)) {
      if (value.from && value.to) {
        filters[key] = ['between', [value.from, value.to]];
      } else if (value.from) {
        filters[key] = ['>=', value.from];
      } else if (value.to) {
        filters[key] = ['<=', value.to];
      }
    }
    
    let searchConditions = [];
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim();
      searchConditions.push([props.doctype, 'name', 'like', `%${query}%`]);
      searchConditions.push([props.doctype, props.titleField, 'like', `%${query}%`]);
    }

    console.log(`Fetching all records with filters:`, filters);
    console.log(`OR filters:`, orFilters);

    // Fetch all records (with a high limit)
    const result = await api.fetchDocumentList({
      doctype: props.doctype,
      fields: ['*'],
      filters: filters,
      orFilters: orFilters.length > 0 ? orFilters : (searchConditions.length > 0 ? searchConditions : undefined),
      limit: 1000, // Set a high limit to get all records
      orderBy: sortOption.value
    });
    
    // Store all records
    allRecords.value = result.records;
    totalRecords.value = result.records.length;
    totalPages.value = Math.ceil(totalRecords.value / pageSize.value);
    
    console.log(`Fetched ${allRecords.value.length} total records. Pages: ${totalPages.value}`);
    
    // Apply pagination locally
    updateDisplayedRecords();
    
    // Save the current filter state
    saveFilterState();
    
  } catch (error) {
    console.error(`Error fetching ${props.doctype} records:`, error);
    error.value = `Failed to load ${props.doctype} records`;
  } finally {
    loading.value = false;
  }
};

// Update displayed records based on current page
const updateDisplayedRecords = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = Math.min(start + pageSize.value, allRecords.value.length);
  
  console.log(`Updating displayed records for page ${currentPage.value}, start: ${start}, end: ${end}`);
  
  // Get the slice of records for the current page
  records.value = allRecords.value.slice(start, end);
  
  console.log(`Displaying ${records.value.length} records for page ${currentPage.value}`);
};

const applyUserPermissionsToFilters = (filters) => {
  const doctypePermissions = userPermissions.value.filter(p => p.allow === props.doctype);
  
  if (doctypePermissions.length > 0) {
    const permissionsByField = {};
    
    for (const permission of doctypePermissions) {
      const linkFields = formFields.value.filter(field => 
        field.fieldtype === 'Link' && field.options === permission.allow
      );
      
      for (const field of linkFields) {
        if (!permissionsByField[field.fieldname]) {
          permissionsByField[field.fieldname] = [];
        }
        permissionsByField[field.fieldname].push(permission.for_value);
      }
    }
    
    for (const [fieldname, values] of Object.entries(permissionsByField)) {
      if (values.length === 1) {
        filters[fieldname] = values[0];
      } else {
        filters[fieldname] = ['in', values];
      }
    }
  }
};

const getRecordTitle = (record) => {
  return record[props.titleField] || record.name || 'Untitled';
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

const getStatusOptions = () => {
  if (statusField.value && statusField.value.options) {
    return statusField.value.options.split('\n');
  }
  return ['Open', 'Closed', 'Resolved', 'On Hold', 'Replied'];
};

const getLinkOptions = (field) => {
  return linkFieldOptions.value[field.fieldname] || [];
};

const getSelectOptions = (field) => {
  if (field.options) {
    return field.options.split('\n');
  }
  return [];
};

const getFieldIcon = (field) => {
  if (!field) return DocumentIcon;
  
  switch (field.fieldname) {
    case 'project':
      return FolderIcon;
    case 'priority':
      return FlagIcon;
    case 'custom_raised_by_contact':
    case 'raised_by':
    case 'allocated_to':
      return UserIcon;
    case 'creation':
    case 'modified':
      return CalendarIcon;
    case 'status':
      return TagIcon;
    case 'company':
      return BuildingOfficeIcon;
    case 'custom_raised_by_mobile':
      return PhoneIcon;
    case 'email':
      return EnvelopeIcon;
    default:
      return DocumentIcon;
  }
};

const getFieldLabel = (field) => {
  if (!field) return '';
  return field.label || field.fieldname;
};

const getFieldValue = (record, field) => {
  if (!record || !field) return '';
  
  const value = record[field.fieldname];
  
  if (value === null || value === undefined) {
    return '';
  }
  
  if (field.fieldtype === 'Link' && record[`${field.fieldname}_data`]) {
    return record[`${field.fieldname}_data`].label || value;
  }
  
  if (field.fieldtype === 'Date' || field.fieldtype === 'Datetime') {
    return formatDate(value);
  }
  
  return value;
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

// Navigate to record detail view with state preservation
const navigateToRecord = (record) => {
  // Save current filter state before navigation
  saveFilterState();
  
  // Navigate to the detail view
  router.push(`/${doctypeRoute.value}/${record.name}`);
};

// List view methods
const handleSearch = () => {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    // Filter the allRecords directly instead of fetching again
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase();
      const filtered = allRecords.value.filter(record => 
        record.name.toLowerCase().includes(query) || 
        (record[props.titleField] && record[props.titleField].toLowerCase().includes(query))
      );
      records.value = filtered.slice(0, pageSize.value);
      totalRecords.value = filtered.length;
      totalPages.value = Math.ceil(totalRecords.value / pageSize.value);
    } else {
      // If search is cleared, restore original records
      updateDisplayedRecords();
    }
    
    // Save the current filter state
    saveFilterState();
  }, 300);
};

const resetFilters = () => {
  statusFilter.value = '';
  sortOption.value = 'creation desc';
  searchQuery.value = '';
  customFilters.value = {};
  assignmentFilter.value = '';
  
  // Reset date filters
  for (const key in dateFilters.value) {
    dateFilters.value[key] = { from: '', to: '' };
  }
  
  showFilterPanel.value = false;
  currentPage.value = 1;
  
  // Clear saved filter state
  localStorage.removeItem(getStateKey());
  
  fetchAllRecords();
};

const applyFilters = () => {
  showFilterPanel.value = false;
  currentPage.value = 1;
  fetchAllRecords();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    updateDisplayedRecords();
    saveFilterState();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    updateDisplayedRecords();
    saveFilterState();
  }
};

// Handle clicks outside the filter panel
const handleClickOutside = (event) => {
  const filterDropdown = document.querySelector('.filter-dropdown');
  const filterToggleBtn = document.querySelector('.filter-toggle-btn');
  
  if (
    showFilterPanel.value && 
    filterDropdown && 
    !filterDropdown.contains(event.target) && 
    !filterToggleBtn.contains(event.target)
  ) {
    showFilterPanel.value = false;
  }
};

onMounted(async () => {
  console.log(`ListView component mounted for ${props.doctype}`);
  
  try {
    // Get current user
    currentUser.value = await getCurrentUser();
    
    await checkPermissions();
    await fetchDoctypeFields();
    await fetchUserPermissions();
    
    // Try to load saved filter state
    const stateLoaded = loadFilterState();
    console.log(`Filter state loaded: ${stateLoaded}`);
    
    await fetchAssignedRecords(); // Fetch assigned records
    await fetchAllRecords();
  } catch (error) {
    console.error('Error initializing component:', error);
    error.value = 'Failed to initialize component';
  }
  
  document.addEventListener('click', handleClickOutside);
});

watch(sortOption, () => {
  currentPage.value = 1;
  fetchAllRecords();
});

watch(() => props.doctype, async () => {
  loading.value = true;
  formFields.value = [];
  records.value = [];
  allRecords.value = [];
  currentPage.value = 1;
  
  // Clear saved filter state when doctype changes
  localStorage.removeItem(getStateKey());
  
  try {
    await checkPermissions();
    await fetchDoctypeFields();
    await fetchUserPermissions();
    await fetchAssignedRecords();
    await fetchAllRecords();
  } catch (error) {
    console.error('Error when doctype changed:', error);
  } finally {
    loading.value = false;
  }
});

watch(() => props.filters, () => {
  currentPage.value = 1;
  fetchAllRecords();
}, { deep: true });

// Save filter state before component is unmounted
onBeforeUnmount(() => {
  saveFilterState();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style>
@media (max-width: 640px) {
  .filter-dropdown {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    margin: 0;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 100;
  }
  
  .filter-dropdown::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    background-color: #cbd5e0;
    border-radius: 2px;
    margin: 0.5rem auto 1rem;
  }
}

/* Add hover animation */
.hover\:-translate-y-1:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>