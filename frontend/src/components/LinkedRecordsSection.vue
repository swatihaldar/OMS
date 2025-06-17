<template>
  <div v-if="hasLinkedRecords" class="linked-records-section">
    <!-- Desktop View -->
    <div class="hidden md:block border-t border-gray-200 pt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Linked Records
        </div>
      </h3>
      <div class="space-y-4">
        <div v-for="(group, doctype) in groupedLinkedRecords" :key="doctype" class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-700 mb-2 flex items-center">
            <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
            {{ doctype }} ({{ group.length }})
          </h4>
          <div class="space-y-2">
            <div v-for="record in group" :key="record.name" class="bg-white p-3 rounded border border-gray-200 hover:shadow-md transition-shadow">
              <a 
                :href="`/${getRouteFromDoctype(doctype)}/${record.name}`"
                class="flex justify-between items-center text-blue-800 hover:text-blue-900 font-medium"
                @click.prevent="navigateToLinkedRecord(doctype, record.name)"
              >
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{{ record.title || record.name }}</span>
                </div>
                <div class="flex items-center">
                  <span class="hidden md:inline mr-2 text-xs text-gray-500">{{ formatDate(record.modified || record.creation).split(',')[0] }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile View -->
    <div class="md:hidden space-y-4 mt-4">
      <h3 class="text-lg font-medium text-gray-900 mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Linked Records
      </h3>
      <div v-for="(group, doctype) in groupedLinkedRecords" :key="doctype" class="mb-6">
        <div class="text-sm font-medium text-gray-700 mb-2">{{ doctype }} ({{ group.length }})</div>
        <div class="space-y-3">
          <div v-for="record in group" :key="record.name" class="border rounded-lg p-3">
            <a 
              :href="`/${getRouteFromDoctype(doctype)}/${record.name}`" 
              class="text-blue-800 hover:underline font-medium"
              @click.prevent="navigateToLinkedRecord(doctype, record.name)"
            >
              {{ record.title || record.name }}
            </a>
            <div class="text-sm text-gray-500 mt-1">
              {{ formatDate(record.modified || record.creation) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  linkedRecords: {
    type: Array,
    default: () => []
  },
  showOnlyIfRecordsExist: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()

// Check if there are any linked records
const hasLinkedRecords = computed(() => {
  if (!props.showOnlyIfRecordsExist) return true
  return props.linkedRecords.length > 0
})

// Group linked records by doctype
const groupedLinkedRecords = computed(() => {
  const grouped = {}
  
  props.linkedRecords.forEach(record => {
    if (!grouped[record.doctype]) {
      grouped[record.doctype] = []
    }
    grouped[record.doctype].push(record)
  })
  
  return grouped
})

// Get route from doctype
const getRouteFromDoctype = (doctype) => {
  return doctype.toLowerCase().replace(/\s+/g, '-')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Navigate to a linked record
const navigateToLinkedRecord = (doctype, name) => {
  const route = `/${getRouteFromDoctype(doctype)}/${name}`
  router.push(route)
}
</script>

<style scoped>
.linked-records-section {
  margin-top: 1.5rem;
}

@media (max-width: 767px) {
  .linked-records-section {
    padding: 0 1rem;
  }
}
</style>