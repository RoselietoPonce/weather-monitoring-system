import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './firebase.js'
import '@/user.js'
import './assets/main.css'
import 'leaflet/dist/leaflet.css'
import './utils/leaflet-fix.js' // Apply Leaflet icon path fix
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)

app.use(router)
app.use(VueApexCharts)

app.mount('#app')
