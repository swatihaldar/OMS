<template>
  <div class="bg-gradient-to-r from-blue-600 to-purple-700 shadow-md px-4 py-3 flex justify-between items-center text-white">
    <!-- Left side with title - adjusted padding for mobile -->
    <h1 class="text-xl font-bold ml-8 md:ml-0">{{ pageTitle }}</h1>
    
    <!-- Right side with notification and profile -->
    <div class="flex items-center space-x-4">
      <button class="relative p-1.5 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
      </button>

      <button @click="goToProfile" class="h-9 w-9 rounded-full bg-white bg-opacity-20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 flex items-center justify-center transition-transform hover:scale-110">
        <img v-if="userData && userData.user_image" :src="getUserImage(userData.user_image)" :alt="userData.full_name" class="h-full w-full object-cover" />
        <div v-else class="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium text-lg">
          {{ getInitials(userData?.full_name) }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const userData = ref(null);

// Dynamic title logic
const pageTitle = computed(() => {
  if (route.path.startsWith('/issue')) {
    return 'Issues';
  } else if (route.path.startsWith('/task')) {
    return 'Tasks';
  } else if (route.path.startsWith('/project')) {
    return 'Projects';
  } else if (route.path.startsWith('/timesheet')) {
    return 'Timesheets';
  } else if (route.path === '/profile') {
    return 'Profile';
  } else {
    return 'OMS';
  }
});

// Navigate to Profile Page
const goToProfile = () => {
  router.push('/profile');
};

const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const getUserImage = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/private/files')) {
    return `/api/method/frappe.utils.file_manager.download_file?file_url=${imagePath}`;
  }
  return imagePath;
};

const fetchUserData = async () => {
  try {
    const response = await fetch('/api/method/oms.api.get_current_user_info');
    const data = await response.json();

    if (data.message) {
      userData.value = data.message;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

onMounted(async () => {
  await fetchUserData();
});
</script>

<style scoped>
/* Ensure circular profile image */
button {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

button img, button div {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

/* Add subtle animation to notification bell */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-pulse {
  animation: pulse 2s infinite;
}
</style>