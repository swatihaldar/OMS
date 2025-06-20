<template>
  <div class="assignment-list">
    <div v-if="loading" class="flex justify-center items-center py-1">
      <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else>
      <div v-if="assignments.length === 0" class="text-gray-500 text-xs italic">
        No assignments
      </div>
      
      <div v-else class="flex flex-wrap gap-1">
        <div v-for="assignment in assignments" :key="assignment.name" class="relative">
          <div 
            @click="toggleUserPopup(assignment)"
            class="cursor-pointer transition-transform hover:scale-110"
            :title="isCurrentUser(assignment) ? 'You' : (assignment.allocated_to_fullname || assignment.allocated_to)"
          >
            <div class="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white border border-white shadow-sm">
              <img 
                v-if="assignment.user_image" 
                :src="assignment.user_image" 
                :alt="isCurrentUser(assignment) ? 'You' : (assignment.allocated_to_fullname || assignment.allocated_to)"
                class="h-full w-full object-cover"
                @error="handleImageError($event, assignment)"
              />
              <span v-else class="text-xs font-medium">{{ getUserInitials(assignment.allocated_to_fullname || assignment.allocated_to) }}</span>
            </div>
            
            <div 
              class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
              :class="{
                'bg-red-500': assignment.priority === 'High',
                'bg-yellow-500': assignment.priority === 'Medium',
                'bg-green-500': assignment.priority === 'Low'
              }"
              :title="`Priority: ${assignment.priority}`"
            ></div>
          </div>
          
          <!-- User popup - Mobile optimized -->
          <div 
            v-if="activePopup === assignment.name"
            ref="popupRef"
            :data-popup-id="assignment.name"
            class="fixed bg-white rounded-lg shadow-lg z-50 w-64 p-3 border"
            :style="getPopupPosition(assignment)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center min-w-0 flex-1">
                <div class="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white mr-2 flex-shrink-0">
                  <img 
                    v-if="assignment.user_image" 
                    :src="assignment.user_image" 
                    :alt="isCurrentUser(assignment) ? 'You' : assignment.allocated_to_fullname"
                    class="h-full w-full object-cover"
                    @error="handleImageError($event, assignment)"
                  />
                  <span v-else class="text-xs font-medium">
                    {{ getUserInitials(assignment.allocated_to_fullname) }}
                  </span>
                </div>
                
                <div class="font-medium text-blue-700 text-sm truncate">
                  {{ isCurrentUser(assignment) ? 'You' : assignment.allocated_to_fullname }}
                </div>
              </div>
              
              <button 
                v-if="canRemove(assignment)"
                @click="removeAssignment(assignment.name)" 
                class="text-gray-400 hover:text-red-500 ml-2 p-1 flex-shrink-0"
                title="Remove assignment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="text-xs text-gray-600 space-y-1">
              <div v-if="assignment.description" class="truncate">
                <span class="font-medium">Comment:</span> {{ assignment.description }}
              </div>
              <div v-if="assignment.date">
                <span class="font-medium">Due:</span> {{ formatDate(assignment.date) }}
              </div>
              <div class="flex items-center">
                <span class="font-medium mr-1">Priority:</span>
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

const isCurrentUser = (assignment) => {
  return currentUser.value && assignment.allocated_to === currentUser.value;
};

const handleImageError = (event, assignment) => {
  event.target.style.display = 'none';
  if (assignment) {
    assignment.user_image = null;
  }
};

const addAssignment = (newAssignment) => {
  if (!newAssignment) return;
  
  const existingIndex = assignments.value.findIndex(a => 
    a.allocated_to === newAssignment.allocated_to
  );
  
  if (existingIndex >= 0) {
    assignments.value[existingIndex] = { 
      ...assignments.value[existingIndex],
      ...newAssignment
    };
  } else {
    assignments.value.push(newAssignment);
  }
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('/private/')) {
    return `/api/method/frappe.utils.file_manager.get_file?private=1&file=${encodeURIComponent(imagePath)}`;
  }
  
  return imagePath;
};

const getUserInitials = (name) => {
  if (!name) return '';
  
  if (name.includes('@')) {
    return name.substring(0, 2).toUpperCase();
  }
  
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
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
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
      const userResponse = await fetch('/api/method/frappe.client.get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          doctype: 'User',
          name: data.message,
          fields: ['name', 'full_name', 'user_image']
        })
      });
      
      const userData = await userResponse.json();
      currentUser.value = userData.message;
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
};

const canRemove = (assignment) => {
  return currentUser.value && 
    (assignment.owner === currentUser.value.name || 
     assignment.allocated_to === currentUser.value.name);
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
      assignments.value = assignments.value.filter(a => a.name !== todoName);
      
      emit('assignment-removed', todoName);
      activePopup.value = null;
    } else {
      throw new Error('Failed to remove assignment');
    }
  } catch (error) {
    console.error('Error removing assignment:', error);
    emit('assignment-error', error.message || 'Failed to remove assignment');
  }
};

const getPopupPosition = (assignment) => {
  const isMobile = window.innerWidth < 640;
  
  if (isMobile) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'calc(100vw - 2rem)',
      maxWidth: '300px'
    };
  } else {
    return {
      top: '100%',
      left: '0',
      marginTop: '8px'
    };
  }
};

const toggleUserPopup = (assignment) => {
  if (activePopup.value === assignment.name) {
    activePopup.value = null;
  } else {
    activePopup.value = assignment.name;
  }
};

const handleClickOutside = (event) => {
  if (activePopup.value && !event.target.closest('.assignment-list')) {
    activePopup.value = null;
  }
};

watch([() => props.doctype, () => props.docname], () => {
  fetchAssignments();
});

const handleAssignmentAdded = (event) => {
  if (event.detail && event.detail.doctype === props.doctype && event.detail.docname === props.docname) {
    addAssignment(event.detail.assignment);
  }
};

onMounted(() => {
  fetchCurrentUser();
  fetchAssignments();
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('assignment-added', handleAssignmentAdded);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('assignment-added', handleAssignmentAdded);
});

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

/* Mobile optimizations */
@media (max-width: 640px) {
  .assignment-list {
    font-size: 0.875rem;
  }
}
</style>
