<script setup>
  import { ref } from 'vue';
  import { Icon } from '@iconify/vue';
  import { auth } from '@/firebase.js';
  import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
  } from "firebase/auth";
  import { useRouter } from 'vue-router';

  // State for the form inputs
  const email = ref('');
  const password = ref('');
  const errorMessage = ref('');
  const successMessage = ref('');
  const router = useRouter();

  const signIn = () => {
    signInWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        console.log('Successfully signed in:', userCredential.user);
        errorMessage.value = '';
        successMessage.value = '';
        router.push('/dashboard');
      })
      .catch((error) => {
        console.error('Login Error:', error.message);
        successMessage.value = '';
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage.value = 'Please enter a valid email address.';
            break;
          case 'auth/user-not-found':
            errorMessage.value = 'No account found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage.value = 'Incorrect password. Please try again.';
            break;
          default:
            errorMessage.value = 'An unexpected error occurred. Please try again.';
            break;
        }
      });
  };

  // Function to handle password reset
  const handlePasswordReset = () => {
    if (!email.value) {
      errorMessage.value = 'Please enter your email address to reset your password.';
      successMessage.value = '';
      return;
    }

    sendPasswordResetEmail(auth, email.value)
      .then(() => {
        errorMessage.value = '';
        successMessage.value = 'A password reset link has been sent to ${email.value}. Please check your inbox.';
      })
      .catch((error) => {
        console.error('Password Reset Error:', error.message);
        successMessage.value = '';
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage.value = 'Please enter a valid email address.';
            break;
          case 'auth/user-not-found':
            errorMessage.value = 'No account found with this email.';
            break;
          default:
            errorMessage.value = 'An error occurred. Please try again.';
            break;
        }
      });
  };

  // --- NEW: Function to handle Google Sign-In ---
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log('Successfully signed in with Google:', user);
        errorMessage.value = '';
        successMessage.value = '';
        router.push('/dashboard'); // Redirect to dashboard on success
      }).catch((error) => {
        console.error('Google Sign-In Error:', error);
        errorMessage.value = `Failed to sign in with Google. ${error.message}`;
      });
  };
  </script>

  <template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
    <div class="max-w-md w-full backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl p-8 transition-all duration-300">
      <!-- Enhanced Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="p-4 rounded-full bg-blue-50 shadow-inner">
            <Icon icon="ph:cloud-sun-bold" class="h-16 w-16 text-blue-500" />
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Weather Monitoring</h2>
        <p class="text-gray-600">Sign in to access your dashboard</p>
      </div>

      <form @submit.prevent="signIn" class="space-y-6">
        <!-- Email Input -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="ph:envelope-simple" class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <input
              v-model="email"
              type="email"
              name="email"
              id="email"
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-300 bg-white/50 backdrop-blur-sm"
              placeholder="you@example.com"
              required
            >
          </div>
        </div>

        <!-- Password Input -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="ph:lock-simple" class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <input
              v-model="password"
              type="password"
              name="password"
              id="password"
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-300 bg-white/50 backdrop-blur-sm"
              placeholder="••••••••"
              required
            >
          </div>
        </div>

        <!-- Forgot Password Link -->
        <div class="flex items-center justify-end">
          <button
            @click.prevent="handlePasswordReset"
            class="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Forgot your password?
          </button>
        </div>

        <!-- Error & Success Messages -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 border border-red-100">
          <p class="text-red-600 text-sm text-center">{{ errorMessage }}</p>
        </div>

        <div v-if="successMessage" class="p-3 rounded-lg bg-green-50 border border-green-100">
          <p class="text-green-600 text-sm text-center">{{ successMessage }}</p>
        </div>

        <!-- Sign In Button -->
        <button
          type="submit"
          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl
                 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Sign In
        </button>

        <!-- Google Sign-in -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          @click="signInWithGoogle"
          type="button"
          class="w-full flex items-center justify-center py-2.5 px-4 border border-gray-200
                 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-all duration-300"
        >
          <Icon icon="flat-color-icons:google" class="h-5 w-5" />
          <span class="ml-2 text-sm font-medium text-gray-700">Sign in with Google</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(8px);
}

@media (max-width: 640px) {
  .max-w-md {
    max-width: 100%;
    margin: 1rem;
  }
}
</style>
