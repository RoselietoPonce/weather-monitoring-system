<script setup>
import { ref as vueRef, onMounted, onUnmounted, watch, computed } from 'vue';
import { db } from '@/firebase.js';
import {
  ref as dbRef,
  onValue,
  query,
  limitToLast,
  orderByChild,
  startAt,
} from 'firebase/database';
import { Line } from 'vue-chartjs';
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Decimation
);

const TIME_RANGES = {
  LAST_7: 'last7',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const DAYS_IN_RANGE = {
  [TIME_RANGES.WEEKLY]: 7,
  [TIME_RANGES.MONTHLY]: 30,
  [TIME_RANGES.YEARLY]: 365
};

const isLoading = vueRef(false);
const selectedTimeRange = vueRef(TIME_RANGES.LAST_7);
let unsubscribeHistory;

const chartData = vueRef({
  labels: [],
  datasets: [
    {
      label: 'Temperature (°C)',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(239, 68, 68, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
      tension: 0.4,
      data: [],
      yAxisID: 'y'
    },
    {
      label: 'Humidity (%)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      tension: 0.4,
      data: [],
      yAxisID: 'y1'
    },
    {
      label: 'Rainfall (mm)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
      tension: 0.4,
      data: [],
      yAxisID: 'y2'
    }
  ],
});

const processedChartData = computed(() => ({
  labels: chartData.value.labels,
  datasets: chartData.value.datasets.map(dataset => ({
    ...dataset,
    data: dataset.data.map(value => Number(value))
  }))
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  responsiveAnimationDuration: 0,
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  elements: {
    line: { tension: 0.4 },
    point: { radius: 2, hitRadius: 10, hoverRadius: 4 }
  },
  plugins: {
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (context) => context[0].label,
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) label += context.parsed.y.toFixed(1);
          return label;
        }
      }
    },
    legend: {
      position: 'top',
      align: 'center',
      labels: { usePointStyle: true, padding: 20 }
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 20 } },
    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Temperature (°C)' }, ticks: { callback: value => `${value}°C` } },
    y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Humidity (%)' }, ticks: { callback: value => `${value}%` }, grid: { drawOnChartArea: false } },
    y2: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Rainfall (mm)' }, ticks: { callback: value => `${value}mm` }, grid: { drawOnChartArea: false } }
  }
};

const processRecords = (records, range) => {
  const labels = [];
  const tempData = [];
  const humidityData = [];
  const rainfallData = [];

  records.forEach(record => {
    const date = new Date(record.timestamp);
    const label = formatTimestamp(date, range);
    labels.push(label);
    tempData.push(parseFloat(record.temperature) || 0);
    humidityData.push(parseFloat(record.humidity) || 0);
    rainfallData.push(parseFloat(record.rainfall) || 0);
  });
  return { labels, tempData, humidityData, rainfallData };
};

const formatTimestamp = (date, range) => {
  switch (range) {
    case TIME_RANGES.LAST_7:
      return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
    case TIME_RANGES.WEEKLY:
      return date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    case TIME_RANGES.MONTHLY:
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' });
    case TIME_RANGES.YEARLY:
      return date.toLocaleString([], { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleString();
  }
};

const listenForHistoricalData = async () => {
  isLoading.value = true;
  try {
    if (unsubscribeHistory) unsubscribeHistory();
    const historyRef = dbRef(db, 'sensor_logs');
    let historyQuery;
    const range = selectedTimeRange.value;

    if (range === TIME_RANGES.LAST_7) {
      historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(7));
    } else {
      const now = Date.now();
      const startTime = now - DAYS_IN_RANGE[range] * 24 * 60 * 60 * 1000;
      historyQuery = query(historyRef, orderByChild('timestamp'), startAt(startTime));
    }

    unsubscribeHistory = onValue(historyQuery, (snapshot) => {
      if (!snapshot.exists()) {
        chartData.value.labels = [];
        chartData.value.datasets.forEach(dataset => dataset.data = []);
        return;
      }
      const data = snapshot.val();
      const records = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
      const { labels, tempData, humidityData, rainfallData } = processRecords(records, range);
      chartData.value.labels = labels;
      chartData.value.datasets[0].data = tempData;
      chartData.value.datasets[1].data = humidityData;
      chartData.value.datasets[2].data = rainfallData;
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(selectedTimeRange, listenForHistoricalData, { immediate: true });

onUnmounted(() => {
  if (unsubscribeHistory) unsubscribeHistory();
});
</script>

<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-700">Parameters Trend</h3>
      <select
        v-model="selectedTimeRange"
        :disabled="isLoading"
        class="bg-white/90 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-700
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="last7">Last 7 Readings</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
    <div class="relative h-[400px]">
      <div v-if="isLoading"
           class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
        <div class="animate-pulse text-gray-600">Loading data...</div>
      </div>
      <Line :data="processedChartData" :options="chartOptions" />
    </div>
  </div>
</template>
