<script setup>
import Navbar from './components/Navbar.vue';
import { user } from '@/user.js'; // Import our user state
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">
    <!-- Show Navbar only if logged in -->
    <Navbar v-if="user" />
    <main>
      <RouterView />
    </main>
  </div>
</template>
