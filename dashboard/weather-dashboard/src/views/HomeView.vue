<script setup>
import { ref as vueRef, onMounted, onUnmounted, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
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
  Decimation, // Add this
} from 'chart.js';
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
} from "@vue-leaflet/vue-leaflet";

// Constants
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Decimation // Add this
);

// State Management
const temperature = vueRef('N/A');
const humidity = vueRef('N/A');
const rainfall = vueRef('N/A');
const isLoading = vueRef(false);
const selectedTimeRange = vueRef(TIME_RANGES.LAST_7);
let unsubscribeLatest;
let unsubscribeHistory;

// Updated Map Configuration
const mapConfig = {
  zoom: 15,
  defaultCenter: [7.9775, 124.2452],
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  popupOptions: {
    closeOnClick: false,
    autoClose: false,
    className: 'custom-popup'
  }
};

const mapZoom = vueRef(mapConfig.zoom);
const mapCenter = vueRef(mapConfig.defaultCenter);
const markerLatLng = vueRef(mapConfig.defaultCenter);
const deviceAddress = vueRef('Weather Station Location');
const isMapLoading = vueRef(true);
const mapError = vueRef(null);

// Map Event Handlers
const onMapReady = () => {
  isMapLoading.value = false;
};

const onMapError = (error) => {
  console.error('Map error:', error);
  mapError.value = 'Failed to load map properly';
  isMapLoading.value = false;
};

const onMarkerClick = () => {
  console.log('Weather station clicked');
};

// Location Update Handler
const updateDeviceLocation = (data) => {
  try {
    if (data.location) {
      const { lat, lng, address } = data.location;
      if (lat && lng) {
        mapCenter.value = [lat, lng];
        markerLatLng.value = [lat, lng];
        deviceAddress.value = address || 'Weather Station Location';
      }
    }
  } catch (error) {
    console.error('Error updating device location:', error);
  }
};

// Chart Configuration
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
    line: {
      tension: 0.4
    },
    point: {
      radius: 2,
      hitRadius: 10,
      hoverRadius: 4
    }
  },
  plugins: {
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: (context) => {
          return context[0].label;
        },
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(1);
          }
          return label;
        }
      }
    },
    legend: {
      position: 'top',
      align: 'center',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        maxTicksLimit: 20
      }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Temperature (°C)'
      },
      ticks: {
        callback: value => `${value}°C`
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Humidity (%)'
      },
      ticks: {
        callback: value => `${value}%`
      },
      grid: {
        drawOnChartArea: false
      }
    },
    y2: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Rainfall (mm)'
      },
      ticks: {
        callback: value => `${value}mm`
      },
      grid: {
        drawOnChartArea: false
      }
    }
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
  switch(range) {
    case TIME_RANGES.LAST_7:
      return date.toLocaleString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    case TIME_RANGES.WEEKLY:
      return date.toLocaleString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    case TIME_RANGES.MONTHLY:
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit'
      });
    case TIME_RANGES.YEARLY:
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric'
      });
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

    switch (range) {
      case TIME_RANGES.LAST_7:
        historyQuery = query(historyRef,
          orderByChild('timestamp'),
          limitToLast(7)
        );
        break;
      default:
        const now = Date.now();
        const startTime = now - DAYS_IN_RANGE[range] * 24 * 60 * 60 * 1000;
        historyQuery = query(
          historyRef,
          orderByChild('timestamp'),
          startAt(startTime)
        );
    }

    unsubscribeHistory = onValue(historyQuery, (snapshot) => {
      if (!snapshot.exists()) {
        chartData.value.labels = [];
        chartData.value.datasets.forEach(dataset => dataset.data = []);
        return;
      }

      const data = snapshot.val();
      const records = Object.values(data)
        .sort((a, b) => a.timestamp - b.timestamp);

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

watch(selectedTimeRange, async (newRange) => {
  try {
    isLoading.value = true;
    await listenForHistoricalData();
  } catch (error) {
    console.error('Error updating time range:', error);
  } finally {
    isLoading.value = false;
  }
}, { immediate: true });

onMounted(() => {
  try {
    const latestDataRef = dbRef(db, 'sensor_data/latest');
    unsubscribeLatest = onValue(latestDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        temperature.value = data.temperature?.toFixed(1) || 'N/A';
        humidity.value = data.humidity?.toFixed(0) || 'N/A';
        rainfall.value = data.rainfall?.toFixed(1) || 'N/A';
        updateDeviceLocation(data);
      }
    });
  } catch (error) {
    console.error('Error setting up data listeners:', error);
  }
});

onUnmounted(() => {
  if (unsubscribeLatest) unsubscribeLatest();
  if (unsubscribeHistory) unsubscribeHistory();
});

const weatherData = [
  {
    id: 'temp',
    title: 'Temperature',
    value: temperature,
    unit: '°C',
    icon: 'ph:thermometer-cold-bold',
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  },
  {
    id: 'humidity',
    title: 'Humidity',
    value: humidity,
    unit: '%',
    icon: 'ph:drop-bold',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'rainfall',
    title: 'Rainfall',
    value: rainfall,
    unit: 'mm',
    icon: 'ph:cloud-rain-bold',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100'
  },
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-10 text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Weather Monitoring</h1>
        <p class="text-gray-600 text-lg">
          MSU-Marawi Weather Station
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="item in weatherData"
          :key="item.id"
          class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div class="flex items-center space-x-4 mb-4">
            <div :class="['p-3 rounded-xl', item.bgColor]">
              <Icon :icon="item.icon" :class="['h-7 w-7', item.color]" />
            </div>
            <h3 class="text-lg font-medium text-gray-700">{{ item.title }}</h3>
          </div>
          <div class="text-center">
            <p class="text-5xl font-bold tracking-tight" :class="item.color">
              <span v-if="isLoading">...</span>
              <span v-else>{{ item.value }}</span>
            </p>
            <p class="text-gray-500 mt-2 font-medium">{{ item.unit }}</p>
          </div>
        </div>
      </div>

      <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-medium text-gray-700">Station Location</h3>
            <span class="text-sm text-gray-600 font-medium">{{ deviceAddress }}</span>
          </div>
          <div class="relative h-[400px] rounded-xl overflow-hidden">
            <div v-if="isMapLoading"
                 class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div class="animate-pulse text-gray-600">Loading map...</div>
            </div>
            <l-map
              v-model:zoom="mapZoom"
              :center="mapCenter"
              @ready="onMapReady"
              @error="onMapError"
              class="h-full w-full rounded-xl shadow-inner"
            >
              <l-tile-layer
                :url="mapConfig.tileUrl"
                :attribution="mapConfig.attribution"
              />
              <l-marker :lat-lng="markerLatLng" @click="onMarkerClick">
                <l-popup :options="mapConfig.popupOptions">
                  <div class="p-3">
                    <h4 class="font-medium text-gray-800 mb-2">Weather Station</h4>
                    <div class="space-y-2">
                      <p class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Temperature</span>
                        <span class="font-medium text-red-500">{{ temperature }}°C</span>
                      </p>
                      <p class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Humidity</span>
                        <span class="font-medium text-blue-500">{{ humidity }}%</span>
                      </p>
                      <p class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">Rainfall</span>
                        <span class="font-medium text-indigo-500">{{ rainfall }}mm</span>
                      </p>
                    </div>
                  </div>
                </l-popup>
              </l-marker>
            </l-map>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.leaflet-container {
  border-radius: 0.75rem;
}

.leaflet-popup-content-wrapper {
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.leaflet-popup-content {
  margin: 0;
  min-width: 220px;
}

.custom-popup .leaflet-popup-tip,
.custom-popup .leaflet-popup-content-wrapper {
  background: white;
  color: #2c3e50;
}

.custom-popup .leaflet-popup-close-button {
  color: #2c3e50;
}

.custom-popup .leaflet-popup-close-button:hover {
  color: #000;
}
</style>
