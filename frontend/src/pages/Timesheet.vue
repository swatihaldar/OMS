<template>
    <DocTypeView
      doctype="Timesheet"
      titleField="subject"
      :listFields="['status', 'start_date', 'total_hours', ]"
    />
  </template>
  
  <script setup>
  import DocTypeView from '@/components/DocTypeView.vue';
  </script>