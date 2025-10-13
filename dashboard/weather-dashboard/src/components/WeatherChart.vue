<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Decimation,
} from 'chart.js'

// Register Chart.js plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Decimation,
)

// Props
const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// --- Dark mode reactive state ---
const isDark = ref(document.documentElement.classList.contains('dark'))
let observer = null

onMounted(() => {
  observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// Chart options (reacts to dark mode)
const chartOptions = computed(() => {
  const textColor = isDark.value ? '#d1d5db' : '#374151'
  const gridColor = isDark.value ? '#374151' : '#e5e7eb'

  return {
    responsive: true,
    maintainAspectRatio: false, // chart fills parent container
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: textColor,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) : 0}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45,
          color: textColor,
        },
        grid: { color: gridColor },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Temperature (°C)' },
        ticks: {
          callback: (v) => `${v}°C`,
          color: textColor,
        },
        grid: { color: gridColor },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Humidity (%)' },
        ticks: {
          callback: (v) => `${v}%`,
          color: textColor,
        },
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Rainfall (mm)' },
        ticks: {
          callback: (v) => `${v}mm`,
          color: textColor,
        },
      },
    },
  }
})

// Safe dataset handling
const processedChartData = computed(() => ({
  labels: props.chartData.labels || [],
  datasets: (props.chartData.datasets || []).map((ds) => ({
    ...ds,
    data: (ds.data || []).map((v) => Number(v) || 0),
    borderWidth: ds.borderWidth ?? 2,
    tension: ds.tension ?? 0.3,
  })),
}))
</script>

<template>
  <div class="relative w-full min-h-[400px] h-full">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-surface/70 dark:bg-dark-surface/70 backdrop-blur-sm rounded-xl z-10"
    >
      <div class="animate-pulse text-gray-500 dark:text-gray-300">Loading data...</div>
    </div>

    <!-- Chart -->
    <Line
      v-if="!isLoading"
      :data="processedChartData"
      :options="chartOptions"
      class="w-full h-full"
    />
  </div>
</template>
