<template>
  <div class="space-y-3">
    <div v-if="records.length === 0" class="text-center py-8 text-gray-500">
      <FeatherIcon name="file-text" class="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p>No connected {{ doctype }} records found</p>
    </div>
    
    <div
      v-for="record in records"
      :key="record.name"
      class="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
      @click="$emit('navigate-to-record', doctype, record.name)"
    >
      <div class="flex justify-between items-start">
        <div class="flex-1 min-w-0">
          <div class="flex items-center mb-2">
            <FeatherIcon name="file-text" class="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
            <h4 class="font-medium text-gray-900 truncate">{{ record.name }}</h4>
          </div>
          
          <div v-if="record.title || record.subject" class="text-sm text-gray-700 mb-2 truncate">
            {{ record.title || record.subject }}
          </div>
          
          <div class="flex items-center text-xs text-gray-500 space-x-4">
            <Badge
              v-if="record.status"
              :label="record.status"
              :theme="getStatusColor(record.status)"
              class="text-xs"
            />
            <span>Created: {{ formatDate(record.creation) }}</span>
            <span v-if="record.modified !== record.creation">
              Modified: {{ formatDate(record.modified) }}
            </span>
          </div>
        </div>
        
        <div class="ml-4 flex-shrink-0">
          <FeatherIcon name="chevron-right" class="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FeatherIcon, Badge } from "frappe-ui"

defineProps({
  doctype: {
    type: String,
    required: true
  },
  records: {
    type: Array,
    default: () => []
  }
})

defineEmits(['navigate-to-record'])

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const getStatusColor = (status) => {
  const statusColors = {
    'Open': 'blue',
    'In Progress': 'yellow',
    'Completed': 'green',
    'Closed': 'gray',
    'Cancelled': 'red',
    'Draft': 'gray',
    'Submitted': 'blue',
    'Approved': 'green',
    'Rejected': 'red'
  }
  return statusColors[status] || 'gray'
}
</script>
