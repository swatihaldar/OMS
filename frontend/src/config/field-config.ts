interface DoctypeFieldConfig {
  hiddenFields: string[]
  readonlyFields: string[]
  hiddenViewFields: string[]
}

interface FieldConfigMap {
  [doctype: string]: DoctypeFieldConfig
}


const defaultConfig: DoctypeFieldConfig = {
  hiddenFields: [],
  readonlyFields: [],
  hiddenViewFields: [],
}


const defaultHiddenViewFields = [
  "name", "owner", "creation", "modified", 
  "modified_by", "docstatus", "idx",
  "parent", "parentfield", "parenttype"
];

// Specific configurations by doctype
const fieldConfigs: FieldConfigMap = {

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

  Issue: {
    hiddenFields: [],
    readonlyFields: [],
    hiddenViewFields: [],
  },

  // Child doctypes configuration
  "Timesheet Detail": {
    hiddenFields: ['activity_type'],
    readonlyFields: [],
    // Combine default hidden fields with custom hidden fields
    hiddenViewFields: [...defaultHiddenViewFields, 'activity_type'],
  },
  
}


export function getFieldConfig(doctype: string): DoctypeFieldConfig {
  if (fieldConfigs[doctype]) {
    return fieldConfigs[doctype];
  }
  
  if (doctype && (doctype.includes("Detail") || doctype.includes("Item") || doctype.includes("Child"))) {
    return {
      hiddenFields: [],
      readonlyFields: [],
      hiddenViewFields: defaultHiddenViewFields,
    };
  }
  
  return defaultConfig;
}


export function shouldHideField(doctype: string, fieldname: string): boolean {
  const config = getFieldConfig(doctype);
  return config.hiddenFields.includes(fieldname);
}


export function shouldHideViewField(doctype: string, fieldname: string): boolean {

  if (defaultHiddenViewFields.includes(fieldname) && 
      (doctype.includes("Detail") || doctype.includes("Item") || doctype.includes("Child"))) {
    return true;
  }
  
  const config = getFieldConfig(doctype);
  return config.hiddenViewFields.includes(fieldname);
}

export function isReadonlyField(doctype: string, fieldname: string): boolean {
  const config = getFieldConfig(doctype);
  return config.readonlyFields.includes(fieldname);
}