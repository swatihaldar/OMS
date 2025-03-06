<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto p-4">
      <!-- Header -->
      <div class="flex items-center mb-6">
        <button @click="$router.back()" class="mr-4 text-gray-600 hover:text-gray-800 transition-colors">
          <ChevronLeftIcon class="h-6 w-6" />
        </button>
        <h2 class="text-xl font-semibold">New Issue</h2>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitIssue" class="space-y-6">
        <!-- Project Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Project <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.project"
            required
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Project</option>
            <option v-for="project in projects" :key="project.name" :value="project.name">
              {{ project.project_name }}
            </option>
          </select>
        </div>

        <!-- Subject -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Subject <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.subject"
            type="text"
            required
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Contact Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Raised by Contact <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.custom_raised_by_contact"
            required
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Contact</option>
            <option v-for="contact in contacts" :key="contact.name" :value="contact.name">
              {{ contact.name }}
            </option>
          </select>
        </div>

        <!-- Mobile Number -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Raised By (Mobile No.) <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.custom_raised_by_mobile"
            type="tel"
            required
            pattern="[0-9]{10}"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div class="border rounded-lg overflow-hidden">
            <QuillEditor
              v-model:content="formData.description"
              toolbar="full"
              theme="snow"
              contentType="html"
              :options="{
                modules: {
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean']
                  ]
                }
              }"
            />
          </div>
        </div>

        <!-- Issue Image -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Issue Image
          </label>
          <div
            v-if="!imagePreview"
            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg"
            @dragover.prevent
            @drop.prevent="handleDrop($event, 'image')"
          >
            <div class="space-y-1 text-center">
              <PhotoIcon class="mx-auto h-12 w-12 text-gray-400" />
              <div class="flex text-sm text-gray-600">
                <label class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    class="sr-only"
                    accept="image/*"
                    @change="handleFileUpload($event, 'image')"
                  />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
          <div v-else class="mt-1 relative">
            <img :src="imagePreview" alt="Preview" class="h-48 w-auto rounded-lg" />
            <button 
              type="button" 
              @click="removeFile('image')" 
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>


        <!-- Other Attachment -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Other Attachment
          </label>
          <div
            v-if="!attachmentName"
            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg"
            @dragover.prevent
            @drop.prevent="handleDrop($event, 'other')"
          >
            <div class="space-y-1 text-center">
              <DocumentIcon class="mx-auto h-12 w-12 text-gray-400" />
              <div class="flex text-sm text-gray-600">
                <label class="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    class="sr-only"
                    @change="handleFileUpload($event, 'other')"
                  />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-500">Any file type up to 10MB</p>
            </div>
          </div>
          <div v-else class="mt-1 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div class="flex items-center">
              <DocumentIcon class="h-6 w-6 text-gray-500 mr-2" />
              <span class="text-sm text-gray-700">{{ attachmentName }}</span>
            </div>
            <button 
              type="button" 
              @click="removeFile('other')" 
              class="text-red-500 hover:text-red-600"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {{ submitting ? 'Creating Issue...' : 'Create Issue' }}
        </button>
      </form>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeftIcon, PhotoIcon, DocumentIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const router = useRouter();
const projects = ref([]);
const contacts = ref([]);
const submitting = ref(false);
const imagePreview = ref(null);
const attachmentName = ref('');
const currentUser = ref('');

const formData = ref({
  project: '',
  subject: '',
  custom_raised_by_contact: '',
  custom_raised_by_mobile: '',
  description: '',
  custom_issue_image: null,
  custom_other_attachment: null,
  raised_by: '' // Will be set to current user
});

const handleFileUpload = (event, type) => {
  const file = event.target.files[0];
  handleFile(file, type);
};

const handleDrop = (event, type) => {
  const file = event.dataTransfer.files[0];
  handleFile(file, type);
};

const handleFile = (file, type) => {
  if (!file) return;

  if (type === 'image') {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
      formData.value.custom_issue_image = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    attachmentName.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.custom_other_attachment = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeFile = (type) => {
  if (type === 'image') {
    imagePreview.value = null;
    formData.value.custom_issue_image = null;
  } else {
    attachmentName.value = '';
    formData.value.custom_other_attachment = null;
  }
};


const submitIssue = async () => {
  try {
    submitting.value = true;
    
    // If there are attachments, upload them first
    if (formData.value.custom_issue_image) {
      const imageFormData = new FormData();
      imageFormData.append('file', formData.value.custom_issue_image);
      imageFormData.append('is_private', 0); 
      imageFormData.append('doctype', 'Issue');
      
      const imageResponse = await fetch('/api/method/upload_file', {
        method: 'POST',
        body: imageFormData
      });
      
      const imageData = await imageResponse.json();
      if (imageData.message) {
        formData.value.custom_issue_image = imageData.message.file_url;
      }
    }
    
    if (formData.value.custom_other_attachment) {
      const attachmentFormData = new FormData();
      attachmentFormData.append('file', formData.value.custom_other_attachment);
      attachmentFormData.append('is_private', 0); 
      attachmentFormData.append('doctype', 'Issue');
      
      const attachmentResponse = await fetch('/api/method/upload_file', {
        method: 'POST',
        body: attachmentFormData
      });
      
      const attachmentData = await attachmentResponse.json();
      if (attachmentData.message) {
        formData.value.custom_other_attachment = attachmentData.message.file_url;
      }
    }
    
    // Create the issue
    const response = await fetch('/api/method/frappe.client.insert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doc: {
          doctype: 'Issue',
          ...formData.value
        }
      })
    });

    const data = await response.json();
    if (data.message) {
      router.push(`/issue/${data.message.name}`);
    }
  } catch (error) {
    console.error('Error creating issue:', error);
    alert('Error creating issue. Please try again.');
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    const userResponse = await fetch('/api/method/frappe.auth.get_logged_user');
    const userData = await userResponse.json();
    if (userData.message) {
      currentUser.value = userData.message;
      
      const userPermissionsResponse = await fetch('/api/method/frappe.client.get_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: 'User Permission',
          fields: ['allow', 'for_value', 'is_default'],
          filters: { 
            user: currentUser.value,
            allow: 'Project'
          }
        }),
      });
      
      const userPermissionsData = await userPermissionsResponse.json();
      

      if (userPermissionsData.message && userPermissionsData.message.length > 0) {
        const projectNames = userPermissionsData.message.map(p => p.for_value);
        
        const defaultProject = userPermissionsData.message.find(p => p.is_default === 1);
        
        const projectsResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctype: 'Project',
            fields: ['name', 'project_name'],
            filters: { 
              name: ['in', projectNames],
              is_active: 'Yes'
            }
          }),
        });
        
        const projectsData = await projectsResponse.json();
        if (projectsData.message) {
          projects.value = projectsData.message;
          
          if (defaultProject) {
            formData.value.project = defaultProject.for_value;
          } else if (projects.value.length === 1) {
            formData.value.project = projects.value[0].name;
          }
        }
      } else {
        const projectsResponse = await fetch('/api/method/frappe.client.get_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctype: 'Project',
            fields: ['name', 'project_name'],
            filters: { is_active: 'Yes' },
            limit: 50
          }),
        });
        
        const projectsData = await projectsResponse.json();
        if (projectsData.message) {
          projects.value = projectsData.message;
        }
      }
    }

    // Fetch contacts
    const contactsResponse = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctype: 'Contact',
        fields: ['name'],
        limit: 50
      }),
    });
    
    const contactsData = await contactsResponse.json();
    if (contactsData.message) {
      contacts.value = contactsData.message;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
});


</script>

<style>
.ql-editor {
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
  font-weight: normal !important;
}

.ql-editor p {
  font-weight: normal !important;
}


.ql-editor * {
  font-weight: inherit !important;
}

.ql-editor strong, .ql-editor b {
  font-weight: bold !important;
}
</style>