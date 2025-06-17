<template>
  <div @click.stop>
    <!-- List View -->
    <ListView 
      v-if="mode === 'list'"
      :doctype="doctype"
      :titleField="titleField"
      :listFields="listFields"
      :showOnlyOwnRecords="showOnlyOwnRecords"
      :standardFilters="standardFilters"
      :filters="filters"
      @click.stop
    />
    
    <!-- Combined View/Edit Mode -->
    <FormHandler
      v-else
      :doctype="doctype"
      :recordId="recordId"
      :defaultValues="enhancedDefaultValues"
      :titleField="titleField"
      :mode="mode"
      @form-submitted="handleFormSubmitted"
      @cancel="handleFormCancel"
      @record-deleted="handleRecordDeleted"
      @record-updated="handleRecordUpdated"
      @click.stop
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ListView from '@/components/ListView.vue';
import FormHandler from '@/components/FormHandler.vue';
import api from '@/utils/api';
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

const { 
  currentUser, 
  canCreate, 
  canRead, 
  canWrite, 
  canDelete, 
  userPermissions, 
  checkPermissions 
} = usePermissions();

const doctypeRoute = computed(() => {
  return props.doctype.toLowerCase().replace(/\s+/g, '-');
});

const mode = computed(() => {
  const path = route.path;
  const baseRoute = `/${doctypeRoute.value}`;
  
  if (path === baseRoute) {
    return 'list';
  } else if (path === `${baseRoute}/new`) {
    return 'add';
  } else {
    // All document views now go to edit mode
    return 'edit';
  }
});

const recordId = computed(() => {
  if (route.path === `/${doctypeRoute.value}/new`) {
    return null;
  } else {
    return route.params.id;
  }
});

const enhancedDefaultValues = computed(() => {
  const defaults = { ...props.defaultValues };
  
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

const fetchDoctypeFields = async () => {
  try {
    const result = await api.fetchDoctypeFields(props.doctype);
    if (Array.isArray(result)) {
      doctypeFields.value = result;
    } else if (result && result.fields) {
      doctypeFields.value = result.fields;
    }
    
    console.log(`Loaded ${doctypeFields.value.length} fields for ${props.doctype}`);
    console.log(`Permission check: canCreate=${canCreate.value}, canRead=${canRead.value}, canWrite=${canWrite.value}, canDelete=${canDelete.value}`);
    
    if (!canRead.value && mode.value === 'list') {
      console.error(`User doesn't have permission to read ${props.doctype}`);
    }
    
    if (!canCreate.value && mode.value === 'form' && !recordId.value) {
      console.error(`User doesn't have permission to create ${props.doctype}`);
      router.push(`/${doctypeRoute.value}`);
    }
  } catch (error) {
    console.error(`Error fetching fields for ${props.doctype}:`, error);
  }
};

onMounted(() => {
  checkPermissions(props.doctype).then(fetchDoctypeFields);
});

watch(() => props.doctype, (newDoctype) => {
  checkPermissions(newDoctype).then(fetchDoctypeFields);
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
  router.push(`/${doctypeRoute.value}`);
};

const handleFormCancel = () => {
  router.push(`/${doctypeRoute.value}`);
};
</script>
