/**
 * API utility functions for Frappe
 */

// Cache for API responses
const apiCache = {
  doctypeFields: {},
  linkOptions: {},
  clientScripts: {},
}

/**
 * Get the current logged-in user
 * @returns {Promise<string>} - The username of the current user
 */
async function getCurrentUser() {
  try {
    const response = await fetch("/api/method/frappe.auth.get_logged_user")
    const data = await response.json()
    return data.message || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Fetch user roles for the current user
 * @returns {Promise<Array>} - Array of role names
 */
async function fetchUserRoles() {
  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: "Has Role",
        fields: ["role"],
        filters: {
          parenttype: "User",
          parent: await getCurrentUser(),
        },
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message.map((item) => item.role)
    }

    return []
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return []
  }
}

/**
 * Fetch user permissions for the current user
 * @returns {Promise<Array>} - Array of user permission objects
 */
async function fetchUserPermissions() {
  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: "User Permission",
        fields: ["name", "allow", "for_value", "apply_to_all_doctypes", "applicable_for"],
        filters: {
          user: await getCurrentUser(),
        },
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }

    return []
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return []
  }
}

/**
 * Fetch permissions for a doctype
 * @param {string} doctype - The doctype name
 * @returns {Promise<Array>} - Array of permission objects
 */
async function fetchDocPermissions(doctype) {
  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctype: "DocPerm",
        fields: [
          "name",
          "role",
          "permlevel",
          "read",
          "write",
          "create",
          "delete",
          "submit",
          "cancel",
          "amend",
          "report",
          "import",
          "export",
          "print",
          "email",
          "share",
          "if_owner",
        ],
        filters: {
          parent: doctype,
        },
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }

    return []
  } catch (error) {
    console.error(`Error fetching permissions for ${doctype}:`, error)
    return []
  }
}

/**
 * Fetch fields for a doctype
 * @param {string} doctype - The doctype name
 * @returns {Promise<Array>} - Array of field objects
 */
async function fetchDoctypeFields(doctype) {
  // Check cache first
  if (apiCache.doctypeFields[doctype]) {
    return apiCache.doctypeFields[doctype]
  }

  try {
    console.log(`Fetching doctype fields for ${doctype}...`)

    try {
      const response = await fetch("/api/method/oms.api.get_doctype_fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctype: doctype,
        }),
      })

      const data = await response.json()

      if (data.message && Array.isArray(data.message) && data.message.length > 0) {
        apiCache.doctypeFields[doctype] = data.message
        console.log(`Successfully fetched ${data.message.length} fields using custom API`)
        return data.message
      } else {
        console.log("Custom API returned no fields, falling back to standard API")
      }
    } catch (error) {
      console.error("Error using custom API, falling back to standard API:", error)
    }

    // Fallback to standard Frappe API
    const response = await fetch("/api/method/frappe.desk.form.load.getdoctype", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctype: doctype,
      }),
    })

    const data = await response.json()

    if (data.message && data.message.docs && data.message.docs[0]) {
      // Get the doctype definition
      const doctypeDef = data.message.docs[0]

      // Store all fields
      apiCache.doctypeFields[doctype] = doctypeDef.fields || []
      console.log(`Successfully fetched ${doctypeDef.fields.length} fields using standard API`)
      return doctypeDef.fields
    } else {
      console.error("Failed to get fields from standard API")
      throw new Error("Failed to get doctype fields")
    }
  } catch (error) {
    console.error("Error fetching doctype fields:", error)
    throw error
  }
}

/**
 * Get field permissions for a doctype
 * @param {string} doctype - The doctype name
 * @returns {Promise<Object>} - Object mapping fieldnames to permission levels
 */
async function getFieldPermissions(doctype) {
  try {
    const fields = await fetchDoctypeFields(doctype)

    const fieldPermissions = {}

    for (const field of fields) {
      fieldPermissions[field.fieldname] = field.permlevel || 0
    }

    return fieldPermissions
  } catch (error) {
    console.error(`Error getting field permissions for ${doctype}:`, error)
    return {}
  }
}

/**
 * Fetch options for a Link field
 * @param {string} doctype - The linked doctype
 * @param {Array} fields - The fields to fetch
 * @returns {Promise<Array>} - Array of option objects
 */
async function fetchLinkOptions(doctype, fields = ["name"]) {
  const cacheKey = `${doctype}:${fields.join(",")}`

  // Check cache first
  if (apiCache.linkOptions[cacheKey]) {
    return apiCache.linkOptions[cacheKey]
  }

  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctype: doctype,
        fields: fields,
        limit: 50,
      }),
    })

    const data = await response.json()

    if (data.message) {
      apiCache.linkOptions[cacheKey] = data.message
      return data.message
    }

    return []
  } catch (error) {
    console.error(`Error fetching options for ${doctype}:`, error)
    return []
  }
}

/**
 * Fetch client scripts for a doctype
 * @param {string} doctype - The doctype name
 * @returns {Promise<Array>} - Array of client script objects
 */
async function fetchClientScripts(doctype) {
  // Check cache first
  if (apiCache.clientScripts[doctype]) {
    return apiCache.clientScripts[doctype]
  }

  try {
    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctype: "Client Script",
        fields: ["name", "script", "dt", "enabled"],
        filters: {
          dt: doctype,
          enabled: 1,
        },
      }),
    })

    const data = await response.json()

    if (data.message) {
      apiCache.clientScripts[doctype] = data.message
      return data.message
    }

    return []
  } catch (error) {
    console.error(`Error fetching client scripts for ${doctype}:`, error)
    return []
  }
}

/**
 * Fetch a document by doctype and name
 * @param {string} doctype - The doctype name
 * @param {string} name - The document name
 * @returns {Promise<Object>} - The document object
 */
async function fetchDocument(doctype, name) {
  try {
    const response = await fetch("/api/method/frappe.client.get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctype: doctype,
        name: name,
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }

    throw new Error(`Document ${doctype} ${name} not found`)
  } catch (error) {
    console.error(`Error fetching document ${doctype} ${name}:`, error)
    throw error
  }
}

/**
 * Fetch a list of documents
 * @param {Object} options - The options object
 * @param {string} options.doctype - The doctype name
 * @param {Array} options.fields - The fields to fetch
 * @param {Object} options.filters - The filters to apply
 * @param {Array} options.orFilters - The OR filters to apply
 * @param {number} options.start - The start index
 * @param {number} options.limit - The limit
 * @param {string} options.orderBy - The order by clause
 * @returns {Promise<Object>} - Object with records and totalCount
 */
async function fetchDocumentList(options) {
  try {
    const {
      doctype,
      fields = ["*"],
      filters = {},
      orFilters,
      start = 0,
      limit = 20,
      orderBy = "creation desc",
    } = options

    const requestBody = {
      doctype: doctype,
      fields: fields,
      filters: filters,
      start: start,
      limit_page_length: limit,
    }

    if (orFilters && orFilters.length > 0) {
      requestBody.or_filters = orFilters
    }

    if (orderBy) {
      const [field, order] = orderBy.split(" ")
      requestBody.order_by = `${field} ${order}`
    }

    const response = await fetch("/api/method/frappe.client.get_list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (data.message) {
      // Get total count
      const countResponse = await fetch("/api/method/frappe.client.get_count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctype: doctype,
          filters: filters,
        }),
      })

      const countData = await countResponse.json()

      return {
        records: data.message,
        totalCount: countData.message || data.message.length,
      }
    }

    return {
      records: [],
      totalCount: 0,
    }
  } catch (error) {
    console.error(`Error fetching document list for ${options.doctype}:`, error)
    throw error
  }
}

/**
 * Create a new document
 * @param {Object} doc - The document object
 * @returns {Promise<Object>} - The created document
 */
async function createDocument(doc) {
  try {
    const response = await fetch("/api/method/frappe.client.insert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doc: doc,
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }

    throw new Error("Failed to create document")
  } catch (error) {
    console.error(`Error creating document ${doc.doctype}:`, error)
    throw error
  }
}

/**
 * Update an existing document
 * @param {Object} doc - The document object
 * @returns {Promise<Object>} - The updated document
 */
async function updateDocument(doc) {
  try {
    const response = await fetch("/api/method/frappe.client.save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doc: doc,
      }),
    })

    const data = await response.json()

    if (data.message) {
      return data.message
    }

    throw new Error("Failed to update document")
  } catch (error) {
    console.error(`Error updating document ${doc.doctype} ${doc.name}:`, error)
    throw error
  }
}

/**
 * Save a document (create or update)
 * @param {Object} doc - The document object
 * @param {boolean} isNew - Whether this is a new document
 * @returns {Promise<Object>} - The saved document
 */
async function saveDocument(doc, isNew = false) {
  if (isNew) {
    return createDocument(doc)
  } else {
    return updateDocument(doc)
  }
}

/**
 * Delete a document
 * @param {string} doctype - The doctype name
 * @param {string} name - The document name
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
async function deleteDocument(doctype, name) {
  try {
    const response = await fetch("/api/method/frappe.client.delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctype: doctype,
        name: name,
      }),
    })

    const data = await response.json()

    if (data.message === "ok") {
      return true
    }

    throw new Error("Failed to delete document")
  } catch (error) {
    console.error(`Error deleting document ${doctype} ${name}:`, error)
    throw error
  }
}

/**
 * Clear the API cache
 */
function clearCache() {
  apiCache.doctypeFields = {}
  apiCache.linkOptions = {}
  apiCache.clientScripts = {}
}

export default {
  getCurrentUser,
  fetchUserRoles,
  fetchUserPermissions,
  fetchDocPermissions,
  fetchDoctypeFields,
  getFieldPermissions,
  fetchLinkOptions,
  fetchClientScripts,
  fetchDocument,
  fetchDocumentList,
  createDocument,
  updateDocument,
  saveDocument,
  deleteDocument,
  clearCache,
}

