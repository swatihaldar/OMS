<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <button @click="$router.back()" class="mr-4 text-gray-600 hover:text-gray-800 transition-colors">
            <ChevronLeftIcon class="h-6 w-6" />
          </button>
          <h2 class="text-xl font-semibold">Issue Details</h2>
        </div>
      </div>

 
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>


      <div v-else-if="issue" class="space-y-6">
        <!-- Basic Info Card -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-900">{{ issue.subject }}</h3>
            <span :class="getStatusClass(issue.status)" class="px-3 py-1 rounded-full text-sm font-medium">
              {{ issue.status }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-500">Project</h4>
              <p class="mt-1 text-gray-900">{{ issue.project || 'Not specified' }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">Created On</h4>
              <p class="mt-1 text-gray-900">{{ formatDate(issue.creation) }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">Raised by</h4>
              <p class="mt-1 text-gray-900">{{ issue.custom_raised_by_contact || 'Not specified' }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">Contact Number</h4>
              <p class="mt-1 text-gray-900">{{ issue.custom_raised_by_mobile || 'Not specified' }}</p>
            </div>
          </div>
        </div>

        <!-- Description Card -->
        <div v-if="issue.description" class="bg-white rounded-xl shadow-sm p-6">
          <h4 class="text-sm font-medium text-gray-500 mb-3">Description</h4>
          <div class="prose max-w-none" v-html="issue.description"></div>
        </div>

        <!-- Attachments Card -->
        <div v-if="issue.custom_issue_image || issue.custom_other_attachment" class="bg-white rounded-xl shadow-sm p-6">
          <h4 class="text-sm font-medium text-gray-500 mb-4">Attachments</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Issue Image -->
            <div v-if="issue.custom_issue_image" class="space-y-2">
              <button 
                @click="showImageModal = true" 
                class="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
              >
                <PhotoIcon class="h-6 w-6 text-gray-500 mr-2" />
                <span class="text-sm font-medium">View Issue Image</span>
              </button>
            </div>

            <!-- Other Attachment -->
            <div v-if="issue.custom_other_attachment" class="space-y-2">
              <a
                :href="issue.custom_other_attachment"
                target="_blank"
                class="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
              >
                <DocumentIcon class="h-6 w-6 text-gray-500 mr-2" />
                <span class="text-sm font-medium">View Attachment</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Timeline Card -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h4 class="text-sm font-medium text-gray-500 mb-4">Timeline</h4>
          <div class="space-y-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClockIcon class="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-900">Issue Created</p>
                <p class="text-sm text-gray-500">{{ formatDate(issue.creation) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else class="bg-white rounded-xl shadow-sm p-6 text-center">
        <p class="text-gray-600">Issue not found</p>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="relative max-w-4xl w-full">
        <button 
          @click="showImageModal = false" 
          class="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg"
        >
          <XMarkIcon class="h-6 w-6 text-gray-800" />
        </button>
        <img 
          :src="issue?.custom_issue_image" 
          alt="Issue Image" 
          class="max-w-full max-h-[80vh] mx-auto rounded-lg shadow-lg"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronLeftIcon, DocumentIcon, ClockIcon, PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const issue = ref(null);
const loading = ref(true);
const showImageModal = ref(false);

const getStatusClass = (status) => {
  switch (status) {
    case 'Open':
      return 'bg-yellow-100 text-yellow-800';
    case 'Replied':
      return 'bg-blue-100 text-blue-800';
    case 'Closed':
      return 'bg-green-100 text-green-800';
    case 'Resolved':
      return 'bg-indigo-100 text-indigo-800';
    case 'On Hold':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(async () => {
  try {
    const response = await fetch('/api/method/frappe.client.get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctype: 'Issue',
        name: route.params.id
      }),
    });
    
    const data = await response.json();
    if (data.message) {
      issue.value = data.message;
    }
  } catch (error) {
    console.error('Error fetching issue details:', error);
  } finally {
    loading.value = false;
  }
});
</script>