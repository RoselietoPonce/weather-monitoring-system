<template>
  <aside
    class="flex flex-col bg-gray-50 text-gray-900 transition-all duration-300 ease-in-out h-screen pt-6"
    :class="isExpanded ? 'w-64' : 'w-20'"
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
  >
    <!-- Main Navigation -->
    <nav class="flex-1 px-4 space-y-2" role="navigation">
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
          class="relative flex items-center p-3 rounded-full transition-all duration-200 group"
          :class="[
            isExpanded ? '' : 'justify-center',
            (item.routeName === 'dashboard' ? isExactActive : isActive)
              ? 'bg-gray-200 text-gray-800 font-semibold'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800',
          ]"
          :aria-label="item.name"
        >
          <Icon :icon="item.icon" class="h-6 w-6 flex-shrink-0" />
          <span v-if="isExpanded" class="ml-4 font-medium transition-opacity duration-200">
            {{ item.name }}
          </span>
          <!-- Tooltip when collapsed -->
          <span
            v-if="!isExpanded"
            class="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap"
          >
            {{ item.name }}
          </span>
        </a>
      </router-link>
    </nav>

    <!-- Footer Navigation -->
    <div class="px-4 py-4 space-y-2">
      <!-- Profile -->
      <router-link to="/profile" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="navigate"
          class="relative flex items-center p-3 rounded-full transition-all duration-200 group"
          :class="[
            isExpanded ? '' : 'justify-center',
            isActive
              ? 'bg-gray-200 text-gray-800 font-semibold'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800',
          ]"
          aria-label="Profile"
        >
          <Icon icon="ph:user-circle-bold" class="h-6 w-6 flex-shrink-0" />
          <span v-if="isExpanded" class="ml-4 font-medium">Profile</span>
          <span
            v-if="!isExpanded"
            class="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100"
          >
            Profile
          </span>
        </a>
      </router-link>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="relative flex w-full items-center p-3 rounded-full transition-all duration-200 group text-gray-600 hover:bg-red-100 hover:text-red-700"
        :class="{ 'justify-center': !isExpanded }"
        aria-label="Logout"
      >
        <Icon icon="ph:sign-out-bold" class="h-6 w-6 flex-shrink-0" />
        <span v-if="isExpanded" class="ml-4 font-medium">Logout</span>
        <span
          v-if="!isExpanded"
          class="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100"
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
