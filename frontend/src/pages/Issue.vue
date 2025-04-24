<template>
  <GenerateUI
    doctype="Issue"
    titleField="subject"
    :listFields="['status', 'project', 'creation', 'custom_client_status', 'allocated_to','raised_by']"
    :showOnlyOwnRecords="true"
  />
</template>

<script setup>
import GenerateUI from '../components/GenerateUI.vue';
</script>