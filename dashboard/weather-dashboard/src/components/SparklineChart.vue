<template>
  <div class="w-full h-12">
    <ApexChart :options="chartOptions" :series="series" type="line" height="48" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Register component for <script setup>
const ApexChart = VueApexCharts

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue
  },
})

const series = computed(() => [
  {
    name: 'Value',
    data: props.data,
  },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    height: 48,
    sparkline: {
      enabled: true,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: (value) => (value != null ? value.toFixed(1) : ''),
    },
  },
  colors: [props.color],
  dataLabels: {
    enabled: false,
  },
}))
</script>
