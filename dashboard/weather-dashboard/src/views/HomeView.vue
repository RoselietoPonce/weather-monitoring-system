<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-[var(--color-surface)]/40 pb-4 gap-4 sm:gap-0"
      >
        <!-- Left Side: Title -->
        <h1 class="text-3xl sm:text-4xl font-bold text-[var(--color-text-main)] tracking-tight">
          Dashboard
        </h1>

        <!-- Right Side: Status Indicators -->
        <div
          class="flex items-center text-sm text-[var(--color-text-light)]"
          aria-live="polite"
          role="status"
        >
          <!-- Connecting State -->
          <span v-if="lastUpdated === null">Connecting...</span>

          <!-- Online/Offline State -->
          <template v-else>
            <div class="flex items-center space-x-2">
              <!-- Status Dot -->
              <span
                class="relative flex h-3 w-3"
                :aria-label="isOnline ? 'Device Online' : 'Device Offline'"
              >
                <span
                  v-if="isOnline"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/70"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-3 w-3"
                  :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
                ></span>
              </span>

              <!-- Status Label -->
              <span
                :class="isOnline
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
                class="px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-200"
              >
                {{ isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>

            <!-- Last Updated Timestamp -->
            <div v-if="lastUpdated" class="flex items-center ml-4 text-xs sm:text-sm">
              <span class="mx-2 text-[var(--color-text-light)]/50">|</span>
              <span>
                Last updated:
                <strong class="text-[var(--color-text-main)]">
                  {{ new Date(lastUpdated).toLocaleString() }}
                </strong>
              </span>
            </div>
          </template>
        </div>
      </header>

      <!-- Weather Cards -->
      <WeatherCards :weather-data="weatherData" :is-loading="isLoading" />

      <!-- Map Section -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-[var(--color-text-main)] mb-4">Station Location</h2>

        <!-- Map -->
        <WeatherMap
          v-if="mapCenter && markerLatLng"
          :map-center="mapCenter"
          :marker-lat-lng="markerLatLng"
          :device-address="deviceAddress"
          :temperature="temperature"
          :humidity="humidity"
          :rainfall="rainfall"
        />

        <!-- Fallback -->
        <div
          v-else
          class="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)] rounded-3xl shadow-lg p-6 h-96 flex items-center justify-center transition-all duration-300"
        >
          <p class="text-[var(--color-text-light)] animate-pulse">Loading map data...</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, onValue, off } from 'firebase/database'

// Components
import WeatherCards from '@/components/WeatherCards.vue'
import WeatherMap from '@/components/WeatherMap.vue'

// Reactive state
const temperature = ref('N/A')
const humidity = ref('N/A')
const rainfall = ref('N/A')
const isLoading = ref(false)
const mapCenter = ref(null)
const markerLatLng = ref(null)
const deviceAddress = ref('Weather Station Location')
const lastUpdated = ref(null)

let latestDataRef = null
let latestDataCallback = null

// Computed: Device status
const isOnline = computed(() => {
  if (!lastUpdated.value) return false
  return Date.now() - lastUpdated.value < 30000 // within 30s considered online
})

// Weather card data
const weatherData = computed(() => [
  {
    id: 'temp',
    title: 'Temperature',
    value: temperature.value,
    unit: '°C',
    icon: 'ph:thermometer-cold-bold',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-200 dark:bg-red-900/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-300',
  },
  {
    id: 'humidity',
    title: 'Humidity',
    value: humidity.value,
    unit: '%',
    icon: 'ph:drop-bold',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-200 dark:bg-blue-900/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-300',
  },
  {
    id: 'rainfall',
    title: 'Rainfall',
    value: rainfall.value,
    unit: 'mm',
    icon: 'ph:cloud-rain-bold',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-200 dark:bg-indigo-900/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-300',
  },
])

// Update device location
const updateDeviceLocation = (data) => {
  try {
    if (data.location) {
      const { lat, lng, address } = data.location
      const latNum = Number(lat)
      const lngNum = Number(lng)

      if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
        mapCenter.value = [latNum, lngNum]
        markerLatLng.value = [latNum, lngNum]
        deviceAddress.value = address || 'Weather Station Location'
      }
    }
  } catch (error) {
    console.error('Error updating device location:', error)
  }
}

// Firebase listener
onMounted(() => {
  isLoading.value = true
  latestDataRef = dbRef(rtdb, 'sensor_data/latest')

  latestDataCallback = (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const temp = Number(data.temperature)
      const hum = Number(data.humidity)
      const rain = Number(data.rainfall)

      temperature.value = !isNaN(temp) ? temp.toFixed(1) : 'N/A'
      humidity.value = !isNaN(hum) ? hum.toFixed(0) : 'N/A'
      rainfall.value = !isNaN(rain) ? rain.toFixed(1) : 'N/A'

      // ✅ Prefer device timestamp if available
      lastUpdated.value = data.timestamp || Date.now()

      updateDeviceLocation(data)
    }
    isLoading.value = false
  }

  onValue(latestDataRef, latestDataCallback, (error) => {
    console.error('Error setting up data listeners:', error)
    isLoading.value = false
  })
})

// Cleanup listener
onUnmounted(() => {
  if (latestDataRef && latestDataCallback) {
    off(latestDataRef, latestDataCallback) // ✅ simplified
  }
})
</script>
