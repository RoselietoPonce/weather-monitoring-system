<template>
  <div class="flex h-screen bg-background font-sans overflow-hidden">

    <!-- SIDEBAR -->
    <Sidebar ref="sidebar" @update:expanded="isSidebarExpanded = $event" />

    <!-- MAIN AREA -->
    <div class="flex-1 flex flex-col relative min-w-0">

      <!-- HEADER -->
      <header
        class="bg-background/80 backdrop-blur-lg px-4 md:px-6 flex items-center justify-between
               h-20 shrink-0 border-b border-hover z-20"
      >
        <div class="flex items-center">

          <!-- Mobile Sidebar Toggle -->
          <button
            @click="toggleMobileSidebar"
            class="lg:hidden p-2 mr-2 rounded-md text-text-light hover:bg-surface
                   focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Open Sidebar"
          >
            <Icon :icon="sidebarOpenIcon" class="h-6 w-6" />
          </button>

          <Icon icon="ph:cloud-sun-bold" class="h-7 w-7 text-primary hidden sm:block" />
          <span class="ml-2 text-lg font-bold text-text-main hidden sm:block">
            Weather Monitoring System
          </span>
        </div>

        <div class="flex items-center">
          <button
            @click="toggleTheme"
            class="p-2 rounded-full text-text-light hover:bg-surface
                   focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle Dark Mode"
          >
            <Icon
              :icon="isDarkMode ? 'ph:sun-bold' : 'ph:moon-bold'"
              class="h-6 w-6"
            />
          </button>
        </div>
      </header>

      <!-- CONTENT -->
      <main
        class="flex-1 p-6 overflow-y-auto bg-background scroll-smooth overscroll-none"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <AppFooter class="shrink-0" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { Icon } from '@iconify/vue'
import { useTheme } from '@/composables/useTheme.js'

const { isDarkMode, toggleTheme } = useTheme()

const sidebar = ref(null)
const isSidebarExpanded = ref(true)

// Mobile toggle
const toggleMobileSidebar = () => {
  sidebar.value?.toggleMobile()
}

const sidebarOpenIcon = computed(() =>
  sidebar.value?.isMobileOpen ? 'ph:x-bold' : 'ph:list-bold'
)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
