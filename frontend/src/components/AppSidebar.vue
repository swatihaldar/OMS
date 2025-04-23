<template>
  <div>
    <!-- Mobile overlay when sidebar is open -->
    <div 
      v-if="isOpen && isMobile" 
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
      @click="toggleSidebar"
    ></div>
    
    <!-- Sidebar -->
    <div 
      class="fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out shadow-xl"
      :class="[
        isMobile ? 'w-72' : 'w-64 lg:w-72',
        isOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- User profile section -->
      <div class="bg-gradient-to-r from-purple-800 to-blue-600 text-white p-5 relative overflow-hidden">
        <!-- Decorative elements -->
        <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white opacity-10"></div>
        <div class="absolute -left-6 -bottom-10 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div class="absolute right-10 bottom-0 w-16 h-16 rounded-full bg-white opacity-10"></div>
        
        <!-- Close button (mobile only)  -->
        <button 
          v-if="isMobile && isOpen"
          @click="toggleSidebar"
          class="absolute top-3 right-3 z-50 p-1.5 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200 transform hover:rotate-90"
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div class="flex items-center mb-3 relative z-10">
          <!-- avatar  -->
          <div 
            class="h-14 w-14 rounded-full bg-white overflow-hidden flex items-center justify-center mr-3 shadow-md border-2 border-white transition-transform duration-300 hover:scale-105"
            :class="{ 'animate-pulse': isLoading }"
          >
            <img 
              v-if="userData && userData.user_image" 
              :src="getUserImage(userData.user_image)" 
              :alt="userData.full_name" 
              class="h-full w-full object-cover"
              @load="isLoading = false"
            />
            <div 
              v-else 
              class="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xl"
            >
              {{ getInitials(userData?.full_name || 'User') }}
            </div>
          </div>
          
          <!-- User info  -->
          <div class="flex-1 overflow-hidden">
            <div v-if="isLoading" class="animate-pulse">
              <div class="h-5 bg-white bg-opacity-30 rounded w-3/4 mb-1"></div>
              <div class="h-3 bg-white bg-opacity-30 rounded w-1/2"></div>
            </div>
            <div v-else>
              <h3 class="font-semibold text-lg truncate">{{ userData?.full_name || 'User Name' }}</h3>
              <p class="text-xs text-blue-100 truncate opacity-90">{{ userData?.email || 'user@example.com' }}</p>
              <p v-if="userData?.user_id" class="text-xs text-blue-100 truncate opacity-75 mt-0.5">ID: {{ userData.user_id }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- search bar  -->
      <div class="px-4 py-3 bg-gradient-to-b from-purple-800 to-purple-900 border-b border-purple-700">
        <div class="relative group">
          <input 
            type="text" 
            placeholder="Search..." 
            class="w-full bg-purple-700 bg-opacity-40 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white focus:bg-purple-700 transition-all duration-200 group-hover:bg-purple-700"
            v-model="searchQuery"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-4 w-4 text-purple-300 absolute left-3 top-2.5 transition-colors duration-200 group-hover:text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="absolute right-3 top-2.5 text-purple-300 hover:text-white transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Menu items  -->
      <div class="bg-gradient-to-b from-purple-900 to-blue-900 h-[calc(100%-160px)] overflow-y-auto">
        <nav class="py-2">
          <!-- Home  -->
          <router-link 
            to="/" 
            class="group flex items-center px-4 py-2.5 mx-2 my-1 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200" 
            active-class="bg-white bg-opacity-20 text-white"
            @mouseenter="animateIcon('home')"
          >
            <div class="flex items-center w-full">
              <div 
                class="flex items-center justify-center h-8 w-8 rounded-md bg-white bg-opacity-10 text-white group-hover:bg-opacity-20 transition-all duration-200"
                :class="{ 'animate-bounce': activeIcon === 'home' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span class="ml-3 font-medium">Home</span>
            </div>
          </router-link>
          
          <!-- Issues with submenu -->
          <div class="relative my-1">
            <button 
              @click="toggleSubmenu('issues')" 
              @mouseenter="animateIcon('issues')"
              class="group flex items-center px-4 py-2.5 mx-2 rounded-lg w-full text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              :class="{ 'bg-white bg-opacity-20': isIssueActive || openSubmenus.issues }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center">
                  <div 
                    class="flex items-center justify-center h-8 w-8 rounded-md bg-white bg-opacity-10 text-white group-hover:bg-opacity-20 transition-colors duration-200"
                    :class="{ 'animate-pulse': activeIcon === 'issues' }"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <span class="ml-3 font-medium">Issues</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-4 w-4 transition-transform duration-300" 
                  :class="{ 'rotate-180': openSubmenus.issues }"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <!-- Issue submenu -->
            <div 
              class="overflow-hidden transition-all duration-300 pl-12 mx-2 rounded-b-lg"
              :class="openSubmenus.issues ? 'max-h-24 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'"
            >
              <router-link 
                to="/issue" 
                class="flex items-center px-4 py-2 text-sm text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-opacity-100 rounded-md transition-all duration-200 hover:translate-x-1" 
                active-class="text-white bg-white bg-opacity-10"
              >
                <span>Issue List</span>
              </router-link>
              <router-link 
                to="/issue/new" 
                class="flex items-center px-4 py-2 text-sm text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-opacity-100 rounded-md transition-all duration-200 hover:translate-x-1" 
                active-class="text-white bg-white bg-opacity-10"
              >
                <span>New Issue</span>
              </router-link>
            </div>
          </div>
          
          <!-- Tasks with submenu  -->
          <div class="relative my-1">
            <button 
              @click="toggleSubmenu('tasks')" 
              @mouseenter="animateIcon('tasks')"
              class="group flex items-center px-4 py-2.5 mx-2 rounded-lg w-full text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              :class="{ 'bg-white bg-opacity-20': isTaskActive || openSubmenus.tasks }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center">
                  <div 
                    class="flex items-center justify-center h-8 w-8 rounded-md bg-white bg-opacity-10 text-white group-hover:bg-opacity-20 transition-colors duration-200"
                    :class="{ 'animate-pulse': activeIcon === 'tasks' }"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span class="ml-3 font-medium">Tasks</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-4 w-4 transition-transform duration-300" 
                  :class="{ 'rotate-180': openSubmenus.tasks }"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <!-- Task submenu -->
            <div 
              class="overflow-hidden transition-all duration-300 pl-12 mx-2 rounded-b-lg"
              :class="openSubmenus.tasks ? 'max-h-24 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'"
            >
              <router-link 
                to="/task" 
                class="flex items-center px-4 py-2 text-sm text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-opacity-100 rounded-md transition-all duration-200 hover:translate-x-1" 
                active-class="text-white bg-white bg-opacity-10"
              >
                <span>Task List</span>
              </router-link>
              <router-link 
                to="/task/new" 
                class="flex items-center px-4 py-2 text-sm text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-opacity-100 rounded-md transition-all duration-200 hover:translate-x-1" 
                active-class="text-white bg-white bg-opacity-10"
              >
                <span>New Task</span>
              </router-link>
            </div>
          </div>
          
          <!-- Timesheets -->
          <router-link 
            to="/timesheet" 
            class="group flex items-center px-4 py-2.5 mx-2 my-1 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200" 
            active-class="bg-white bg-opacity-20 text-white"
            @mouseenter="animateIcon('timesheets')"
          >
            <div class="flex items-center w-full">
              <div 
                class="flex items-center justify-center h-8 w-8 rounded-md bg-white bg-opacity-10 text-white group-hover:bg-opacity-20 transition-colors duration-200"
                :class="{ 'animate-pulse': activeIcon === 'timesheets' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="ml-3 font-medium">Timesheets</span>
            </div>
          </router-link>
          
          <!-- My Profile -->
          <router-link 
            to="/profile" 
            class="group flex items-center px-4 py-2.5 mx-2 my-1 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200" 
            active-class="bg-white bg-opacity-20 text-white"
            @mouseenter="animateIcon('profile')"
          >
            <div class="flex items-center w-full">
              <div 
                class="flex items-center justify-center h-8 w-8 rounded-md bg-white bg-opacity-10 text-white group-hover:bg-opacity-20 transition-colors duration-200"
                :class="{ 'animate-pulse': activeIcon === 'profile' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span class="ml-3 font-medium">My Profile</span>
            </div>
          </router-link>
          
          <!-- Settings -->
          <!-- <router-link 
            to="/settings" 
            class="group flex items-center px-4 py-2.5 mx-2 my-1 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200" 
            active-class="bg-white bg-opacity-20 text-white"
            @mouseenter="animateIcon('settings')"
          >
            <div class="flex items-center w-full">
              <div 
                class="flex items-center justify-center h-8 w-8 rounded-md bg-white bg-opacity-10 text-white group-hover:bg-opacity-20 transition-colors duration-200"
                :class="{ 'animate-pulse': activeIcon === 'settings' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span class="ml-3 font-medium">Settings</span>
            </div>
          </router-link> -->
        </nav>
      </div>
      
      <!-- footer  -->
      <div class="absolute bottom-0 w-full bg-gradient-to-r from-purple-900 to-blue-900 border-t border-purple-800 py-3 px-4">
        <div class="flex items-center justify-between">
          <div class="text-xs text-white text-opacity-70 flex items-center">
            <div class="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></div>
            <span>OMS v1.0.0</span>
          </div>
          <router-link 
            to="/account/login" 
            class="p-2 rounded-full hover:bg-white hover:bg-opacity-10 text-white text-opacity-70 hover:text-opacity-100 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle']);

const route = useRoute();
const userData = ref(null);
const isLoading = ref(true);
const searchQuery = ref('');
const activeIcon = ref(null);
const openSubmenus = ref({
  issues: false,
  tasks: false
});

// Computed properties for active routes
const isIssueActive = computed(() => {
  return route.path.startsWith('/issue');
});

const isTaskActive = computed(() => {
  return route.path.startsWith('/task');
});

// Toggle submenu open/closed
const toggleSubmenu = (menu) => {
  openSubmenus.value[menu] = !openSubmenus.value[menu];
};

// Toggle sidebar open/closed
const toggleSidebar = () => {
  emit('toggle');
};

// Get user initials for avatar
const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

// Get user image URL
const getUserImage = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/private/files')) {
    return `/api/method/frappe.utils.file_manager.download_file?file_url=${imagePath}`;
  }
  return imagePath;
};

// Animate icon on hover
const animateIcon = (icon) => {
  activeIcon.value = icon;
  setTimeout(() => {
    if (activeIcon.value === icon) {
      activeIcon.value = null;
    }
  }, 1000);
};

// Fetch user data with enhanced error handling
const fetchUserData = async () => {
  isLoading.value = true;
  try {
    const response = await fetch('/api/method/oms.api.get_current_user_info');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.message) {
      userData.value = data.message;
      
      // If user_id is not provided, try to extract it from email
      if (!userData.value.user_id && userData.value.email) {
        const emailParts = userData.value.email.split('@');
        if (emailParts.length > 0) {
          userData.value.user_id = emailParts[0];
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Set fallback data for development/testing
    userData.value = {
      full_name: 'User Name',
      email: 'user@example.com',
      user_id: 'USR001'
    };
  } finally {
    // Delay turning off loading state for smoother transition
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  }
};

// Watch for route changes to update submenu state
watch(
  () => route.path,
  (newPath) => {
    openSubmenus.value.issues = newPath.startsWith('/issue');
    openSubmenus.value.tasks = newPath.startsWith('/task');
  },
  { immediate: true }
);

// Initialize component
onMounted(() => {
  fetchUserData();
});
</script>

<style scoped>
/* Enhanced animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.animate-bounce {
  animation: bounce 0.6s ease-in-out;
}

/* Hover transitions for menu items */
.router-link-active {
  position: relative;
}

.router-link-active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: #fff;
  border-radius: 0 3px 3px 0;
}

/* Custom scrollbar for sidebar content */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

/* Submenu item hover effect */
.hover\:translate-x-1:hover {
  transform: translateX(4px);
}
</style>