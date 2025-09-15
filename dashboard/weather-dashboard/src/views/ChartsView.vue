<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Charts & Trends</h1>
        <p class="text-gray-600 mt-1">
          View historical graphs of weather parameters.
        </p>
      </div>

      <!-- Control Panel -->
      <div class="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-800">Data Time Range</h3>
          <select
            v-model="selectedTimeRange"
            :disabled="isLoading"
            class="bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="last7">Last 7 Readings</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <!-- Chart Display -->
      <div class="bg-white rounded-2xl shadow-md p-6">
        <div v-memo="[processedChartData, isLoading]">
          <WeatherChart
            :chart-data="processedChartData"
            :is-loading="isLoading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, watch, computed } from 'vue'
import { rtdb } from '@/firebase.js'
import {
  ref as dbRef,
  onValue,
  off,
  query,
  limitToLast,
  orderByChild,
  startAt,
} from 'firebase/database'
import WeatherChart from '@/components/WeatherChart.vue'

// --- STATE ---
const isLoading = ref(true)
const selectedTimeRange = ref('last7')
let unsubscribeRef = null
let unsubscribeCallback = null

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Temperature (°C)',
      borderColor: 'rgba(239, 68, 68, 1)',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      data: [],
      borderWidth: 2,
      tension: 0.4,
      yAxisID: 'y',
    },
    {
      label: 'Humidity (%)',
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      data: [],
      borderWidth: 2,
      tension: 0.4,
      yAxisID: 'y1',
    },
    {
      label: 'Rainfall (mm)',
      borderColor: 'rgba(99, 102, 241, 1)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      data: [],
      borderWidth: 2,
      tension: 0.4,
      yAxisID: 'y2',
    },
  ],
})

const processedChartData = computed(() => ({
  labels: chartData.value.labels,
  datasets: chartData.value.datasets.map((ds) => ({
    ...ds,
    data: ds.data.map((v) => Number(v) || 0),
  })),
}))

// --- HELPERS ---
const TIME_RANGES = {
  LAST_7: 'last7',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}
const DAYS_IN_RANGE = {
  [TIME_RANGES.LAST_7]: 7,
  [TIME_RANGES.WEEKLY]: 7,
  [TIME_RANGES.MONTHLY]: 30,
  [TIME_RANGES.YEARLY]: 365,
}

const formatTimestamp = (date, range) => {
  switch (range) {
    case TIME_RANGES.LAST_7:
      return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
    case TIME_RANGES.WEEKLY:
      return date.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    case TIME_RANGES.MONTHLY:
      return date.toLocaleString([], { month: 'short', day: 'numeric' })
    case TIME_RANGES.YEARLY:
      return date.toLocaleString([], { month: 'long' })
    default:
      return date.toLocaleString()
  }
}

const processRecords = (records, range) => {
  if (range === TIME_RANGES.LAST_7) {
    return {
      labels: records.map((r) =>
        formatTimestamp(new Date(r.timestamp), range)
      ),
      temp: records.map((r) => Number(r.temperature) || 0),
      hum: records.map((r) => Number(r.humidity) || 0),
      rain: records.map((r) => Number(r.rainfall) || 0),
    }
  }
  const groupedData = records.reduce((acc, record) => {
    const date = new Date(record.timestamp)
    const key =
      range === TIME_RANGES.YEARLY
        ? `${date.getFullYear()}-${date.getMonth()}`
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!acc[key])
      acc[key] = { timestamp: date, temps: [], hums: [], rains: [], count: 0 }
    acc[key].temps.push(Number(record.temperature) || 0)
    acc[key].hums.push(Number(record.humidity) || 0)
    acc[key].rains.push(Number(record.rainfall) || 0)
    acc[key].count++
    return acc
  }, {})
  const sortedGroups = Object.values(groupedData).sort(
    (a, b) => a.timestamp - b.timestamp
  )
  const labels = [],
    temp = [],
    hum = [],
    rain = []
  sortedGroups.forEach((g) => {
    labels.push(formatTimestamp(g.timestamp, range))
    temp.push(g.count ? g.temps.reduce((a, b) => a + b, 0) / g.count : 0)
    hum.push(g.count ? g.hums.reduce((a, b) => a + b, 0) / g.count : 0)
    rain.push(g.count ? g.rains.reduce((a, b) => a + b, 0) / g.count : 0)
  })
  return { labels, temp, hum, rain }
}

// --- FIREBASE LISTENER ---
const listenForHistoricalData = () => {
  isLoading.value = true
  if (unsubscribeRef && unsubscribeCallback) {
    off(unsubscribeRef, 'value', unsubscribeCallback)
  }
  const historyRef = dbRef(rtdb, 'sensor_logs')
  const range = selectedTimeRange.value
  let historyQuery
  if (range === TIME_RANGES.LAST_7) {
    historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(7))
  } else {
    const startTime = Date.now() - DAYS_IN_RANGE[range] * 86400000
    historyQuery = query(historyRef, orderByChild('timestamp'), startAt(startTime))
  }

  unsubscribeRef = historyRef
  unsubscribeCallback = (snap) => {
    if (!snap.exists()) {
      chartData.value.labels = []
      chartData.value.datasets.forEach((ds) => (ds.data = []))
    } else {
      const { labels, temp, hum, rain } = processRecords(
        Object.values(snap.val()),
        range
      )
      chartData.value = {
        labels,
        datasets: [
          { ...chartData.value.datasets[0], data: temp },
          { ...chartData.value.datasets[1], data: hum },
          { ...chartData.value.datasets[2], data: rain },
        ],
      }
    }
    isLoading.value = false
  }

  onValue(historyQuery, unsubscribeCallback, (error) => {
    console.error('Firebase onValue error:', error)
    isLoading.value = false
  })
}

// --- LIFECYCLE ---
watch(selectedTimeRange, listenForHistoricalData, { immediate: true })
onUnmounted(() => {
  if (unsubscribeRef && unsubscribeCallback) {
    off(unsubscribeRef, 'value', unsubscribeCallback)
  }
})
</script>
