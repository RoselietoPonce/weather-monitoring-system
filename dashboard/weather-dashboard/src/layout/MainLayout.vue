<template>
    <div class="flex h-screen bg-gemini-gray-100 font-sans">
      <!-- Sidebar -->
      <Sidebar @update:expanded="isSidebarExpanded = $event" />

      <!-- Main Content -->
      <div
        class="flex-1 flex flex-col transition-all duration-300"
        :class="isSidebarExpanded ? 'ml-64' : 'ml-20'"
      >
        <!-- Header -->
        <header
          class="bg-gemini-gray-100/80 backdrop-blur-lg px-6 flex items-center justify-between h-20"
        >
          <!-- Left Side: Page Title -->
          <h1 class="text-2xl font-semibold text-gemini-gray-800">
            {{ pageTitle }}
          </h1>

          <!-- Right Side: App Title -->
          <div class="flex items-center">
            <Icon icon="ph:cloud-sun-bold" class="h-7 w-7 text-gemini-blue-dark" />
            <span class="ml-2 text-lg font-bold text-gemini-gray-800">
              Weather Monitoring System
            </span>
          </div>
        </header>

        <!-- Main View -->
        <main class="flex-1 p-6 overflow-y-auto">
          <router-view />
        </main>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import Sidebar from '@/components/Sidebar.vue';
  import { Icon } from '@iconify/vue'; // Import Icon component

  // Sidebar expanded state
  const isSidebarExpanded = ref(false);

  // Route title handling
  const route = useRoute();
  const pageTitle = computed(() => {
    if (!route.name) return 'Dashboard';
    const name = String(route.name);
    return name.charAt(0).toUpperCase() + name.slice(1);
  });
  </script>
