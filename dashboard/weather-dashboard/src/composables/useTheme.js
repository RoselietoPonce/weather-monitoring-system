import { ref } from 'vue'

const isDarkMode = ref(false)

// Function to initialize the theme
const initializeTheme = () => {
  // Ensure this code runs only in the browser
  if (typeof window === 'undefined') return

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

// Function to toggle the theme
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

// Initialize the theme as soon as the module is loaded
initializeTheme()

// Export the theme management functions
export function useTheme() {
  return {
    isDarkMode,
    toggleTheme,
  }
}
