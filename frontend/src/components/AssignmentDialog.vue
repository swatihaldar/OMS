<template>
    <div>
      <!-- Assignment Button -->
    <button 
      @click="openDialog" 
      class="flex items-center justify-center p-2 bg-white text-blue-700 border border-blue-700 rounded-full hover:bg-blue-50 transition-colors"
      title="Assign"
    >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    </button>
  
      <!-- Assignment Dialog -->
      <div v-if="showDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
          <!-- Dialog Header -->
          <div class="flex justify-between items-center border-b px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">Add to ToDo</h3>
            <button @click="closeDialog" class="text-gray-400 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          <!-- Dialog Content -->
          <div class="px-6 py-4 space-y-4">
            <!-- Assign to me -->
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="assign-to-me" 
                v-model="assignToMe"
                class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                @change="handleAssignToMeChange"
              />
              <label for="assign-to-me" class="ml-2 text-gray-700">Assign to me</label>
            </div>
  
            <!-- User Group -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Assign To User Group</label>
              <div class="relative">
                <select
                  v-model="assignmentData.user_group"
                  class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users..."
                  @focus="showUserDropdown = true"
                  @blur="handleUserBlur"
                  :disabled="assignToMe"
                />
                <div 
                  v-if="showUserDropdown && !assignToMe" 
                  class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                >
                  <div
                    v-for="user in filteredUsers"
                    :key="user.value"
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                    @mousedown="selectUser(user)"
                  >
                    <div class="flex items-center">
                      <!-- User image if available -->
                      <img 
                        v-if="user.image" 
                        :src="user.image" 
                        :alt="user.label"
                        class="h-6 w-6 rounded-full object-cover"
                      />
                      <!-- Fallback to initials if no image -->
                      <div 
                        v-else
                        class="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
                      >
                        {{ getUserInitials(user.label) }}
                      </div>
                      <span class="ml-3 block truncate">{{ user.label }}</span>
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
                class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
  
            <!-- Priority -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                v-model="assignmentData.priority"
                class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="High">High</option>
              </select>
            </div>
  
            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea
                v-model="assignmentData.description"
                rows="3"
                class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a comment..."
              ></textarea>
            </div>
          </div>
  
          <!-- Dialog Footer -->
          <div class="bg-gray-50 px-6 py-4 flex justify-end">
            <button 
              @click="submitAssignment" 
              class="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              :disabled="!isFormValid || isSubmitting"
            >
              <span v-if="isSubmitting" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
              <span v-else>Add</span>
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
    if (!userSearch.value) return users.value;
    
    return users.value.filter(user => 
      user.label.toLowerCase().includes(userSearch.value.toLowerCase())
    );
  });
  
  const isFormValid = computed(() => {
    return assignmentData.value.assign_to !== '';
  });
  
  // Methods
  const openDialog = () => {
    showDialog.value = true;
    resetForm();
    fetchUsers();
    fetchUserGroups();
    
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
  
  const generateDefaultComment = () => {
    // Generate a default comment based on the document type and name
    assignmentData.value.description = `Please review this ${props.doctype}: ${props.docname}`;
  };
  
  const handleAssignToMeChange = () => {
    if (assignToMe.value && currentUser.value) {
      assignmentData.value.assign_to = currentUser.value.value;
      userSearch.value = currentUser.value.label;
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
    userSearch.value = user.label;
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
          emit('assignment-added', customResult.message);
          closeDialog();
          return;
        }
      } catch (customError) {
        console.log('Custom endpoint not available, falling back to standard API');
      }
      
      // Prepare data for standard API call
      const todoData = {
        doctype: 'ToDo',
        description: assignmentData.value.description,
        reference_type: props.doctype,
        reference_name: props.docname,
        allocated_to: assignmentData.value.assign_to,
        priority: assignmentData.value.priority,
        date: assignmentData.value.complete_by || null,
        status: 'Open'
      };
      
      // If user group is selected, add it
      if (assignmentData.value.user_group) {
        todoData.assigned_by_user_group = assignmentData.value.user_group;
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
        emit('assignment-added', result.message);
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
          label: user.full_name || user.name,
          image: user.user_image ? getFullImageUrl(user.user_image) : null
        };
      }
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
};
  
  // Fetch users
  const fetchUsers = async () => {
  try {
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
      users.value = data.message.map(user => ({
        value: user.name,
        label: user.full_name || user.name,
        image: user.user_image ? getFullImageUrl(user.user_image) : null
      }));
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Handle private files
  if (imagePath.startsWith('/private/')) {
    return `/api/method/frappe.utils.file_manager.get_file${imagePath}`;
  }
  
  // Handle public files
  return imagePath;
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
  
  // Watch for changes in props
  watch(() => props.doctype, (newDoctype) => {
    assignmentData.value.doctype = newDoctype;
  });
  
  watch(() => props.docname, (newDocname) => {
    assignmentData.value.name = newDocname;
  });
  
  // Initialize
  onMounted(() => {
    fetchCurrentUser();
  });
  </script>