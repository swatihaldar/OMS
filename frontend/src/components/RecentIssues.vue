<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">My Recent Issues</h3>
      <button @click="$router.push('/issue')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
        View All
      </button>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else-if="issues.length === 0" class="text-center py-8 text-gray-500">
      No recent issues found
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raised By</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="issue in issues" :key="issue.name" @click="viewIssue(issue.name)" class="hover:bg-gray-50 cursor-pointer">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ issue.subject }}</div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ issue.project || 'N/A' }}</div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ issue.raised_by }}</div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span :class="getStatusClass(issue.status)" class="px-2 py-1 text-xs rounded-full">
                {{ issue.status }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(issue.creation) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const issues = ref([]);
const loading = ref(true);

const getStatusClass = (status) => {
  switch (status) {
    case 'Open': return 'bg-yellow-100 text-yellow-800';
    case 'Replied': return 'bg-purple-100 text-purple-800';
    case 'Closed': return 'bg-green-100 text-green-800';
    case 'Resolved': return 'bg-blue-100 text-blue-800';
    case 'On Hold': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const viewIssue = (issueId) => {
  router.push(`/issue/${issueId}`);
};

onMounted(async () => {
  try {
    const userResponse = await fetch('/api/method/frappe.auth.get_logged_user');
    const userData = await userResponse.json();
    if (userData.message) {
      const response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Issue',
          fields: ['name', 'subject', 'status', 'creation', 'project', 'raised_by'],
          filters: { raised_by: userData.message },
          limit_page_length: 5,
        limit_start: 5,
          order_by: 'creation desc'
        })
      });

      const data = await response.json();
      if (data.message) {
        issues.value = data.message;
      }
    }
  } catch (error) {
    console.error('Error fetching recent issues:', error);
  } finally {
    loading.value = false;
  }
});
</script>
