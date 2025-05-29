<template>
  <div class="location-manager p-4 sm:p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Location Manager</h1>
      <p class="text-gray-600">Monitor and track user locations in real-time</p>
    </div>

    <!-- Controls -->
    <div class="bg-white rounded-xl shadow-sm border p-3 sm:p-4 mb-6">
      <div class="flex flex-col space-y-3 sm:space-y-4">
        <!-- First Row: Filters -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <!-- User Filter -->
          <div class="w-full sm:min-w-[180px] sm:max-w-[220px]">
            <label class="block text-xs font-medium text-gray-700 mb-1">Filter by User</label>
            <select 
              v-model="selectedUser" 
              @change="fetchLocations"
              class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              <option v-for="user in allUsers" :key="user.user_id" :value="user.user_id">
                {{ user.full_name || user.user_id }}
              </option>
            </select>
          </div>
          
          <!-- Auto Refresh Toggle -->
          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="autoRefresh" 
                @change="toggleAutoRefresh"
                class="sr-only"
              >
              <div class="relative">
                <div class="block bg-gray-600 w-10 h-6 rounded-full" :class="autoRefresh ? 'bg-green-600' : 'bg-gray-600'"></div>
                <div class="dot absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition" :class="autoRefresh ? 'transform translate-x-4' : ''"></div>
              </div>
              <span class="ml-2 text-xs font-medium text-gray-700">Auto Refresh</span>
            </label>
          </div>
        </div>
        
        <!-- Second Row: Actions and Status -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-gray-500">Last updated: {{ lastUpdated }}</span>
            <span v-if="userLocations.length > 0" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {{ userLocations.length }} users tracked
            </span>
          </div>
          
          <div class="flex space-x-2">
            <!-- Manager Location Controls -->
            <button 
              @click="refreshMyLocation" 
              :disabled="refreshingMyLocation"
              class="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ refreshingMyLocation ? 'Saving...' : 'My Location' }}
            </button>
            
            <button 
              @click="fetchLocations" 
              :disabled="loading"
              class="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ loading ? 'Loading...' : 'Refresh All' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map View -->
    <div class="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold text-gray-900">Live Location Map</h2>
      </div>
      <div class="relative">
        <div class="h-64 sm:h-80 lg:h-96 w-full" ref="mapContainer">
          <div v-if="mapLoading" class="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Loading map...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- User Locations List -->
    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold text-gray-900">User Locations ({{ userLocations.length }})</h2>
      </div>
      
      <div v-if="loading && userLocations.length === 0" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading user locations...</p>
      </div>
      
      <div v-else-if="error" class="p-4 bg-red-50 border-l-4 border-red-500">
        <p class="text-red-800">{{ error }}</p>
      </div>
      
      <div v-else-if="userLocations.length === 0" class="p-8 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p>No user locations found</p>
      </div>
      
      <div v-else class="divide-y divide-gray-200">
        <div v-for="userLocation in userLocations" :key="userLocation.name" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center space-x-4">
              <!-- User Avatar -->
              <div class="flex-shrink-0">
                <div class="h-12 w-12 rounded-full overflow-hidden bg-gray-300">
                  <img 
                    v-if="userLocation.user_image" 
                    :src="getUserImage(userLocation.user_image)" 
                    :alt="userLocation.full_name"
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="h-full w-full flex items-center justify-center text-gray-600 font-medium">
                    {{ getInitials(userLocation.full_name || userLocation.user) }}
                  </div>
                </div>
              </div>
              
              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  {{ userLocation.full_name || userLocation.user }}
                </h3>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span v-if="userLocation.department" class="truncate">{{ userLocation.department }}</span>
                  <span v-if="userLocation.designation" class="truncate">{{ userLocation.designation }}</span>
                  <span class="flex items-center">
                    <div class="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                    {{ userLocation.time_ago }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Location Info & Actions -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="text-left sm:text-right text-sm">
                <p class="text-gray-900 font-medium">
                  {{ formatCoordinates(userLocation.latitude, userLocation.longitude) }}
                </p>
                <p class="text-gray-500">
                  Accuracy: {{ userLocation.accuracy_meters ? userLocation.accuracy_meters.toFixed(0) + 'm' : 'Unknown' }}
                </p>
              </div>
              
              <div class="flex space-x-2">
                <button 
                  @click="viewUserOnMap(userLocation)" 
                  class="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                  title="View on map"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button 
                  @click="viewLocationHistory(userLocation)" 
                  class="text-green-600 hover:text-green-800 transition-colors p-2 rounded-lg hover:bg-green-50"
                  title="View history"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button 
                  @click="openInGoogleMaps(userLocation)" 
                  class="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  title="Open in Google Maps"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Address -->
          <div v-if="userLocation.address" class="mt-2 text-sm text-gray-600 ml-0 sm:ml-16">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ userLocation.address }}
          </div>
        </div>
      </div>
    </div>

    <!-- Location History Modal -->
    <div v-if="showHistoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold">Location History - {{ selectedUserForHistory?.full_name }}</h3>
          <button @click="closeHistoryModal" class="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-4 overflow-y-auto max-h-[70vh]">
          <LocationHistory :user-id="selectedUserForHistory?.user" v-if="selectedUserForHistory" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import LocationHistory from './LocationHistory.vue';
import * as L from 'leaflet';

// State
const userLocations = ref([]);
const allUsers = ref([]);
const loading = ref(false);
const error = ref(null);
const mapContainer = ref(null);
const mapLoading = ref(true);
const autoRefresh = ref(true);
const lastUpdated = ref('');
const selectedUser = ref('');
const showHistoryModal = ref(false);
const selectedUserForHistory = ref(null);
const refreshingMyLocation = ref(false);

// Map
let map = null;
let markers = {};
let refreshInterval = null;

// Methods
const fetchAllUsers = async () => {
  try {
    const response = await fetch('/api/method/oms.api.get_all_users_for_tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || ''
      }
    });
    
    const data = await response.json();
    
    if (data.message && data.message.success) {
      allUsers.value = data.message.data;
    } else {
      console.error('Failed to fetch users:', data.message?.message);
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  }
};

const fetchLocations = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await fetch('/api/method/oms.api.get_user_locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || ''
      },
      body: JSON.stringify({
        user_filter: selectedUser.value || null,
        limit: 50
      })
    });
    
    const data = await response.json();
    
    if (data.message && data.message.success) {
      userLocations.value = data.message.data;
      lastUpdated.value = new Date().toLocaleTimeString();
      
      updateMap();
    } else {
      error.value = data.message?.message || 'Failed to fetch user locations';
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while fetching locations';
    console.error('Error fetching locations:', err);
  } finally {
    loading.value = false;
  }
};

const initMap = () => {
  if (!mapContainer.value) return;
  
  mapLoading.value = true;
  
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

const createMap = () => {
  if (!window.L) return;
  
  map = L.map(mapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    dragging: true,
    touchZoom: true
  }).setView([40.7128, -74.0060], 10);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  
  updateMap();
  
  setTimeout(() => {
    map.invalidateSize();
    mapLoading.value = false;
  }, 100);
};

const updateMap = () => {
  if (!map) return;
  
  // Clear existing markers
  Object.values(markers).forEach(marker => {
    map.removeLayer(marker);
  });
  markers = {};
  
  if (userLocations.value.length === 0) return;
  
  const bounds = [];
  
  userLocations.value.forEach(userLocation => {
    if (userLocation.latitude && userLocation.longitude) {
      const lat = parseFloat(userLocation.latitude);
      const lng = parseFloat(userLocation.longitude);
      
      const iconHtml = `
        <div class="relative">
          <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white bg-blue-500">
            ${getInitials(userLocation.full_name || userLocation.user)}
          </div>
          <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white bg-green-500"></div>
        </div>
      `;
      
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      
      const popupContent = `
        <div class="p-2">
          <h4 class="font-semibold text-gray-900">${userLocation.full_name || userLocation.user}</h4>
          <p class="text-sm text-gray-600">${userLocation.department || ''} ${userLocation.designation || ''}</p>
          <p class="text-xs text-gray-500">Last seen: ${userLocation.time_ago}</p>
          ${userLocation.address ? `<p class="text-xs text-gray-500 mt-1">${userLocation.address}</p>` : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markers[userLocation.name] = marker;
      bounds.push([lat, lng]);
    }
  });
  
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }
};

const viewUserOnMap = (userLocation) => {
  if (!map || !userLocation.latitude || !userLocation.longitude) return;
  
  const lat = parseFloat(userLocation.latitude);
  const lng = parseFloat(userLocation.longitude);
  
  map.setView([lat, lng], 15);
  
  if (markers[userLocation.name]) {
    markers[userLocation.name].openPopup();
  }
  
  // Scroll to map on mobile
  if (window.innerWidth < 768) {
    mapContainer.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const viewLocationHistory = (userLocation) => {
  selectedUserForHistory.value = userLocation;
  showHistoryModal.value = true;
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  selectedUserForHistory.value = null;
};

const openInGoogleMaps = (userLocation) => {
  if (!userLocation.latitude || !userLocation.longitude) return;
  
  const url = `https://www.google.com/maps/search/?api=1&query=${userLocation.latitude},${userLocation.longitude}`;
  window.open(url, '_blank');
};

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const startAutoRefresh = () => {
  if (refreshInterval) return;
  
  refreshInterval = setInterval(() => {
    fetchLocations();
  }, 30000);
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const refreshMyLocation = async () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  
  refreshingMyLocation.value = true;
  
  navigator.geolocation.getCurrentPosition(
    async position => {
      try {
        // Fetch address
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`, {
          headers: {
            'User-Agent': 'OMS Location Tracker/1.0'
          }
        });
        const addressData = await response.json();
        const address = addressData?.display_name || `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        
        // Save location
        const deviceInfo = {
          userAgent: navigator.userAgent.substring(0, 50),
          platform: navigator.platform.substring(0, 30),
          language: navigator.language,
          timestamp: new Date().toISOString()
        };
        
        const saveResponse = await fetch('/api/method/oms.api.save_user_location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token || ''
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: address,
            device_info: JSON.stringify(deviceInfo),
            manual_refresh: true
          })
        });
        
        const saveData = await saveResponse.json();
        
        if (saveData.message && saveData.message.success) {
          // Refresh the locations list
          await fetchLocations();
          alert('Your location has been saved successfully!');
        } else {
          throw new Error(saveData.message?.message || 'Failed to save location');
        }
      } catch (err) {
        console.error('Error saving manager location:', err);
        alert('Failed to save location: ' + err.message);
      }
    },
    err => {
      console.error('Geolocation error:', err);
      let errorMessage = 'Failed to get location: ';
      switch(err.code) {
        case err.PERMISSION_DENIED:
          errorMessage += 'Location access denied. Please enable location services.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          errorMessage += 'The request to get location timed out.';
          break;
        default:
          errorMessage += 'An unknown error occurred.';
          break;
      }
      alert(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
  
  refreshingMyLocation.value = false;
};

// Utility functions
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatCoordinates = (lat, lng) => {
  if (!lat || !lng) return 'No location';
  return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
};

const getUserImage = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/private/files')) {
    return `/api/method/frappe.utils.file_manager.download_file?file_url=${imagePath}`;
  }
  return imagePath;
};

// Lifecycle
onMounted(async () => {
  await fetchAllUsers();
  await fetchLocations();
  initMap();
  
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
  
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

:deep(.leaflet-popup-content) {
  margin: 0;
}

/* Fix z-index hierarchy */
:deep(.leaflet-container) {
  z-index: 10 !important;
}

:deep(.leaflet-control-container) {
  z-index: 15 !important;
}

:deep(.leaflet-map-pane) {
  z-index: 10 !important;
}

:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 15 !important;
}

/* Fix marker display */
:deep(.leaflet-marker-icon) {
  z-index: 12 !important;
}

:deep(.leaflet-marker-shadow) {
  z-index: 11 !important;
}

.dot {
  transition: transform 0.3s ease;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .location-manager {
    padding: 0.75rem;
  }
  
  .grid {
    gap: 0.75rem;
  }
}

/* Ensure proper stacking order */
.location-manager {
  position: relative;
  z-index: 1;
}
</style>
