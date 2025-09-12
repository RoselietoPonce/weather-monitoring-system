<template>
    <div class="p-4 sm:p-6 lg:p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Charts & Trends</h1>
      <p class="text-gray-600">View historical graphs of weather parameters.</p>
      <div class="mt-8">
        <WeatherChart />
      </div>
    </div>
  </template>

  <script setup>
  import WeatherChart from '@/components/WeatherChart.vue';
  </script>
