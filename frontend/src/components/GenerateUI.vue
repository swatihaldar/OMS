<template>
  <div>
    <!-- List View -->
    <ListView 
      v-if="mode === 'list'"
      :doctype="doctype"
      :titleField="titleField"
      :listFields="listFields"
      :showOnlyOwnRecords="showOnlyOwnRecords"
      :standardFilters="standardFilters"
      :filters="filters"
    />
    
    <!-- Detail View -->
    <DetailView
      v-else-if="mode === 'detail'"
      :doctype="doctype"
      :recordId="recordId"
      :titleField="titleField"
      :detailFields="detailFields"
      @record-deleted="handleRecordDeleted"
      @record-updated="handleRecordUpdated"
    />
    
    <!-- Form View (New/Edit) -->
    <FormHandler
      v-else-if="mode === 'form'"
      :doctype="doctype"
      :recordId="recordId"
      :defaultValues="enhancedDefaultValues"
      :titleField="titleField"
      @form-submitted="handleFormSubmitted"
      @cancel="handleFormCancel"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ListView from '@/components/ListView.vue';
import DetailView from '@/components/DetailView.vue';
import FormHandler from '@/components/FormHandler.vue';
import api from '@/utils/api';
// import { usePermissions } from '@/composables/usePermissions';
import { usePermissions } from '../composables/usePermissions';

const props = defineProps({
  doctype: {
    type: String,
    required: true
  },
  titleField: {
    type: String,
    default: 'name'
  },
  listFields: {
    type: Array,
    default: () => []
  },
  detailFields: {
    type: Array,
    default: () => []
  },
  defaultValues: {
    type: Object,
    default: () => ({})
  },
  showOnlyOwnRecords: {
    type: Boolean,
    default: false
  },
  standardFilters: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['record-deleted', 'form-submitted', 'record-updated']);

const route = useRoute();
const router = useRouter();
const doctypeFields = ref([]);

// Use the permissions composable
const { 
  currentUser, 
  canCreate, 
  canRead, 
  canWrite, 
  canDelete, 
  userPermissions, 
  checkPermissions 
} = usePermissions();

// Fetch doctype fields on component mount
onMounted(async () => {
  try {
    // Check permissions for this doctype
    await checkPermissions(props.doctype);
    
    const result = await api.fetchDoctypeFields(props.doctype);
    if (Array.isArray(result)) {
      doctypeFields.value = result;
    } else if (result && result.fields) {
      doctypeFields.value = result.fields;
    }
    
    console.log(`Loaded ${doctypeFields.value.length} fields for ${props.doctype}`);
    console.log(`Permission check: canCreate=${canCreate.value}, canRead=${canRead.value}, canWrite=${canWrite.value}, canDelete=${canDelete.value}`);
    
    // If user doesn't have read permission and we're in list view, show an error or redirect
    if (!canRead.value && mode.value === 'list') {
      console.error(`User doesn't have permission to read ${props.doctype}`);
      // You could redirect to a permission denied page or show an error message
    }
    
    // If user doesn't have create permission and we're in new form view, redirect to list
    if (!canCreate.value && mode.value === 'form' && !recordId.value) {
      console.error(`User doesn't have permission to create ${props.doctype}`);
      router.push(`/${doctypeRoute.value}`);
    }
  } catch (error) {
    console.error(`Error fetching fields for ${props.doctype}:`, error);
  }
});

// Watch for changes in doctype to update permissions
watch(() => props.doctype, async () => {
  await checkPermissions(props.doctype);
  
  try {
    const result = await api.fetchDoctypeFields(props.doctype);
    if (Array.isArray(result)) {
      doctypeFields.value = result;
    } else if (result && result.fields) {
      doctypeFields.value = result.fields;
    }
  } catch (error) {
    console.error(`Error fetching fields for ${props.doctype}:`, error);
  }
});

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const mode = computed(() => {
  const path = route.path;
  const baseRoute = `/${doctypeRoute.value}`;
  
  if (path === baseRoute) {
    return 'list';
  } else if (path === `${baseRoute}/new`) {
    return 'form';
  } else if (path.includes('/edit/')) {
    return 'form';
  } else {
    return 'detail';
  }
});

const recordId = computed(() => {
  if (route.path === `/${doctypeRoute.value}/new`) {
    return null;
  } else if (route.path.includes('/edit/')) {
    return route.params.id;
  } else {
    return route.params.id;
  }
});

const enhancedDefaultValues = computed(() => {
  const defaults = { ...props.defaultValues };
  
  // Apply user permissions as default values for new records
  userPermissions.value.forEach(permission => {
    const linkFields = doctypeFields.value.filter(field => 
      field.fieldtype === 'Link' && field.options === permission.allow
    );
    
    linkFields.forEach(field => {
      if (!defaults[field.fieldname]) {
        defaults[field.fieldname] = permission.for_value;
      }
    });
  });
  
  return defaults;
});

const handleRecordDeleted = (id) => {
  emit('record-deleted', id);
  router.push(`/${doctypeRoute.value}`);
};

const handleRecordUpdated = (record) => {
  emit('record-updated', record);
};

const handleFormSubmitted = (record) => {
  emit('form-submitted', record);
  router.push(`/${doctypeRoute.value}/${record.name}`);
};

const handleFormCancel = () => {
  if (recordId.value) {
    // If editing, go back to detail view
    router.push(`/${doctypeRoute.value}/${recordId.value}`);
  } else {
    // If creating new, go back to list view
    router.push(`/${doctypeRoute.value}`);
  }
};
</script>