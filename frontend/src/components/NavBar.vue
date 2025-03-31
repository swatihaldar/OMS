<template>
  <div class="bg-white shadow-md px-4 py-3 flex justify-between items-center">
    <h1 class="text-xl font-bold text-gray-800">{{ pageTitle }}</h1>
    
    <div class="flex items-center space-x-4">
      <BellIcon class="h-6 w-6 text-gray-600" />

      <button @click="goToProfile" class="h-9 w-9 rounded-full bg-gray-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center">
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
import { BellIcon } from '@heroicons/vue/24/outline';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const userData = ref(null);

// Dynamic title logic
const pageTitle = computed(() => (route.path.startsWith('/issue') ? 'Issue' : 'OMS'));

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

onMounted(async () => {
  try {
    const response = await fetch('/api/method/oms.api.get_current_user_info');
    const data = await response.json();

    if (data.message) {
      userData.value = data.message;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
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
</style>