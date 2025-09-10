<script setup>
import { ref as vueRef, onMounted, onUnmounted } from 'vue';
import { db } from '@/firebase.js';
import { ref as dbRef, onValue } from 'firebase/database';

// Import the new child components
import WeatherCards from '@/components/WeatherCards.vue';
import WeatherChart from '@/components/WeatherChart.vue';
import WeatherMap from '@/components/WeatherMap.vue';

// State Management
const temperature = vueRef('N/A');
const humidity = vueRef('N/A');
const rainfall = vueRef('N/A');
const isLoading = vueRef(false);
const mapCenter = vueRef([7.99795, 124.25324]);
const markerLatLng = vueRef([7.99795, 124.25324]);
const deviceAddress = vueRef('Weather Station Location');
let unsubscribeLatest;

// Data for WeatherCards component
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

onMounted(() => {
  isLoading.value = true;
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
      isLoading.value = false;
    });
  } catch (error) {
    console.error('Error setting up data listeners:', error);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (unsubscribeLatest) unsubscribeLatest();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-10 text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">DASHBOARD</h1>
        <p class="text-gray-600 text-lg">
          MSU-Main Campus Weather Station
        </p>
      </div>

      <WeatherCards :weather-data="weatherData" :is-loading="isLoading" />

      <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeatherChart />

        <WeatherMap
          :map-center="mapCenter"
          :marker-lat-lng="markerLatLng"
          :device-address="deviceAddress"
          :temperature="temperature"
          :humidity="humidity"
          :rainfall="rainfall"
        />
      </div>
    </div>
  </div>
</template>
