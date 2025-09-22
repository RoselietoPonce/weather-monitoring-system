<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Alerts & Notifications</h1>
        <p class="text-text-light mt-2">
          Set alert thresholds and view the history of triggered events.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Column 1: Threshold Settings -->
        <div class="lg:col-span-1">
          <div class="bg-surface rounded-2xl shadow-sm p-6 sticky top-8">
            <h2 class="text-xl font-bold text-text-main mb-6">Alert Thresholds</h2>

            <!-- Temperature -->
            <div class="space-y-2 mb-4">
              <label class="block text-sm font-medium text-text-light">Temperature (°C)</label>
              <div class="flex items-center space-x-3">
                <input
                  type="number"
                  placeholder="Min"
                  v-model.number="thresholds.temp_min"
                  class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                />
                <input
                  type="number"
                  placeholder="Max"
                  v-model.number="thresholds.temp_max"
                  class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                />
              </div>
            </div>

            <!-- Humidity -->
            <div class="space-y-2 mb-4">
              <label class="block text-sm font-medium text-text-light">Humidity (%)</label>
              <div class="flex items-center space-x-3">
                <input
                  type="number"
                  placeholder="Min"
                  v-model.number="thresholds.humidity_min"
                  class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                />
                <input
                  type="number"
                  placeholder="Max"
                  v-model.number="thresholds.humidity_max"
                  class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                />
              </div>
            </div>

            <!-- Rainfall -->
            <div class="space-y-2 mb-6">
              <label class="block text-sm font-medium text-text-light">Rainfall (mm/30min)</label>
              <input
                type="number"
                placeholder="Max"
                v-model.number="thresholds.rainfall_max"
                class="w-full px-4 py-2 border border-text-light/20 rounded-lg bg-background focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              />
              <p class="text-xs text-text-light/70">
                Alerts if rainfall exceeds this value in 30 minutes.
              </p>
            </div>

            <!-- Divider -->
            <div class="border-t border-text-light/10 my-6"></div>

            <!-- Email Notifications -->
            <div class="flex items-center justify-between">
              <label for="email-notifications" class="text-sm font-medium text-text-light"
                >Email Notifications</label
              >
              <button
                @click="
                  thresholds.email_notifications_enabled = !thresholds.email_notifications_enabled
                "
                :class="thresholds.email_notifications_enabled ? 'bg-primary' : 'bg-text-light/20'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                role="switch"
                :aria-checked="thresholds.email_notifications_enabled"
              >
                <span
                  :class="
                    thresholds.email_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                  "
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>
            <p class="text-xs text-text-light/70 mt-2">
              Receive an email when any alert threshold is triggered. Your login email will be used.
            </p>

            <!-- Save Button -->
            <button
              @click="saveThresholds"
              :disabled="isSaving"
              class="w-full flex justify-center mt-6 py-3 px-4 border border-transparent rounded-full text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Threshold</span>
            </button>
            <p
              v-if="saveStatus"
              class="text-sm text-center mt-3"
              :class="saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'"
            >
              {{ saveStatus }}
            </p>
          </div>
        </div>

        <!-- Column 2: Alert History -->
        <div class="lg:col-span-2">
          <div class="bg-surface rounded-2xl shadow-sm">
            <h2 class="text-xl font-bold text-text-main p-6 border-b border-text-light/10">
              Alert History
            </h2>
            <div v-if="isLoadingHistory" class="p-6 text-center text-text-light">
              <p>Loading alert history...</p>
            </div>
            <div v-else-if="!alertHistory.length" class="p-6 text-center text-text-light">
              <p>No alerts have been triggered yet.</p>
            </div>
            <ul v-else class="divide-y divide-text-light/10">
              <li
                v-for="alert in alertHistory"
                :key="alert.id"
                v-memo="[alert]"
                class="p-4 hover:bg-background transition-colors"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    :class="getAlertClass(alert.type).bg"
                  >
                    <Icon
                      :icon="getAlertClass(alert.type).icon"
                      class="h-6 w-6"
                      :class="getAlertClass(alert.type).text"
                    />
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-text-main">
                      {{ getAlertClass(alert.type).title }}
                    </p>
                    <p class="text-sm text-text-light">{{ alert.message }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium text-text-light">
                      {{ formatTimestamp(alert.timestamp) }}
                    </p>
                    <p class="text-xs text-text-light/70">{{ timeAgo(alert.timestamp) }}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/firebase.js'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { Icon } from '@iconify/vue'

// State for thresholds
const thresholds = ref({
  temp_min: null,
  temp_max: null,
  humidity_min: null,
  humidity_max: null,
  rainfall_max: null,
  email_notifications_enabled: false, // New state for email alerts
})
const isSaving = ref(false)
const saveStatus = ref('')

// State for alert history
const alertHistory = ref([])
const isLoadingHistory = ref(true)
let unsubscribeFromAlerts = null

// --- Thresholds Logic ---
const fetchThresholds = async () => {
  try {
    const docRef = doc(db, 'alerts', 'thresholds')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      thresholds.value = { ...thresholds.value, ...docSnap.data() }
    } else {
      console.log('No threshold document found. Using defaults.')
    }
  } catch (error) {
    console.error('Error fetching thresholds:', error)
    saveStatus.value = 'Error: Could not load settings.'
  }
}

const saveThresholds = async () => {
  isSaving.value = true
  saveStatus.value = ''
  try {
    const docRef = doc(db, 'alerts', 'thresholds')
    await setDoc(docRef, thresholds.value, { merge: true })
    saveStatus.value = 'Settings saved successfully!'
  } catch (error) {
    console.error('Error saving thresholds:', error)
    saveStatus.value = 'Error: Could not save settings.'
  } finally {
    isSaving.value = false
    setTimeout(() => (saveStatus.value = ''), 3000)
  }
}

// --- Alert History Logic ---
const listenForAlerts = () => {
  const alertsRef = collection(db, 'alerts_history')
  const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50))

  unsubscribeFromAlerts = onSnapshot(
    q,
    (snapshot) => {
      alertHistory.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      isLoadingHistory.value = false
    },
    (error) => {
      console.error('Error listening for alerts:', error)
      isLoadingHistory.value = false
    },
  )
}

// --- Helpers & Lifecycle ---
const getAlertClass = (type) => {
  switch (type) {
    case 'HIGH_TEMP':
      return {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: 'ph:thermometer-hot-bold',
        title: 'High Temperature',
      }
    case 'LOW_TEMP':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        icon: 'ph:thermometer-cold-bold',
        title: 'Low Temperature',
      }
    case 'HIGH_HUMIDITY':
      return {
        bg: 'bg-indigo-100',
        text: 'text-indigo-600',
        icon: 'ph:drop-half-bold',
        title: 'High Humidity',
      }
    case 'LOW_HUMIDITY':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: 'ph:drop-half-bottom-bold',
        title: 'Low Humidity',
      }
    case 'HEAVY_RAINFALL':
      return {
        bg: 'bg-cyan-100',
        text: 'text-cyan-600',
        icon: 'ph:cloud-rain-bold',
        title: 'Heavy Rainfall',
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        icon: 'ph:warning-circle-bold',
        title: 'System Alert',
      }
  }
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '...'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const timeAgo = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000)

  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

onMounted(() => {
  fetchThresholds()
  listenForAlerts()
})

onUnmounted(() => {
  if (unsubscribeFromAlerts) {
    unsubscribeFromAlerts()
  }
})
</script>
