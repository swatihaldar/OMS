export const HIDDEN_FIELDS = [
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
  "naming_series",
  "customer_name",
  "service_level_section",
  "issue_split_from",
  "contact",
  "section_break_19",
  "resolution_details",
  "response",
  "first_responded_on",
  "additional_info",
  "email_account",
  "via_customer_portal",
  "subject_section",
  "custom_qc_count",
  "custom_qc_rework_count",
  "custom_client_rework_count",
  "custom_client_change_count_",
  "sla_resolution_by",
  "customer",
  "custom_issue_tracker",
  "company",

  // For Task DocType
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

]

/**
 * Additional hidden fields that can be dynamically added at runtime
 */
export const additionalHiddenFields: string[] = ["opening_date"]

export const getHiddenFields = (): string[] => {
  return [...HIDDEN_FIELDS, ...additionalHiddenFields]
}

export const hideField = (fieldname: string): void => {
  if (!additionalHiddenFields.includes(fieldname)) {
    additionalHiddenFields.push(fieldname)
  }
}

export const showField = (fieldname: string): void => {
  const index = additionalHiddenFields.indexOf(fieldname)
  if (index !== -1) {
    additionalHiddenFields.splice(index, 1)
  }
}