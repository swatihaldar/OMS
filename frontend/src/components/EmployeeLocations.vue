<template>
  <div class="bg-gray-50 min-h-screen p-6">
    <div class="max-w-8xl mx-auto">
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Employee Locations</h1>
        
        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Employees</label>
            <select v-model="selectedUsers" multiple class="w-full border-gray-300 rounded-md shadow-sm">
              <option v-for="user in allUsers" :key="user.name" :value="user.name">
                {{ user.full_name || user.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input type="datetime-local" v-model="fromDate" class="w-full border-gray-300 rounded-md shadow-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input type="datetime-local" v-model="toDate" class="w-full border-gray-300 rounded-md shadow-sm">
          </div>
          <div class="flex items-end">
            <button 
              @click="fetchLocations"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        <!-- Map -->
        <div class="rounded-lg overflow-hidden h-96 bg-gray-100 relative">
          <div v-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <div ref="mapContainer" class="h-full w-full"></div>
        </div>
        
        <!-- Location List -->
        <div class="mt-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Recent Locations</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="loc in locations" :key="loc.name">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                        <img :src="getUserImage(loc.user)" :alt="loc.user" class="h-full w-full object-cover">
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ getUserName(loc.user) }}</div>
                        <div class="text-sm text-gray-500">{{ loc.user }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ loc.address || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ loc.latitude.toFixed(6) }}, {{ loc.longitude.toFixed(6) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDateTime(loc.timestamp) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ loc.accuracy ? `${loc.accuracy.toFixed(0)} m` : 'N/A' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { fetchJson } from '../utils/fetch';

const selectedUsers = ref([]);
const fromDate = ref('');
const toDate = ref('');
const allUsers = ref([]);
const locations = ref([]);
const mapLoading = ref(true);
const mapContainer = ref(null);
let map = null;
let markers = [];

// Fetch all users for dropdown
const fetchAllUsers = async () => {
  try {
    const response = await fetchJson('/api/method/frappe.client.get_list', {
      method: 'POST',
      body: JSON.stringify({
        doctype: 'User',
        fields: ['name', 'full_name', 'user_image'],
        filters: { 'enabled': 1 },
        limit: 0
      })
    });
    
    allUsers.value = response.message || [];
  } catch (err) {
    console.error('Error fetching users:', err);
  }
};

// Fetch locations based on filters
const fetchLocations = async () => {
  try {
    const response = await fetchJson('/api/method/oms.api.get_user_locations', {
      method: 'POST',
      body: JSON.stringify({
        users: selectedUsers.value.length ? selectedUsers.value : allUsers.value.map(u => u.name),
        from_date: fromDate.value,
        to_date: toDate.value
      })
    });
    
    if (response.success) {
      locations.value = response.data;
      updateMap();
    }
  } catch (err) {
    console.error('Error fetching locations:', err);
  }
};

// Initialize map
const initMap = () => {
  if (!window.L) {
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(linkElement);
    
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    scriptElement.onload = () => {
      createMap();
    };
    document.head.appendChild(scriptElement);
  } else {
    createMap();
  }
};

// Create map with all locations
const createMap = () => {
  if (!window.L || !mapContainer.value) return;
  
  map = L.map(mapContainer.value).setView([20, 0], 2);
  
  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  
  mapLoading.value = false;
};

// Update map with markers
const updateMap = () => {
  if (!map) return;
  
  // Clear existing markers
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  
  // Add new markers
  locations.value.forEach(loc => {
    const user = allUsers.value.find(u => u.name === loc.user) || {};
    const popupContent = `
      <div class="p-2">
        <div class="font-bold">${user.full_name || loc.user}</div>
        <div>${formatDateTime(loc.timestamp)}</div>
        <div>Accuracy: ${loc.accuracy ? `${loc.accuracy.toFixed(0)} m` : 'N/A'}</div>
        ${loc.address ? `<div class="text-sm mt-1">${loc.address}</div>` : ''}
      </div>
    `;
    
    const marker = L.marker([loc.latitude, loc.longitude])
      .addTo(map)
      .bindPopup(popupContent);
    
    markers.push(marker);
  });
  
  // Fit map to markers if we have any
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
};

// Helper functions
const getUserName = (userId) => {
  const user = allUsers.value.find(u => u.name === userId);
  return user ? (user.full_name || userId) : userId;
};

const getUserImage = (userId) => {
  const user = allUsers.value.find(u => u.name === userId);
  if (!user || !user.user_image) return '';
  
  if (user.user_image.startsWith('/private/files')) {
    return `/api/method/frappe.utils.file_manager.download_file?file_url=${user.user_image}`;
  }
  return user.user_image;
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

onMounted(async () => {
  await fetchAllUsers();
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>