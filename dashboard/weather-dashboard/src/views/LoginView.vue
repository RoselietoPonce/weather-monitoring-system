<script setup>
  import { Icon } from '@iconify/vue';
  </script>

  <template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div class="text-center mb-8">
          <div class="flex justify-center text-blue-500 mb-4">
            <Icon icon="ph:cloud-sun-bold" class="h-16 w-16" />
          </div>
          <h2 class="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p class="text-gray-500">Sign in to access your dashboard</p>
        </div>

        <form>
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email
  Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon icon="ph:envelope-simple" class="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" name="email" id="email" class="block w-full pl-10 pr-3 py-2 border
   border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500
  sm:text-sm" placeholder="you@example.com">
            </div>
          </div>

          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700
  mb-2">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon icon="ph:lock-simple" class="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" name="password" id="password" class="block w-full pl-10 pr-3
  py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500
  focus:border-blue-500 sm:text-sm" placeholder="••••••••">
            </div>
          </div>

          <div class="flex items-center justify-end mb-6">
            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border
  border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600
  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Sign In
            </button>
          </div>
        </form>

        <!-- START: New Code Added -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div class="mt-6">
            <button type="button" class="w-full inline-flex justify-center py-2 px-4 border
  border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              <Icon icon="flat-color-icons:google" class="h-5 w-5" />
              <span class="ml-2">Sign in with Google</span>
            </button>
          </div>
        </div>
        <!-- END: New Code Added -->

      </div>
    </div>
  </template>
