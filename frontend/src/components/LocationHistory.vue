<template>
  <div class="location-history">
    <!-- Date Range Selector -->
    <div class="mb-4 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
        <input 
          v-model="fromDate" 
          type="date" 
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="fetchHistory"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
        <input 
          v-model="toDate" 
          type="date" 
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="fetchHistory"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Limit</label>
        <select 
          v-model="limit" 
          @change="fetchHistory" 
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="50">50 records</option>
          <option value="100">100 records</option>
          <option value="200">200 records</option>
        </select>
      </div>
      <button 
        @click="fetchHistory" 
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Refresh
      </button>
    </div>

    <!-- History Map -->
    <div class="bg-white rounded-lg border mb-4 overflow-hidden">
      <div class="p-3 border-b">
        <h4 class="font-semibold text-gray-900">Location Trail</h4>
      </div>
      <div class="relative">
        <div class="h-64 w-full" ref="historyMapContainer">
          <div v-if="mapLoading" class="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- History List -->
    <div class="bg-white rounded-lg border overflow-hidden">
      <div class="p-3 border-b">
        <h4 class="font-semibold text-gray-900">Location History ({{ history.length }} records)</h4>
      </div>
      
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading location history...</p>
      </div>
      
      <div v-else-if="error" class="p-4 bg-red-50 border-l-4 border-red-500">
        <p class="text-red-800">{{ error }}</p>
      </div>
      
      <div v-else-if="history.length === 0" class="p-8 text-center text-gray-500">
        <p>No location history found for the selected period</p>
      </div>
      
      <div v-else class="max-h-96 overflow-y-auto">
        <div v-for="(record, index) in history" :key="record.name" class="p-3 border-b last:border-b-0 hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-sm font-medium text-gray-900">
                  {{ formatDateTime(record.creation) }}
                </span>
                <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {{ formatCoordinates(record.latitude, record.longitude) }}
                </span>
                <span v-if="record.manual_refresh" class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                  Manual
                </span>
              </div>
              
              <p v-if="record.address" class="text-sm text-gray-600 mb-1">
                {{ record.address }}
              </p>
              
              <div class="flex items-center space-x-4 text-xs text-gray-500">
                <span v-if="record.accuracy_meters">
                  Accuracy: {{ record.accuracy_meters.toFixed(0) }}m
                </span>
                <span>{{ record.time_ago }}</span>
              </div>
            </div>
            
            <div class="flex space-x-2 ml-4">
              <button 
                @click="viewOnMap(record, index)" 
                class="text-blue-600 hover:text-blue-800 p-1 rounded"
                title="View on map"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                @click="openInGoogleMaps(record)" 
                class="text-gray-600 hover:text-gray-800 p-1 rounded"
                title="Open in Google Maps"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

// State
const history = ref([]);
const loading = ref(false);
const error = ref(null);
const historyMapContainer = ref(null);
const mapLoading = ref(true);

// Filters
const fromDate = ref('');
const toDate = ref('');
const limit = ref('100');

// Map
let historyMap = null;
let historyMarkers = [];
let polyline = null;

// Initialize date range (last 7 days)
const initializeDateRange = () => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  toDate.value = today.toISOString().split('T')[0];
  fromDate.value = weekAgo.toISOString().split('T')[0];
};

const fetchHistory = async () => {
  if (!props.userId) return;
  
  try {
    loading.value = true;
    error.value = null;
    
    const response = await fetch('/api/method/oms.api.get_location_history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || ''
      },
      body: JSON.stringify({
        user_id: props.userId,
        from_date: fromDate.value,
        to_date: toDate.value,
        limit: parseInt(limit.value)
      })
    });
    
    const data = await response.json();
    
    if (data.message && data.message.success) {
      history.value = data.message.data;
      updateHistoryMap();
    } else {
      error.value = data.message?.message || 'Failed to fetch location history';
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while fetching history';
    console.error('Error fetching history:', err);
  } finally {
    loading.value = false;
  }
};

const initHistoryMap = () => {
  if (!historyMapContainer.value) return;
  
  mapLoading.value = true;
  
  if (!window.L) {
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(linkElement);
    
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    scriptElement.onload = () => {
      createHistoryMap();
    };
    document.head.appendChild(scriptElement);
  } else {
    createHistoryMap();
  }
};

const createHistoryMap = () => {
  if (!window.L) return;
  
  historyMap = L.map(historyMapContainer.value, {
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
  }).addTo(historyMap);
  
  updateHistoryMap();
  
  setTimeout(() => {
    historyMap.invalidateSize();
    mapLoading.value = false;
  }, 100);
};

const updateHistoryMap = () => {
  if (!historyMap || history.value.length === 0) return;
  
  // Clear existing markers and polyline
  historyMarkers.forEach(marker => historyMap.removeLayer(marker));
  historyMarkers = [];
  
  if (polyline) {
    historyMap.removeLayer(polyline);
    polyline = null;
  }
  
  const coordinates = [];
  const bounds = [];
  
  history.value.forEach((record, index) => {
    if (record.latitude && record.longitude) {
      const lat = parseFloat(record.latitude);
      const lng = parseFloat(record.longitude);
      
      coordinates.push([lat, lng]);
      bounds.push([lat, lng]);
      
      // Create marker with timestamp
      const isFirst = index === 0;
      const isLast = index === history.value.length - 1;
      
      let iconHtml = '';
      if (isFirst) {
        iconHtml = '<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>';
      } else if (isLast) {
        iconHtml = '<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>';
      } else {
        iconHtml = '<div class="w-3 h-3 bg-blue-500 rounded-full border border-white shadow"></div>';
      }
      
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'history-marker',
        iconSize: isFirst || isLast ? [16, 16] : [12, 12],
        iconAnchor: isFirst || isLast ? [8, 8] : [6, 6]
      });
      
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(historyMap);
      
      const popupContent = `
        <div class="p-2">
          <p class="font-semibold text-sm">${formatDateTime(record.creation)}</p>
          <p class="text-xs text-gray-600">${formatCoordinates(record.latitude, record.longitude)}</p>
          ${record.address ? `<p class="text-xs text-gray-500 mt-1">${record.address}</p>` : ''}
          ${record.accuracy_meters ? `<p class="text-xs text-gray-500">Accuracy: ${record.accuracy_meters.toFixed(0)}m</p>` : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent);
      historyMarkers.push(marker);
    }
  });
  
  // Draw path
  if (coordinates.length > 1) {
    polyline = L.polyline(coordinates, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.7
    }).addTo(historyMap);
  }
  
  // Fit map to show all points
  if (bounds.length > 0) {
    historyMap.fitBounds(bounds, { padding: [20, 20] });
  }
};

const viewOnMap = (record, index) => {
  if (!historyMap || !record.latitude || !record.longitude) return;
  
  const lat = parseFloat(record.latitude);
  const lng = parseFloat(record.longitude);
  
  historyMap.setView([lat, lng], 15);
  
  if (historyMarkers[index]) {
    historyMarkers[index].openPopup();
  }
};

const openInGoogleMaps = (record) => {
  if (!record.latitude || !record.longitude) return;
  
  const url = `https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`;
  window.open(url, '_blank');
};

// Utility functions
const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const formatCoordinates = (lat, lng) => {
  if (!lat || !lng) return 'No location';
  return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
};

// Lifecycle
onMounted(() => {
  initializeDateRange();
  fetchHistory();
  initHistoryMap();
});

onUnmounted(() => {
  if (historyMap) {
    historyMap.remove();
    historyMap = null;
  }
});

// Watch for user changes
watch(() => props.userId, () => {
  if (props.userId) {
    fetchHistory();
  }
});
</script>

<style scoped>
:deep(.history-marker) {
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
</style>
