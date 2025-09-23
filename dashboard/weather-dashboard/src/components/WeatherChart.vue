<script setup>
import { computed } from 'vue'
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

// Chart options with theme-aware styling
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#374151', // fallback to gray-700
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
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#374151',
      },
      grid: {
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--grid-color') || '#e5e7eb',
      },
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: { display: true, text: 'Temperature (°C)' },
      ticks: {
        callback: (v) => `${v}°C`,
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#374151',
      },
      grid: {
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--grid-color') || '#e5e7eb',
      },
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Humidity (%)' },
      ticks: {
        callback: (v) => `${v}%`,
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#374151',
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
        color:
          getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#374151',
      },
    },
  },
}))

// Ensure safe dataset handling
const processedChartData = computed(() => ({
  labels: props.chartData.labels || [],
  datasets: (props.chartData.datasets || []).map((ds) => ({
    ...ds,
    data: ds.data.map((v) => Number(v) || 0),
    borderWidth: ds.borderWidth || 2,
    tension: ds.tension ?? 0.3, // smoother lines
  })),
}))
</script>

<template>
  <div class="relative h-[400px]">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-surface/70 dark:bg-dark-surface/70 backdrop-blur-sm rounded-xl z-10"
    >
      <div class="animate-pulse text-text-light">Loading data...</div>
    </div>

    <!-- Chart -->
    <Line v-if="!isLoading" :data="processedChartData" :options="chartOptions" />
  </div>
</template>
