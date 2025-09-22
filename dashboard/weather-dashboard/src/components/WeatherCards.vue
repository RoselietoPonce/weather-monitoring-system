<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Skeleton Loader Cards -->
    <template v-if="isLoading">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 animate-pulse"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="h-8 w-24 bg-text-light/20 rounded-md"></div>
          <div class="h-10 w-10 bg-text-light/20 rounded-full"></div>
        </div>
        <div class="h-12 w-32 bg-text-light/20 rounded-md mb-4"></div>
        <div class="h-16 bg-text-light/20 rounded-md"></div>
      </div>
    </template>

    <!-- Data Cards -->
    <template v-else>
      <div
        v-for="card in weatherData"
        :key="card.id"
        class="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col"
      >
        <!-- Card Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-text-light">{{ card.title }}</h3>
          <div class="p-2 rounded-full" :class="card.bgColor">
            <Icon :icon="card.icon" class="h-6 w-6" :class="card.color" />
          </div>
        </div>

        <!-- Main Value -->
        <div class="mb-4">
          <span class="text-4xl font-bold text-text-main">{{ card.value }}</span>
          <span class="text-xl font-medium text-text-light ml-1">{{ card.unit }}</span>
        </div>

        <!-- Sparkline (takes remaining space) -->
        <div class="flex-grow flex items-end">
          <Sparkline :data="historicalData[card.id] || []" :color-class="card.color" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, onValue, off, query, limitToLast } from 'firebase/database'
import Sparkline from './SparklineChart.vue'

defineProps({
  weatherData: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// Store historical sensor values for sparkline charts
const historicalData = ref({
  temp: [],
  humidity: [],
  rainfall: [],
})

let historyRef = null

// Fetch the last 20 sensor logs
onMounted(() => {
  historyRef = query(dbRef(rtdb, 'sensor_logs'), limitToLast(20))

  onValue(historyRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const records = Object.values(data)
      // Ensure we handle cases where a value might be missing
      historicalData.value.temp = records.map((r) => r.temperature ?? 0)
      historicalData.value.humidity = records.map((r) => r.humidity ?? 0)
      historicalData.value.rainfall = records.map((r) => r.rainfall ?? 0)
    }
  })
})

// Clean up the Firebase listener when component unmounts
onUnmounted(() => {
  if (historyRef) off(historyRef)
})
</script>
