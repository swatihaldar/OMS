<template>
  <div class="p-4">
    <!-- Search and Filter Bar -->
    <div class="bg-white rounded-lg shadow-sm p-2 mb-4 sticky top-0 z-50">
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by ID or subject..."
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
            <div class="mb-3">
              <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                v-model="statusFilter"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Resolved">Resolved</option>
                <option value="Replied">Replied</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                v-model="sortOption"
                class="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="creation desc">Newest First</option>
                <option value="creation asc">Oldest First</option>
                <option value="priority desc">Priority (High to Low)</option>
                <option value="priority asc">Priority (Low to High)</option>
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

        <button @click="$router.push('/issue/new')" class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
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
    <div v-else-if="issues.length === 0" class="bg-white rounded-lg shadow-md p-6 text-center">
      <ExclamationTriangleIcon class="h-12 w-12 mx-auto text-gray-400 mb-2" />
      <p class="text-gray-600">No issues found</p>
      <button @click="$router.push('/issue/new')" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
        Create New Issue
      </button>
    </div>

    <!-- Issues List -->
    <div v-else class="space-y-4">
      <div
        v-for="issue in issues"
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
              <div class="flex items-center text-sm text-gray-500">
                <FolderIcon class="h-4 w-4 mr-1" />
                <span>{{ issue.project || 'No Project' }}</span>
              </div>
              <div class="flex items-center text-sm text-gray-500">
                <FlagIcon class="h-4 w-4 mr-1" />
                <span>Priority: {{ issue.priority || 'Medium' }}</span>
              </div>
              <div class="flex items-center text-sm text-gray-500">
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
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
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

// Search and filter state
const searchQuery = ref('');
const statusFilter = ref('');
const sortOption = ref('creation desc');

// Pagination
const currentPage = ref(1);
const pageSize = 20;
const totalPages = ref(1);

// Computed properties
const activeFilters = computed(() => {
  return statusFilter.value !== '' || searchQuery.value !== '';
});

const filterCount = computed(() => {
  let count = 0;
  if (statusFilter.value) count++;
  if (searchQuery.value) count++;
  return count;
});

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

// Reset all filters
const resetFilters = () => {
  statusFilter.value = '';
  sortOption.value = 'creation desc';
  searchQuery.value = '';
  showFilterPanel.value = false;
  currentPage.value = 1;
  fetchIssues();
};

// Apply filters and close the panel
const applyFilters = () => {
  showFilterPanel.value = false;
  currentPage.value = 1;
  fetchIssues();
};

// Debounced search
let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchIssues();
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

// Fetch issues from the server
const fetchIssues = async () => {
  loading.value = true;
  try {
    // Get current user
    const userResponse = await fetch('/api/method/oms.api.get_current_user_info');
    const userData = await userResponse.json();
    currentUser.value = userData.message;

    // Prepare filters
    const filters = {
      raised_by: currentUser.value.name
    };
    
    // Add status filter if selected
    if (statusFilter.value) {
      filters.status = statusFilter.value;
    }
    
    // Prepare search conditions
    let searchConditions = [];
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim();
      // Search in name field
      searchConditions.push(['Issue', 'name', 'like', `%${query}%`]);
      // Search in subject field
      searchConditions.push(['Issue', 'subject', 'like', `%${query}%`]);
    }

    // Fetch issues
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
        filters: filters,
        or_filters: searchConditions.length > 0 ? searchConditions : undefined,
        limit_start: (currentPage.value - 1) * pageSize,
        limit_page_length: pageSize,
        order_by: sortOption.value
      }),
    });

    const data = await response.json();
    
    if (data.message) {
      issues.value = data.message;
  
      // Get total count for pagination
      const totalResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Issue',
          fields: ['name'],
          filters: filters,
          or_filters: searchConditions.length > 0 ? searchConditions : undefined,
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

// Watch for changes in sort option to refetch data
watch(sortOption, () => {
  currentPage.value = 1;
  fetchIssues();
});

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

onMounted(() => {
  fetchIssues();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style>
/* Fix for mobile filter panel */
@media (max-width: 640px) {
  .filter-dropdown {
    position: absolute;
    right: 0;
    width: 250px;
    z-index: 100;
  }
}
</style>