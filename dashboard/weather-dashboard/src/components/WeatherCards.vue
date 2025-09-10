<script setup>
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

const props = defineProps({
  weatherData: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const formattedData = computed(() => {
  return props.weatherData.map(item => ({
    ...item,
    displayValue: props.isLoading ? '...' : item.value,
  }));
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div
      v-for="item in formattedData"
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
          <span>{{ item.displayValue }}</span>
        </p>
        <p class="text-gray-500 mt-2 font-medium">{{ item.unit }}</p>
      </div>
    </div>
  </div>
</template>
