<template>
    <DocTypeView
      doctype="Task"
      titleField="subject"
      :listFields="['status', 'project', 'priority', 'creation','allocated_to']"
    />
  </template>
  
  <script setup>
  import DocTypeView from '@/components/DocTypeView.vue';
  </script>