<template>
  <div class="bg-white rounded-xl shadow-md p-4 mb-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-3">Current Location</h2>
    
    <div v-if="loading" class="flex items-center justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Getting your location...</span>
    </div>
    
    <div v-else-if="error" class="bg-red-50 p-3 rounded-lg">
      <div class="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-red-800">{{ error }}</p>
          <div class="mt-2 flex space-x-2">
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
    
    <div v-else-if="location">
      <div class="flex items-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-gray-700">{{ locationAddress || 'Fetching address...' }}</span>
      </div>
      
      <div class="bg-gray-100 rounded-lg p-3 mb-3">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Latitude:</span>
            <span class="ml-1 font-medium">{{ location.latitude.toFixed(6) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Longitude:</span>
            <span class="ml-1 font-medium">{{ location.longitude.toFixed(6) }}</span>
          </div>
          <div v-if="location.accuracy">
            <span class="text-gray-500">Accuracy:</span>
            <span class="ml-1 font-medium">{{ location.accuracy.toFixed(0) }} m</span>
          </div>
          <div v-if="location.timestamp">
            <span class="text-gray-500">Updated:</span>
            <span class="ml-1 font-medium">{{ formatTime(location.timestamp) }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex justify-between">
        <button 
          @click="getLocation" 
          class="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        
        <button 
          @click="openMap" 
          class="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Open Map
        </button>
      </div>
    </div>
    
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
import { ref, onMounted, onUnmounted } from 'vue';

const location = ref(null);
const loading = ref(false);
const error = ref(null);
const locationAddress = ref('');
const watchId = ref(null);
const lastAddressUpdate = ref({
  latitude: null,
  longitude: null,
  timestamp: null
});

const requestPermission = async () => {
  try {
    // Try to request permission via the Permissions API
    if (navigator.permissions && navigator.permissions.query) {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissionStatus.state === 'prompt') {
        // This will trigger the permission prompt
        getLocation();
      } else if (permissionStatus.state === 'denied') {
        // Provide instructions to enable location in browser settings
        error.value = 'Please enable location access in your browser settings and refresh the page.';
        
        // Open browser settings if possible
        if (confirm('Would you like to open your browser settings to enable location access?')) {
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            // iOS devices
            alert('Please go to Settings > Safari > Location Services and enable for this website.');
          } else if (/Android/.test(navigator.userAgent)) {
            // Android devices
            alert('Please go to Settings > Site settings > Location and enable for this website.');
          } else {
            // Desktop browsers
            alert('Please click the lock/info icon in your address bar and enable location access.');
          }
        }
      } else {
        // Permission is already granted, try getting location
        getLocation();
      }
    } else {
      // Fallback for browsers without Permissions API
      getLocation();
    }
  } catch (err) {
    console.error('Error requesting permission:', err);
    getLocation(); // Fallback to standard geolocation request
  }
};

const getLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  navigator.geolocation.getCurrentPosition(
    position => {
      location.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      loading.value = false;
      
      // Try to get address from coordinates
      fetchAddress(position.coords.latitude, position.coords.longitude);
      
      // Start watching position for updates
      startWatchingPosition();
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
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};



const startWatchingPosition = () => {
  // Clear any existing watch
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value);
  }
  
  // Start a new watch
  watchId.value = navigator.geolocation.watchPosition(
    position => {
      location.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      
      // Only fetch address if coordinates changed significantly
      if (shouldUpdateAddress(position.coords.latitude, position.coords.longitude)) {
        fetchAddress(position.coords.latitude, position.coords.longitude);
      }
    },
    err => {
      console.error('Error watching position:', err);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
};

const shouldUpdateAddress = (lat, lng) => {
  if (!lastAddressUpdate.value.timestamp) return true;
  
  // Only update if more than 2 minutes passed or moved more than 100 meters
  const timeDiff = Date.now() - lastAddressUpdate.value.timestamp;
  if (timeDiff > 2 * 60 * 1000) return true;
  
  const distance = calculateDistance(
    lat, 
    lng, 
    lastAddressUpdate.value.latitude, 
    lastAddressUpdate.value.longitude
  );
  
  return distance > 0.1; // 100 meters
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

const fetchAddress = async (latitude, longitude) => {
  try {
    // Update last address update info
    lastAddressUpdate.value = {
      latitude,
      longitude,
      timestamp: Date.now()
    };
    
    // Try to use Nominatim API for reverse geocoding
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
    const data = await response.json();
    
    if (data && data.display_name) {
      locationAddress.value = data.display_name;
    } else {
      locationAddress.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    locationAddress.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

const openMap = () => {
  if (!location.value) return;
  
  // Open in Google Maps
  const url = `https://www.google.com/maps/search/?api=1&query=${location.value.latitude},${location.value.longitude}`;
  window.open(url, '_blank');
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  // Automatically get location when component mounts
  getLocation();
});

// Clean up the watch when component is unmounted
onUnmounted(() => {
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value);
  }
});
</script>