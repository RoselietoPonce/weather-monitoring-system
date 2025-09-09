<script setup>
  import { Icon } from '@iconify/vue';

  // Placeholder data for your specific parameters
  const weatherData = [
    {
      id: 'temp',
      title: 'Temperature',
      value: '26.1',
      unit: '°C',
      icon: 'ph:thermometer-cold-bold',
      color: 'text-red-500',
    },
    {
      id: 'humidity',
      title: 'Humidity',
      value: '72',
      unit: '%',
      icon: 'ph:drop-bold',
      color: 'text-blue-500',
    },
    {
      id: 'rainfall',
      title: 'Rainfall',
      value: '3.4',
      unit: 'mm',
      icon: 'ph:cloud-rain-bold',
      color: 'text-indigo-500',
    },
  ];
  </script>

  <template>
    <div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p class="text-gray-500 mt-1">
            Overview of the latest sensor readings.
          </p>
        </div>

        <!-- Grid of Weather Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Loop through weatherData to create a card for each item -->
          <div
            v-for="item in weatherData"
            :key="item.id"
            class="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
          >
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-600">{{ item.title }}</h3>
                <div :class="['p-2 rounded-full bg-opacity-20', item.color.replace('text-', 'bg-')]">
                  <Icon :icon="item.icon" :class="['h-6 w-6', item.color]" />
                </div>
              </div>
              <div class="text-center">
                <p class="text-4xl font-bold text-gray-800">{{ item.value }}</p>
                <p class="text-sm text-gray-500">{{ item.unit }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Placeholder for future charts or tables -->
        <div class="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-medium text-gray-600 mb-4">Data History</h3>
          <div class="text-center text-gray-400">
            <Icon icon="ph:chart-line-up-bold" class="h-16 w-16 mx-auto mb-2" />
            <p>Historical data charts will be displayed here.</p>
          </div>
        </div>
      </div>
    </div>
  </template>
