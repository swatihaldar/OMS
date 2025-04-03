<template>
  <div class="bg-gray-50 min-h-screen pb-20">
    <div class="p-4">
      <!-- Welcome Section -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Welcome back, {{ userName }}</h1>
            <p class="text-gray-600">{{ currentDate }}</p>
          </div>
          <div class="h-12 w-12 rounded-full overflow-hidden">
            <img v-if="userImage" :src="userImage" :alt="userName" class="h-full w-full object-cover" />
            <div v-else class="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
              {{ userInitials }}
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-sm text-blue-700 mb-1">Open Issues</div>
            <div class="text-2xl font-bold text-blue-900">{{ stats.openIssues }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <div class="text-sm text-green-700 mb-1">Completed Tasks</div>
            <div class="text-2xl font-bold text-green-900">{{ stats.completedTasks }}</div>
          </div>
        </div>
      </div>
      
      <!-- Issue Chart Status -->
      <!-- <div class="bg-white rounded-xl shadow-md p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Issue Status</h2>
          <button 
            @click="showChartPopup = true" 
            class="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            View Full Chart
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        
        <div class="h-64">
          <IssueChartStatus :statusCounts="{}" />
        </div>
      </div> -->
      
      <!-- Location Tracker -->
      <LocationTracker />
      
      <!-- Tasks Section -->
      <UserTasks />
      
      <!-- Quick Actions -->
      <QuickActions />
    </div>
    
    <!-- Chart Popup -->
    <div v-if="showChartPopup" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-medium">Issue Status</h3>
          <button @click="showChartPopup = false" class="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <div class="h-96">
            <IssueChartStatus :statusCounts="{}" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UserTasks from '../components/UserTasks.vue';
import QuickActions from '../components/QuickActions.vue';
import LocationTracker from '../components/LocationTracker.vue';
import IssueChartStatus from '../components/IssueStatusChart.vue'

const userName = ref('User');
const userInitials = ref('U');
const userImage = ref('');
const currentDate = ref('');
const showChartPopup = ref(false);

const stats = ref({
  openIssues: 0,
  completedTasks: 0
});

const formatDate = () => {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDate.value = now.toLocaleDateString('en-US', options);
};

const getUserInfo = async () => {
  try {
    // Try to get user info from custom API first
    try {
      const response = await fetch('/api/method/oms.api.get_current_user_info');
      const data = await response.json();
      
      if (data.message) {
        userName.value = data.message.full_name || data.message.name || 'User';
        
        // Get user image
        if (data.message.user_image) {
          userImage.value = getUserImage(data.message.user_image);
        }
        
        // Generate initials
        userInitials.value = getInitials(data.message.full_name || data.message.name);
        
        return;
      }
    } catch (error) {
      console.log('Custom API not available, trying standard method');
    }
    
    // Try to get user info from Frappe
    const response = await fetch('/api/method/frappe.auth.get_logged_user');
    const data = await response.json();
    
    if (data.message) {
      // Get user details
      const userResponse = await fetch('/api/method/frappe.client.get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'User',
          name: data.message
        })
      });
      
      const userData = await userResponse.json();
      
      if (userData.message) {
        userName.value = userData.message.full_name || userData.message.first_name || data.message;
        
        // Get user image
        if (userData.message.user_image) {
          userImage.value = getUserImage(userData.message.user_image);
        }
        
        // Generate initials
        userInitials.value = getInitials(userData.message.full_name || userData.message.first_name || data.message);
      } else {
        userName.value = data.message;
        userInitials.value = getInitials(data.message);
      }
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    // Default values
    userName.value = 'User';
    userInitials.value = 'U';
  }
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const getUserImage = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/private/files')) {
    return `/api/method/frappe.utils.file_manager.download_file?file_url=${imagePath}`;
  }
  return imagePath;
};

const fetchStats = async () => {
  try {
    // Get current user
    let currentUser = '';
    try {
      const userResponse = await fetch('/api/method/frappe.auth.get_logged_user');
      const userData = await userResponse.json();
      currentUser = userData.message;
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    // Fetch open issues count for current user
    const issuesResponse = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Issue',
        filters: { 
          status: 'Open',
          raised_by: currentUser
        },
        limit: 0,
        fields: ['count(name) as count']
      })
    });
    
    const issuesData = await issuesResponse.json();
    if (issuesData.message && issuesData.message.length > 0) {
      stats.value.openIssues = issuesData.message[0].count || 0;
    }
    
    // Fetch completed tasks count
    const tasksResponse = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Task',
        filters: { status: 'Completed' },
        limit: 0,
        fields: ['count(name) as count']
      })
    });
    
    const tasksData = await tasksResponse.json();
    if (tasksData.message && tasksData.message.length > 0) {
      stats.value.completedTasks = tasksData.message[0].count || 0;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

onMounted(async () => {
  formatDate();
  await getUserInfo();
  await fetchStats();
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>