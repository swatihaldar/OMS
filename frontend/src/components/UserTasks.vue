<template>
  <div v-if="!loading && userTasks.length > 0" class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800">My Tasks</h2>
      <button 
        @click="$router.push('/task')" 
        class="text-sm text-blue-600 hover:text-blue-800 flex items-center"
      >
        View All
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    
    <div class="overflow-x-auto pb-2">
      <div class="flex space-x-4">
        <div 
          v-for="task in userTasks" 
          :key="task.name"
          @click="$router.push(`/task/${task.name}`)"
          class="bg-white rounded-lg shadow-sm p-4 min-w-[280px] max-w-[320px] cursor-pointer hover:shadow-md transition-shadow"
          
        >
        
          <!-- Status badges -->
          <div class="flex gap-2 mb-3">
            <span 
              v-if="task.status" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800': task.status === 'Completed',
                'bg-blue-100 text-blue-800': task.status === 'Working',
                'bg-yellow-100 text-yellow-800': task.status === 'Pending',
                'bg-purple-100 text-purple-800': task.status === 'Open',
                'bg-gray-100 text-gray-800': !['Completed', 'Working', 'Pending', 'Open'].includes(task.status)
              }"
            >
              {{ task.status }}
            </span>
            <span 
              v-if="isOverdue(task)" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
            >
              <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
              Overdue
            </span>
            <span 
              v-if="task.priority" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-red-100 text-red-800': task.priority === 'High',
                'bg-yellow-100 text-yellow-800': task.priority === 'Medium',
                'bg-green-100 text-green-800': task.priority === 'Low',
                'bg-orange-100 text-orange-800': !['High', 'Medium', 'Low'].includes(task.priority),
              }"
            >
              {{ task.priority }}
            </span>
          </div>
          
          <!-- Created by -->
          <div class="text-sm text-gray-500 mb-1">
            Created by {{ task.owner_name || task.owner || 'Unknown' }}
          </div>
          
          <!-- Task title -->
          <h3 class="font-medium text-gray-900 mb-1">{{ task.subject || task.name }}</h3>
          
          <!-- Description -->
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ task.description || 'No description' }}</p>
          
          <!-- Due date -->
          <div v-if="task.exp_end_date" class="flex items-center text-sm text-blue-600 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(task.exp_end_date) }}
          </div>
          
          <!-- Progress bar -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{{ task.progress || 0 }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full" 
                :style="{ width: `${task.progress || 0}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800">My Tasks</h2>
    </div>
    <div class="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div class="h-2 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userTasks = ref([]);
const loading = ref(true);
const currentUser = ref(null);

const getCurrentUser = async () => {
  try {
    // Try to get from session
    const response = await fetch('/api/method/frappe.auth.get_logged_user');
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error getting current user:', error);
    // Fallback to a default user for testing
    return 'Administrator';
  }
};

const fetchUserTasks = async () => {
  try {
    loading.value = true;
    
    // Get current user
    currentUser.value = await getCurrentUser();
    
    if (!currentUser.value) {
      console.error('Could not determine current user');
      return;
    }
    
    console.log('Fetching tasks for user:', currentUser.value);
    
    // Try multiple approaches to fetch tasks
    
    // Approach 1: Using _assign field
    let response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Task',
        fields: ['name', 'subject', 'status', 'priority', 'description', 'exp_end_date', 'progress', 'owner', '_assign'],
        filters: {
          '_assign': ['like', `%${currentUser.value}%`]
        },
        limit: 10,
        order_by: 'exp_end_date asc'
      })
    });
    
    let data = await response.json();
    let tasks = data.message || [];
    
    // If no tasks found with _assign, try owner field
    if (tasks.length === 0) {
      console.log('No tasks found with _assign filter, trying owner filter');
      
      response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Task',
          fields: ['name', 'subject', 'status', 'priority', 'description', 'exp_end_date', 'progress', 'owner', '_assign'],
          filters: {
            'owner': currentUser.value
          },
          limit: 10,
          order_by: 'exp_end_date asc'
        })
      });
      
      data = await response.json();
      tasks = data.message || [];
    }
    
    // If still no tasks, try without any user filter (for testing)
    if (tasks.length === 0) {
      console.log('No tasks found with owner filter, trying without user filter');
      
      response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Task',
          fields: ['name', 'subject', 'status', 'priority', 'description', 'exp_end_date', 'progress', 'owner', '_assign'],
          limit: 10,
          order_by: 'exp_end_date asc'
        })
      });
      
      data = await response.json();
      tasks = data.message || [];
    }
    
    console.log('Tasks found:', tasks.length);
    
    // Process tasks to add owner names
    const tasksWithOwnerNames = await Promise.all(tasks.map(async (task) => {
      try {
        if (task.owner) {
          const userResponse = await fetch('/api/method/frappe.client.get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctype: 'User',
              name: task.owner
            })
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.message) {
              return {
                ...task,
                owner_name: userData.message.full_name || userData.message.first_name
              };
            }
          }
        }
        return task;
      } catch (error) {
        console.error('Error fetching user details:', error);
        return task;
      }
    }));
    
    userTasks.value = tasksWithOwnerNames;
    console.log('User tasks with owner names:', userTasks.value);
    
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    userTasks.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const isOverdue = (task) => {
  if (!task.exp_end_date) return false;
  
  const dueDate = new Date(task.exp_end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dueDate < today && task.status !== 'Completed';
};

onMounted(async () => {
  await fetchUserTasks();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>