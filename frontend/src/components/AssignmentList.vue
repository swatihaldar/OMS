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
              class="cursor-pointer"
            >
              <!-- User image if available -->
              <img 
                v-if="assignment.user_image" 
                :src="assignment.user_image" 
                :alt="assignment.allocated_to_fullname || assignment.allocated_to"
                class="h-8 w-8 rounded-full object-cover border-2 border-white"
              />
              <!-- Fallback to initials if no image -->
              <div 
                v-else
                class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
              >
                {{ getUserInitials(assignment.allocated_to_fullname || assignment.allocated_to) }}
              </div>
            </div>
            
            <!-- User popup -->
<div 
  v-if="activePopup === assignment.name"
  class="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 w-48 p-3 border"
>
  <div class="flex items-center justify-between">
    <!-- User info -->
    <div class="flex items-center">
      <!-- User image -->
      <img 
        v-if="assignment.user_image" 
        :src="assignment.user_image" 
        :alt="assignment.allocated_to_fullname"
        class="h-8 w-8 rounded-full object-cover mr-2"
      />
      <!-- Fallback initials -->
      <div 
        v-else
        class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium mr-2"
      >
        {{ getUserInitials(assignment.allocated_to_fullname) }}
      </div>
      
      <div class="font-medium text-gray-900 text-sm">
        {{ assignment.allocated_to_fullname }}
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
</div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch, onUnmounted } from 'vue';
  
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
                name: todo.allocated_to
              })
            });
            
            const userData = await userResponse.json();
            
            if (userData.message) {
              todo.allocated_to_fullname = userData.message.full_name;
              todo.user_image = userData.message.user_image;
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
  
  const getUserInitials = (name) => {
    if (!name) return '';
    
    // Check if it's an email address
    if (name.includes('@')) {
      return name.substring(0, 2).toUpperCase();
    }
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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
        emit('assignment-removed', todoName);
        fetchAssignments(); // Refresh the list
        activePopup.value = null; // Close popup after removal
      } else {
        throw new Error('Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      emit('assignment-error', error.message || 'Failed to remove assignment');
    }
  };
  
  const toggleUserPopup = (assignment) => {
    if (activePopup.value === assignment.name) {
      activePopup.value = null;
    } else {
      activePopup.value = assignment.name;
    }
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
  
  // Initialize
  onMounted(() => {
    fetchCurrentUser();
    fetchAssignments();
    document.addEventListener('click', handleClickOutside);
  });
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
  </script>