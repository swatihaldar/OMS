<template>
  <Autocomplete
    :options="options"
    :modelValue="modelValue"
    :placeholder="`Select ${doctype}`"
    :disabled="disabled"
    @update:modelValue="(v) => $emit('update:modelValue', v?.value)"
    @update:query="handleSearch"
  />
</template>

<script setup>
import { Autocomplete } from "frappe-ui"
import { ref, onMounted } from "vue"

const props = defineProps({
  doctype: String,
  modelValue: [String, Number],
  filters: Object,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])

const options = ref([])

const handleSearch = async (query) => {
  if (!query || query.length < 2) return
  
  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: props.doctype,
        fields: ["name", "title"],
        filters: {
          name: ["like", `%${query}%`],
          ...props.filters
        },
        limit_page_length: 20,
      }),
    })

    const data = await response.json()
    if (data.message) {
      options.value = data.message.map(item => ({
        value: item.name,
        label: item.title || item.name
      }))
    }
  } catch (error) {
    console.error(`Error searching ${props.doctype}:`, error)
  }
}

onMounted(async () => {
  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: props.doctype,
        fields: ["name", "title"],
        filters: props.filters || {},
        limit_page_length: 50,
        order_by: "creation desc"
      }),
    })

    const data = await response.json()
    if (data.message) {
      options.value = data.message.map(item => ({
        value: item.name,
        label: item.title || item.name
      }))
    }
  } catch (error) {
    console.error(`Error loading ${props.doctype} options:`, error)
  }
})
</script>
