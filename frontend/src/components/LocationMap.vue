<template>
  <div class="location-map-container relative">
    <!-- Online/Offline Status -->
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="flex items-center">
          <div class="h-2 w-2 rounded-full mr-2" :class="isOnline ? 'bg-green-500' : 'bg-red-500'"></div>
          <span class="text-xs text-gray-600">{{ isOnline ? 'Online' : 'Offline' }}</span>
        </div>
        <div v-if="lastSyncTime" class="text-xs text-gray-500">
          Last sync: {{ formatTime(lastSyncTime) }}
        </div>
      </div>
      <div v-if="pendingSync > 0" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
        {{ pendingSync }} pending
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Getting your location...</span>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 p-3 rounded-lg">
      <div class="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-red-800">{{ error }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button 
              @click="getLocation" 
              class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
            >
              Try Again
            </button>
            <button 
              @click="requestPermission" 
              class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
            >
              Enable Location
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Success State -->
    <div v-else-if="location">
      <!-- Map Container with proper structure -->
      <div class="h-48 md:h-64 rounded-lg overflow-hidden mb-3 relative bg-gray-100">
        <div class="absolute inset-0 z-10" ref="mapContainer"></div>
        <div v-if="mapLoading" class="map-loading-overlay z-20">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
      
      <!-- Location Address Only -->
      <div class="flex items-start mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-gray-700 text-sm flex-1">{{ locationAddress || 'Fetching address...' }}</span>
      </div>
      
      <!-- Simple Status and Refresh Button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div v-if="saveStatus" class="text-xs px-2 py-1 rounded-full" :class="saveStatusClass">
            {{ saveStatus }}
          </div>
          <div v-if="lastSaved" class="text-xs text-gray-500">
            Updated: {{ formatTime(lastSaved) }}
          </div>
        </div>
        
        <button 
          @click="getLocation(true)" 
          :disabled="saving"
          class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ saving ? 'Updating...' : 'Refresh' }}
        </button>
      </div>
    </div>
    
    <!-- Initial State -->
    <div v-else class="text-center py-4">
      <button 
        @click="getLocation" 
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Get My Location
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  autoTrack: {
    type: Boolean,
    default: true
  },
  trackingInterval: {
    type: Number,
    default: 300000 // 5 minutes
  },
  autoSave: {
    type: Boolean,
    default: true // Automatically save location when obtained
  }
});

const emit = defineEmits(['location-updated', 'location-saved', 'error']);

// State
const location = ref(null);
const loading = ref(false);
const error = ref(null);
const locationAddress = ref('');
const mapLoading = ref(true);
const mapContainer = ref(null);
const saving = ref(false);
const saveStatus = ref('');
const lastSaved = ref(null);
const autoTracking = ref(false);
const isOnline = ref(navigator.onLine);
const lastSyncTime = ref(null);
const pendingSync = ref(0);

// Map variables
let map = null;
let marker = null;
let trackingInterval = null;
let appUsageInterval = null;

// Cache keys
const LOCATION_CACHE_KEY = 'user_location_cache';
const PENDING_LOCATIONS_KEY = 'pending_location_sync';
const LOCATION_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Computed
const saveStatusClass = computed(() => {
  switch (saveStatus.value) {
    case 'Saved':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    case 'Saving...':
      return 'bg-yellow-100 text-yellow-800';
    case 'Cached':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

// Methods
const loadCachedLocation = () => {
  try {
    const cachedData = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      
      // Use cached data if it's not expired or if we're offline
      if (now - timestamp < LOCATION_CACHE_EXPIRY || !isOnline.value) {
        location.value = data.location;
        locationAddress.value = data.address;
        lastSaved.value = new Date(data.lastSaved);
        
        // Initialize map with cached data
        nextTick(() => {
          initMap();
        });
        
        return true;
      }
    }
  } catch (err) {
    console.error('Error loading cached location:', err);
  }
  return false;
};

const cacheLocation = () => {
  try {
    const cacheData = {
      data: {
        location: location.value,
        address: locationAddress.value,
        lastSaved: lastSaved.value
      },
      timestamp: Date.now()
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Error caching location:', err);
  }
};

const loadLastSavedLocation = async () => {
  try {
    const response = await fetch('/api/method/oms.api.get_my_last_location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || ''
      }
    });
    
    const data = await response.json();
    
    if (data.message && data.message.success) {
      const locationData = data.message.data;
      location.value = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy_meters,
        timestamp: new Date(locationData.creation).getTime()
      };
      locationAddress.value = locationData.address || '';
      lastSaved.value = new Date(locationData.creation);
      
      // Initialize map with last known location
      nextTick(() => {
        initMap();
      });
      
      return true;
    }
  } catch (err) {
    console.error('Error loading last saved location:', err);
  }
  return false;
};

const requestPermission = async () => {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissionStatus.state === 'prompt') {
        getLocation();
      } else if (permissionStatus.state === 'denied') {
        error.value = 'Please enable location access in your browser settings and refresh the page.';
        
        if (confirm('Would you like to open your browser settings to enable location access?')) {
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            alert('Please go to Settings > Safari > Location Services and enable for this website.');
          } else if (/Android/.test(navigator.userAgent)) {
            alert('Please go to Settings > Site settings > Location and enable for this website.');
          } else {
            alert('Please click the lock/info icon in your address bar and enable location access.');
          }
        }
      } else {
        getLocation();
      }
    } else {
      getLocation();
    }
  } catch (err) {
    console.error('Error requesting permission:', err);
    getLocation();
  }
};

const getLocation = (manualRefresh = false) => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser';
    emit('error', error.value);
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  navigator.geolocation.getCurrentPosition(
    async position => {
      location.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      loading.value = false;
      
      // Fetch address
      await fetchAddress(position.coords.latitude, position.coords.longitude);
      
      // Auto-save if enabled or manual refresh
      if (props.autoSave || manualRefresh) {
        await saveLocationToDatabase(manualRefresh);
      }
      
      // Initialize map
      nextTick(() => {
        initMap();
      });
      
      // Cache location
      cacheLocation();
      
      emit('location-updated', location.value);
    },
    err => {
      loading.value = false;
      switch(err.code) {
        case err.PERMISSION_DENIED:
          error.value = 'Location access denied. Please enable location services.';
          break;
        case err.POSITION_UNAVAILABLE:
          error.value = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          error.value = 'The request to get location timed out.';
          break;
        default:
          error.value = 'An unknown error occurred.';
          break;
      }
      emit('error', error.value);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
};

const fetchAddress = async (latitude, longitude) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
      headers: {
        'User-Agent': 'OMS Location Tracker/1.0'
      }
    });
    const data = await response.json();
    
    if (data && data.display_name) {
      locationAddress.value = data.display_name;
      cacheLocation();
    } else {
      locationAddress.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    locationAddress.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

const saveLocationToDatabase = async (manualRefresh = false) => {
  if (!location.value) return;
  
  try {
    saving.value = true;
    saveStatus.value = 'Saving...';
    
    const deviceInfo = {
      userAgent: navigator.userAgent.substring(0, 50),
      platform: navigator.platform.substring(0, 30),
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
    
    if (isOnline.value) {
      const response = await fetch('/api/method/oms.api.save_user_location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Frappe-CSRF-Token': window.csrf_token || ''
        },
        body: JSON.stringify({
          latitude: location.value.latitude,
          longitude: location.value.longitude,
          accuracy: location.value.accuracy,
          address: locationAddress.value,
          device_info: JSON.stringify(deviceInfo),
          manual_refresh: manualRefresh
        })
      });
      
      const data = await response.json();
      
      if (data.message && data.message.success) {
        saveStatus.value = 'Saved';
        lastSaved.value = new Date();
        lastSyncTime.value = new Date();
        emit('location-saved', data.message.data);
        
        await syncPendingLocations();
        
        setTimeout(() => {
          saveStatus.value = '';
        }, 3000);
      } else {
        throw new Error(data.message?.message || 'Failed to save location');
      }
    } else {
      await saveLocationOffline(manualRefresh, deviceInfo);
    }
  } catch (err) {
    console.error('Error saving location:', err);
    
    if (isOnline.value) {
      saveStatus.value = 'Failed';
      const deviceInfo = {
        userAgent: navigator.userAgent.substring(0, 50),
        platform: navigator.platform.substring(0, 30),
        language: navigator.language,
        timestamp: new Date().toISOString()
      };
      await saveLocationOffline(manualRefresh, deviceInfo);
    }
    
    setTimeout(() => {
      saveStatus.value = '';
    }, 5000);
  } finally {
    saving.value = false;
  }
};

const saveLocationOffline = async (manualRefresh, deviceInfo) => {
  try {
    const pendingLocations = JSON.parse(localStorage.getItem(PENDING_LOCATIONS_KEY) || '[]');
    
    const locationData = {
      latitude: location.value.latitude,
      longitude: location.value.longitude,
      accuracy: location.value.accuracy,
      address: locationAddress.value,
      device_info: JSON.stringify(deviceInfo),
      manual_refresh: manualRefresh,
      timestamp: new Date().toISOString()
    };
    
    pendingLocations.push(locationData);
    localStorage.setItem(PENDING_LOCATIONS_KEY, JSON.stringify(pendingLocations));
    
    pendingSync.value = pendingLocations.length;
    saveStatus.value = 'Cached';
    
    setTimeout(() => {
      saveStatus.value = '';
    }, 3000);
  } catch (err) {
    console.error('Error saving location offline:', err);
  }
};

const syncPendingLocations = async () => {
  try {
    const pendingLocations = JSON.parse(localStorage.getItem(PENDING_LOCATIONS_KEY) || '[]');
    
    if (pendingLocations.length === 0) {
      pendingSync.value = 0;
      return;
    }
    
    for (const locationData of pendingLocations) {
      try {
        const response = await fetch('/api/method/oms.api.save_user_location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token || ''
          },
          body: JSON.stringify(locationData)
        });
        
        const data = await response.json();
        
        if (data.message && data.message.success) {
          const index = pendingLocations.indexOf(locationData);
          if (index > -1) {
            pendingLocations.splice(index, 1);
          }
        }
      } catch (err) {
        console.error('Error syncing location:', err);
        break;
      }
    }
    
    localStorage.setItem(PENDING_LOCATIONS_KEY, JSON.stringify(pendingLocations));
    pendingSync.value = pendingLocations.length;
    
    if (pendingLocations.length === 0) {
      lastSyncTime.value = new Date();
    }
  } catch (err) {
    console.error('Error syncing pending locations:', err);
  }
};

const initMap = () => {
  if (!location.value || !mapContainer.value) return;
  
  mapLoading.value = true;
  
  // Fix for Leaflet marker icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  if (!window.L) {
    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(linkElement);
    }

    // Load Leaflet JS if not already loaded
    if (!document.querySelector('script[src*="leaflet.js"]')) {
      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      scriptElement.onload = () => {
        createMap();
      };
      document.head.appendChild(scriptElement);
    } else if (window.L) {
      // If Leaflet is already loaded but we missed the onload event
      createMap();
    }
  } else {
    createMap();
  }
};

const createMap = () => {
  if (!window.L || !location.value) return;
  
  const { latitude, longitude } = location.value;
  
  // If map already exists, just update marker position
  if (map) {
    try {
      map.setView([latitude, longitude], 15);
      if (marker) {
        marker.setLatLng([latitude, longitude]);
      } else {
        marker = L.marker([latitude, longitude]).addTo(map);
      }
      
      // Add accuracy circle if it doesn't exist
      if (location.value.accuracy && !map.hasLayer(marker)) {
        L.circle([latitude, longitude], {
          radius: location.value.accuracy,
          color: 'blue',
          fillColor: '#3b82f6',
          fillOpacity: 0.2
        }).addTo(map);
      }
      
      mapLoading.value = false;
      return;
    } catch (e) {
      console.error('Error updating map:', e);
      // If there's an error, recreate the map
      if (map) map.remove();
      map = null;
      marker = null;
    }
  }
  
  // Create new map with error handling
  try {
    map = L.map(mapContainer.value, {
      preferCanvas: true, // Better performance for markers
      zoomControl: true
    }).setView([latitude, longitude], 15);
    
    // Add tile layer with error handling
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      detectRetina: true
    });
    
    tiles.addTo(map);
    
    // Add marker with error handling
    marker = L.marker([latitude, longitude], {
      title: 'Your Location',
      alt: 'Your Location Marker',
      riseOnHover: true
    }).addTo(map);
    
    // Add accuracy circle
    if (location.value.accuracy) {
      L.circle([latitude, longitude], {
        radius: location.value.accuracy,
        color: 'blue',
        fillColor: '#3b82f6',
        fillOpacity: 0.2
      }).addTo(map);
    }
    
    // Fix map display issues with multiple attempts
    const fixMapSize = () => {
      if (map) {
        try {
          map.invalidateSize();
          mapLoading.value = false;
        } catch (e) {
          console.error('Error fixing map size:', e);
        }
      }
    };
    
    // Try to fix map size immediately and after a short delay
    fixMapSize();
    setTimeout(fixMapSize, 100);
    setTimeout(fixMapSize, 500);
    
  } catch (e) {
    console.error('Error creating map:', e);
    mapLoading.value = false;
    error.value = 'Failed to load map. Please try again.';
    
    // Fallback to showing coordinates if map fails
    if (!locationAddress.value) {
      locationAddress.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }
};

const openMap = () => {
  if (!location.value) return;
  
  const url = `https://www.google.com/maps/search/?api=1&query=${location.value.latitude},${location.value.longitude}`;
  window.open(url, '_blank');
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const startAutoTracking = () => {
  if (trackingInterval || !props.autoTrack) return;
  
  autoTracking.value = true;
  
  trackingInterval = setInterval(() => {
    getLocation(false);
  }, props.trackingInterval);
};

const stopAutoTracking = () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  autoTracking.value = false;
};

// App usage tracking - automatically get location when user is active
const startAppUsageTracking = () => {
  let lastActivity = Date.now();
  let isTracking = false;
  
  const trackActivity = () => {
    lastActivity = Date.now();
    
    // If user is active and we haven't tracked recently, get location
    if (!isTracking && props.autoSave) {
      const timeSinceLastSave = lastSaved.value ? Date.now() - lastSaved.value.getTime() : Infinity;
      
      // Track every 10 minutes of activity
      if (timeSinceLastSave > 10 * 60 * 1000) {
        isTracking = true;
        getLocation(false).finally(() => {
          isTracking = false;
        });
      }
    }
  };
  
  // Listen for user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, trackActivity, { passive: true });
  });
  
  // Check for inactivity and stop tracking
  appUsageInterval = setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivity;
    
    // If inactive for more than 5 minutes, consider user away
    if (timeSinceActivity > 5 * 60 * 1000) {
      // User is inactive, don't track
    }
  }, 60000); // Check every minute
};

// Online/Offline event handlers
const handleOnline = () => {
  isOnline.value = true;
  syncPendingLocations();
};

const handleOffline = () => {
  isOnline.value = false;
};

// Lifecycle
onMounted(async () => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  const pendingLocations = JSON.parse(localStorage.getItem(PENDING_LOCATIONS_KEY) || '[]');
  pendingSync.value = pendingLocations.length;
  
  const hasCachedLocation = loadCachedLocation();
  
  if (hasCachedLocation) {
    nextTick(() => {
      initMap();
    });
  } else {
    await loadLastSavedLocation();
  }
  
  // Always get fresh location on mount if autoSave is enabled
  if (props.autoSave) {
    getLocation(false);
  }
  
  if (props.autoTrack) {
    setTimeout(() => {
      startAutoTracking();
    }, 5000);
  }
  
  // Start app usage tracking for automatic location saving
  if (props.autoSave) {
    startAppUsageTracking();
  }
  
  if (isOnline.value && pendingSync.value > 0) {
    syncPendingLocations();
  }
});

onUnmounted(() => {
  stopAutoTracking();
  
  if (appUsageInterval) {
    clearInterval(appUsageInterval);
  }
  
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
});

defineExpose({
  getLocation,
  startAutoTracking,
  stopAutoTracking,
  location,
  autoTracking
});
</script>

<style scoped>
.location-map-container {
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Ensure map stays below navigation */
:deep(.leaflet-container) {
  width: 100% !important;
  height: 100% !important;
  min-height: 200px;
  z-index: 10;
}

:deep(.leaflet-marker-icon) {
  background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
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
  background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png');
}

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
