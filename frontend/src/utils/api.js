const API_ENDPOINTS = {
  GET_LIST: '/api/method/frappe.client.get_list',
  GET_DOC: '/api/method/frappe.client.get_doc',
  GET: '/api/method/frappe.client.get',
  INSERT: '/api/method/frappe.client.insert',
  SAVE: '/api/method/frappe.client.save',
  UPDATE: '/api/method/frappe.client.set_value',
  DELETE: '/api/method/frappe.client.delete',
  UPLOAD: '/api/method/upload_file',
  GET_DOCTYPE_FIELDS: '/api/method/frappe.desk.form.load.getdoctype',
  CUSTOM_GET_FIELDS: '/api/method/oms.api.get_doctype_fields',
  GET_CLIENT_SCRIPTS: '/api/method/frappe.client.get_list',
  GET_LOGGED_USER: '/api/method/frappe.auth.get_logged_user',
  GET_USER_PERMISSIONS: '/api/method/frappe.client.get_list'
};

/**
 * Fetch doctype fields with metadata
 * @param {string} doctype 
 * @returns {Promise<Array|Object>} 
 */

export async function fetchDoctypeFields(doctype) {
  try {
    console.log(`Fetching doctype fields for ${doctype}...`);
    
    // First try using custom API endpoint
    try {
      const response = await fetch(API_ENDPOINTS.CUSTOM_GET_FIELDS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctype })
      });
      
      const data = await response.json();
      
      if (data.message && Array.isArray(data.message) && data.message.length > 0) {
        console.log(`Successfully fetched ${data.message.length} fields using custom API`);
        return data.message;
      } else {
        console.log('Custom API returned no fields, falling back to standard API');
      }
    } catch (error) {
      console.error('Error using custom API, falling back to standard API:', error);
    }
    
    // Fallback to standard Frappe API
    const response = await fetch(API_ENDPOINTS.GET_DOCTYPE_FIELDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype })
    });
    
    const data = await response.json();
    
    if (data.message && data.message.docs && data.message.docs[0]) {
      const doctypeDef = data.message.docs[0];
      console.log(`Successfully fetched ${doctypeDef.fields.length} fields using standard API`);
      

      const processedFields = doctypeDef.fields.map(field => {
        if (field.in_list_view === '1' || field.in_list_view === 1) {
          field.in_list_view = true;
        } else {
          field.in_list_view = false;
        }
        
        if (field.in_standard_filter === '1' || field.in_standard_filter === 1) {
          field.in_standard_filter = true;
        } else {
          field.in_standard_filter = false;
        }
        
        return field;
      });
      
      return {
        fields: processedFields || [],
        clientScripts: data.message.__client_scripts || []
      };
    } else {
      throw new Error('Failed to get fields from standard API');
    }
  } catch (error) {
    console.error('Error fetching doctype fields:', error);
    throw error;
  }
}

/**
 * Fetch options for link fields
 * @param {string} doctype 
 * @param {Array} fields
 * @param {Object} filters
 * @returns {Promise<Array>} - Array of options
 */

export async function fetchLinkOptions(doctype, fields = ['name'], filters = {}) {
  try {
    const response = await fetch(API_ENDPOINTS.GET_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype,
        fields,
        filters,
        limit: 50
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching options for ${doctype}:`, error);
    return [];
  }
}

/**
 * Fetch a single document
 * @param {string} doctype - The doctype name
 * @param {string} name - The document name/ID
 * @returns {Promise<Object>} - The document data
 */
export async function fetchDocument(doctype, name) {
  try {
    const response = await fetch(API_ENDPOINTS.GET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name })
    });
    
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    throw new Error(`${doctype} not found`);
  } catch (error) {
    console.error(`Error fetching ${doctype}:`, error);
    throw error;
  }
}

/**
 * Fetch a list of documents
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - List of documents and total count
 */
export async function fetchDocumentList(params) {
  try {
    const { doctype, fields = ['*'], filters = {}, orFilters, 
            limit = 20, start = 0, orderBy = 'creation desc' } = params;
    
    // Fetch records with additional fields for link fields
    const response = await fetch(API_ENDPOINTS.GET_LIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype,
        fields,
        filters,
        or_filters: orFilters,
        limit_start: start,
        limit_page_length: limit,
        order_by: orderBy
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      const countResponse = await fetch(API_ENDPOINTS.GET_LIST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype,
          fields: ['name'],
          filters,
          or_filters: orFilters,
          limit_page_length: 0
        })
      });
      
      const countData = await countResponse.json();
      
 
      const enhancedRecords = await enhanceRecordsWithLinkData(data.message, doctype);
      
      return {
        records: enhancedRecords,
        totalCount: countData.message ? countData.message.length : 0
      };
    }
    
    return { records: [], totalCount: 0 };
  } catch (error) {
    console.error(`Error fetching ${params.doctype} list:`, error);
    throw error;
  }
}

/**
 * Enhance records with link field data
 * @param {Array} records - The records to enhance
 * @param {string} doctype - The doctype name
 * @returns {Promise<Array>} - Enhanced records
 */
async function enhanceRecordsWithLinkData(records, doctype) {
  try {
    const fieldsResult = await fetchDoctypeFields(doctype);
    let fields = [];
    
    if (Array.isArray(fieldsResult)) {
      fields = fieldsResult;
    } else if (fieldsResult && fieldsResult.fields) {
      fields = fieldsResult.fields;
    }
    

    const linkFields = fields.filter(field => field.fieldtype === 'Link');
    
    if (linkFields.length === 0) {
      return records;
    }
    
    const enhancedRecords = [...records];
    
    for (const record of enhancedRecords) {
      for (const linkField of linkFields) {
        const linkValue = record[linkField.fieldname];
        
        if (linkValue) {
          try {
            const linkedDoc = await fetchDocument(linkField.options, linkValue);
            
            record[`${linkField.fieldname}_data`] = {
              value: linkValue,
              label: getLinkedDocLabel(linkedDoc, linkField.options)
            };
          } catch (error) {
            console.error(`Error fetching linked document for ${linkField.fieldname}:`, error);
            record[`${linkField.fieldname}_data`] = {
              value: linkValue,
              label: linkValue
            };
          }
        }
      }
    }
    
    return enhancedRecords;
  } catch (error) {
    console.error('Error enhancing records with link data:', error);
    return records;
  }
}

/**
 * Get a display label for a linked document
 * @param {Object} doc - The linked document
 * @param {string} doctype - The linked doctype
 * @returns {string} - The display label
 */
function getLinkedDocLabel(doc, doctype) {
  if (!doc) return '';
  
  switch (doctype) {
    case 'Project':
      return doc.project_name || doc.name;
    case 'Contact':
      return `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || doc.name;
    case 'Customer':
      return doc.customer_name || doc.name;
    case 'Supplier':
      return doc.supplier_name || doc.name;
    case 'Employee':
      return `${doc.employee_name || ''} (${doc.name})`;
    default:
      for (const field of ['title', 'subject', 'name', 'description']) {
        if (doc[field]) {
          return doc[field];
        }
      }
      return doc.name;
  }
}

/**
 * Save a document (create or update)
 * @param {Object} doc 
 * @param {boolean} isNew 
 * @returns {Promise<Object>}
 */
export async function saveDocument(doc, isNew = true) {
  try {
    const endpoint = isNew ? API_ENDPOINTS.INSERT : API_ENDPOINTS.SAVE;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData.message || 'Error saving document');
    }
    
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    
    throw new Error('No response from server');
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
}

/**
 * Delete a document
 * @param {string} doctype - The doctype name
 * @param {string} name - The document name/ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteDocument(doctype, name) {
  try {
    const response = await fetch(API_ENDPOINTS.DELETE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.exception || errorData.message || `Error deleting ${doctype}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting ${doctype}:`, error);
    throw error;
  }
}

/**
 * Upload a file
 * @param {File} file - The file to upload
 * @param {string} doctype - The doctype name
 * @param {string} fieldname - The field name
 * @param {string} docname - The document name (optional)
 * @returns {Promise<string>} - The file URL
 */

export async function uploadFile(file, doctype, fieldname, docname = null) {
  try {
    const tempId = docname || Math.floor(Math.random() * 1000000).toString();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctype', doctype);
    formData.append('fieldname', fieldname);
    formData.append('is_private', 0);
    formData.append('docname', tempId);
    
    const response = await fetch(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.exception || 'Error uploading file');
    }
    
    const result = await response.json();
    
    if (result.message && result.message.file_url) {
      return result.message.file_url;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Get the current logged in user
 * @returns {Promise<string>} - The username
 */

export async function getCurrentUser() {
  try {
    const response = await fetch(API_ENDPOINTS.GET_LOGGED_USER);
    const data = await response.json();
    
    if (data.message) {
      return data.message;
    }
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Fetch client scripts for a doctype
 * @param {string} doctype - The doctype name
 * @returns {Promise<Array>} - Array of client scripts
 */
export async function fetchClientScripts(doctype) {
  try {
    const response = await fetch(API_ENDPOINTS.GET_CLIENT_SCRIPTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Client Script',
        filters: {
          dt: doctype,
          enabled: 1
        },
        fields: ['name', 'script', 'dt', 'enabled', 'view']
      })
    });
    
    const data = await response.json();
    
    if (data.message && Array.isArray(data.message)) {
      return data.message;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching client scripts for ${doctype}:`, error);
    return [];
  }
}

/**
 * Fetch user permissions
 * @param {string} user 
 * @returns {Promise<Array>} 
 */
export async function fetchUserPermissions(user = null) {
  try {
    const currentUser = user || await getCurrentUser();
    
    if (!currentUser) {
      return [];
    }
    
    const response = await fetch(API_ENDPOINTS.GET_USER_PERMISSIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'User Permission',
        fields: ['name', 'user', 'allow', 'for_value'],
        filters: {
          user: ['=', currentUser]
        }
      })
    });
    
    const data = await response.json();
    
    if (data.message && Array.isArray(data.message)) {
      return data.message;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}


export default {
  fetchDoctypeFields,
  fetchLinkOptions,
  fetchDocument,
  fetchDocumentList,
  saveDocument,
  deleteDocument,
  uploadFile,
  getCurrentUser,
  fetchClientScripts,
  fetchUserPermissions,
};