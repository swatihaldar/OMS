/**
 * Get the list of fields to hide in the form for a specific doctype
 * @param {string} doctype - The doctype name
 * @returns {Array} - Array of field names to hide
 */
export function getHiddenFields(doctype) {
  // Common fields to hide across all doctypes
  const commonHiddenFields = [
    "naming_series",
    "amended_from",
    "amendment_date",
    "_user_tags",
    "_comments",
    "_assign",
    "_liked_by",
  ]

  // Doctype-specific fields to hide
  const doctypeHiddenFields = {
    Issue: [
      // Add Issue-specific fields to hide here
      "via_customer_portal",
      "resolution_date",
      "first_response_time",
      "additional_info",
      "response_by",
      "resolution_by",
      "agreement_status",
      "subject_section",
    ],
    Project: [
      // Add Project-specific fields to hide here
      "cost_center",
      "collected_amount",
      "total_costing_amount",
      "total_expense_claim",
      "total_purchase_cost",
    ],
    // Add more doctypes as needed
  }

  // Return combined list of hidden fields
  return [...commonHiddenFields, ...(doctype && doctypeHiddenFields[doctype] ? doctypeHiddenFields[doctype] : [])]
}

/**
 * Get the list of fields to show in the list view for a specific doctype
 * @param {string} doctype - The doctype name
 * @returns {Array} - Array of field names to show in list view
 */
export function getListViewFields(doctype) {
  // Default fields to show in list view if not specified in doctype
  const defaultListViewFields = {
    Issue: ["name", "subject", "status", "priority", "creation"],
    // Add more doctypes as needed
  }

  return doctype && defaultListViewFields[doctype] ? defaultListViewFields[doctype] : ["name", "creation", "modified"]
}

export default {
  getHiddenFields,
  getListViewFields,
}

