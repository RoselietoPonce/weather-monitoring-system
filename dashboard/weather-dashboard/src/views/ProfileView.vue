<template>
  <div class="font-sans text-text-main">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center p-12 bg-surface rounded-2xl shadow-md">
      <p class="text-text-light">Loading your profile...</p>
    </div>

    <!-- Profile Content -->
    <div v-else class="max-w-3xl mx-auto">
      <div class="space-y-8">
        <!-- Profile Information Card -->
        <div class="bg-surface rounded-2xl shadow-md p-6">
          <h2 class="text-xl font-bold mb-6">Profile Information</h2>
          <div class="flex items-center pb-6 mb-6 border-b border-gray-200 dark:border-white/10">
            <div class="relative">
              <!-- Avatar -->
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-blue-600 text-white text-3xl font-bold shadow-md"
              >
                <img
                  v-if="profile.photoURL && profile.photoURL !== ''"
                  :src="profile.photoURL"
                  alt="Profile Avatar"
                  class="w-full h-full object-cover rounded-full"
                />
                <span v-else>
                  {{ avatarInitials }}
                </span>
              </div>
            </div>
          </div>

          <!-- Profile Fields -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-text-light">Email Address</label>
              <input
                type="email"
                :value="user?.email"
                disabled
                class="mt-1 w-full bg-background border border-gray-300 dark:border-white/20 rounded-lg shadow-sm cursor-not-allowed text-text-light px-3 py-2"
              />
            </div>

            <div>
              <label for="displayName" class="block text-sm font-medium text-text-light"
                >Display Name</label
              >
              <input
                type="text"
                id="displayName"
                v-model="profile.displayName"
                placeholder="e.g., Juan Dela Cruz"
                class="mt-1 w-full bg-surface border border-gray-300 dark:border-white/20 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 px-3 py-2"
              />
            </div>

            <div>
              <label for="location" class="block text-sm font-medium text-text-light"
                >Location</label
              >
              <input
                type="text"
                id="location"
                v-model="profile.location"
                placeholder="e.g., Manila, Philippines"
                class="mt-1 w-full bg-surface border border-gray-300 dark:border-white/20 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 px-3 py-2"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This helps in providing more localized recommendations.
              </p>
            </div>
          </div>
        </div>

        <!-- Preferences Card -->
        <div class="bg-surface rounded-2xl shadow-md p-6">
          <h2 class="text-xl font-bold mb-6">Preferences</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-text-light">Email Notifications</span>
              <button
                @click="profile.emailNotifications = !profile.emailNotifications"
                :class="profile.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              >
                <span
                  :class="profile.emailNotifications ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                ></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex items-center justify-end gap-4 pt-4">
          <p
            v-if="saveStatus"
            class="text-sm"
            :class="saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'"
          >
            {{ saveStatus }}
          </p>
          <button
            @click="saveProfile"
            :disabled="isSaving || !hasChanges"
            class="flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/firebase.js'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const router = useRouter()

const user = ref(null)
const profile = ref({
  displayName: '',
  location: '',
  emailNotifications: true,
  photoURL: '',
})
const originalProfile = ref({})

const isLoading = ref(true)
const isSaving = ref(false)
const saveStatus = ref('')

const avatarInitials = computed(() => {
  const name = profile.value.displayName || user.value?.email || ''
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || '?'
  )
})

const hasChanges = computed(() => {
  return JSON.stringify(profile.value) !== JSON.stringify(originalProfile.value)
})

let unsubscribe = null
onMounted(() => {
  if (!unsubscribe) {
    unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        user.value = currentUser
        await fetchUserProfile(currentUser.uid)
      } else {
        router.push('/login')
      }
      isLoading.value = false
    })
  }
})

onUnmounted(() => {
  unsubscribe?.()
})

const fetchUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid)
    const docSnap = await getDoc(userDocRef)
    if (docSnap.exists()) {
      profile.value = { ...profile.value, ...(docSnap.data() ?? {}) }
    } else {
      profile.value.displayName = user.value?.displayName || ''
      profile.value.photoURL = user.value?.photoURL || ''
    }
    originalProfile.value = { ...profile.value } // save baseline for comparison
  } catch (error) {
    console.error('Error fetching user profile:', error)
    saveStatus.value = 'Error: Could not load profile.'
  }
}

const saveProfile = async () => {
  if (!user.value) return
  if (!profile.value.displayName.trim()) {
    saveStatus.value = 'Error: Display name cannot be empty.'
    return
  }

  isSaving.value = true
  saveStatus.value = ''
  try {
    // Update Firebase Auth profile if changed
    if (auth.currentUser && auth.currentUser.displayName !== profile.value.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: profile.value.displayName,
        photoURL: profile.value.photoURL || auth.currentUser.photoURL || '',
      })
    }

    // Save to Firestore (include email for syncing)
    const { displayName, location, emailNotifications, photoURL } = profile.value
    const userDocRef = doc(db, 'users', user.value.uid)
    await setDoc(
      userDocRef,
      { displayName, location, emailNotifications, photoURL, email: user.value.email },
      { merge: true },
    )

    saveStatus.value = 'Profile saved successfully!'
    originalProfile.value = { ...profile.value } // reset baseline after saving

    // Auto-clear only success messages
    setTimeout(() => {
      if (!saveStatus.value.includes('Error')) saveStatus.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error saving user profile:', error.code, error.message)
    saveStatus.value = `Error: Could not save profile. (${error.code})`
  } finally {
    isSaving.value = false
  }
}
</script>
