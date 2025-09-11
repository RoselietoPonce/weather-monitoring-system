<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import { db } from '@/firebase.js';
import { ref as dbRef, onValue, off, query, limitToLast } from 'firebase/database';
import Sparkline from './Sparkline.vue';

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

// Store historical sensor values for sparkline charts
const historicalData = ref({
  temp: [],
  humidity: [],
  rainfall: [],
});

let historyRef = null;

// Fetch the last 20 sensor logs
onMounted(() => {
  historyRef = query(dbRef(db, 'sensor_logs'), limitToLast(20));

  onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const records = Object.values(data);
      historicalData.value.temp = records.map(r => r.temperature ?? 0);
      historicalData.value.humidity = records.map(r => r.humidity ?? 0);
      historicalData.value.rainfall = records.map(r => r.rainfall ?? 0);
    }
  });
});

// Clean up the Firebase listener when component unmounts
onUnmounted(() => {
  if (historyRef) off(historyRef);
});

</script>

  <template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        v-for="(item, index) in weatherData"
        :key="item.id || index"
        class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <!-- Header -->
        <div class="flex items-center space-x-4 mb-4">
          <div :class="['p-3 rounded-xl', item.bgColor]">
            <Icon :icon="item.icon" :class="['h-7 w-7', item.color]" />
          </div>
          <h3 class="text-lg font-medium text-gray-700">{{ item.title }}</h3>
        </div>

        <!-- Value -->
        <div class="text-center">
          <p class="text-5xl font-bold tracking-tight" :class="item.color">
            <span>{{ isLoading ? '...' : item.value }}</span>
          </p>
          <p class="text-gray-500 mt-2 font-medium">{{ item.unit }}</p>
        </div>

        <!-- Sparkline Chart -->
        <div class="mt-4">
          <Sparkline :data="historicalData[item.id] || []" :color="item.color" />
        </div>
      </div>
    </div>
  </template>
