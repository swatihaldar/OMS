<template>
  <div class="bg-gray-50 min-h-screen pb-20">
    <div class="p-4 max-w-7xl mx-auto">
      <!-- Welcome Section -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-xl md:text-2xl font-bold md:font-bold text-gray-800">Welcome back, {{ userName }}</h1>
            <p class="text-sm md:text-base text-gray-600">{{ currentDate }}</p>
          </div>
          <div class="h-12 w-12 rounded-full overflow-hidden">
            <img v-if="userImage" :src="userImage" :alt="userName" class="h-full w-full object-cover" />
            <div v-else class="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
              {{ userInitials }}
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mt-3">
          <div class="bg-blue-50 rounded-lg p-3 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div class="text-xs md:text-sm text-blue-700 mb-1">My Open Issues</div>
            <div class="text-xl md:text-2xl font-bold text-blue-900">{{ stats.openIssues }}</div>
            <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="bg-green-50 rounded-lg p-3 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div class="text-xs md:text-sm text-green-700 mb-1">My Completed Tasks</div>
            <div class="text-xl md:text-2xl font-bold text-green-900">{{ stats.completedTasks }}</div>
            <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="max-w-lg ml-4">
        <QuickActions />
      </div>
      
      <!-- Issue Chart Button -->
      <!-- <div class="bg-white rounded-xl shadow-md p-4 mb-4 flex justify-between items-center">
        <h2 class="text-base md:text-lg font-semibold text-gray-800">Issue Status</h2>
        <button 
          @click="showChartPopup = true" 
          class="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Chart
        </button>
      </div> -->
      
      <!-- Location Map -->
      <div class="bg-white rounded-xl shadow-md p-4 mb-4">
        <h2 class="text-base md:text-lg font-semibold text-gray-800 mb-3">My Location</h2>
        <LocationMap />
      </div>
      
      <!-- Tasks Section -->
      <UserTasks />
      
    </div>
    
    <!-- Chart Popup -->
    <div v-if="showChartPopup" class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-medium">My Issue Status</h3>
          <button @click="showChartPopup = false" class="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <div class="h-96">
            <IssueChartStatus :statusCounts="{}" :showChart="true" />
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
import LocationMap from '../components/LocationMap.vue';
import IssueChartStatus from '../components/IssueStatusChart.vue';

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
    
    if (!currentUser) return;
    
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
    
    // Try multiple approaches to get completed tasks count for current user
    
    // Approach 1: Try with _assign field (JSON field that contains assigned users)
    try {
      const tasksResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Task',
          filters: { 
            status: 'Completed'
          },
          limit: 0,
          fields: ['name', '_assign']
        })
      });
      
      const tasksData = await tasksResponse.json();
      if (tasksData.message && tasksData.message.length > 0) {
        // Filter tasks assigned to current user
        const userTasks = tasksData.message.filter(task => {
          if (!task._assign) return false;
          try {
            const assignedUsers = JSON.parse(task._assign);
            return assignedUsers.includes(currentUser);
          } catch (e) {
            return false;
          }
        });
        
        stats.value.completedTasks = userTasks.length;
      }
    } catch (error) {
      console.error('Error with approach 1:', error);
    }
    
    // If approach 1 didn't find any tasks, try approach 2
    if (stats.value.completedTasks === 0) {
      try {
        // Approach 2: Try with owner field
        const ownerTasksResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctype: 'Task',
            filters: { 
              status: 'Completed',
              owner: currentUser
            },
            limit: 0,
            fields: ['count(name) as count']
          })
        });
        
        const ownerTasksData = await ownerTasksResponse.json();
        if (ownerTasksData.message && ownerTasksData.message.length > 0) {
          stats.value.completedTasks = ownerTasksData.message[0].count || 0;
        }
      } catch (error) {
        console.error('Error with approach 2:', error);
      }
    }
    
    // If approach 2 didn't find any tasks, try approach 3
    if (stats.value.completedTasks === 0) {
      try {
        // Approach 3: Try with custom field or different filter
        const customTasksResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctype: 'Task',
            filters: { 
              status: 'Completed'
            },
            or_filters: {
              owner: currentUser,
              modified_by: currentUser
            },
            limit: 0,
            fields: ['count(name) as count']
          })
        });
        
        const customTasksData = await customTasksResponse.json();
        if (customTasksData.message && customTasksData.message.length > 0) {
          stats.value.completedTasks = customTasksData.message[0].count || 0;
        }
      } catch (error) {
        console.error('Error with approach 3:', error);
      }
    }
    
    // If all approaches failed, try a more general approach
    if (stats.value.completedTasks === 0) {
      try {
        // Approach 4: Get all completed tasks and check if user is mentioned in any field
        const allTasksResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctype: 'Task',
            filters: { 
              status: 'Completed'
            },
            limit: 50,
            fields: ['name']
          })
        });
        
        const allTasksData = await allTasksResponse.json();
        if (allTasksData.message && allTasksData.message.length > 0) {
          let userTaskCount = 0;
          
          // For each task, get full details and check if user is mentioned
          for (const task of allTasksData.message) {
            const taskDetailResponse = await fetch('/api/method/frappe.client.get', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                doctype: 'Task',
                name: task.name
              })
            });
            
            const taskDetail = await taskDetailResponse.json();
            if (taskDetail.message) {
              // Check various fields where user might be mentioned
              const taskData = JSON.stringify(taskDetail.message);
              if (taskData.includes(currentUser)) {
                userTaskCount++;
              }
            }
          }
          
          stats.value.completedTasks = userTaskCount;
        }
      } catch (error) {
        console.error('Error with approach 4:', error);
      }
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