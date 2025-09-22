<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Data Reports</h1>
        <p class="text-text-light mt-2">
          Select a date range and grouping to view summarized sensor data.
        </p>
      </div>

      <!-- Filters + Actions -->
      <div
        class="bg-white rounded-2xl shadow-md p-6 mb-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0"
      >
        <div class="flex flex-wrap items-center gap-4">
          <!-- Start Date -->
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1"
              >Start Date</label
            >
            <input
              type="date"
              id="startDate"
              v-model="startDate"
              class="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- End Date -->
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1"
              >End Date</label
            >
            <input
              type="date"
              id="endDate"
              v-model="endDate"
              class="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Group By -->
          <div>
            <label for="groupBy" class="block text-sm font-medium text-gray-700 mb-1"
              >Group By</label
            >
            <select
              id="groupBy"
              v-model="groupBy"
              class="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <!-- Export Buttons -->
        <div class="flex items-center space-x-3">
          <button
            @click="exportToCSV"
            :disabled="!aggregatedData.length || isExporting"
            class="flex items-center justify-center px-4 py-2 w-36 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Export CSV"
          >
            <span v-if="isExporting">Generating...</span>
            <span v-else class="flex items-center">
              <Icon icon="ph:file-csv-bold" class="h-5 w-5 mr-2" />
              Export CSV
            </span>
          </button>

          <button
            @click="exportToPDF"
            :disabled="!aggregatedData.length || isExporting"
            class="flex items-center justify-center px-4 py-2 w-36 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Export PDF"
          >
            <span v-if="isExporting">Generating...</span>
            <span v-else class="flex items-center">
              <Icon icon="ph:file-pdf-bold" class="h-5 w-5 mr-2" />
              Export PDF
            </span>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-2xl shadow-md overflow-hidden">
        <div v-if="isLoading" class="p-6 text-center text-gray-500">Loading data...</div>
        <div v-else-if="!aggregatedData.length" class="p-6 text-center text-gray-500">
          No data available for the selected period.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Avg. Temp (°C)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Avg. Humidity (%)
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Rainfall (mm)
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="record in aggregatedData" :key="record.period" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                  {{ record.period }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ record.temperature }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ record.humidity }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {{ record.rainfall }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { rtdb } from '@/firebase.js'
import { ref as dbRef, query, orderByChild, startAt, endAt, onValue } from 'firebase/database'
import { Icon } from '@iconify/vue'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// State
const startDate = ref('')
const endDate = ref('')
const groupBy = ref('daily')
const rawReportData = ref([])
const isLoading = ref(false)
const isExporting = ref(false)

let unsubscribe = null

// Set default date range (today)
onMounted(() => {
  const today = new Date()
  startDate.value = today.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// Fetch data from Firebase
const fetchData = () => {
  if (!startDate.value || !endDate.value) return

  isLoading.value = true
  if (unsubscribe) unsubscribe()

  const startTimestamp = new Date(startDate.value).getTime()
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)
  const endTimestamp = end.getTime()

  const sensorLogsRef = query(
    dbRef(rtdb, 'sensor_logs'),
    orderByChild('timestamp'),
    startAt(startTimestamp),
    endAt(endTimestamp),
  )

  unsubscribe = onValue(
    sensorLogsRef,
    (snapshot) => {
      const data = snapshot.val()
      rawReportData.value = data ? Object.values(data) : []
      isLoading.value = false
    },
    (error) => {
      console.error('Error fetching report data:', error)
      isLoading.value = false
    },
  )
}

watch([startDate, endDate], fetchData, { immediate: true })

// Aggregate data
const aggregatedData = computed(() => {
  if (!rawReportData.value.length) return []

  const getGroupKey = (record, period) => {
    const date = new Date(record.timestamp)
    const year = date.getFullYear()
    const month = date.getMonth()

    switch (period) {
      case 'yearly':
        return `${year}`
      case 'monthly':
        return `${year}-${String(month + 1).padStart(2, '0')}`
      case 'weekly': {
        // ISO week (starting Monday)
        const tmp = new Date(date)
        const day = tmp.getDay() || 7
        tmp.setDate(tmp.getDate() - day + 1)
        return tmp.toISOString().split('T')[0]
      }
      case 'daily':
      default:
        return date.toISOString().split('T')[0]
    }
  }

  const groups = {}

  rawReportData.value.forEach((record) => {
    const key = getGroupKey(record, groupBy.value)
    if (!groups[key]) {
      groups[key] = {
        tempSum: 0,
        tempCount: 0,
        humiditySum: 0,
        humidityCount: 0,
        rainfallSum: 0,
        recordCount: 0,
      }
    }

    if (record.temperature != null) {
      groups[key].tempSum += record.temperature
      groups[key].tempCount++
    }
    if (record.humidity != null) {
      groups[key].humiditySum += record.humidity
      groups[key].humidityCount++
    }
    if (record.rainfall != null) {
      groups[key].rainfallSum += record.rainfall
    }
    groups[key].recordCount++
  })

  return Object.keys(groups)
    .map((key) => {
      const group = groups[key]
      return {
        period: key,
        temperature: group.tempCount > 0 ? (group.tempSum / group.tempCount).toFixed(1) : 'N/A',
        humidity:
          group.humidityCount > 0 ? (group.humiditySum / group.humidityCount).toFixed(0) : 'N/A',
        rainfall: group.rainfallSum.toFixed(1),
      }
    })
    .sort((a, b) => new Date(b.period) - new Date(a.period)) // Sort descending by actual date
})

// Export CSV
const exportToCSV = () => {
  if (!aggregatedData.value.length) return
  isExporting.value = true
  try {
    const csv = Papa.unparse(aggregatedData.value)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute(
      'download',
      `report_${groupBy.value}_${startDate.value}_to_${endDate.value}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    isExporting.value = false
  }
}

// Export PDF
const exportToPDF = () => {
  if (!aggregatedData.value.length) return
  isExporting.value = true
  try {
    const doc = new jsPDF()
    doc.text(`Weather Report (${groupBy.value})`, 14, 16)
    doc.text(`Period: ${startDate.value} to ${endDate.value}`, 14, 22)

    const tableColumn = ['Period', 'Avg. Temp (°C)', 'Avg. Humidity (%)', 'Total Rainfall (mm)']
    const tableRows = aggregatedData.value.map((row) => [
      row.period,
      row.temperature,
      row.humidity,
      row.rainfall,
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
    })

    doc.save(`report_${groupBy.value}_${startDate.value}_to_${endDate.value}.pdf`)
  } finally {
    isExporting.value = false
  }
}
</script>
