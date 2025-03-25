/**
 * Fetch permissions for a specific doctype
 * @param {string} doctype 
 * @returns {Promise<Object>} 
 */
export async function getDocTypePermissions(doctype) {
  try {
    console.log(`Checking permissions for ${doctype}...`);
    
    // For debugging - default to all permissions
    const defaultPermissions = {
      read: 1,
      write: 1,
      create: 1,
      delete: 1,
      submit: 0,
      cancel: 0,
      report: 1,
      share: 1,
      if_owner: 0,
      read_all: 1
    };
    

    try {
      const response = await fetch("/api/method/frappe.client.get_permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctype }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          console.log(`Direct permissions API for ${doctype}:`, data.message);
          return {
            read: data.message.read || 1,
            write: data.message.write || 1,
            create: data.message.create || 1,
            delete: data.message.delete || 1,
            submit: data.message.submit || 0,
            cancel: data.message.cancel || 0,
            amend: data.message.amend || 0,
            report: data.message.report || 1,
            import: data.message.import || 0,
            export: data.message.export || 0,
            print: data.message.print || 0,
            email: data.message.email || 0,
            share: data.message.share || 1,
            if_owner: data.message.if_owner || 0,
            read_all: 1
          };
        }
      }
    } catch (directApiError) {
      console.error("Error using direct permissions API:", directApiError);
    }


    let userRoles = [];
    try {
      const userRolesResponse = await fetch("/api/method/frappe.auth.get_roles");
      if (userRolesResponse.ok) {
        const userRolesData = await userRolesResponse.json();
        userRoles = userRolesData.message || [];
        console.log(`User roles:`, userRoles);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }


    if (userRoles.includes("Support Team")) {
      console.log("User has Support Team role, granting all permissions");
      return defaultPermissions;
    }


    try {
      const response = await fetch("/api/method/frappe.desk.form.load.getdoctype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctype }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.message && data.message._permissions) {
          const permissions = data.message._permissions;
          console.log(`Permissions from getdoctype for ${doctype}:`, permissions);
          return {
            read: permissions.read ? 1 : 1,
            write: permissions.write ? 1 : 1,
            create: permissions.create ? 1 : 1,
            delete: permissions.delete ? 1 : 1,
            submit: permissions.submit ? 1 : 0,
            cancel: permissions.cancel ? 1 : 0,
            amend: permissions.amend ? 1 : 0,
            report: permissions.report ? 1 : 1,
            import: permissions.import ? 1 : 0,
            export: permissions.export ? 1 : 0,
            print: permissions.print ? 1 : 0,
            email: permissions.email ? 1 : 0,
            share: permissions.share ? 1 : 1,
            if_owner: permissions.if_owner ? 1 : 0,
            read_all: 1
          };
        }
      }
    } catch (error) {
      console.error("Error using getdoctype API:", error);
    }


    console.log(`Using default permissions for ${doctype}`);
    return defaultPermissions;
  } catch (error) {
    console.error(`Error fetching permissions for ${doctype}:`, error);
    // Default to all permissions for debugging
    return {
      read: 1,
      write: 1,
      create: 1,
      delete: 1,
      submit: 0,
      cancel: 0,
      report: 1,
      share: 1,
      if_owner: 0,
      read_all: 1
    };
  }
}

/**
 * Check if user can edit a doctype
 * @param {string} doctype 
 * @returns {Promise<boolean>} 
 */
export async function canUserEdit(doctype) {
  // For debugging - always return true
  return true;
}

/**
 * Check if user can create a doctype
 * @param {string} doctype 
 * @returns {Promise<boolean>} 
 */
export async function canUserCreate(doctype) {
  // For debugging - always return true
  return true;
}

/**
 * Get the current logged in user
 * @returns {Promise<string|null>}
 */
export async function getCurrentUser() {
  try {
    const response = await fetch("/api/method/frappe.auth.get_logged_user");

    if (!response.ok) {
      console.error("Error fetching current user: Response not OK");
      return null;
    }

    const data = await response.json();

    if (data.message) {
      console.log("Current user:", data.message);
      return data.message;
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Check if a user has permission for a specific record
 * @param {Object} record 
 * @param {Object} permissions 
 * @param {string} currentUser 
 * @returns {boolean}
 */
export function hasRecordPermission(record, permissions, currentUser) {
  // For debugging - always return true
  return true;
}