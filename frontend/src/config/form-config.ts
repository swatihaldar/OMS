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
  "customer"

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