<template>
  <div>
    <!-- Assignment Button -->
    <button 
      @click="openDialog" 
      class="flex items-center justify-center p-3 bg-white text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
      title="Assign to User"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Assignment Dialog -->
    <div v-if="showDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <!-- Dialog Header -->
        <div class="flex justify-between items-center border-b px-4 py-3 bg-gradient-to-r from-blue-50 to-white">
          <h3 class="text-lg font-medium text-gray-900">Assign {{ doctype }}</h3>
          <button @click="closeDialog" class="text-gray-400 hover:text-gray-500 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Dialog Content -->
        <div class="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
  
          <!-- Assign to me -->
          <div class="flex items-center p-3 bg-blue-50 rounded-lg">
            <label class="inline-flex items-center cursor-pointer">
              <!-- Hidden actual checkbox -->
              <input 
                type="checkbox" 
                id="assign-to-me" 
                v-model="assignToMe"
                class="absolute opacity-0 w-0 h-0"
                @change="handleAssignToMeChange"
              />
              <!-- Custom circular checkbox -->
              <span 
                class="relative flex items-center justify-center h-4 w-4 rounded-full border-2 transition-all"
                :class="{
                  'border-blue-600 bg-blue-600': assignToMe,
                  'border-gray-300': !assignToMe
                }"
              >
                <!-- Inner circle (visible when checked) -->
                <svg 
                  v-if="assignToMe"
                  class="h-2 w-2 text-white"
                  viewBox="0 0 8 8"
                  fill="currentColor"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
              </span>
              <span class="ml-2 text-gray-700 font-medium">Assign to me</span>
            </label>
            
            <div v-if="assignToMe && currentUser" class="ml-auto flex items-center">
              <div class="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white mr-2">
                <img 
                  v-if="currentUser.image" 
                  :src="currentUser.image" 
                  :alt="currentUser.label"
                  class="h-full w-full object-cover"
                  @error="handleImageError($event, currentUser)"
                />
                <span v-else class="text-sm font-medium">{{ getUserInitials(currentUser.label) }}</span>
              </div>
              <span class="text-sm font-medium text-gray-700 truncate max-w-[120px]">{{ currentUser.label }}</span>
            </div>
          </div>

          <!-- User Group -->
          <div v-if="hasUserGroups">
            <label class="block text-sm font-medium text-gray-700 mb-1">Assign To User Group</label>
            <div class="relative">
              <select
                v-model="assignmentData.user_group"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :disabled="assignToMe"
              >
                <option value="">Select User Group</option>
                <option v-for="group in userGroups" :key="group.value" :value="group.value">
                  {{ group.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Assign To -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Assign To <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="userSearch"
                type="text"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search users..."
                @focus="showUserDropdown = true"
                @blur="handleUserBlur"
                :disabled="assignToMe"
              />
              <div 
                v-if="showUserDropdown && !assignToMe" 
                class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm left-0 right-0"
                style="max-width: 100%;"
              >
              <div
                v-for="user in filteredUsers"
                :key="user.value"
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                @mousedown="selectUser(user)"
              >
                <div class="flex items-center">
                  <!-- User image if available -->
                  <div class="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white mr-2">
                    <img 
                      v-if="user.image" 
                      :src="user.image" 
                      :alt="user.fullName || user.userId"
                      class="h-full w-full object-cover"
                      @error="handleImageError($event, user)"
                    />
                    <span v-else class="text-sm font-medium">{{ getUserInitials(user.fullName || user.userId) }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ user.fullName }}</span>
                    <span class="text-xs text-gray-500">{{ user.userId }}</span>
                  </div>
                </div>
              </div>
                <div
                  v-if="filteredUsers.length === 0"
                  class="py-2 px-3 text-gray-500 italic"
                >
                  No users found
                </div>
              </div>
            </div>
          </div>

          <!-- Complete By -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Complete By</label>
            <input
              type="date"
              v-model="assignmentData.complete_by"
              class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div class="flex space-x-2">
              <button 
                @click="assignmentData.priority = 'Low'" 
                class="flex-1 py-2 px-3 rounded-md border focus:outline-none transition-colors"
                :class="assignmentData.priority === 'Low' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-700'"
              >
                Low
              </button>
              <button 
                @click="assignmentData.priority = 'Medium'" 
                class="flex-1 py-2 px-3 rounded-md border focus:outline-none transition-colors"
                :class="assignmentData.priority === 'Medium' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-gray-50 border-gray-300 text-gray-700'"
              >
                Medium
              </button>
              <button 
                @click="assignmentData.priority = 'High'" 
                class="flex-1 py-2 px-3 rounded-md border focus:outline-none transition-colors"
                :class="assignmentData.priority === 'High' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'"
              >
                High
              </button>
            </div>
          </div>

          <!-- Comment -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Comment</label>
            <textarea
              v-model="assignmentData.description"
              rows="3"
              class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a comment..."
            ></textarea>
          </div>
        </div>

        <!-- Dialog Footer -->
        <div class="bg-gray-50 px-4 py-3 flex justify-end">
          <button 
            @click="submitAssignment" 
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :disabled="!isFormValid || isSubmitting"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>Assign</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

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

const emit = defineEmits(['assignment-added', 'assignment-error']);

// State
const showDialog = ref(false);
const assignToMe = ref(false);
const userSearch = ref('');
const showUserDropdown = ref(false);
const users = ref([]);
const userGroups = ref([]);
const currentUser = ref(null);
const isSubmitting = ref(false);
const documentTitle = ref('');
const assignableUsers = ref([]); // Users who can be assigned

// Assignment data
const assignmentData = ref({
  doctype: props.doctype,
  name: props.docname,
  assign_to: '',
  user_group: '',
  description: '',
  priority: 'Medium',
  complete_by: ''
});

// Computed properties
const filteredUsers = computed(() => {
  if (!userSearch.value) return assignableUsers.value;
  
  return assignableUsers.value.filter(user => 
    user.label.toLowerCase().includes(userSearch.value.toLowerCase())
  );
});

const isFormValid = computed(() => {
  return assignmentData.value.assign_to !== '';
});

const hasUserGroups = computed(() => {
  return userGroups.value.length > 0;
});

// Methods
const openDialog = async () => {
  showDialog.value = true;
  resetForm();
  
  // Fetch document title for better context
  await fetchDocumentTitle();
  
  // Fetch users and user groups in parallel
  await Promise.all([
    fetchCurrentUser(),
    fetchAssignableUsers(),
    fetchUserGroups()
  ]);
  
  // Auto-generate a comment about the document
  generateDefaultComment();
};

const closeDialog = () => {
  showDialog.value = false;
  resetForm();
};

const resetForm = () => {
  assignToMe.value = false;
  userSearch.value = '';
  assignmentData.value = {
    doctype: props.doctype,
    name: props.docname,
    assign_to: '',
    user_group: '',
    description: '',
    priority: 'Medium',
    complete_by: ''
  };
};

const fetchDocumentTitle = async () => {
  try {
    const response = await fetch('/api/method/frappe.client.get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        doctype: props.doctype,
        name: props.docname,
        fields: ['name', 'title', 'subject']
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      const doc = data.message;
      documentTitle.value = doc.title || doc.subject || doc.name || props.docname;
    }
  } catch (error) {
    console.error('Error fetching document title:', error);
    documentTitle.value = props.docname;
  }
};

const generateDefaultComment = () => {
  // Generate a default comment based on the document type and title
  const title = documentTitle.value || props.docname;
  assignmentData.value.description = `Please review this ${props.doctype}: ${title}`;
};

const handleAssignToMeChange = () => {
  if (assignToMe.value && currentUser.value) {
    assignmentData.value.assign_to = currentUser.value.value;
    userSearch.value = currentUser.value.fullName ? 
      `${currentUser.value.fullName} (${currentUser.value.userId})` : 
      currentUser.value.userId;
  } else {
    assignmentData.value.assign_to = '';
    userSearch.value = '';
  }
};

const handleUserBlur = () => {
  // Delay hiding the dropdown to allow for selection
  setTimeout(() => {
    showUserDropdown.value = false;
  }, 200);
};

const selectUser = (user) => {
  assignmentData.value.assign_to = user.value;
  userSearch.value = user.fullName ? `${user.fullName} (${user.userId})` : user.userId;
  showUserDropdown.value = false;
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

const handleImageError = (event, user) => {
  event.target.style.display = 'none';
  if (user) {
    user.image = null; // Reset the image so the initials show instead
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

// Fetch current user
const fetchCurrentUser = async () => {
  try {
    const response = await fetch('/api/method/frappe.auth.get_logged_user');
    const data = await response.json();
    
    if (data.message) {
      // Fetch user details
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
      
      if (userData.message) {
      const user = userData.message;
      currentUser.value = {
        value: user.name,
        label: user.full_name ? `${user.full_name} (${user.name})` : user.name,
        fullName: user.full_name || '',
        userId: user.name,
        image: user.user_image ? getFullImageUrl(user.user_image) : null
      };
    }

    }
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
};

// Fetch users who can be assigned to this doctype
const fetchAssignableUsers = async () => {
  try {
    // First try to get assignable users for this specific doctype
    try {
      const response = await fetch('/api/method/frappe.desk.form.assign_to.get_assignable_users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: props.doctype
        })
      });
      
      const data = await response.json();
      
      if (data.message && Array.isArray(data.message)) {
        // Format the users with their images and include both name and ID
        const userPromises = data.message.map(async (username) => {
          try {
            const userResponse = await fetch('/api/method/frappe.client.get', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                doctype: 'User',
                name: username,
                fields: ['name', 'full_name', 'user_image']
              })
            });
            
            const userData = await userResponse.json();
            
            if (userData.message) {
              const user = userData.message;
              return {
                value: user.name,
                label: user.full_name ? `${user.full_name} (${user.name})` : user.name,
                fullName: user.full_name || '',
                userId: user.name,
                image: user.user_image ? getFullImageUrl(user.user_image) : null
              };
            }
            
            return {
              value: username,
              label: username,
              fullName: '',
              userId: username,
              image: null
            };
          } catch (error) {
            console.error(`Error fetching details for user ${username}:`, error);
            return {
              value: username,
              label: username,
              fullName: '',
              userId: username,
              image: null
            };
          }
        });
        
        assignableUsers.value = await Promise.all(userPromises);
        users.value = assignableUsers.value; // Keep a copy of all users
        return;
      }
    } catch (error) {
      console.error('Error fetching assignable users, falling back to all users:', error);
    }
    
    // Fallback: fetch all enabled users
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'User',
        fields: ['name', 'full_name', 'user_image'],
        filters: {
          enabled: 1
        },
        limit_page_length: 0
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      assignableUsers.value = data.message.map(user => ({
        value: user.name,
        label: user.full_name ? `${user.full_name} (${user.name})` : user.name,
        fullName: user.full_name || '',
        userId: user.name,
        image: user.user_image ? getFullImageUrl(user.user_image) : null
      }));
      
      users.value = assignableUsers.value;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return empty array if there's an error
    assignableUsers.value = [];
    users.value = [];
  }
};

// Fetch user groups
const fetchUserGroups = async () => {
  try {
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'User Group',
        fields: ['name'],
        limit_page_length: 0
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      userGroups.value = data.message.map(group => ({
        value: group.name,
        label: group.name
      }));
    }
  } catch (error) {
    console.error('Error fetching user groups:', error);
  }
};

const submitAssignment = async () => {
  if (!isFormValid.value) return;
  
  try {
    isSubmitting.value = true;
    
    // Try using custom endpoint to avoid permission issues
    try {
      const customResponse = await fetch('/api/method/oms.api.assign_document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: props.doctype,
          name: props.docname,
          user: assignmentData.value.assign_to,
          description: assignmentData.value.description,
          priority: assignmentData.value.priority,
          date: assignmentData.value.complete_by || null
        })
      });
      
      const customResult = await customResponse.json();
      
      if (customResult.message && customResult.message.status === 'success') {
        // Create a new assignment object to emit
        const newAssignment = {
          name: customResult.message.name || Date.now().toString(),
          allocated_to: assignmentData.value.assign_to,
          allocated_to_fullname: assignableUsers.value.find(u => u.value === assignmentData.value.assign_to)?.label || assignmentData.value.assign_to,
          user_image: assignableUsers.value.find(u => u.value === assignmentData.value.assign_to)?.image || null,
          description: assignmentData.value.description,
          priority: assignmentData.value.priority,
          date: assignmentData.value.complete_by || null
        };
        
        emit('assignment-added', newAssignment);
        closeDialog();
        return;
      }
    } catch (customError) {
      console.log('Custom endpoint not available, falling back to standard API');
    }
    
    // Call Frappe API to create ToDo
    const response = await fetch('/api/method/frappe.desk.form.assign_to.add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assign_to: [assignmentData.value.assign_to],
        doctype: props.doctype,
        name: props.docname,
        description: assignmentData.value.description,
        priority: assignmentData.value.priority,
        date: assignmentData.value.complete_by || null
      })
    });
    
    const result = await response.json();
    
    if (result.message) {
      // Create a new assignment object to emit
      const newAssignment = {
        name: result.message.name || Date.now().toString(),
        allocated_to: assignmentData.value.assign_to,
        allocated_to_fullname: assignableUsers.value.find(u => u.value === assignmentData.value.assign_to)?.label || assignmentData.value.assign_to,
        user_image: assignableUsers.value.find(u => u.value === assignmentData.value.assign_to)?.image || null,
        description: assignmentData.value.description,
        priority: assignmentData.value.priority,
        date: assignmentData.value.complete_by || null
      };
      
      emit('assignment-added', newAssignment);
      closeDialog();
    } else {
      throw new Error('Failed to create assignment');
    }
  } catch (error) {
    console.error('Error creating assignment:', error);
    emit('assignment-error', error.message || 'Failed to create assignment');
  } finally {
    isSubmitting.value = false;
  }
};

// Watch for changes in props
watch(() => props.doctype, (newDoctype) => {
  assignmentData.value.doctype = newDoctype;
});

watch(() => props.docname, (newDocname) => {
  assignmentData.value.name = newDocname;
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>