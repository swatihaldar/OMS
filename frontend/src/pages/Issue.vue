<template>
  <DocTypeView
    doctype="Issue"
    titleField="subject"
    :listFields="['status', 'project', 'creation','custom_client_status']"
  />
</template>

<script setup>
import DocTypeView from '@/components/DocTypeView.vue';
</script>