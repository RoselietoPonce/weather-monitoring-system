import { ref, onMounted } from 'vue'

const isDarkMode = ref(false)

export function useTheme() {
  const initializeTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark')
      isDarkMode.value = true
    } else {
      document.documentElement.classList.remove('dark')
      isDarkMode.value = false
    }
  }

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Call initializeTheme when the composable is first used
  onMounted(() => {
    initializeTheme()
  })

  return {
    isDarkMode,
    toggleTheme,
    initializeTheme, // Expose for App.vue
  }
}
