<template>
  <div class="assignment-list">
    <div v-if="loading" class="flex justify-center items-center py-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else>
      <div v-if="assignments.length === 0" class="text-gray-500 text-sm italic">
        No assignments
      </div>
      
      <div v-else class="flex flex-wrap gap-1">
        <!-- User avatars with popup functionality -->
        <div v-for="assignment in assignments" :key="assignment.name" class="relative">
          <div 
            @click="toggleUserPopup(assignment)"
            class="cursor-pointer transition-transform hover:scale-110"
            :title="isCurrentUser(assignment) ? 'You' : (assignment.allocated_to_fullname || assignment.allocated_to)"
          >
            <!-- User image if available -->
            <div class="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white border-2 border-white shadow-sm">
              <img 
                v-if="assignment.user_image" 
                :src="assignment.user_image" 
                :alt="isCurrentUser(assignment) ? 'You' : (assignment.allocated_to_fullname || assignment.allocated_to)"
                class="h-full w-full object-cover"
                @error="handleImageError($event, assignment)"
              />
              <span v-else class="text-xs font-medium">{{ getUserInitials(assignment.allocated_to_fullname || assignment.allocated_to) }}</span>
            </div>
            
            <!-- Priority indicator -->
            <div 
              class="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white"
              :class="{
                'bg-red-500': assignment.priority === 'High',
                'bg-yellow-500': assignment.priority === 'Medium',
                'bg-green-500': assignment.priority === 'Low'
              }"
              :title="`Priority: ${assignment.priority}`"
            ></div>
          </div>
          
          <!-- User popup - positioned to stay within viewport -->
          <div 
            v-if="activePopup === assignment.name"
            ref="popupRef"
            :data-popup-id="assignment.name"
            class="fixed bg-white rounded-lg shadow-lg z-50 w-48 p-3 border"
            :style="getPopupPosition(assignment)"
          >
            <div class="flex items-center justify-between">
              <!-- User info -->
              <div class="flex items-center">
                <!-- User image -->
                <div class="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white mr-2">
                  <img 
                    v-if="assignment.user_image" 
                    :src="assignment.user_image" 
                    :alt="isCurrentUser(assignment) ? 'You' : assignment.allocated_to_fullname"
                    class="h-full w-full object-cover"
                    @error="handleImageError($event, assignment)"
                  />
                  <!-- Fallback initials -->
                  <span v-else class="text-xs font-medium">
                    {{ getUserInitials(assignment.allocated_to_fullname) }}
                  </span>
                </div>
                
                <div class="font-medium text-blue-700 text-sm truncate max-w-[120px]">
                  {{ isCurrentUser(assignment) ? 'You' : assignment.allocated_to_fullname }}
                </div>
              </div>
              
              <!-- Remove button (just X) -->
              <button 
                v-if="canRemove(assignment)"
                @click="removeAssignment(assignment.name)" 
                class="text-gray-400 hover:text-red-500 ml-2"
                title="Remove assignment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Assignment details -->
            <div class="mt-2 text-xs text-gray-600">
              <div v-if="assignment.description" class="mb-1">
                <div class="font-medium">Comment:</div>
                <div class="truncate">{{ assignment.description }}</div>
              </div>
              <div v-if="assignment.date" class="mb-1">
                <div class="font-medium">Due:</div>
                <div>{{ formatDate(assignment.date) }}</div>
              </div>
              <div class="flex items-center">
                <div class="font-medium mr-1">Priority:</div>
                <div 
                  class="px-2 py-0.5 rounded-full text-xs"
                  :class="{
                    'bg-red-100 text-red-800': assignment.priority === 'High',
                    'bg-yellow-100 text-yellow-800': assignment.priority === 'Medium',
                    'bg-green-100 text-green-800': assignment.priority === 'Low'
                  }"
                >
                  {{ assignment.priority }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  doctype: {
    type: String,
    required: true
  },
  docname: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['assignment-removed', 'assignment-error']);

// State
const assignments = ref([]);
const loading = ref(true);
const currentUser = ref(null);
const activePopup = ref(null);
const popupRef = ref(null);
const popupPositions = ref({});

// Methods
const fetchAssignments = async () => {
  if (!props.doctype || !props.docname) return;
  
  try {
    loading.value = true;
    
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'ToDo',
        fields: ['name', 'allocated_to', 'owner', 'description', 'priority', 'date', 'status'],
        filters: {
          reference_type: props.doctype,
          reference_name: props.docname,
          status: 'Open'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      // Fetch user full names and images
      const todos = data.message;
      const userPromises = todos.map(async (todo) => {
        try {
          const userResponse = await fetch('/api/method/frappe.client.get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              doctype: 'User',
              name: todo.allocated_to,
              fields: ['name', 'full_name', 'user_image']
            })
          });
          
          const userData = await userResponse.json();
          
          if (userData.message)  {
            todo.allocated_to_fullname = userData.message.full_name || todo.allocated_to;
            todo.user_image = userData.message.user_image ? getFullImageUrl(userData.message.user_image) : null;
          }
          
          return todo;
        } catch (error) {
          console.error('Error fetching user details:', error);
          return todo;
        }
      });
      
      assignments.value = await Promise.all(userPromises);
    } else {
      assignments.value = [];
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    assignments.value = [];
  } finally {
    loading.value = false;
  }
};

// Check if the assignment is for the current user
const isCurrentUser = (assignment) => {
  return currentUser.value && assignment.allocated_to === currentUser.value;
};

// Handle image loading errors
const handleImageError = (event, assignment) => {
  event.target.style.display = 'none';
  if (assignment) {
    assignment.user_image = null; // Reset the image so the initials show instead
  }
};

// Add a new assignment without fetching from server
const addAssignment = (newAssignment) => {
  if (!newAssignment) return;
  
  // Check if assignment already exists
  const existingIndex = assignments.value.findIndex(a => 
    a.allocated_to === newAssignment.allocated_to
  );
  
  if (existingIndex >= 0) {
    // Update existing assignment
    assignments.value[existingIndex] = { 
      ...assignments.value[existingIndex],
      ...newAssignment
    };
  } else {
    // Add new assignment
    assignments.value.push(newAssignment);
  }
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Handle private files
  if (imagePath.startsWith('/private/')) {
    return `/api/method/frappe.utils.file_manager.get_file?private=1&file=${encodeURIComponent(imagePath)}`;
  }
  
  // Handle public files
  return imagePath;
};

const getUserInitials = (name) => {
  if (!name) return '';
  
  // Check if it's an email address
  if (name.includes('@')) {
    // For email addresses, use the first two letters of the email
    return name.substring(0, 2).toUpperCase();
  }
  
  // For full names, use the first letter of each word (first and last name)
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return 'No due date';
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if date is today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if date is tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  // Format date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const fetchCurrentUser = async () => {
  try {
    const response = await fetch('/api/method/frappe.auth.get_logged_user');
    const data = await response.json();
    
    if (data.message) {
      currentUser.value = data.message;
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
};

const canRemove = (assignment) => {
  // User can remove if they are the owner or the assignee
  return currentUser.value && 
    (assignment.owner === currentUser.value || 
     assignment.allocated_to === currentUser.value);
};

const removeAssignment = async (todoName) => {
  try {
    const response = await fetch('/api/method/frappe.client.set_value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'ToDo',
        name: todoName,
        fieldname: 'status',
        value: 'Cancelled'
      })
    });
    
    const result = await response.json();
    
    if (result.message) {
      // Remove from local state immediately
      assignments.value = assignments.value.filter(a => a.name !== todoName);
      
      emit('assignment-removed', todoName);
      activePopup.value = null; // Close popup after removal
    } else {
      throw new Error('Failed to remove assignment');
    }
  } catch (error) {
    console.error('Error removing assignment:', error);
    emit('assignment-error', error.message || 'Failed to remove assignment');
  }
};

// Calculate popup position to ensure it stays within viewport
const getPopupPosition = (assignment) => {
  // Get the index of the assignment in the array
  const index = assignments.value.findIndex(a => a.name === assignment.name);
  
  // Calculate position based on viewport size and assignment position
  const isMobile = window.innerWidth < 640;
  const isLastInRow = (index + 1) % 4 === 0 || index === assignments.value.length - 1;
  const isNearEnd = assignments.value.length - index <= 2;
  
  // Base position
  let position = {
    top: '100%',
    left: '0',
    transform: 'none'
  };
  
  if (isMobile) {
    // On mobile, position the popup in the center of the screen
    position = {
      top: 'auto',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100vw - 40px)',
      maxWidth: '300px'
    };
  } else if (isLastInRow || isNearEnd) {
    // If it's the last item in a row or near the end, position to the left
    position = {
      top: '0',
      right: '100%',
      left: 'auto',
      marginRight: '8px'
    };
  }
  
  return position;
};

const toggleUserPopup = (assignment) => {
  if (activePopup.value === assignment.name) {
    activePopup.value = null;
  } else {
    activePopup.value = assignment.name;
    // Calculate position after popup is shown
    nextTick(() => {
      adjustPopupPosition();
    });
  }
};

// Adjust popup position to stay within viewport
const adjustPopupPosition = () => {
  nextTick(() => {
    const popupElements = document.querySelectorAll('[data-popup-id]');
    
    popupElements.forEach(popup => {
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if popup extends beyond right edge
      if (rect.right > viewportWidth) {
        popup.style.left = 'auto';
        popup.style.right = '0';
      }
      
      // Check if popup extends beyond bottom edge
      if (rect.bottom > viewportHeight) {
        popup.style.top = 'auto';
        popup.style.bottom = '100%';
      }
      
      // Check if popup extends beyond left edge
      if (rect.left < 0) {
        popup.style.left = '0';
        popup.style.right = 'auto';
      }
      
      // Check if popup extends beyond top edge
      if (rect.top < 0) {
        popup.style.top = '0';
        popup.style.bottom = 'auto';
      }
    });
  });
};

// Close popup when clicking outside
const handleClickOutside = (event) => {
  if (activePopup.value && !event.target.closest('.assignment-list')) {
    activePopup.value = null;
  }
};

// Watch for changes in props
watch([() => props.doctype, () => props.docname], () => {
  fetchAssignments();
});

// Handle assignment added event
const handleAssignmentAdded = (event) => {
  if (event.detail && event.detail.doctype === props.doctype && event.detail.docname === props.docname) {
    addAssignment(event.detail.assignment);
  }
};

// Handle window resize to recalculate popup positions
const handleResize = () => {
  if (activePopup.value) {
    adjustPopupPosition();
  }
};

// Initialize
onMounted(() => {
  fetchCurrentUser();
  fetchAssignments();
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  
  // Listen for custom events from parent
  window.addEventListener('assignment-added', handleAssignmentAdded);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('assignment-added', handleAssignmentAdded);
});

// Expose methods to parent
defineExpose({
  addAssignment,
  removeAssignment,
  fetchAssignments
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>