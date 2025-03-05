<template>
  <div class="min-h-screen bg-gray-50 p-4 ">
    <!-- Header Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-4 max-w-7xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-800">Hey, {{ userName }}</h2>
      <p class="text-gray-600 mt-2">Welcome to Frappe OMS</p>
    </div>
    
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chart Section -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-md p-6 h-full">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Issue Statistics</h3>
            <div class="h-[300px] md:h-[350px]">
              <IssueStatusChart :statusCounts="statusCounts" />
            </div>
          </div>
        </div>
        
        <!-- Quick Actions Section -->
        <div class="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
      
      <!-- Recent Issues Section -->
      <div class="mt-6">
        <RecentIssues :issues="recentIssues" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import IssueStatusChart from '../components/IssueStatusChart.vue';
import QuickActions from '../components/QuickActions.vue';
import RecentIssues from '../components/RecentIssues.vue';

const userName = ref('User');
const statusCounts = ref({
  'Open': 0,
  'Replied': 0,
  'Closed': 0,
  'Resolved': 0,
  'On Hold': 0
});
const recentIssues = ref([]);

onMounted(async () => {
  try {
    // Fetch user data
    const response = await fetch('/api/method/oms.api.get_current_user_info');
    const data = await response.json();
    
    if (data.message) {
      userName.value = data.message.full_name || 'User';
    }

    // Fetch issue statistics
    const issueStatsResponse = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctype: 'Issue',
        fields: ['status'],
        limit: 'all'
      }),
    });
    
    const issueStatsData = await issueStatsResponse.json();
    
    if (issueStatsData.message) {
      // Reset counts
      Object.keys(statusCounts.value).forEach(key => {
        statusCounts.value[key] = 0;
      });
      
      // Count issues by status
      issueStatsData.message.forEach(issue => {
        if (statusCounts.value.hasOwnProperty(issue.status)) {
          statusCounts.value[issue.status]++;
        }
      });
    }
    
    // Fetch recent issues
    const recentIssuesResponse = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctype: 'Issue',
        fields: ['name', 'subject', 'status', 'creation'],
        order_by: 'creation desc',
        limit: 5
      }),
    });
    
    const recentIssuesData = await recentIssuesResponse.json();
    
    if (recentIssuesData.message) {
      recentIssues.value = recentIssuesData.message;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});
</script>