<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
} from "@vue-leaflet/vue-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const props = defineProps({
  mapCenter: {
    type: Array,
    required: true
  },
  markerLatLng: {
    type: Array,
    required: true
  },
  deviceAddress: {
    type: String,
    required: true
  },
  temperature: {
    type: [String, Number],
    required: true
  },
  humidity: {
    type: [String, Number],
    required: true
  },
  rainfall: {
    type: [String, Number],
    required: true
  }
});

const mapConfig = {
  zoom: 15,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  popupOptions: {
    closeOnClick: false,
    autoClose: false,
    className: 'custom-popup'
  }
};

const mapZoom = ref(mapConfig.zoom);
const isMapLoading = ref(true);
const mapError = ref(null);

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
</script>

<template>
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
</template>

<style scoped>
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