<template>
  <div class="p-4">
    <!-- Search and Filter Bar -->
    <div class="bg-white rounded-lg shadow-sm p-3 mb-4 sticky top-0 z-10">
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
          
          <!-- Filter Dropdown -->
          <div 
            v-if="showFilterPanel" 
            class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-3 border filter-dropdown"
          >
            <div v-if="statusField" class="mb-3">
              <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                v-model="statusFilter"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option v-for="option in getStatusOptions()" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
            
            <!-- Additional Filters -->
            <div v-for="field in filterableFields" :key="field.fieldname" class="mb-3">
              <label class="block text-xs font-medium text-gray-700 mb-1">{{ field.label }}</label>
              
              <!-- Link field filter -->
              <select
                v-if="field.fieldtype === 'Link'"
                v-model="customFilters[field.fieldname]"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All {{ field.label }}</option>
                <option v-for="option in getLinkOptions(field)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              
              <!-- Select field filter -->
              <select
                v-else-if="field.fieldtype === 'Select'"
                v-model="customFilters[field.fieldname]"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All {{ field.label }}</option>
                <option v-for="option in getSelectOptions(field)" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              
              <!-- Date field filter -->
              <div v-else-if="field.fieldtype === 'Date' || field.fieldtype === 'Datetime'" class="flex gap-2">
                <input
                  v-model="dateFilters[field.fieldname].from"
                  type="date"
                  class="w-1/2 border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="From"
                />
                <input
                  v-model="dateFilters[field.fieldname].to"
                  type="date"
                  class="w-1/2 border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="To"
                />
              </div>
              
              <!-- Text field filter -->
              <input
                v-else
                v-model="customFilters[field.fieldname]"
                type="text"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :placeholder="`Filter by ${field.label}`"
              />
            </div>
            
            <div class="mb-3">
              <label class="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                v-model="sortOption"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="creation desc">Newest First</option>
                <option value="creation asc">Oldest First</option>
                <option v-for="field in sortableFields" :key="field.fieldname" :value="`${field.fieldname} asc`">
                  {{ field.label }} (A-Z)
                </option>
                <option v-for="field in sortableFields" :key="`${field.fieldname}-desc`" :value="`${field.fieldname} desc`">
                  {{ field.label }} (Z-A)
                </option>
              </select>
            </div>
            
            <div class="flex justify-between">
              <button 
                @click="resetFilters" 
                class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button 
                @click="applyFilters" 
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        <button 
          v-if="canCreate"
          @click="$router.push(`/${doctypeRoute}/new`)" 
          class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
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
    <div v-else-if="records.length === 0" class="bg-white rounded-lg shadow-md p-6 text-center">
      <ExclamationTriangleIcon class="h-12 w-12 mx-auto text-gray-400 mb-2" />
      <p class="text-gray-600">No {{ doctype }} found</p>
      <button 
        v-if="canCreate"
        @click="$router.push(`/${doctypeRoute}/new`)" 
        class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Create New {{ doctype }}
      </button>
    </div>

    <!-- Records List -->
    <div v-else class="space-y-4">
      <div
        v-for="record in records"
        :key="record.name"
        @click="$router.push(`/${doctypeRoute}/${record.name}`)"
        class="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">{{ record.name }}</span>
              <div v-if="record.status" :class="getStatusClass(record.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ record.status }}
              </div>
            </div>
            <h3 class="font-semibold text-gray-800 mt-1">{{ getRecordTitle(record) }}</h3>
            <div class="flex flex-wrap gap-4 mt-2">
              <div v-for="(field, index) in listDisplayFields" :key="index" class="flex items-center text-sm text-gray-500">
                <component :is="getFieldIcon(field)" class="h-4 w-4 mr-1" />
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
        class="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
      >
        Previous
      </button>
      <span class="text-sm text-gray-600">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  PlusIcon,
  ExclamationTriangleIcon,
  UserIcon,
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
const records = ref([]);
const loading = ref(true);
const formFields = ref([]);
const error = ref(null);
const linkFieldOptions = ref({});
const userPermissions = ref([]);
const canCreate = ref(false);

// List view state
const searchQuery = ref('');
const statusFilter = ref('');
const customFilters = ref({});
const dateFilters = ref({});
const sortOption = ref('creation desc');
const showFilterPanel = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);

// Computed properties
const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const activeFilters = computed(() => {
  return statusFilter.value !== '' || 
         searchQuery.value !== '' || 
         Object.values(customFilters.value).some(v => v !== '') ||
         Object.values(dateFilters.value).some(v => v.from || v.to);
});

const filterCount = computed(() => {
  let count = 0;
  if (statusFilter.value) count++;
  if (searchQuery.value) count++;
  
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

const fetchRecords = async () => {
  loading.value = true;
  try {
    const filters = { ...props.filters };
    
    // Apply user permissions as filters
    applyUserPermissionsToFilters(filters);

    // Add filter to only show records owned by the current user if showOnlyOwnRecords is true
    if (props.showOnlyOwnRecords) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        filters.owner = currentUser;
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

    // Fetch records
    const result = await api.fetchDocumentList({
      doctype: props.doctype,
      fields: ['*'],
      filters: filters,
      orFilters: searchConditions.length > 0 ? searchConditions : undefined,
      start: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      orderBy: sortOption.value
    });
    
    records.value = result.records;
    totalPages.value = Math.ceil(result.totalCount / pageSize.value);
    
  } catch (error) {
    console.error(`Error fetching ${props.doctype} records:`, error);
    error.value = `Failed to load ${props.doctype} records`;
  } finally {
    loading.value = false;
  }
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

// List view methods
const handleSearch = () => {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchRecords();
  }, 300);
};

const resetFilters = () => {
  statusFilter.value = '';
  sortOption.value = 'creation desc';
  searchQuery.value = '';
  customFilters.value = {};
  
  // Reset date filters
  for (const key in dateFilters.value) {
    dateFilters.value[key] = { from: '', to: '' };
  }
  
  showFilterPanel.value = false;
  currentPage.value = 1;
  fetchRecords();
};

const applyFilters = () => {
  showFilterPanel.value = false;
  currentPage.value = 1;
  fetchRecords();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchRecords();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchRecords();
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
    await checkPermissions();
    await fetchDoctypeFields();
    await fetchUserPermissions();
    await fetchRecords();
  } catch (error) {
    console.error('Error initializing component:', error);
    error.value = 'Failed to initialize component';
  }
  
  document.addEventListener('click', handleClickOutside);
});

watch(sortOption, () => {
  currentPage.value = 1;
  fetchRecords();
});

watch(() => props.doctype, async () => {
  loading.value = true;
  formFields.value = [];
  records.value = [];
  
  try {
    await checkPermissions();
    await fetchDoctypeFields();
    await fetchUserPermissions();
    await fetchRecords();
  } catch (error) {
    console.error('Error when doctype changed:', error);
  } finally {
    loading.value = false;
  }
});

watch(() => props.filters, () => {
  fetchRecords();
}, { deep: true });

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
</style>