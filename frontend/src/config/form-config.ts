/**
 * Configuration for hidden fields in forms, organized by doctype
 */

// Define a type for the hidden fields configuration
type HiddenFieldsConfig = {
  // Global hidden fields that apply to all doctypes
  global: string[]
  // Doctype-specific hidden fields
  doctypes: Record<string, string[]>
  // Additional hidden fields that can be dynamically added at runtime
  additional: string[]
}

// Initialize the configuration
export const HIDDEN_FIELDS_CONFIG: HiddenFieldsConfig = {
  global: [
    // Fields that should be hidden in all doctypes
    "naming_series",
    "section_break_19",
    "email_account",
    "via_customer_portal",
    "subject_section",
  ],

  doctypes: {
    // Issue DocType hidden fields
    Issue: [
      "avg_response_time",
      "total_hold_time",
      "lead",
      "first_response_time",
      "user_resolution_time",
      "opening_date",
      "opening_time",
      "resolution_time",
      "agreement_status",
      "service_level_agreement",
      "response_by",
      "resolution_by",
      "response_by_variance",
      "resolution_by_variance",
      "on_hold_since",
      "total_hold_time",
      "user",
      "customer_name",
      "service_level_section",
      "issue_split_from",
      "contact",
      "resolution_details",
      "response",
      "first_responded_on",
      "additional_info",
      "custom_qc_count",
      "custom_qc_rework_count",
      "custom_client_rework_count",
      "custom_client_change_count_",
      "sla_resolution_by",
      "customer",
      "custom_issue_tracker",
      "company",
    ],

    // Task DocType hidden fields
    Task: [
      "sb_depends_on",
      "depends_on",
      "depends_on_tasks",
      "sb_actual",
      "act_start_date",
      "act_end_date",
      "actual_time",
      "sb_costing",
      "total_costing_amount",
      "total_billing_amount",
      "total_expense_claim",
      "sb_more_info",
      "review_date",
      "closing_date",
      "department",
      "custom_custom_title",
      "custom_development_complete",
      "custom_section_break_ixk4k",
      "custom_development_checklist",
      "custom_section_break_5sqth",
      "custom_development_note",
      "custom_qc_date",
      "custom_qc_template",
      "custom_tester",
      "custom_qc_complete",
      "custom_section_break_n3cef",
      "custom_qc_check",
      "custom_section_break_qrtn3",
      "custom_quality_control_notes",
      "tna_base_document_no",
      "tna_planner",
      "tna_status",
      "custom_tna_end_date",
      "completed_by",
      "completed_on",
      "start",
      "duration",
      "is_milestone",
      "custom_section_break_iahoa",
      "custom_task_resource",
      "custom_total_amount",
    ],

    // TimeSheet DocType hidden fields - Note the exact string case matching
    Timesheet: [
      "sales_invoice",
      "salary_slip",
      "start_date",
      "end_date",
      "total_billed_hours",
      "total_billed_amount",
      "base_total_billable_amount",
      "base_total_billed_amount",
      "base_total_costing_amount",
      "per_billed",
      "section_break_18",
      "note",
      "company",
      "customer",
      "exchange_rate",
      "currency",
    ],

    // Timesheet Detail hidden fields
    "Timesheet Detail": [
      "billing_hours",
      "billing_rate",
      "billing_amount",
      "base_billing_rate",
      "base_billing_amount",
      "costing_rate",
      "costing_amount",
      "base_costing_rate",
      "base_costing_amount",
      "weightage",
      "project_name",
      "is_billable",
      "sales_invoice",
      
    ],
  },

  additional: [],
}

/**
 * Get all hidden fields for a specific doctype
 * @param doctype The doctype to get hidden fields for
 * @returns Array of hidden field names
 */
export const getHiddenFields = (doctype?: string): string[] => {
  // Start with global hidden fields
  const hiddenFields = [...HIDDEN_FIELDS_CONFIG.global, ...HIDDEN_FIELDS_CONFIG.additional]

  // Add doctype-specific hidden fields if a doctype is provided
  if (doctype) {
    // Try to find the doctype in the configuration (case-sensitive)
    if (HIDDEN_FIELDS_CONFIG.doctypes[doctype]) {
      hiddenFields.push(...HIDDEN_FIELDS_CONFIG.doctypes[doctype])
    } else {
      // Try case-insensitive match as a fallback
      const doctypeKey = Object.keys(HIDDEN_FIELDS_CONFIG.doctypes).find(
        (key) => key.toLowerCase() === doctype.toLowerCase(),
      )
      if (doctypeKey) {
        hiddenFields.push(...HIDDEN_FIELDS_CONFIG.doctypes[doctypeKey])
      }
    }
  }

  return hiddenFields
}

/**
 * Hide a field dynamically
 * @param fieldname Field name to hide
 */
export const hideField = (fieldname: string): void => {
  if (!HIDDEN_FIELDS_CONFIG.additional.includes(fieldname)) {
    HIDDEN_FIELDS_CONFIG.additional.push(fieldname)
  }
}

/**
 * Show a previously hidden field
 * @param fieldname Field name to show
 */
export const showField = (fieldname: string): void => {
  const index = HIDDEN_FIELDS_CONFIG.additional.indexOf(fieldname)
  if (index !== -1) {
    HIDDEN_FIELDS_CONFIG.additional.splice(index, 1)
  }
}

/**
 * Add hidden fields for a specific doctype
 * @param doctype The doctype to add hidden fields for
 * @param fieldnames Array of field names to hide
 */
export const addHiddenFieldsForDoctype = (doctype: string, fieldnames: string[]): void => {
  if (!HIDDEN_FIELDS_CONFIG.doctypes[doctype]) {
    HIDDEN_FIELDS_CONFIG.doctypes[doctype] = []
  }

  fieldnames.forEach((fieldname) => {
    if (!HIDDEN_FIELDS_CONFIG.doctypes[doctype].includes(fieldname)) {
      HIDDEN_FIELDS_CONFIG.doctypes[doctype].push(fieldname)
    }
  })
}

/**
 * Remove hidden fields for a specific doctype
 * @param doctype The doctype to remove hidden fields from
 * @param fieldnames Array of field names to show (or all if not provided)
 */
export const removeHiddenFieldsForDoctype = (doctype: string, fieldnames?: string[]): void => {
  if (!HIDDEN_FIELDS_CONFIG.doctypes[doctype]) return

  if (!fieldnames) {
    // Remove all hidden fields for this doctype
    delete HIDDEN_FIELDS_CONFIG.doctypes[doctype]
  } else {
    // Remove specific fields
    fieldnames.forEach((fieldname) => {
      const index = HIDDEN_FIELDS_CONFIG.doctypes[doctype].indexOf(fieldname)
      if (index !== -1) {
        HIDDEN_FIELDS_CONFIG.doctypes[doctype].splice(index, 1)
      }
    })
  }
}

// For backward compatibility
export const HIDDEN_FIELDS = [
  ...HIDDEN_FIELDS_CONFIG.global,
  ...(HIDDEN_FIELDS_CONFIG.doctypes.Issue || []),
  ...(HIDDEN_FIELDS_CONFIG.doctypes.Task || []),
  ...(HIDDEN_FIELDS_CONFIG.doctypes.TimeSheet || []),
]

export const additionalHiddenFields = HIDDEN_FIELDS_CONFIG.additional
