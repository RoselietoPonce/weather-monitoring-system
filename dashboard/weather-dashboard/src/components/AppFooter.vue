<template>
  <footer
    class="bg-surface text-text-light py-4 px-6 border-t border-gray-200 dark:border-white/10"
  >
    <div class="max-w-7xl mx-auto flex justify-between items-center text-sm">
      <p>&copy; {{ new Date().getFullYear() }} Weather Monitoring System. All Rights Reserved.</p>
      <div class="flex items-center space-x-4">
        <router-link to="/privacy-policy" class="hover:text-primary">Privacy Policy</router-link>
        <router-link to="/terms-of-service" class="hover:text-primary"
          >Terms of Service</router-link
        >
      </div>
    </div>
  </footer>
</template>

<script setup>
// No script logic needed for this simple component
</script>
