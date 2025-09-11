<script setup>
import { ref, onUnmounted, watch, computed } from 'vue';
import { db } from '@/firebase.js';
import {
  ref as dbRef,
  onValue,
  off,
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

// ✅ Register Chart.js plugins
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

// Time ranges
const TIME_RANGES = {
  LAST_7: 'last7',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

// Days in range (added LAST_7 for consistency)
const DAYS_IN_RANGE = {
  [TIME_RANGES.LAST_7]: 7,
  [TIME_RANGES.WEEKLY]: 7,
  [TIME_RANGES.MONTHLY]: 30,
  [TIME_RANGES.YEARLY]: 365,
};

// State
const isLoading = ref(false);
const selectedTimeRange = ref(TIME_RANGES.LAST_7);

// ✅ Keep a reference to current listener ref (not function)
let unsubscribeRef = null;

// Chart data (reactive)
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
});

// ✅ Computed version ensures all values are numbers
const processedChartData = computed(() => ({
  labels: chartData.value.labels,
  datasets: chartData.value.datasets.map(ds => ({
    ...ds,
    data: ds.data.map(v => Number(v) || 0),
  })),
}));

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (ctx) =>
          `${ctx.dataset.label}: ${
            ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) : 0
          }`,
      },
    },
  },
  scales: {
    x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 45 } },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: { display: true, text: 'Temperature (°C)' },
      ticks: { callback: (v) => `${v}°C` },
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Humidity (%)' },
      ticks: { callback: (v) => `${v}%` },
    },
    y2: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Rainfall (mm)' },
      ticks: { callback: (v) => `${v}mm` },
    },
  },
};

// ======================
// Helpers
// ======================
const processRecords = (records, range) => {
  if (range === TIME_RANGES.LAST_7) {
    const labels = records.map(r =>
      formatTimestamp(new Date(r.timestamp), range)
    );
    const temp = records.map(r => Number(r.temperature) || 0);
    const hum = records.map(r => Number(r.humidity) || 0);
    const rain = records.map(r => Number(r.rainfall) || 0);
    return { labels, temp, hum, rain };
  }

  // Group data for weekly/monthly/yearly
  const groupedData = records.reduce((acc, record) => {
    const date = new Date(record.timestamp);
    let key;

    if (range === TIME_RANGES.YEARLY) {
      key = `${date.getFullYear()}-${date.getMonth()}`; // by month
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; // by day
    }

    if (!acc[key]) {
      acc[key] = {
        timestamp: date,
        temps: [],
        hums: [],
        rains: [],
        count: 0,
      };
    }

    acc[key].temps.push(Number(record.temperature) || 0);
    acc[key].hums.push(Number(record.humidity) || 0);
    acc[key].rains.push(Number(record.rainfall) || 0);
    acc[key].count++;
    return acc;
  }, {});

  const sortedGroups = Object.values(groupedData).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const labels = [];
  const temp = [];
  const hum = [];
  const rain = [];

  sortedGroups.forEach(group => {
    labels.push(formatTimestamp(group.timestamp, range));
    temp.push(group.temps.reduce((a, b) => a + b, 0) / group.count);
    hum.push(group.hums.reduce((a, b) => a + b, 0) / group.count);
    rain.push(group.rains.reduce((a, b) => a + b, 0) / group.count);
  });

  return { labels, temp, hum, rain };
};

const formatTimestamp = (date, range) => {
  switch (range) {
    case TIME_RANGES.LAST_7:
      return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
    case TIME_RANGES.WEEKLY:
      return date.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    case TIME_RANGES.MONTHLY:
      return date.toLocaleString([], { month: 'short', day: 'numeric' });
    case TIME_RANGES.YEARLY:
      return date.toLocaleString([], { month: 'long' });
    default:
      return date.toLocaleString();
  }
};

// ======================
// Firebase Listener
// ======================
const listenForHistoricalData = () => {
  isLoading.value = true;

  try {
    // ✅ detach old listener
    if (unsubscribeRef) off(unsubscribeRef);

    const historyRef = dbRef(db, 'sensor_logs');
    const range = selectedTimeRange.value;
    let historyQuery;

    if (range === TIME_RANGES.LAST_7) {
      historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(7));
    } else {
      const now = Date.now();
      const startTime = now - DAYS_IN_RANGE[range] * 86400000;
      historyQuery = query(historyRef, orderByChild('timestamp'), startAt(startTime));
    }

    // Keep reference for cleanup
    unsubscribeRef = historyRef;

    onValue(
      historyQuery,
      (snap) => {
        if (!snap.exists()) {
          chartData.value = {
            ...chartData.value,
            labels: [],
            datasets: chartData.value.datasets.map(ds => ({ ...ds, data: [] })),
          };
          isLoading.value = false;
          return;
        }

        const records = Object.values(snap.val());
        const { labels, temp, hum, rain } = processRecords(records, range);

        // ✅ update chart reactively (not mutate deep arrays directly)
        chartData.value = {
          ...chartData.value,
          labels,
          datasets: [
            { ...chartData.value.datasets[0], data: temp },
            { ...chartData.value.datasets[1], data: hum },
            { ...chartData.value.datasets[2], data: rain },
          ],
        };
        isLoading.value = false;
      },
      (error) => {
        console.error('Firebase onValue error:', error);
        isLoading.value = false;
      }
    );
  } catch (err) {
    console.error('Error fetching data:', err);
    isLoading.value = false;
  }
};

// Lifecycle
watch(selectedTimeRange, listenForHistoricalData, { immediate: true });

onUnmounted(() => {
  if (unsubscribeRef) off(unsubscribeRef);
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
               focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="last7">Last 7 Readings</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>

    <div class="relative h-[400px]">
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl z-10"
      >
        <div class="animate-pulse text-gray-600">Loading data...</div>
      </div>
      <Line v-if="!isLoading" :data="processedChartData" :options="chartOptions" />
    </div>
  </div>
</template>
