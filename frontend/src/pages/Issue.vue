<template>
  <DocTypeView
    doctype="Issue"
    titleField="subject"
    :listFields="['status', 'project', 'creation','custom_client_status','allocated_to']"
  />
</template>

<script setup>
import DocTypeView from '@/components/DocTypeView.vue';
</script>