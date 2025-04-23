<template>
  <div>
    <!-- List View -->
    <ListView 
      v-if="mode === 'list'"
      :doctype="doctype"
      :titleField="titleField"
      :listFields="listFields"
      :showOnlyOwnRecords="true"
    />
    
    <!-- Detail View -->
    <DetailView
      v-else-if="mode === 'detail'"
      :doctype="doctype"
      :recordId="recordId"
      :titleField="titleField"
      :detailFields="detailFields"
      @record-deleted="handleRecordDeleted"
    />
    
    <!-- Form View (New/Edit) -->
    <FormHandler
      v-else-if="mode === 'form'"
      :doctype="doctype"
      :recordId="recordId"
      :defaultValues="defaultValues"
      :titleField="titleField"
      @form-submitted="handleFormSubmitted"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ListView from '@/components/ListView.vue';
import DetailView from '@/components/DetailView.vue';
import FormHandler from '@/components/FormHandler.vue';
import api from '@/utils/api';

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
  }
});

const emit = defineEmits(['record-deleted', 'form-submitted']);

const route = useRoute();
const router = useRouter();
const doctypeFields = ref([]);
const userPermissions = ref([]);

// Fetch doctype fields on component mount
onMounted(async () => {
  try {
    const result = await api.fetchDoctypeFields(props.doctype);
    if (Array.isArray(result)) {
      doctypeFields.value = result;
    } else if (result && result.fields) {
      doctypeFields.value = result.fields;
    }
    
    await fetchUserPermissions();
  } catch (error) {
    console.error(`Error fetching fields for ${props.doctype}:`, error);
  }
});

const fetchUserPermissions = async () => {
  try {
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'User Permission',
        fields: ['name', 'user', 'allow', 'for_value'],
        filters: {
          user: ['=', await api.getCurrentUser()]
        }
      })
    });
    
    const data = await response.json();
    if (data.message) {
      userPermissions.value = data.message;
      console.log('User permissions loaded:', userPermissions.value);
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
  }
};

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

const handleFormSubmitted = (record) => {
  emit('form-submitted', record);
  router.push(`/${doctypeRoute.value}/${record.name}`);
};
</script>