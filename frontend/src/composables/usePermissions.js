import { ref, computed } from 'vue';
import api from '@/utils/api';

export function usePermissions() {
  const currentUser = ref(null);
  const userRoles = ref([]);
  const userPermissions = ref([]);
  const doctypePermissions = ref({});
  
  // Permission flags
  const canCreate = ref(false);
  const canRead = ref(false);
  const canWrite = ref(false);
  const canDelete = ref(false);
  
  /**
   * Get the current logged-in user
   */
  const getCurrentUser = async () => {
    if (currentUser.value) return currentUser.value;
    
    try {
      currentUser.value = await api.getCurrentUser();
      return currentUser.value;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };
  
  /**
   * Fetch user roles for the current user
   */
  const fetchUserRoles = async () => {
    if (!currentUser.value) {
      await getCurrentUser();
    }
    
    try {
      userRoles.value = await api.fetchUserRoles();
      console.log('User roles:', userRoles.value);
      return userRoles.value;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  };
  
  /**
   * Fetch user permissions for the current user
   */
  const fetchUserPermissions = async () => {
    if (!currentUser.value) {
      await getCurrentUser();
    }
    
    try {
      userPermissions.value = await api.fetchUserPermissions();
      console.log('User permissions:', userPermissions.value);
      return userPermissions.value;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  };
  
  /**
   * Check permissions for a specific doctype
   */
  const checkPermissions = async (doctype) => {
    if (!currentUser.value) {
      await getCurrentUser();
    }
    
    if (!userRoles.value.length) {
      await fetchUserRoles();
    }
    
    try {
      // Try direct API call to Frappe for permissions
      const response = await fetch('/api/method/frappe.client.get_permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctype })
      });
      
      if (response.ok) {
        const permData = await response.json();
        if (permData.message) {
          doctypePermissions.value[doctype] = permData.message;
          
          // Update permission flags
          canCreate.value = permData.message.create || false;
          canRead.value = permData.message.read || false;
          canWrite.value = permData.message.write || false;
          canDelete.value = permData.message.delete || false;
          
          console.log(`Direct permissions for ${doctype}:`, permData.message);
          return permData.message;
        }
      }
      
      // Fallback to our utility function
      const permissions = await api.fetchDocPermissions(doctype);
      
      // Process permissions based on user roles
      const userHasPermission = {
        create: false,
        read: false,
        write: false,
        delete: false
      };
      
      // Check if any of the user's roles have the required permissions
      for (const perm of permissions) {
        if (userRoles.value.includes(perm.role)) {
          if (perm.create) userHasPermission.create = true;
          if (perm.read) userHasPermission.read = true;
          if (perm.write) userHasPermission.write = true;
          if (perm.delete) userHasPermission.delete = true;
        }
      }
      
      doctypePermissions.value[doctype] = userHasPermission;
      
      // Update permission flags
      canCreate.value = userHasPermission.create;
      canRead.value = userHasPermission.read;
      canWrite.value = userHasPermission.write;
      canDelete.value = userHasPermission.delete;
      
      console.log(`Processed permissions for ${doctype}:`, userHasPermission);
      return userHasPermission;
      
    } catch (error) {
      console.error(`Error checking permissions for ${doctype}:`, error);
      
      // Default permissions for debugging
      const defaultPermissions = {
        create: true,
        read: true,
        write: true,
        delete: true
      };
      
      doctypePermissions.value[doctype] = defaultPermissions;
      
      // Update permission flags with defaults
      canCreate.value = true;
      canRead.value = true;
      canWrite.value = true;
      canDelete.value = true;
      
      return defaultPermissions;
    }
  };
  
  /**
   * Check if user has permission to perform an action on a doctype
   */
  const hasPermission = (doctype, action) => {
    if (!doctypePermissions.value[doctype]) {
      return false;
    }
    
    return doctypePermissions.value[doctype][action] || false;
  };
  
  /**
   * Check if user is the owner of a document
   */
  const isOwner = (doc) => {
    return doc.owner === currentUser.value;
  };
  
  /**
   * Check if a document is assigned to the current user
   */
  const isAssignedToMe = async (doctype, docname) => {
    if (!currentUser.value) {
      await getCurrentUser();
    }
    
    try {
      const response = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctype: 'ToDo',
          fields: ['name'],
          filters: {
            reference_type: doctype,
            reference_name: docname,
            allocated_to: currentUser.value,
            status: 'Open'
          }
        })
      });
      
      const data = await response.json();
      return data.message && data.message.length > 0;
    } catch (error) {
      console.error('Error checking assignment:', error);
      return false;
    }
  };
  
  return {
    currentUser,
    userRoles,
    userPermissions,
    doctypePermissions,
    canCreate,
    canRead,
    canWrite,
    canDelete,
    getCurrentUser,
    fetchUserRoles,
    fetchUserPermissions,
    checkPermissions,
    hasPermission,
    isOwner,
    isAssignedToMe
  };
}