export const HIDDEN_FIELDS = [
  "avg_response_time",
  "total_hold_time",
  "lead",
  "first_response_time",
  "user_resolution_time",
  "opening_date",
  "opening_time",
  "resolution_date",
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
  "raised_by",
  "issue_type",
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
  "company",
  "via_customer_portal",
  "subject_section",
  // "custom_demo_name",
]

/**
 * Additional hidden fields that can be dynamically added at runtime
 */
export const additionalHiddenFields: string[] = []

/**
 * Get the complete list of hidden fields
 * @returns {string[]} Array of field names to hide
 */
export const getHiddenFields = (): string[] => {
  return [...HIDDEN_FIELDS, ...additionalHiddenFields]
}

/**
 * Add a field to the hidden fields list
 * @param {string} fieldname - The field name to hide
 */
export const hideField = (fieldname: string): void => {
  if (!additionalHiddenFields.includes(fieldname)) {
    additionalHiddenFields.push(fieldname)
  }
}

/**
 * Remove a field from the hidden fields list
 * @param {string} fieldname - The field name to show
 */
export const showField = (fieldname: string): void => {
  const index = additionalHiddenFields.indexOf(fieldname)
  if (index !== -1) {
    additionalHiddenFields.splice(index, 1)
  }
}