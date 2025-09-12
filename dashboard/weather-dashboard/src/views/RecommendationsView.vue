<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">AI Recommendations</h1>
    <p class="text-gray-600">
      Get AI-powered insights for your crops based on live weather data.
    </p>

    <div v-if="isLoading" class="mt-8 text-center text-gray-600 animate-pulse">
      Generating recommendations...
    </div>

    <div
      v-else-if="recommendations.length"
      class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="(rec, index) in recommendations"
        :key="index"
        class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-l-4"
        :class="rec.borderColor"
      >
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0 p-3 rounded-xl" :class="rec.bgColor">
            <Icon :icon="rec.icon" class="h-6 w-6" :class="rec.iconColor" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ rec.title }}</h3>
            <p class="text-gray-600 mt-1">{{ rec.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="mt-8 bg-white/80 p-6 rounded-2xl shadow-lg text-center"
    >
      <p class="text-gray-700">
        No specific recommendations at this time. Conditions appear normal.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { db } from '@/firebase.js';
import { ref as dbRef, onValue, off } from 'firebase/database';
import { Icon } from '@iconify/vue';

const isLoading = ref(true);
const recommendations = ref([]);
let unsubscribeRef = null;

// Generate recommendations dynamically
const generateRecommendations = (data) => {
  const recs = [];
  const temp = Number(data.temperature) || 0;
  const humidity = Number(data.humidity) || 0;
  const rainfall = Number(data.rainfall) || 0;

  // Temperature-based
  if (temp > 32) {
    recs.push({
      title: 'High Temperature',
      message: `Temp is ${temp}°C. Consider irrigating in the early morning to reduce crop stress.`,
      icon: 'ph:thermometer-hot-bold',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-500',
    });
  }
  if (temp < 15) {
    recs.push({
      title: 'Low Temperature',
      message: `Temp is ${temp}°C. This may slow growth. Protect crops from frost if temps drop further.`,
      icon: 'ph:thermometer-cold-bold',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-500',
    });
  }

  // Rainfall-based
  if (rainfall > 10) {
    recs.push({
      title: 'Heavy Rainfall',
      message: `Rainfall is ${rainfall}mm. Avoid applying fertilizer to prevent nutrient leaching.`,
      icon: 'ph:cloud-rain-bold',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      borderColor: 'border-indigo-500',
    });
  }
  if (rainfall === 0 && temp > 28) {
    recs.push({
      title: 'Dry & Hot',
      message: 'No rainfall and high temperatures detected. Check soil moisture and irrigate if needed.',
      icon: 'ph:sun-dim-bold',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-500',
    });
  }

  // Humidity-based
  if (humidity > 85) {
    recs.push({
      title: 'High Humidity',
      message: `Humidity is ${humidity}%. Increased risk of fungal diseases. Monitor crops closely.`,
      icon: 'ph:drop-bold',
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-100',
      borderColor: 'border-teal-500',
    });
  }

  return recs;
};

// Firebase listener
onMounted(() => {
  unsubscribeRef = dbRef(db, 'sensor_data/latest');

  onValue(
    unsubscribeRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        recommendations.value = generateRecommendations(data);
      }
      isLoading.value = false;
    },
    { onlyOnce: true } // ✅ fetch once
  );
});

// Clean up listener
onUnmounted(() => {
  if (unsubscribeRef) {
    off(unsubscribeRef); // ✅ detach listener
  }
});
</script>
