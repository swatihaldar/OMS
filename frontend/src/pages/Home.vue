<template>
  <div class="bg-gray-50 min-h-screen pb-20">
    <div class="max-w-8xl mx-auto p-4">
      <!-- Welcome Section with Enhanced Design -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white relative overflow-hidden">
        <!-- Decorative elements -->
        <div class="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white opacity-10"></div>
        <div class="absolute -left-8 bottom-0 w-32 h-32 rounded-full bg-white opacity-5"></div>
        
        <div class="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white">Welcome back, {{ userName }}</h1>
            <p class="text-sm md:text-base text-blue-100 opacity-90 mt-1">{{ currentDate }}</p>
          </div>
          <div class="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md">
            <img v-if="userImage" :src="userImage" :alt="userName" class="h-full w-full object-cover" />
            <div v-else class="h-full w-full flex items-center justify-center bg-blue-400 text-white font-bold text-xl">
              {{ userInitials }}
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden group hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105">
            <div class="text-xs md:text-sm text-white mb-1 font-medium">My Open Issues</div>
            <div class="text-xl md:text-2xl font-bold text-white">{{ stats.openIssues }}</div>
            <div class="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden group hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105">
            <div class="text-xs md:text-sm text-white mb-1 font-medium">Completed Tasks</div>
            <div class="text-xl md:text-2xl font-bold text-white">{{ stats.completedTasks }}</div>
            <div class="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <!-- <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden group hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105">
            <div class="text-xs md:text-sm text-white mb-1 font-medium">Active Projects</div>
            <div class="text-xl md:text-2xl font-bold text-white">{{ stats.activeProjects || 3 }}</div>
            <div class="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div> -->
          <!-- <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 relative overflow-hidden group hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105">
            <div class="text-xs md:text-sm text-white mb-1 font-medium">Hours Logged</div>
            <div class="text-xl md:text-2xl font-bold text-white">{{ stats.hoursLogged || 24 }}</div>
            <div class="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div> -->
        </div>
      </div>
      
      <!-- Quick Actions with Enhanced Design -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-md p-5 transform transition-all duration-300 hover:shadow-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <button 
              @click="$router.push('/task/new')"
              class="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
            >
              <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">New Task</span>
            </button>
            <button 
              @click="$router.push('/issue/new')"
              class="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 group"
            >
              <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">Report Issue</span>
            </button>
            <button 
              @click="$router.push('/timesheet/new')"
              class="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 group"
            >
              <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">Log Time</span>
            </button>
            <button 
              @click="$router.push('/project')"
              class="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-200 group"
            >
              <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2 group-hover:bg-amber-200 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">Projects</span>
            </button>
          </div>
        </div>
        
        <!-- Location Map with Enhanced Design -->
        <div class="bg-white rounded-xl shadow-md p-5 transform transition-all duration-300 hover:shadow-lg md:col-span-2">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            My Location
          </h2>
          <div class="rounded-lg overflow-hidden h-[200px] bg-gray-100">
            <LocationMap />
          </div>
        </div>
      </div>
      
      <!-- Tasks Section -->
      <UserTasks />
      
    </div>
    
    <!-- Chart Popup -->
    <div v-if="showChartPopup" class="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-800">My Issue Status</h3>
          <button @click="showChartPopup = false" class="text-gray-500 hover:text-gray-700 transition-colors">
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
import LocationMap from '../components/LocationMap.vue';
import IssueChartStatus from '../components/IssueStatusChart.vue';

const userName = ref('User');
const userInitials = ref('U');
const userImage = ref('');
const currentDate = ref('');
const showChartPopup = ref(false);

const stats = ref({
  openIssues: 0,
  completedTasks: 0,
  activeProjects: 3,
  hoursLogged: 24
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
    
    // Try to get active projects count
    try {
      const projectsResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Project',
          filters: { 
            status: 'Open'
          },
          limit: 0,
          fields: ['count(name) as count']
        })
      });
      
      const projectsData = await projectsResponse.json();
      if (projectsData.message && projectsData.message.length > 0) {
        stats.value.activeProjects = projectsData.message[0].count || 3;
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    
    // Try to get hours logged
    try {
      const timesheetResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Timesheet',
          filters: { 
            owner: currentUser
          },
          limit: 0,
          fields: ['sum(total_hours) as total_hours']
        })
      });
      
      const timesheetData = await timesheetResponse.json();
      if (timesheetData.message && timesheetData.message.length > 0) {
        stats.value.hoursLogged = Math.round(timesheetData.message[0].total_hours || 0);
      }
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
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
.bg-gradient-to-r {
  background-size: 200% 200%;
  animation: gradientAnimation 15s ease infinite;
}

@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>