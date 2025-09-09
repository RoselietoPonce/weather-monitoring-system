<script setup>
  import { ref as vueRef, onMounted, onUnmounted } from 'vue';
  import { Icon } from '@iconify/vue';
  import { db } from '@/firebase.js';
  import { ref as dbRef, onValue } from 'firebase/database';
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
  let unsubscribe;

  // --- CHART PLACEHOLDER DATA ---
  const chartData = vueRef({
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Temperature (°C)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Softer Red
        borderColor: 'rgba(239, 68, 68, 1)', // Solid Red
        borderWidth: 2,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
        tension: 0.4, // Makes the line curvy
        data: [22, 24, 23, 25, 26, 24, 27],
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  // --- COMPONENT LIFECYCLE HOOKS ---
  onMounted(() => {
    const latestDataRef = dbRef(db, 'sensor_data/latest');
    unsubscribe = onValue(latestDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        temperature.value = data.temperature?.toFixed(1) || 'N/A';
        humidity.value = data.humidity?.toFixed(0) || 'N/A';
        rainfall.value = data.rainfall?.toFixed(1) || 'N/A';
      }
    });
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // --- DATA FOR DISPLAY CARDS ---
  const weatherData = [
    {
      id: 'temp',
      title: 'Temperature',
      value: temperature,
      unit: '°C',
      icon: 'ph:thermometer-cold-bold',
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      id: 'humidity',
      title: 'Humidity',
      value: humidity,
      unit: '%',
      icon: 'ph:drop-bold',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'rainfall',
      title: 'Rainfall',
      value: rainfall,
      unit: 'mm',
      icon: 'ph:cloud-rain-bold',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100',
    },
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
          <h3 class="text-base font-medium text-gray-500 mb-4">Weekly Temperature Trend</h3>
          <div class="relative h-96">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </template>
