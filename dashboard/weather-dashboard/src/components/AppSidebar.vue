<template>
  <aside
    class="flex flex-col bg-[var(--color-surface)] text-[var(--color-text-main)] h-screen border-r border-[var(--color-hover)] transition-all duration-500 ease-in-out"
    :class="isExpanded ? 'w-64' : 'w-20'"
  >
    <!-- Main Navigation with Toggle -->
    <nav class="flex-1 px-4 space-y-2 mt-4" role="navigation">
      <!-- Hamburger Toggle -->
      <button
        @click="isExpanded = !isExpanded"
        class="flex items-center w-full p-3 mb-4 rounded-xl bg-[var(--color-surface)] shadow-sm hover:bg-[var(--color-primary)]/5 transition-all duration-300 ease-in-out focus:outline-none focus:ring-0"
        :class="{ 'justify-center': !isExpanded }"
        :title="isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'"
        aria-label="Toggle Sidebar"
      >
        <Icon
          :icon="isExpanded ? 'ph:x-bold' : 'ph:list-bold'"
          class="h-5 w-5 text-[var(--color-text-light)] transition-all duration-300 ease-in-out"
        />
        <span v-if="isExpanded" class="ml-4 font-medium">Menu</span>
      </button>

      <!-- Navigation Items -->
      <router-link
        v-for="item in navItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        custom
        v-slot="{ href, navigate, isActive, isExactActive }"
      >
        <a
          :href="href"
          @click="navigate"
          class="relative flex items-center p-3 rounded-xl group transition-all duration-300 ease-in-out focus:outline-none focus:ring-0"
          :class="[
            isExpanded ? '' : 'justify-center',
            (item.routeName === 'dashboard' ? isExactActive : isActive)
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
              : 'text-[var(--color-text-light)] opacity-80 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]',
          ]"
          :aria-label="item.name"
        >
          <Icon
            :icon="item.icon"
            class="h-6 w-6 flex-shrink-0 transition-all duration-300 ease-in-out"
          />
          <span v-if="isExpanded" class="ml-4 font-medium sidebar-label">{{ item.name }}</span>

          <!-- Tooltip when collapsed -->
          <span
            v-if="!isExpanded"
            class="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-300 ease-in-out"
          >
            {{ item.name }}
          </span>
        </a>
      </router-link>
    </nav>

    <!-- Footer Navigation -->
    <div
      class="px-4 py-4 space-y-2 border-t border-[var(--color-hover)] transition-all duration-500 ease-in-out"
    >
      <!-- Profile -->
      <router-link to="/profile" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="navigate"
          class="relative flex items-center p-3 rounded-xl group transition-all duration-300 ease-in-out focus:outline-none focus:ring-0"
          :class="[
            isExpanded ? '' : 'justify-center',
            isActive
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
              : 'text-[var(--color-text-light)] opacity-80 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]',
          ]"
          aria-label="Profile"
        >
          <Icon icon="ph:user-circle-bold" class="h-6 w-6 flex-shrink-0" />
          <span v-if="isExpanded" class="ml-4 font-medium">Profile</span>
          <span
            v-if="!isExpanded"
            class="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
          >
            Profile
          </span>
        </a>
      </router-link>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="relative flex w-full items-center p-3 rounded-xl group text-[var(--color-text-light)] opacity-80 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)] transition-all duration-300 ease-in-out focus:outline-none focus:ring-0"
        :class="{ 'justify-center': !isExpanded }"
        aria-label="Logout"
      >
        <Icon icon="ph:sign-out-bold" class="h-6 w-6 flex-shrink-0" />
        <span v-if="isExpanded" class="ml-4 font-medium">Logout</span>
        <span
          v-if="!isExpanded"
          class="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
        >
          Logout
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase.js'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const isExpanded = ref(false)
const router = useRouter()

const navItems = [
  { name: 'Dashboard', routeName: 'dashboard', icon: 'ph:layout-bold' },
  { name: 'Charts', routeName: 'charts', icon: 'ph:chart-line-up-bold' },
  { name: 'Reports', routeName: 'reports', icon: 'ph:file-text-bold' },
  { name: 'Alerts', routeName: 'alerts', icon: 'ph:bell-ringing-bold' },
  { name: 'Recommendations', routeName: 'recommendations', icon: 'ph:plant-bold' },
]

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.sidebar-label {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
</style>
