<script setup>
  import { ref } from 'vue'
  import { Icon } from '@iconify/vue'
  import { auth } from '@/firebase.js'
  import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
  } from "firebase/auth"
  import { useRouter } from 'vue-router'

  const email = ref('')
  const password = ref('')
  const errorMessage = ref('')
  const successMessage = ref('')
  const isLoading = ref(false)

  const router = useRouter()

  // --- Email/Password Sign In ---
  const signIn = async () => {
    try {
      isLoading.value = true
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
      console.log('Successfully signed in:', userCredential.user)
      errorMessage.value = ''
      successMessage.value = ''
      // CORRECTED REDIRECT: Let the router guard handle the final destination
      router.push('/')
    } catch (error) {
      console.error('Login Error:', error.message)
      successMessage.value = ''
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage.value = 'Please enter a valid email address.'
          break
        case 'auth/user-not-found':
          errorMessage.value = 'No account found with this email.'
          break
        case 'auth/wrong-password':
          errorMessage.value = 'Incorrect password. Please try again.'
          break
        default:
          errorMessage.value = 'An unexpected error occurred. Please try again.'
          break
      }
    } finally {
      isLoading.value = false
    }
  }

  // --- Password Reset ---
  const handlePasswordReset = async () => {
    if (!email.value) {
      errorMessage.value = 'Please enter your email address to reset your password.'
      successMessage.value = ''
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.value)
      errorMessage.value = ''
      successMessage.value = `A password reset link has been sent to ${email.value}. Please check your inbox.`
    } catch (error) {
      console.error('Password Reset Error:', error.message)
      successMessage.value = ''
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage.value = 'Please enter a valid email address.'
          break
        case 'auth/user-not-found':
          errorMessage.value = 'No account found with this email.'
          break
        default:
          errorMessage.value = 'An error occurred. Please try again.'
          break
      }
    }
  }

  // --- Google Sign-In ---
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      isLoading.value = true
      const result = await signInWithPopup(auth, provider)
      console.log('Successfully signed in with Google:', result.user)
      errorMessage.value = ''
      successMessage.value = ''
      // CORRECTED REDIRECT: Let the router guard handle the final destination
      router.push('/')
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      errorMessage.value = `Failed to sign in with Google. ${error.message}`
    } finally {
      isLoading.value = false
    }
  }
  </script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gemini-gray-100 p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-8">
        <!-- Header -->
        <div class="text-center">
          <Icon icon="ph:cloud-sun-bold" class="h-12 w-12 text-gemini-blue-dark mx-auto mb-4" />
          <h2 class="text-3xl font-bold text-gemini-gray-900">
            Welcome Back
          </h2>
          <p class="text-gemini-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>

        <!-- Social Sign-in -->
        <button
          @click="signInWithGoogle"
          type="button"
          :disabled="isLoading"
          aria-label="Sign in with Google"
          class="w-full flex items-center justify-center py-3 px-4 border border-gemini-gray-300
                 rounded-full shadow-sm bg-white hover:bg-gemini-gray-100 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Icon icon="flat-color-icons:google" class="h-5 w-5" />
          <span class="ml-3 text-sm font-medium text-gemini-gray-800 group-hover:text-gemini-gray-900">
            {{ isLoading ? 'Please wait...' : 'Sign in with Google' }}
          </span>
        </button>

        <!-- Separator -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gemini-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gemini-gray-500">Or sign in with email</span>
          </div>
        </div>

        <form @submit.prevent="signIn" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gemini-gray-700 mb-1">Email Address</label>
            <input
              v-model="email"
              type="email"
              id="email"
              aria-label="Email Address"
              class="block w-full px-4 py-3 border border-gemini-gray-300 rounded-lg
                     bg-gemini-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gemini-blue
                     transition-all duration-200"
              placeholder="you@example.com"
              required
            >
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-medium text-gemini-gray-700 mb-1">Password</label>
              <button
                @click.prevent="handlePasswordReset"
                type="button"
                aria-label="Reset password"
                class="text-sm font-medium text-gemini-blue hover:text-gemini-blue-dark hover:underline transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>
            <input
              v-model="password"
              type="password"
              id="password"
              aria-label="Password"
              class="block w-full px-4 py-3 border border-gemini-gray-300 rounded-lg
                     bg-gemini-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gemini-blue
                     transition-all duration-200"
              placeholder="••••••••"
              required
            >
          </div>

          <!-- Messages -->
          <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50">
            <p class="text-red-700 text-sm text-center">{{ errorMessage }}</p>
          </div>
          <div v-if="successMessage" class="p-3 rounded-lg bg-green-50">
            <p class="text-green-700 text-sm text-center">{{ successMessage }}</p>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="isLoading"
            aria-label="Sign in"
            class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-full
                  text-base font-medium text-gray-800 bg-white hover:bg-gray-100
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                  transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Signing In...' : 'Sign In' }}
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
