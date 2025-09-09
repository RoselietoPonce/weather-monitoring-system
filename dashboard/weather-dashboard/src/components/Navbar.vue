<script setup>
  import { Icon } from '@iconify/vue';
  import { auth } from '@/firebase.js'; // Import auth service
  import { signOut } from 'firebase/auth'; // Import signOut function
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const handleSignOut = () => {
    signOut(auth).then(() => {
      // Sign-out successful.
      console.log('User signed out');
      // Redirect to the login page
      router.push('/');
    }).catch((error) => {
      // An error happened.
      console.error('Sign out error:', error);
    });
  };
  </script>

  <template>
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo and Title -->
          <div class="flex items-center">
            <div class="flex-shrink-0 text-blue-500">
              <Icon icon="ph:cloud-sun-bold" class="h-8 w-8" />
            </div>
            <div class="ml-4">
              <h1 class="text-xl font-bold text-gray-800">Weather Monitoring System</h1>
            </div>
          </div>

          <!-- Sign Out Button -->
          <div class="flex items-center">
            <button
              @click="handleSignOut"
              class="flex items-center text-gray-600 hover:text-blue-500 focus:outline-none focus:text-blue-500 transition-colors
  duration-200"
            >
              <Icon icon="ph:sign-out-bold" class="h-5 w-5" />
              <span class="ml-2 text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  </template>
