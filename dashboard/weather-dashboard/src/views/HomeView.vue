<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="flex items-center justify-between mb-10">
        <!-- Left Side: Title -->
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Dashboard</h1>

        <!-- Right Side: Status Indicators -->
        <div class="flex items-center text-sm text-text-light" aria-live="polite">
          <!-- Connecting State -->
          <span v-if="lastUpdated === null">Connecting...</span>

          <!-- Online/Offline State -->
          <template v-else>
            <div class="flex items-center">
              <span class="relative flex h-3 w-3 mr-2">
                <span
                  v-if="isOnline"
                  class="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-3 w-3"
                  :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
                ></span>
              </span>
              <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
            </div>

            <!-- Last Updated Timestamp -->
            <div v-if="lastUpdated" class="flex items-center ml-4">
              <span class="mx-2 text-text-light/50">|</span>
              <span>Last updated: {{ new Date(lastUpdated).toLocaleString() }}</span>
            </div>
          </template>
        </div>
      </header>

      <!-- Weather Cards -->
      <WeatherCards :weather-data="weatherData" :is-loading="isLoading" />

      <!-- Map Section -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-text-main mb-4">Station Location</h2>

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
          class="bg-surface rounded-2xl shadow-sm p-6 h-96 flex items-center justify-center"
        >
          <p class="text-text-light">Loading map data...</p>
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

// Computed: Device status
const isOnline = computed(() => {
  if (!lastUpdated.value) return false
  const now = Date.now()
  return now - lastUpdated.value < 30000 // within 30s considered online
})

// Computed: Weather card data
const weatherData = computed(() => [
  {
    id: 'temp',
    title: 'Temperature',
    value: temperature.value,
    unit: '°C',
    icon: 'ph:thermometer-cold-bold',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  {
    id: 'humidity',
    title: 'Humidity',
    value: humidity.value,
    unit: '%',
    icon: 'ph:drop-bold',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'rainfall',
    title: 'Rainfall',
    value: rainfall.value,
    unit: 'mm',
    icon: 'ph:cloud-rain-bold',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
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

  onValue(
    latestDataRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data) {
        temperature.value =
          typeof data.temperature === 'number' ? data.temperature.toFixed(1) : 'N/A'
        humidity.value = typeof data.humidity === 'number' ? data.humidity.toFixed(0) : 'N/A'
        rainfall.value = typeof data.rainfall === 'number' ? data.rainfall.toFixed(1) : 'N/A'
        lastUpdated.value = Date.now()
        updateDeviceLocation(data)
      }
      isLoading.value = false
    },
    (error) => {
      console.error('Error setting up data listeners:', error)
      isLoading.value = false
    },
  )
})

// Cleanup listener
onUnmounted(() => {
  if (latestDataRef) off(latestDataRef)
})
</script>
