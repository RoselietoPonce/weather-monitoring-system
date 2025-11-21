<template>
  <!-- Mobile backdrop -->
  <transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-300"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="isMobileOpen = false"
    ></div>
  </transition>

  <!-- Sidebar -->
  <aside
    @click.stop
    class="fixed lg:static top-0 left-0 z-40 h-screen bg-surface text-text-main border-r border-hover flex flex-col transition-[width,transform] duration-300 ease-in-out"
    :class="{
      'w-64': isExpanded,
      'w-20': !isExpanded,
      'translate-x-0': isMobileOpen,
      '-translate-x-full lg:translate-x-0': !isMobileOpen,
    }"
  >
    <nav class="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar" role="navigation">

      <!-- Desktop expand button -->
      <button
        @click="toggleExpand"
        class="hidden lg:flex items-center w-full p-3 mb-4 rounded-xl bg-surface shadow-sm hover:bg-primary/5 transition-all duration-300"
        :class="{ 'justify-center': !isExpanded }"
      >
        <Icon
          :icon="isExpanded ? 'ph:caret-left-bold' : 'ph:list-bold'"
          class="h-5 w-5 text-text-light"
        />
        <span v-if="isExpanded" class="ml-4 font-medium">Menu</span>
      </button>

      <!-- Mobile close -->
      <div class="flex lg:hidden justify-end p-2 mb-2">
        <button @click="isMobileOpen = false" class="p-2 text-text-light hover:text-primary">
          <Icon icon="ph:x-bold" class="h-6 w-6" />
        </button>
      </div>

      <!-- Navigation items -->
      <router-link
        v-for="item in navItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        custom
        v-slot="{ href, navigate, isActive }"
      >
        <a
          :href="href"
          @click="navigate"
          class="relative flex items-center p-3 rounded-xl group transition-all duration-300"
          :class="[
            isExpanded ? '' : 'justify-center',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-light opacity-80 hover:bg-primary/5 hover:text-primary'
          ]"
        >
          <Icon :icon="item.icon" class="h-6 w-6 flex-shrink-0" />

          <!-- Label when expanded -->
          <span v-if="isExpanded" class="ml-4 font-medium whitespace-nowrap">
            {{ item.name }}
          </span>

          <!-- Tooltip (desktop only) -->
          <div
            v-if="!isExpanded"
            class="absolute left-14 z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded-md
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden lg:block"
          >
            {{ item.name }}
          </div>
        </a>
      </router-link>
    </nav>

    <!-- PROFILE + LOGOUT -->
    <div class="px-4 py-4 space-y-2 border-t border-hover">

      <!-- Profile -->
      <router-link to="/profile" custom v-slot="{ href, navigate, isActive }">
        <a
          :href="href"
          @click="navigate"
          class="relative flex items-center p-3 rounded-xl group transition-all duration-300"
          :class="[
            isExpanded ? '' : 'justify-center',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-text-light opacity-80 hover:bg-primary/5 hover:text-primary'
          ]"
        >
          <Icon icon="ph:user-circle-bold" class="h-6 w-6" />

          <span v-if="isExpanded" class="ml-4 font-medium whitespace-nowrap">Profile</span>

          <div
            v-if="!isExpanded"
            class="absolute left-14 z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded-md
                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden lg:block"
          >
            Profile
          </div>
        </a>
      </router-link>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="relative flex w-full items-center p-3 rounded-xl group text-text-light opacity-80 hover:bg-primary/5 hover:text-red-500 transition-all duration-300"
        :class="{ 'justify-center': !isExpanded }"
      >
        <Icon icon="ph:sign-out-bold" class="h-6 w-6" />
        <span v-if="isExpanded" class="ml-4 font-medium whitespace-nowrap">Logout</span>

        <div
          v-if="!isExpanded"
          class="absolute left-14 z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded-md
                 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden lg:block"
        >
          Logout
        </div>
      </button>

    </div>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'

const isExpanded = ref(true)
const isMobileOpen = ref(false)

const router = useRouter()
const route = useRoute()

const emit = defineEmits(['update:expanded'])

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

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  emit('update:expanded', isExpanded.value)
}

const toggleMobile = () => {
  isMobileOpen.value = !isMobileOpen.value
}

defineExpose({ toggleMobile, isMobileOpen })

watch(route, () => {
  isMobileOpen.value = false
})
</script>

<style scoped>
/* Sidebar label fade */
.sidebar-label {
  transition: opacity 0.2s ease;
}

/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
