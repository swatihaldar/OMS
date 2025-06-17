<template>
  <div>
    <!-- Assignment Button - Smaller for mobile -->
    <Button 
      @click="openDialog"
      variant="outline"
      size="sm"
      class="text-blue-600 border-blue-600 hover:bg-blue-50"
    >
      <template #prefix>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </template>
      Assign
    </Button>

    <!-- Assignment Dialog - Mobile Optimized -->
    <div v-if="showDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div class="bg-white w-full sm:max-w-md sm:rounded-lg overflow-hidden animate-slide-up sm:animate-fade-in">
        <!-- Dialog Header -->
        <div class="flex justify-between items-center border-b px-4 py-3 bg-gradient-to-r from-blue-50 to-white">
          <h3 class="text-lg font-medium text-gray-900">Assign {{ doctype }}</h3>
          <Button @click="closeDialog" variant="ghost" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <!-- Dialog Content -->
        <div class="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
  
          <!-- Assign to me -->
          <div class="flex items-center p-3 bg-blue-50 rounded-lg">
            <FormControl
              type="checkbox"
              :model-value="assignToMe"
              size="sm"
              variant="subtle"
              @update:model-value="handleAssignToMeChange"
              class="flex"
            >
              <template #label>
                <span class="text-gray-700 font-medium">Assign to me</span>
              </template>
            </FormControl>
            
            <div v-if="assignToMe && currentUser" class="flex items-center ml-3">
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
              <span class="text-sm font-medium text-gray-700 truncate max-w-[100px]">{{ currentUser.fullName || currentUser.userId }}</span>
            </div>
          </div>

          <!-- Assign To -->
          <div>
            <FormControl
              type="autocomplete"
              :model-value="assignmentData.assign_to"
              :options="filteredUsers"
              :placeholder="'Search users...'"
              :disabled="assignToMe"
              size="sm"
              variant="subtle"
              @update:model-value="selectUser"
              @update:query="(query) => userSearch = query"
            >
              <template #label>
                Assign To <span class="text-red-500">*</span>
              </template>
            </FormControl>
          </div>

          <!-- Complete By -->
          <div>
            <FormControl
              type="date"
              :model-value="assignmentData.complete_by"
              size="sm"
              variant="subtle"
              @update:model-value="(val) => assignmentData.complete_by = val"
            >
              <template #label>
                Complete By
              </template>
            </FormControl>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div class="grid grid-cols-3 gap-2">
              <Button 
                @click="assignmentData.priority = 'Low'" 
                :variant="assignmentData.priority === 'Low' ? 'solid' : 'outline'"
                size="sm"
                class="text-sm font-medium"
                :class="assignmentData.priority === 'Low' ? 'bg-green-600 text-white' : 'text-green-700 border-green-300'"
              >
                Low
              </Button>
              <Button 
                @click="assignmentData.priority = 'Medium'" 
                :variant="assignmentData.priority === 'Medium' ? 'solid' : 'outline'"
                size="sm"
                class="text-sm font-medium"
                :class="assignmentData.priority === 'Medium' ? 'bg-yellow-600 text-white' : 'text-yellow-700 border-yellow-300'"
              >
                Medium
              </Button>
              <Button 
                @click="assignmentData.priority = 'High'" 
                :variant="assignmentData.priority === 'High' ? 'solid' : 'outline'"
                size="sm"
                class="text-sm font-medium"
                :class="assignmentData.priority === 'High' ? 'bg-red-600 text-white' : 'text-red-700 border-red-300'"
              >
                High
              </Button>
            </div>
          </div>

          <!-- Comment -->
          <div>
            <FormControl
              type="textarea"
              :model-value="assignmentData.description"
              :rows="3"
              size="sm"
              variant="subtle"
              :placeholder="'Add a comment...'"
              @update:model-value="(val) => assignmentData.description = val"
            >
              <template #label>
                Comment
              </template>
            </FormControl>
          </div>
        </div>

        <!-- Dialog Footer -->
        <div class="bg-gray-50 px-4 py-4 flex gap-3">
          <Button 
            @click="closeDialog"
            variant="outline"
            class="flex-1"
          >
            Cancel
          </Button>
          <Button 
            @click="submitAssignment" 
            variant="solid"
            class="flex-1"
            :disabled="!isFormValid || isSubmitting"
            :loading="isSubmitting"
          >
            {{ isSubmitting ? 'Assigning...' : 'Assign' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Button, FormControl } from 'frappe-ui';

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
const users = ref([]);
const currentUser = ref(null);
const isSubmitting = ref(false);
const documentTitle = ref('');
const assignableUsers = ref([]);

// Assignment data
const assignmentData = ref({
  doctype: props.doctype,
  name: props.docname,
  assign_to: '',
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

// Methods
const openDialog = async () => {
  showDialog.value = true;
  resetForm();
  
  await fetchDocumentTitle();
  
  await Promise.all([
    fetchCurrentUser(),
    fetchAssignableUsers()
  ]);
  
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
  const title = documentTitle.value || props.docname;
  assignmentData.value.description = `Please review this ${props.doctype}: ${title}`;
};

const handleAssignToMeChange = (value) => {
  assignToMe.value = value;
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

const selectUser = (user) => {
  if (typeof user === 'string') {
    assignmentData.value.assign_to = user;
  } else if (user && user.value) {
    assignmentData.value.assign_to = user.value;
    userSearch.value = user.fullName ? `${user.fullName} (${user.userId})` : user.userId;
  }
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

const handleImageError = (event, user) => {
  event.target.style.display = 'none';
  if (user) {
    user.image = null;
  }
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('/private/')) {
    return `/api/method/frappe.utils.file_manager.get_file?private=1&file=${encodeURIComponent(imagePath)}`;
  }
  
  return imagePath;
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

const fetchAssignableUsers = async () => {
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
    assignableUsers.value = [];
    users.value = [];
  }
};

const submitAssignment = async () => {
  if (!isFormValid.value) return;
  
  try {
    isSubmitting.value = true;
    
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
      const newAssignment = {
        name: result.message.name || Date.now().toString(),
        allocated_to: assignmentData.value.assign_to,
        allocated_to_fullname: assignableUsers.value.find(u => u.value === assignmentData.value.assign_to)?.fullName || assignmentData.value.assign_to,
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

watch(() => props.doctype, (newDoctype) => {
  assignmentData.value.doctype = newDoctype;
});

watch(() => props.docname, (newDocname) => {
  assignmentData.value.name = newDocname;
});
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(100%); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .animate-slide-up {
    border-radius: 1rem 1rem 0 0;
  }
}
</style>
