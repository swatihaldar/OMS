<template>
  <div class="p-4">
  <!-- Search and Filter Bar -->
   
    <div class="bg-white rounded-lg shadow-sm p-2 mb-4 sticky top-0 z-50">
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="flex-1 relative">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search..."
            class="w-full pl-8 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @input="handleSearch"
          />
          <MagnifyingGlassIcon class="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
        </div>

        <!-- Filter Button -->
        <button 
          @click="showFilterPanel = !showFilterPanel"
          class="p-2 border rounded-lg hover:bg-gray-50 relative"
          :class="{'bg-blue-50 border-blue-300': isFiltered}"
        >
          <FunnelIcon class="h-5 w-5" :class="isFiltered ? 'text-blue-600' : 'text-gray-600'" />
          <span v-if="isFiltered" class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {{ activeFilterCount }}
          </span>
        </button>

        <button @click="$router.push('/issue/new')" class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
        <PlusIcon class="h-5 w-5 mr-1" />
        New
      </button>
      </div>

      <!-- Filter Panel -->
      <div v-if="showFilterPanel" class="mt-3 border-t pt-3 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="filters.status"
              class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @change="applyFilters"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Resolved">Resolved</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <!-- Sort -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
            <select
              v-model="sortBy"
              class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @change="applyFilters"
            >
              <option value="creation desc">Newest First</option>
              <option value="creation asc">Oldest First</option>
              <option value="priority desc">Priority (High to Low)</option>
              <option value="priority asc">Priority (Low to High)</option>
            </select>
          </div>
        </div>


        <!-- Column Visibility -->
        <!-- <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Show Columns</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="col in availableColumns"
              :key="col.field"
              class="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm"
              :class="{'bg-blue-100': visibleColumns.includes(col.field)}"
            >
              <input
                type="checkbox"
                :checked="visibleColumns.includes(col.field)"
                @change="toggleColumn(col.field)"
                class="rounded text-blue-600 focus:ring-blue-500 mr-1.5 h-3.5 w-3.5"
              />
              {{ col.label }}
            </label>
          </div>
        </div> -->

        <!-- Filter Actions -->
        <div class="flex justify-end space-x-2">
          <button 
            @click="resetFilters" 
            class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
          <button 
            @click="showFilterPanel = false" 
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>


    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredIssues.length === 0" class="bg-white rounded-lg shadow-md p-6 text-center">
      <ExclamationTriangleIcon class="h-12 w-12 mx-auto text-gray-400 mb-2" />
      <p class="text-gray-600">No issues found</p>
      <button @click="$router.push('/issue/new')" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
        Create New Issue
      </button>
    </div>

    <!-- Issues List -->
    <div v-else class="space-y-4">
      <div
        v-for="issue in filteredIssues"
        :key="issue.name"
        @click="$router.push(`/issue/${issue.name}`)"
        class="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">{{ issue.name }}</span>
              <div :class="getStatusClass(issue.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ issue.status }}
              </div>
            </div>
            <h3 class="font-semibold text-gray-800 mt-1">{{ issue.subject }}</h3>
            <div class="flex flex-wrap gap-4 mt-2">
              <div v-if="isColumnVisible('project')" class="flex items-center text-sm text-gray-500">
                <FolderIcon class="h-4 w-4 mr-1" />
                <span>{{ issue.project || 'No Project' }}</span>
              </div>
              <div v-if="isColumnVisible('priority')" class="flex items-center text-sm text-gray-500">
                <FlagIcon class="h-4 w-4 mr-1" />
                <span>Priority: {{ issue.priority || 'Medium' }}</span>
              </div>
              <div v-if="isColumnVisible('raised_by')" class="flex items-center text-sm text-gray-500">
                <UserIcon class="h-4 w-4 mr-1" />
                <span>{{ issue.custom_raised_by_contact || issue.raised_by || 'Unknown' }}</span>
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
import { ref, computed, onMounted, watch } from 'vue';
import {
  PlusIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  FlagIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline';

const issues = ref([]);
const loading = ref(true);
const currentUser = ref(null);
const showFilterPanel = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = 20;
const totalPages = ref(1);

// Filters
const filters = ref({
  search: '',
  status: '',
});

const sortBy = ref('creation desc');

// Column settings
const availableColumns = [
  { field: 'project', label: 'Project' },
  { field: 'priority', label: 'Priority' },
  { field: 'raised_by', label: 'Raised By' },
];

const visibleColumns = ref(['project', 'priority', 'raised_by']);

// Computed properties for filter state
const isFiltered = computed(() => {
  return filters.value.status !== '' || sortBy.value !== 'creation desc';
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.status) count++;
  if (sortBy.value !== 'creation desc') count++;
  return count;
});

const isColumnVisible = (column) => {
  return visibleColumns.value.includes(column);
};

const toggleColumn = (column) => {
  const index = visibleColumns.value.indexOf(column);
  if (index === -1) {
    visibleColumns.value.push(column);
  } else {
    visibleColumns.value.splice(index, 1);
  }
};

// Reset filters
const resetFilters = () => {
  filters.value.status = '';
  sortBy.value = 'creation desc';
  applyFilters();
};

// Status styling
const getStatusClass = (status) => {
  switch (status) {
    case 'Open':
      return 'bg-yellow-100 text-yellow-800';
    case 'Closed':
      return 'bg-green-100 text-green-800';
    case 'Resolved':
      return 'bg-blue-100 text-blue-800';
    case 'On Hold':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Computed filtered issues
const filteredIssues = computed(() => {
  let filtered = [...issues.value];

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    filtered = filtered.filter(
      issue =>
        issue.name.toLowerCase().includes(searchLower) ||
        issue.subject.toLowerCase().includes(searchLower)
    );
  }

  if (filters.value.status) {
    filtered = filtered.filter(issue => issue.status === filters.value.status);
  }

  return filtered;
});

// Debounced search
let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
};

// Pagination methods
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchIssues();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchIssues();
  }
};


const fetchIssues = async () => {
  loading.value = true;
  try {
    const userResponse = await fetch('/api/method/oms.api.get_current_user_info');
    const userData = await userResponse.json();
    currentUser.value = userData.message;


    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Issue',
        fields: [
          'name',
          'subject',
          'project',
          'status',
          'custom_raised_by_contact',
          'raised_by',
          'priority',
          'creation'
        ],
        filters: {
          raised_by: currentUser.value.name, 
          ...(filters.value.status && { status: filters.value.status }),
        },
        limit_start: (currentPage.value - 1) * pageSize,
        limit_page_length: pageSize,
        order_by: sortBy.value
      }),
    });

    const data = await response.json();
    
    if (data.message) {
      issues.value = data.message;
  
      const totalResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Issue',
          fields: ['name'],
          filters: {
            raised_by: currentUser.value.name,
            ...(filters.value.status && { status: filters.value.status }),
          },
          limit_page_length: 0
        }),
      });
      
      const totalData = await totalResponse.json();
      totalPages.value = Math.ceil(totalData.message.length / pageSize);
    }
  } catch (error) {
    console.error('Error fetching issues:', error);
  } finally {
    loading.value = false;
  }
};


watch([filters, sortBy], () => {
  currentPage.value = 1; 
  fetchIssues();
});

const applyFilters = () => {
  fetchIssues();
};


onMounted(() => {
  fetchIssues();
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-panel') && !e.target.closest('button')) {
      showFilterPanel.value = false;
    }
  });
});
</script>

