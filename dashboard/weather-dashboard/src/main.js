import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './firebase.js'
import '@/user.js'
import './assets/main.css'
import "leaflet/dist/leaflet.css"
import L from 'leaflet'
import VueApexCharts from 'vue3-apexcharts'; // Import the library

// Fix Leaflet marker icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('../node_modules/leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('../node_modules/leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('../node_modules/leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const app = createApp(App)

app.use(router)
app.use(VueApexCharts); // Register the component globally

app.mount('#app')
