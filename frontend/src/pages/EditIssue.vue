<template>
    <div class="p-4 max-w-3xl mx-auto">
      <div class="flex items-center mb-6">
        <button @click="$router.back()" class="mr-2">
          <ChevronLeftIcon class="h-6 w-6 text-gray-600" />
        </button>
        <h2 class="text-2xl font-bold text-gray-800">Edit Issue</h2>
      </div>
      
      <form v-if="issue" @submit.prevent="updateIssue" class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input id="subject" v-model="issue.subject" type="text" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <div>
          <label for="project" class="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select id="project" v-model="issue.project" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Select Project</option>
            <option v-for="project in projects" :key="project.name" :value="project.name">
              {{ project.project_name }}
            </option>
          </select>
        </div>
        
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" v-model="issue.status" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="Open">Open</option>
            <option value="Replied">Replied</option>
            <option value="Closed">Closed</option>
            <option value="Resolved">Resolved</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        
        <div>
          <label for="raised_by" class="block text-sm font-medium text-gray-700 mb-1">Raised by Contact</label>
          <input id="raised_by" v-model="issue.custom_raised_by_contact" type="text" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <div>
          <label for="mobile" class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
          <input id="mobile" v-model="issue.custom_raised_by_mobile" type="tel" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="description" v-model="issue.description" rows="4" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Issue Image</label>
          <div v-if="issue.custom_issue_image" class="mb-2">
            <img :src="issue.custom_issue_image" alt="Issue Image" class="max-w-full h-auto rounded-lg shadow-md" />
          </div>
          <input type="file" @change="handleFileUpload('image')" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Other Attachment</label>
          <div v-if="issue.custom_other_attachment" class="mb-2">
            <a :href="issue.custom_other_attachment" target="_blank" class="text-blue-600 hover:underline">View current attachment</a>
          </div>
          <input type="file" @change="handleFileUpload('other')" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
  
        <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors" :disabled="submitting">
          {{ submitting ? 'Updating...' : 'Update Issue' }}
        </button>
      </form>
  
      <div v-else-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
  
      <div v-else class="bg-white rounded-lg shadow-md p-6 text-center">
        <p class="text-gray-600">Issue not found</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ChevronLeftIcon } from '@heroicons/vue/24/outline';
  
  const route = useRoute();
  const router = useRouter();
  const issue = ref(null);
  const loading = ref(true);
  const submitting = ref(false);
  const projects = ref([]);
  
  const handleFileUpload = (type) => {
    const fileInput = event.target;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'image') {
          issue.value.custom_issue_image = e.target.result;
        } else {
          issue.value.custom_other_attachment = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const updateIssue = async () => {
    submitting.value = true;
    try {
      await fetch('/api/method/frappe.client.save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: 'Issue',
          ...issue.value
        })
      });
      router.push(`/issue/${issue.value.name}`);
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Error updating issue. Please try again.');
    } finally {
      submitting.value = false;
    }
  };
  
  onMounted(async () => {
    try {
      const [issueResponse, projectsResponse] = await Promise.all([
        fetch('/api/method/frappe.client.get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctype: 'Issue',
            name: route.params.id
          }),
        }),
        fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctype: 'Project',
            fields: ['name', 'project_name'],
            filters: { is_active: 'Yes' },
            limit: 50
          }),
        })
      ]);
      
      const [issueData, projectsData] = await Promise.all([
        issueResponse.json(),
        projectsResponse.json()
      ]);
      
      if (issueData.message) {
        issue.value = issueData.message;
      }
      
      if (projectsData.message) {
        projects.value = projectsData.message;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      loading.value = false;
    }
  });
  </script>
  
  