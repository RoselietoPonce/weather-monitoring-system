<script setup>
import { ref as vueRef, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import { db } from '@/firebase.js';
// Import new functions for advanced queries
import {
  ref as dbRef,
  onValue,
  query,
  limitToLast,
  orderByChild,
  startAt,
} from 'firebase/database';
// --- CHART.JS IMPORTS ---
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
} from 'chart.js';

// --- Register Chart.js components ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- LIVE DATA FOR CARDS ---
const temperature = vueRef('N/A');
const humidity = vueRef('N/A');
const rainfall = vueRef('N/A');
let unsubscribeLatest;
let unsubscribeHistory;

// --- NEW: STATE FOR TIME RANGE DROPDOWN ---
const selectedTimeRange = vueRef('last7'); // Default to 'Last 7 Readings'

// --- CHART DATA (DYNAMIC) ---
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
    },
  ],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: false } },
};

// --- UPGRADED: FUNCTION TO FETCH HISTORICAL DATA ---
const listenForHistoricalData = () => {
  // Detach the old listener before creating a new one to prevent memory leaks
  if (unsubscribeHistory) {
    unsubscribeHistory();
  }

  const historyRef = dbRef(db, 'sensor_logs');
  let historyQuery;
  const range = selectedTimeRange.value;

  if (range === 'last7') {
    // Query for the last 7 data points
    historyQuery = query(historyRef, limitToLast(7));
  } else {
    // Query for a specific time period
    let days = 0;
    if (range === 'weekly') days = 7;
    if (range === 'monthly') days = 30;
    if (range === 'yearly') days = 365;
    const startTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;
    historyQuery = query(historyRef, orderByChild('timestamp'), startAt(startTimestamp));
  }

  // Attach the new listener
  unsubscribeHistory = onValue(historyQuery, (snapshot) => {
    const labels = [];
    const tempData = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Get an array of the records and sort them by their timestamp
      const records = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

      for (const record of records) {
        const date = new Date(record.timestamp);
        // Show date for longer ranges, time for recent readings
        const label = range === 'last7'
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString();
        labels.push(label);
        tempData.push(parseFloat(record.temperature)); // Ensure temperature is a number
      }
    } else {
      console.log(`No historical data found for the selected range: ${range}`);
    }
    // Update chart data
    chartData.value.labels = labels;
    chartData.value.datasets[0].data = tempData;
  });
};

// --- NEW: HANDLER FOR DROPDOWN CHANGE ---
const onTimeRangeChange = () => {
  listenForHistoricalData();
};

// --- COMPONENT LIFECYCLE HOOKS ---
onMounted(() => {
  const latestDataRef = dbRef(db, 'sensor_data/latest');
  unsubscribeLatest = onValue(latestDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      temperature.value = data.temperature?.toFixed(1) || 'N/A';
      humidity.value = data.humidity?.toFixed(0) || 'N/A';
      rainfall.value = data.rainfall?.toFixed(1) || 'N/A';
    }
  });

  listenForHistoricalData(); // Initial fetch
});

onUnmounted(() => {
  if (unsubscribeLatest) unsubscribeLatest();
  if (unsubscribeHistory) unsubscribeHistory();
});

// --- DATA FOR DISPLAY CARDS ---
const weatherData = [
  { id: 'temp', title: 'Temperature', value: temperature, unit: '°C', icon: 'ph:thermometer-cold-bold', color: 'text-red-500', bgColor:
'bg-red-100' },
  { id: 'humidity', title: 'Humidity', value: humidity, unit: '%', icon: 'ph:drop-bold', color: 'text-blue-500', bgColor: 'bg-blue-100'
},
  { id: 'rainfall', title: 'Rainfall', value: rainfall, unit: '%', icon: 'ph:cloud-rain-bold', color: 'text-indigo-500', bgColor:
'bg-indigo-100' },
];
</script>

<template>
  <div class="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-700">Dashboard</h1>
        <p class="text-gray-500 mt-1">
          Displaying live sensor readings and historical data.
        </p>
      </div>

      <!-- Grid of Weather Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="item in weatherData"
          :key="item.id"
          class="bg-white rounded-xl border border-gray-200 p-6 transition-shadow duration-300 hover:shadow-sm"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-medium text-gray-500">{{ item.title }}</h3>
            <div :class="['p-2 rounded-lg', item.bgColor]">
              <Icon :icon="item.icon" :class="['h-6 w-6', item.color]" />
            </div>
          </div>
          <div class="text-left">
            <p class="text-4xl font-bold text-gray-700">{{ item.value }}</p>
            <p class="text-sm text-gray-400">{{ item.unit }}</p>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
    <h3 class="text-base font-medium text-gray-500">Temperature Trend</h3>
    <select
      @change="onTimeRangeChange"
      v-model="selectedTimeRange"
      class="bg-white border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm text-gray-700 focus:outline-none focus:ring-1
focus:ring-indigo-500"
    >
      <option value="last7">Last 7 Readings</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="yearly">Yearly</option>
    </select>
  </div>
        <div class="relative h-96">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>
