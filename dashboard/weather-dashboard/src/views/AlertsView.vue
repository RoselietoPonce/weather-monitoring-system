<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Alerts & Notifications</h1>
        <p class="text-gray-600 mt-1">Set alert thresholds and view the history of triggered events.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Column 1: Threshold Settings -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-md p-6 sticky top-8">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Alert Thresholds</h2>

            <!-- Temperature -->
            <div class="space-y-2 mb-4">
              <label class="block text-sm font-medium text-gray-700">Temperature (°C)</label>
              <div class="flex items-center space-x-2">
                <input type="number" placeholder="Min" v-model.number="thresholds.temp_min" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <input type="number" placeholder="Max" v-model.number="thresholds.temp_max" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>

            <!-- Humidity -->
            <div class="space-y-2 mb-4">
              <label class="block text-sm font-medium text-gray-700">Humidity (%)</label>
              <div class="flex items-center space-x-2">
                <input type="number" placeholder="Min" v-model.number="thresholds.humidity_min" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <input type="number" placeholder="Max" v-model.number="thresholds.humidity_max" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>

            <!-- Rainfall -->
            <div class="space-y-2 mb-6">
              <label class="block text-sm font-medium text-gray-700">Rainfall (mm/hr)</label>
              <div class="flex items-center space-x-2">
                <input type="number" placeholder="Max" v-model.number="thresholds.rainfall_max" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
              </div>
               <p class="text-xs text-gray-500">Alerts if rainfall exceeds this value in one hour.</p>
            </div>

            <!-- Save Button -->
            <button
              @click="saveThresholds"
              :disabled="isSaving"
              class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-full
                  text-base font-medium text-gray-800 bg-white hover:bg-gray-100
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                  transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Thresholds</span>
            </button>
            <p v-if="saveStatus" class="text-sm text-center mt-3" :class="saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'">
              {{ saveStatus }}
            </p>
          </div>
        </div>

        <!-- Column 2: Alert History -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow-md">
             <h2 class="text-xl font-bold text-gray-800 p-6 border-b border-gray-200">Alert History</h2>
            <div v-if="isLoadingHistory" class="p-6 text-center text-gray-500">
              <p>Loading alert history...</p>
            </div>
            <div v-else-if="!alertHistory.length" class="p-6 text-center text-gray-500">
              <p>No alerts have been triggered yet.</p>
            </div>
            <ul v-else class="divide-y divide-gray-200">
                <li v-for="alert in alertHistory" :key="alert.id" v-memo="[alert]" class="p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" :class="getAlertClass(alert.type).bg">
                       <Icon :icon="getAlertClass(alert.type).icon" class="h-6 w-6" :class="getAlertClass(alert.type).text" />
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold text-gray-800">{{ getAlertClass(alert.type).title }}</p>
                      <p class="text-sm text-gray-600">{{ alert.message }}</p>
                    </div>
                    <div class="text-right">
                       <p class="text-sm font-medium text-gray-700">{{ formatTimestamp(alert.timestamp) }}</p>
                       <p class="text-xs text-gray-500">{{ timeAgo(alert.timestamp) }}</p>
                    </div>
                  </div>
                </li>
              </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { db } from '@/firebase.js';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Icon } from '@iconify/vue';

// State for thresholds
const thresholds = ref({
  temp_min: null,
  temp_max: null,
  humidity_min: null,
  humidity_max: null,
  rainfall_max: null,
});
const isSaving = ref(false);
const saveStatus = ref('');

// State for alert history
const alertHistory = ref([]);
const isLoadingHistory = ref(true);
let unsubscribeFromAlerts = null;

// --- Thresholds Logic ---
const fetchThresholds = async () => {
  try {
    const docRef = doc(db, 'alerts', 'thresholds');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      thresholds.value = { ...thresholds.value, ...docSnap.data() };
    } else {
      console.log('No threshold document found. Using defaults.');
    }
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    saveStatus.value = 'Error: Could not load settings.';
  }
};

const saveThresholds = async () => {
  isSaving.value = true;
  saveStatus.value = '';
  try {
    const docRef = doc(db, 'alerts', 'thresholds');
    // Using setDoc with merge to avoid overwriting fields not in the form
    await setDoc(docRef, thresholds.value, { merge: true });
    saveStatus.value = 'Settings saved successfully!';
  } catch (error) {
    console.error('Error saving thresholds:', error);
    saveStatus.value = 'Error: Could not save settings.';
  } finally {
    isSaving.value = false;
    setTimeout(() => saveStatus.value = '', 3000); // Clear status after 3 seconds
  }
};

// --- Alert History Logic ---
const listenForAlerts = () => {
  const alertsRef = collection(db, 'alerts_history');
  const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50));

  unsubscribeFromAlerts = onSnapshot(q, (snapshot) => {
    alertHistory.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    isLoadingHistory.value = false;
  }, (error) => {
    console.error("Error listening for alerts:", error);
    isLoadingHistory.value = false;
  });
};

// --- Helpers & Lifecycle ---
const getAlertClass = (type) => {
  switch (type) {
    case 'HIGH_TEMP':
      return { bg: 'bg-red-100', text: 'text-red-600', icon: 'ph:thermometer-hot-bold', title: 'High Temperature' };
    case 'LOW_TEMP':
      return { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'ph:thermometer-cold-bold', title: 'Low Temperature' };
    case 'HIGH_HUMIDITY':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: 'ph:drop-half-bold', title: 'High Humidity' };
    case 'LOW_HUMIDITY':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'ph:drop-half-bottom-bold', title: 'Low Humidity' };
    case 'HEAVY_RAINFALL':
      return { bg: 'bg-cyan-100', text: 'text-cyan-600', icon: 'ph:cloud-rain-bold', title: 'Heavy Rainfall' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'ph:warning-circle-bold', title: 'System Alert' };
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp?.seconds) return '...';
  return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const timeAgo = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const now = new Date();
    const alertTime = new Date(timestamp.seconds * 1000);
    const diffSeconds = Math.round((now - alertTime) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
}

onMounted(() => {
  fetchThresholds();
  listenForAlerts();
});

onUnmounted(() => {
  if (unsubscribeFromAlerts) {
    unsubscribeFromAlerts();
  }
});
</script>
