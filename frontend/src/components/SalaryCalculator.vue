<template>
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Daily Salary Calculator
        </h3>
        <div class="flex items-center">
          <span class="text-sm text-gray-500 mr-2">Hourly Rate:</span>
          <input 
            type="number" 
            v-model="hourlyRate" 
            class="w-24 px-2 py-1 border border-gray-300 rounded-md text-right"
            min="1"
          />
        </div>
      </div>
  
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
      </div>
  
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 text-red-600 p-3 rounded-md">
        {{ error }}
      </div>
  
      <!-- No data state -->
      <div v-else-if="!timesheetData || timesheetData.length === 0" class="text-gray-500 italic text-center py-4">
        No timesheet data available
      </div>
  
      <!-- Data display -->
      <div v-else>
        <!-- Today's Summary card -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 class="font-medium text-gray-700 mb-3">Today's Earnings</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-3 rounded-md shadow-sm">
              <div class="text-sm text-gray-500 mb-1">Today's Hours</div>
              <div class="text-xl font-semibold text-gray-800">{{ todayHours.toFixed(2) }}</div>
            </div>
            <div class="bg-white p-3 rounded-md shadow-sm">
              <div class="text-sm text-gray-500 mb-1">Hourly Rate</div>
              <div class="text-xl font-semibold text-gray-800">₹{{ hourlyRate }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ hourlyRateSource }}
              </div>
            </div>
            <div class="bg-white p-3 rounded-md shadow-sm">
              <div class="text-sm text-gray-500 mb-1">Today's Earnings</div>
              <div class="text-xl font-semibold text-green-600">₹{{ todayEarnings.toFixed(2) }}</div>
            </div>
          </div>
        </div>
  
        <!-- Today's Tasks -->
        <div v-if="todayTasks.length > 0" class="mb-6">
          <h4 class="font-medium text-gray-700 mb-2">Today's Tasks</h4>
          <div class="bg-white border rounded-lg divide-y">
            <div v-for="(task, index) in todayTasks" :key="index" class="p-3 hover:bg-gray-50">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium text-gray-800">{{ task.task || 'Untitled Task' }}</div>
                  <div class="text-sm text-gray-500 mt-1">{{ task.activity_type || 'No Activity Type' }}</div>
                  <div v-if="task.description" class="text-sm text-gray-600 mt-1">{{ task.description }}</div>
                </div>
                <div class="text-right">
                  <div class="font-medium text-gray-800">{{ task.hours.toFixed(2) }} hrs</div>
                  <div class="text-sm text-green-600 mt-1">₹{{ (task.hours * hourlyRate).toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Total Summary -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 class="font-medium text-gray-700 mb-3">Timesheet Summary</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-3 rounded-md shadow-sm">
              <div class="text-sm text-gray-500 mb-1">Total Hours</div>
              <div class="text-xl font-semibold text-gray-800">{{ totalHours.toFixed(2) }}</div>
            </div>
            <div class="bg-white p-3 rounded-md shadow-sm">
              <div class="text-sm text-gray-500 mb-1">Working Days</div>
              <div class="text-xl font-semibold text-gray-800">{{ dailyBreakdown.length }}</div>
            </div>
            <div class="bg-white p-3 rounded-md shadow-sm">
              <div class="text-sm text-gray-500 mb-1">Total Earnings</div>
              <div class="text-xl font-semibold text-green-600">₹{{ totalEarnings.toFixed(2) }}</div>
            </div>
          </div>
        </div>
  
        <!-- Daily breakdown table (collapsed by default) -->
        <div class="mb-4">
          <button 
            @click="showDailyBreakdown = !showDailyBreakdown" 
            class="flex items-center justify-between w-full bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <span class="font-medium text-gray-700">Daily Breakdown</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 transition-transform" 
              :class="{ 'transform rotate-180': showDailyBreakdown }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div v-if="showDailyBreakdown" class="mt-3 overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 border rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(day, index) in dailyBreakdown" :key="index" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ formatDate(day.date) }}
                    <span v-if="isToday(day.date)" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Today
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {{ day.hours.toFixed(2) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">
                    <div class="max-w-md">
                      <div v-for="(task, taskIndex) in day.tasks" :key="taskIndex" class="mb-1 last:mb-0">
                        <div class="flex items-start">
                          <span class="inline-block w-2 h-2 rounded-full bg-gray-400 mt-1.5 mr-2 flex-shrink-0"></span>
                          <div>
                            <span class="font-medium">{{ task.task || 'Untitled Task' }}</span>
                            <div class="text-xs text-gray-500 mt-0.5">
                              {{ task.hours.toFixed(2) }} hours
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-green-600">
                    ₹{{ day.earnings.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ totalHours.toFixed(2) }}</td>
                  <td class="px-4 py-3"></td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-green-600">₹{{ totalEarnings.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  
  const props = defineProps({
    timesheetId: {
      type: String,
      default: null
    },
    employeeId: {
      type: String,
      default: null
    },
    startDate: {
      type: String,
      default: null
    },
    endDate: {
      type: String,
      default: null
    },
    refreshTrigger: {
      type: Number,
      default: 0
    }
  });
  
  // State
  const loading = ref(true);
  const error = ref(null);
  const timesheetData = ref([]);
  const employeeData = ref(null);
  const hourlyRate = ref(500); // Default hourly rate
  const hourlyRateSource = ref('Default rate');
  const showDailyBreakdown = ref(false);
  
  // Fetch timesheet data
  const fetchTimesheetData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      let filters = {};
      
      // If specific timesheet ID is provided
      if (props.timesheetId) {
        filters.name = props.timesheetId;
      } 
      // Otherwise filter by employee and date range
      else {
        if (props.employeeId) {
          filters.employee = props.employeeId;
        }
        
        if (props.startDate) {
          filters.start_date = ['>=', props.startDate];
        }
        
        if (props.endDate) {
          filters.end_date = ['<=', props.endDate];
        }
      }
      
      // Fetch timesheet headers
      const response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Timesheet',
          fields: ['name', 'employee', 'employee_name', 'start_date', 'end_date', 'total_hours', 'status'],
          filters: filters,
          limit: 0
        })
      });
      
      const data = await response.json();
      
      if (!data.message || data.message.length === 0) {
        timesheetData.value = [];
        loading.value = false;
        return;
      }
      
      // For each timesheet, fetch the detailed time logs
      const timesheets = data.message;
      const timesheetsWithDetails = await Promise.all(timesheets.map(async (timesheet) => {
        try {
          const detailResponse = await fetch('/api/method/frappe.client.get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctype: 'Timesheet',
              name: timesheet.name
            })
          });
          
          const detailData = await detailResponse.json();
          
          if (detailData.message && detailData.message.time_logs) {
            return {
              ...timesheet,
              time_logs: detailData.message.time_logs
            };
          }
          
          return timesheet;
        } catch (error) {
          console.error(`Error fetching details for timesheet ${timesheet.name}:`, error);
          return timesheet;
        }
      }));
      
      timesheetData.value = timesheetsWithDetails;
      
      // If we have an employee ID, fetch employee details to get CTC
      if (props.employeeId || (timesheetsWithDetails.length > 0 && timesheetsWithDetails[0].employee)) {
        await fetchEmployeeData(props.employeeId || timesheetsWithDetails[0].employee);
      }
      
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
      error.value = 'Failed to load timesheet data. Please try again.';
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch employee data to get CTC
  const fetchEmployeeData = async (employeeId) => {
    if (!employeeId) return;
    
    try {
      const response = await fetch('/api/method/frappe.client.get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'Employee',
          name: employeeId
        })
      });
      
      const data = await response.json();
      
      if (data.message) {
        employeeData.value = data.message;
        
        // If employee has CTC, calculate hourly rate
        if (data.message.ctc) {
          // Assuming CTC is annual, convert to hourly rate
          // Annual CTC / (12 months * 22 working days * 8 hours)
          const annualCtc = parseFloat(data.message.ctc);
          if (!isNaN(annualCtc)) {
            const calculatedHourlyRate = annualCtc / (12 * 22 * 8);
            hourlyRate.value = Math.round(calculatedHourlyRate);
            hourlyRateSource.value = 'Based on CTC';
          }
        }
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };
  
  // Helper function to check if a date is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };
  
  // Computed properties
  const allTimeLogs = computed(() => {
    const logs = [];
    
    timesheetData.value.forEach(timesheet => {
      if (timesheet.time_logs && Array.isArray(timesheet.time_logs)) {
        timesheet.time_logs.forEach(log => {
          logs.push({
            ...log,
            timesheet_name: timesheet.name,
            employee: timesheet.employee,
            employee_name: timesheet.employee_name
          });
        });
      }
    });
    
    return logs;
  });
  
  const dailyBreakdown = computed(() => {
    const days = {};
    
    allTimeLogs.value.forEach(log => {
      const fromTime = new Date(log.from_time);
      const date = fromTime.toISOString().split('T')[0];
      
      if (!days[date]) {
        days[date] = {
          date,
          hours: 0,
          tasks: [],
          earnings: 0
        };
      }
      
      const hours = parseFloat(log.hours || 0);
      days[date].hours += hours;
      days[date].earnings += hours * hourlyRate.value;
      
      days[date].tasks.push({
        task: log.task || log.activity_type,
        activity_type: log.activity_type,
        hours: hours,
        from_time: log.from_time,
        to_time: log.to_time,
        description: log.description
      });
    });
    
    // Convert to array and sort by date
    return Object.values(days).sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  
  // Get today's data
  const todayData = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyBreakdown.value.find(day => day.date === today) || { hours: 0, tasks: [], earnings: 0 };
  });
  
  const todayHours = computed(() => {
    return todayData.value.hours;
  });
  
  const todayEarnings = computed(() => {
    return todayData.value.hours * hourlyRate.value;
  });
  
  const todayTasks = computed(() => {
    return todayData.value.tasks || [];
  });
  
  const totalHours = computed(() => {
    return dailyBreakdown.value.reduce((sum, day) => sum + day.hours, 0);
  });
  
  const totalEarnings = computed(() => {
    return totalHours.value * hourlyRate.value;
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Watch for changes in props or hourly rate
  watch([
    () => props.timesheetId, 
    () => props.employeeId, 
    () => props.startDate, 
    () => props.endDate,
    () => props.refreshTrigger
  ], () => {
    fetchTimesheetData();
  });
  
  // Initialize
  onMounted(() => {
    fetchTimesheetData();
  });
  </script>
  
  <style scoped>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  </style>