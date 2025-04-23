<template>
    <DocTypeView
      doctype="Employee"
      titleField="employee"
      :listFields="['status', 'department']"
    />
  </template>
  
  <script setup>
  import DocTypeView from '@/components/DocTypeView.vue';
  </script>