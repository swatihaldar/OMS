<template>
    <GenerateUI
      doctype="Task"
      titleField="subject"
      :listFields="['status', 'project', 'priority', 'creation','allocated_to']"
      :showOnlyOwnRecords="true"
    />
  </template>
  
  <script setup>
  import GenerateUI from '../components/GenerateUI.vue';
  </script>