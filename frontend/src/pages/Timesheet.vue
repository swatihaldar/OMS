<template>
    <GenerateUI
      doctype="Timesheet"
      titleField="employee_name"
      :listFields="['start_date', 'total_hours', ]"
    />
  </template>
  
  <script setup>
  import GenerateUI from '../components/GenerateUI.vue';
  </script>