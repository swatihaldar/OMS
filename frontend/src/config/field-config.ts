interface DoctypeFieldConfig {
  hiddenFields: string[]
  readonlyFields: string[]
  hiddenViewFields: string[] // Fields to hide in detail view
}

interface FieldConfigMap {
  [doctype: string]: DoctypeFieldConfig
}

// Default configuration for all doctypes
const defaultConfig: DoctypeFieldConfig = {
  hiddenFields: [],
  readonlyFields: [],
  hiddenViewFields: [],
}

// Specific configurations by doctype
const fieldConfigs: FieldConfigMap = {

  // Example: Task doctype configuration
  Task: {
    hiddenFields: ["tna_base_document_no","tna_planne","custom_tna_end_date","completed_by","completed_on","start","duration","custom_section_break_iahoa",
      "custom_task_resource","custom_total_amount","sb_depends_on","depends_on","depends_on_tasks","act_start_date","act_end_date","review_date",
      "closing_date","custom_development_checklist","custom_qc_check","color"
    ],
    readonlyFields: [],
    hiddenViewFields: ['custom_section_break_iahoa','custom_task_resource','custom_total_amount','sb_depends_on','depends_on','actual_time','custom_developer_name',
      'custom_development_complete','company','custom_development_checklist','custom_qc_complete','custom_qc_check'
    ],
  },

  // Example: Customer doctype configuration
  Issue: {
    hiddenFields: [],
    readonlyFields: [],
    hiddenViewFields: [],
  },

  // Add more doctype configurations as needed
}

/**
 * Get field configuration for a specific doctype
 * @param doctype The doctype name
 * @returns Field configuration for the doctype
 */
export function getFieldConfig(doctype: string): DoctypeFieldConfig {
  return fieldConfigs[doctype] || defaultConfig
}

/**
 * Check if a field should be hidden in the edit form
 * @param doctype The doctype name
 * @param fieldname The field name
 * @returns True if the field should be hidden
 */
export function shouldHideField(doctype: string, fieldname: string): boolean {
  const config = getFieldConfig(doctype)
  return config.hiddenFields.includes(fieldname)
}

/**
 * Check if a field should be hidden in the detail view
 * @param doctype The doctype name
 * @param fieldname The field name
 * @returns True if the field should be hidden in detail view
 */
export function shouldHideViewField(doctype: string, fieldname: string): boolean {
  const config = getFieldConfig(doctype)
  return config.hiddenViewFields.includes(fieldname)
}

/**
 * Check if a field should be readonly in the edit form
 * @param doctype The doctype name
 * @param fieldname The field name
 * @returns True if the field should be readonly
 */
export function isReadonlyField(doctype: string, fieldname: string): boolean {
  const config = getFieldConfig(doctype)
  return config.readonlyFields.includes(fieldname)
}

