<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm">
      <div class="px-4 py-3 flex items-center max-w-5xl mx-auto">
        <button @click="$router.back()" class="mr-2 hover:bg-gray-100 rounded-full p-1.5 transition-colors">
          <ChevronLeftIcon class="h-6 w-6 text-gray-600" />
        </button>
        <h1 class="text-xl font-semibold">Profile</h1>
      </div>
    </div>

    <div class="max-w-5xl mx-auto">
      <!-- Profile Info -->
      <div class="bg-white mt-2 px-6 py-8 flex flex-col items-center rounded-lg shadow-sm">
        <div class="relative">
          <div class="h-28 w-28 rounded-full bg-gray-200 overflow-hidden shadow-md">
            <img v-if="userData && userData.user_image" :src="getUserImage(userData.user_image)" :alt="userData.full_name" class="h-full w-full object-cover" />
            <div v-else class="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold text-3xl">
              {{ getInitials(userData?.full_name) }}
            </div>
          </div>
        </div>
        <h2 class="mt-4 text-2xl font-semibold">{{ userData?.full_name || 'User' }}</h2>
        <p class="text-gray-600">{{ employeeData?.designation || 'No Designation' }}</p>
        
        <div class="mt-4 flex items-center text-sm text-gray-500">
          <EnvelopeIcon class="h-4 w-4 mr-1" />
          <span>{{ userData?.name || 'No Email' }}</span>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="bg-white mt-4 rounded-lg shadow-sm overflow-hidden">
        <button 
          @click="activeSheet = 'employee'" 
          class="w-full px-6 py-4 flex items-center justify-between border-b hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center">
            <UserIcon class="h-5 w-5 text-blue-500 mr-3" />
            <span class="font-medium">Employee Details</span>
          </div>
          <ChevronRightIcon class="h-5 w-5 text-gray-400" />
        </button>
        
        <button 
          @click="activeSheet = 'company'" 
          class="w-full px-6 py-4 flex items-center justify-between border-b hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center">
            <BuildingOfficeIcon class="h-5 w-5 text-green-500 mr-3" />
            <span class="font-medium">Company Information</span>
          </div>
          <ChevronRightIcon class="h-5 w-5 text-gray-400" />
        </button>
        
        <button 
          @click="activeSheet = 'contact'" 
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center">
            <PhoneIcon class="h-5 w-5 text-purple-500 mr-3" />
            <span class="font-medium">Contact Information</span>
          </div>
          <ChevronRightIcon class="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <!-- Log Out Button -->
      <div class="px-4 mt-6 mb-8">
        <button 
          @click="confirmLogout" 
          class="w-full bg-white text-red-600 font-medium py-4 rounded-lg border border-red-200 shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center relative overflow-hidden group"
        >
          <span class="absolute inset-0 w-3 bg-red-100 transition-all duration-300 ease-out group-hover:w-full"></span>
          <span class="relative flex items-center">
            <ArrowRightOnRectangleIcon class="h-5 w-5 mr-2" />
            Log Out
          </span>
        </button>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Confirm Logout</h3>
        <p class="text-gray-600 mb-5">Are you sure you want to log out of your account?</p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showLogoutConfirm = false" 
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleLogout" 
            class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            :disabled="isLoggingOut"
          >
            <span v-if="isLoggingOut" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Employee Details Bottom Sheet -->
    <BottomSheet 
      v-model="showEmployeeSheet" 
      title="Employee Details"
      :full-screen="isMobile"
    >
      <div v-if="Object.keys(employeeDetails).length > 0" class="space-y-4">
        <div v-for="(field, key) in employeeDetailsFields" :key="key" class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-500 mb-1">{{ field.label }}</p>
          <p class="font-medium text-gray-800">{{ employeeDetails[field.key] || 'Not specified' }}</p>
        </div>
      </div>
      <div v-else class="p-4 text-center text-gray-500">
        <p>No employee details available</p>
      </div>
    </BottomSheet>

    <!-- Company Information Bottom Sheet -->
    <BottomSheet 
      v-model="showCompanySheet" 
      title="Company Information"
      :full-screen="isMobile"
    >
      <div v-if="Object.keys(companyInfo).length > 0" class="space-y-4">
        <div v-for="(field, key) in companyInfoFields" :key="key" class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-500 mb-1">{{ field.label }}</p>
          <p class="font-medium text-gray-800">{{ companyInfo[field.key] || 'Not specified' }}</p>
        </div>
      </div>
      <div v-else class="p-4 text-center text-gray-500">
        <p>No company information available</p>
      </div>
    </BottomSheet>

    <!-- Contact Information Bottom Sheet -->
    <BottomSheet 
      v-model="showContactSheet" 
      title="Contact Information"
      :full-screen="isMobile"
    >
      <div v-if="Object.keys(contactInfo).length > 0" class="space-y-4">
        <div v-for="(field, key) in contactInfoFields" :key="key" class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-500 mb-1">{{ field.label }}</p>
          <p class="font-medium text-gray-800">{{ contactInfo[field.key] || 'Not specified' }}</p>
        </div>
      </div>
      <div v-else class="p-4 text-center text-gray-500">
        <p>No contact information available</p>
      </div>
    </BottomSheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { 
  ChevronLeftIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  PhoneIcon, 
  ChevronRightIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline';
import BottomSheet from '../components/BottomSheet.vue';

const userData = ref(null);
const employeeData = ref(null);
const activeSheet = ref(null);
const isMobile = ref(window.innerWidth < 768);
const showLogoutConfirm = ref(false);
const isLoggingOut = ref(false);

const employeeDetails = ref({});
const companyInfo = ref({});
const contactInfo = ref({});

// Define field structures with labels for each section
const employeeDetailsFields = [
  { key: 'first_name', label: 'First Name' },
  { key: 'middle_name', label: 'Middle Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'date_of_joining', label: 'Date of Joining' },
  { key: 'employee_number', label: 'Employee Number' },
  { key: 'status', label: 'Status' }
];

const companyInfoFields = [
  { key: 'company', label: 'Company' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'grade', label: 'Grade' },
  { key: 'branch', label: 'Branch' },
  { key: 'reports_to', label: 'Reports To' }
];

const contactInfoFields = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile_no', label: 'Mobile Number' },
  { key: 'company_name', label: 'Company Name' }
];

// Computed properties to control bottom sheet visibility
const showEmployeeSheet = computed({
  get: () => activeSheet.value === 'employee',
  set: (value) => {
    if (!value) activeSheet.value = null;
  }
});

const showCompanySheet = computed({
  get: () => activeSheet.value === 'company',
  set: (value) => {
    if (!value) activeSheet.value = null;
  }
});

const showContactSheet = computed({
  get: () => activeSheet.value === 'contact',
  set: (value) => {
    if (!value) activeSheet.value = null;
  }
});

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatLabel = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const confirmLogout = () => {
  showLogoutConfirm.value = true;
};

const handleLogout = async () => {
  try {
    isLoggingOut.value = true;
    
    // Try multiple logout approaches to ensure it works
    try {
      // First approach: Standard Frappe logout
      await fetch('/api/method/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
    } catch (error) {
      console.warn('First logout approach failed:', error);
    }
    
    try {
      // Second approach: Custom OMS logout
      await fetch('/api/method/oms.api.logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Second logout approach failed:', error);
    }
    
    // Clear any local storage or session storage items
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/oms/account/login';
    }, 500);
  } catch (error) {
    console.error('Error logging out:', error);
    alert('Failed to log out. Please try again.');
    isLoggingOut.value = false;
    showLogoutConfirm.value = false;
  }
};

const getUserImage = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/private/files')) {
    return `/api/method/frappe.utils.file_manager.download_file?file_url=${imagePath}`;
  }
  return imagePath; 
};

// Handle window resize for responsive design
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(async () => {
  // Add resize event listener
  window.addEventListener('resize', handleResize);
  
  try {
    // Fetch user info
    const userResponse = await fetch('/api/method/oms.api.get_current_user_info');
    const userDataResponse = await userResponse.json();
    
    if (userDataResponse.message) {
      userData.value = userDataResponse.message;
      
      // Fetch employee data
      const employeeResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: 'Employee',
          filters: { user_id: userData.value.name },
          fields: ['*']
        }),
      });
      
      const employeeDataResponse = await employeeResponse.json();
      
      if (employeeDataResponse.message?.[0]) {
        const employee = employeeDataResponse.message[0];
        employeeData.value = employee;
        
        // Initialize all fields with null values to ensure they appear in the UI
        employeeDetailsFields.forEach(field => {
          employeeDetails.value[field.key] = null;
        });
        
        companyInfoFields.forEach(field => {
          companyInfo.value[field.key] = null;
        });
        
        // Populate employee details
        employeeDetails.value = {
          ...employeeDetails.value,
          first_name: employee.first_name,
          middle_name: employee.middle_name,
          last_name: employee.last_name,
          gender: employee.gender,
          date_of_birth: formatDate(employee.date_of_birth),
          date_of_joining: formatDate(employee.date_of_joining),
          employee_number: employee.employee_number,
          status: employee.status
        };
        
        // Populate company info
        companyInfo.value = {
          ...companyInfo.value,
          company: employee.company,
          department: employee.department,
          designation: employee.designation,
          grade: employee.grade,
          branch: employee.branch,
          reports_to: employee.reports_to,
        };
      } else {
        // Initialize with empty fields if no employee data
        employeeDetailsFields.forEach(field => {
          employeeDetails.value[field.key] = null;
        });
        
        companyInfoFields.forEach(field => {
          companyInfo.value[field.key] = null;
        });
      }
      
      // Initialize contact fields
      contactInfoFields.forEach(field => {
        contactInfo.value[field.key] = null;
      });
      
      // Fetch contact information
      try {
        const contactResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctype: 'Contact',
            filters: { user: userData.value.name },
            fields: ['*']
          }),
        });
        
        const contactDataResponse = await contactResponse.json();
        
        if (contactDataResponse.message?.[0]) {
          const contact = contactDataResponse.message[0];
          
          // Populate contact info
          contactInfo.value = {
            ...contactInfo.value,
            email: contact.email_id,
            phone: contact.phone,
            mobile_no: contact.mobile_no,
            company_name: contact.company_name,
          };
        }
      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
    }
  } catch (error) {
    console.error('Error fetching profile data:', error);
  }
});

// Format date for better display
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

// Clean up event listener
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>