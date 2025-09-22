<template>
  <div class="flex h-screen bg-background font-sans">
    <!-- Sidebar -->
    <Sidebar @update:expanded="isSidebarExpanded = $event" />

    <!-- Main Content Area -->
    <div
      class="flex-1 flex flex-col transition-all duration-300"
      :class="isSidebarExpanded ? 'ml-64' : 'ml-20'"
    >
      <!-- Header -->
      <header class="bg-background/80 backdrop-blur-lg px-6 flex items-center justify-between h-20">
        <!-- Left Side: App Title -->
        <div class="flex items-center">
          <Icon icon="ph:cloud-sun-bold" class="h-7 w-7 text-primary" />
          <span class="ml-2 text-lg font-bold text-text-main"> Weather Monitoring System </span>
        </div>

        <!-- Right Side: Theme Toggle -->
        <div class="flex items-center">
          <button
            @click="toggleTheme"
            class="p-2 rounded-full text-text-light hover:bg-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary"
            aria-label="Toggle Dark Mode"
          >
            <Icon :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'" class="h-6 w-6" />
          </button>
        </div>
      </header>

      <!-- Main View (Page Content) -->
      <main class="flex-1 p-6 overflow-y-auto">
        <router-view />
      </main>

      <!-- Footer -->
      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue' // <-- Import the new footer
import { Icon } from '@iconify/vue'
import { useTheme } from '@/composables/useTheme.js'

// Theme composable
const { isDarkMode, toggleTheme } = useTheme()

// Sidebar expanded state
const isSidebarExpanded = ref(false)
</script>
