<template>
  <GenerateUI
    doctype="Employee"
    titleField="employee"
    :listFields="['status', 'department']"
  />
</template>

<script setup>
import GenerateUI from '../components/GenerateUI.vue';
</script>