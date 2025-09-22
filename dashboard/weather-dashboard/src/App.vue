<template>
  <router-view />
</template>

<script setup>
import { useTheme } from '@/composables/useTheme.js'

// Initialize the theme manager to apply the theme on app load
useTheme()
</script>
