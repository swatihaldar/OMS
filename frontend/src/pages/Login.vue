<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <img
          class="h-16 w-auto"
          src="/icon.png"
          alt="Your Logo"
        />
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Welcome Back
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Sign in to access your account
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg p-4 sm:p-0">
      <div class="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-100">
        <!-- Error message -->
        <div v-if="errorMessage" class="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationCircleIcon class="h-5 w-5 text-red-500" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              User ID
            </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                v-model="email"
                name="email"
                type="text"
                required
                class="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your user ID"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button 
                  type="button" 
                  @click="showPassword = !showPassword"
                  class="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <EyeIcon v-if="showPassword" class="h-5 w-5" />
                  <EyeSlashIcon v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
            <div class="text-right mt-2">
              <button 
                type="button" 
                @click="showForgotPassword = true"
                class="text-sm text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="mt-8 text-center text-xs text-gray-500">
      <p>© {{ new Date().getFullYear() }} OMS.</p>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPassword" class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <!-- Modal content -->
        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div>
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <LockClosedIcon class="h-6 w-6 text-blue-600" />
            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Reset your password
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-6">
            <div class="mt-1">
              <input
                v-model="forgotPasswordEmail"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>
            <div v-if="forgotPasswordError" class="mt-2 text-sm text-red-600">
              {{ forgotPasswordError }}
            </div>
            <div v-if="forgotPasswordSuccess" class="mt-2 text-sm text-green-600">
              {{ forgotPasswordSuccess }}
            </div>
            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                @click="sendResetLink"
                :disabled="forgotPasswordLoading"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                <svg
                  v-if="forgotPasswordLoading"
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ forgotPasswordLoading ? 'Sending...' : 'Send reset link' }}
              </button>
              <button
                type="button"
                @click="showForgotPassword = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  UserIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationCircleIcon 
} from '@heroicons/vue/24/outline';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

// Forgot password functionality
const showForgotPassword = ref(false);
const forgotPasswordEmail = ref('');
const forgotPasswordLoading = ref(false);
const forgotPasswordError = ref('');
const forgotPasswordSuccess = ref('');

const handleSubmit = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    if (!email.value || !password.value) {
      throw new Error('Please enter both user ID and password');
    }
    
    const response = await fetch('/api/method/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usr: email.value,
        pwd: password.value,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.message === 'Logged In') {
      // Redirect to home page
      router.push('/');
    } else {
      throw new Error(data.message || 'Invalid username or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = error.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const sendResetLink = async () => {
  forgotPasswordLoading.value = true;
  forgotPasswordError.value = '';
  forgotPasswordSuccess.value = '';

  try {
    if (!forgotPasswordEmail.value) {
      throw new Error('Please enter your email address');
    }

    const response = await fetch('/api/method/frappe.core.doctype.user.user.reset_password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: forgotPasswordEmail.value,
      }),
    });

    const data = await response.json();

    if (response.ok && data.message === 'Password reset instructions have been sent to your email') {
      forgotPasswordSuccess.value = data.message;
      // Close the modal after 3 seconds
      setTimeout(() => {
        showForgotPassword.value = false;
        forgotPasswordEmail.value = '';
      }, 3000);
    } else {
      throw new Error(data.message || 'Failed to send reset instructions');
    }
  } catch (error) {
    console.error('Password reset error:', error);
    forgotPasswordError.value = error.message || 'An error occurred while sending reset instructions';
  } finally {
    forgotPasswordLoading.value = false;
  }
};
</script>