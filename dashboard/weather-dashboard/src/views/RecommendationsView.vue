<template>
  <div class="p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-text-main tracking-tight">Recommendations</h1>
        <p class="text-text-light mt-2">
          Generate actionable insights based on the latest weather data.
        </p>
      </div>

      <!-- Control and Current Data Panel -->
      <div class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 mb-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <!-- Left: Data -->
          <div class="flex-1">
            <h2 class="text-xl font-bold text-text-main">Analysis Input</h2>
            <p class="text-text-light mt-1">
              Using the latest sensor readings to generate insights:
            </p>

            <!-- Current Data Display -->
            <div v-if="isDataLoading" class="mt-4 text-text-light">Fetching latest data...</div>
            <div v-else-if="latestData" class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <Icon icon="ph:thermometer-bold" class="h-5 w-5 text-red-500" />
                <span class="text-text-main">
                  Temp: <strong>{{ latestData.temperature.toFixed(1) }}°C</strong>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:drop-bold" class="h-5 w-5 text-blue-500" />
                <span class="text-text-main">
                  Humidity: <strong>{{ latestData.humidity.toFixed(0) }}%</strong>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="ph:cloud-rain-bold" class="h-5 w-5 text-cyan-500" />
                <span class="text-text-main">
                  Rainfall: <strong>{{ latestData.rainfall.toFixed(1) }} mm</strong>
                </span>
              </div>
            </div>
            <div v-else class="mt-4 text-red-500">Could not load latest data.</div>
          </div>

          <!-- Right: Button -->
          <button
            @click="handleGenerate"
            :disabled="isGenerating || isDataLoading || !latestData"
            class="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Icon icon="ph:sparkle-bold" class="h-5 w-5 mr-2" />
            {{ isGenerating ? 'Analyzing...' : 'Generate' }}
          </button>
        </div>
      </div>

      <!-- Recommendations Display Area -->
      <div>
        <!-- Loading Skeleton -->
        <div v-if="isGenerating" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="n in 2"
            :key="n"
            class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6 animate-pulse"
          >
            <div class="flex items-center mb-3">
              <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div class="ml-4 h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-full"></div>
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 w-5/6"></div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-else-if="generationError"
          class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg p-6 text-center"
        >
          <h3 class="font-bold text-lg">Analysis Failed</h3>
          <p>{{ generationError }}</p>
          <button
            @click="handleGenerate"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>

        <!-- Recommendations List -->
        <div
          v-else-if="recommendations.length"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div
            v-for="(rec, index) in recommendations"
            :key="index"
            class="bg-surface dark:bg-dark-surface rounded-2xl shadow-md p-6"
          >
            <div class="flex items-center mb-3">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                :class="getIconDetails(rec.category).bg"
              >
                <Icon
                  :icon="getIconDetails(rec.category).icon"
                  class="h-6 w-6"
                  :class="getIconDetails(rec.category).text"
                />
              </div>
              <h3 class="ml-4 text-xl font-bold text-text-main">
                {{ rec.category }}
              </h3>
            </div>
            <p class="text-text-light leading-relaxed">
              {{ rec.recommendation }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { rtdb } from '@/firebase.js'
import { query, ref as dbRef, orderByChild, get, startAt } from 'firebase/database'
import { Icon } from '@iconify/vue'
import { useWeatherData } from '@/composables/useWeatherData.js'

// --- CONFIGURATION ---
const GEMINI_API_KEY = 'AIzaSyD0qDNzCaAvWc0skFlIZftZjYvBw1pUSeA'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const props = defineProps({
  deviceAddress: { type: String, default: 'Philippines' },
})

const { latestData, isLoading: isDataLoading } = useWeatherData()

const historicalSummary = ref(null)
const recommendations = ref([])
const isGenerating = ref(false)
const generationError = ref(null)

// --- Fetch historical rainfall data ---
const fetchHistoricalData = async () => {
  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const historicalQuery = query(
      dbRef(rtdb, 'sensor_logs'),
      orderByChild('timestamp'),
      startAt(oneDayAgo),
    )
    const historicalSnapshot = await get(historicalQuery)

    let totalRainfall = 0
    if (historicalSnapshot.exists()) {
      Object.values(historicalSnapshot.val()).forEach((log) => {
        if (log.rainfall != null) totalRainfall += log.rainfall
      })
    }
    historicalSummary.value = { totalRainfall24h: totalRainfall }
    return true
  } catch (err) {
    console.error('Error fetching historical data:', err)
    generationError.value = 'Could not fetch historical data for analysis.'
    return false
  }
}

// --- Gemini API Call ---
const generateAIAssistantResponse = async (prompt) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY') {
    throw new Error('Gemini API key is not set. Please add it in the script.')
  }

  const payload = { contents: [{ parts: [{ text: prompt }] }] }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetails = `API request failed with status ${response.status}.`
    try {
      const errorBody = await response.json()
      console.error('Gemini API Error:', errorBody)
      errorDetails += ` Details: ${errorBody.error?.message || JSON.stringify(errorBody)}`
    } catch {
      errorDetails += ' Could not parse error response.'
    }
    throw new Error(errorDetails)
  }

  const data = await response.json()
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini API response format')
  }
  return data.candidates[0].content.parts[0].text
}

// --- Generate recommendations ---
const handleGenerate = async () => {
  if (!latestData.value) {
    generationError.value = 'Cannot generate insights without current data.'
    return
  }

  isGenerating.value = true
  recommendations.value = []
  generationError.value = null

  const historicalDataFetched = await fetchHistoricalData()
  if (!historicalDataFetched) {
    isGenerating.value = false
    return
  }

  try {
    const currentDate = new Date()
    const month = currentDate.toLocaleString('en-US', { month: 'long' })

    const prompt = `
      Persona: You are a senior agricultural and disaster-preparedness advisor from PAGASA.
      Context:
      - Location: ${props.deviceAddress}
      - Date: ${currentDate.toDateString()} (The current month is ${month}, peak typhoon season).
      - Current Weather:
        - Temperature: ${latestData.value.temperature.toFixed(1)}°C
        - Humidity: ${latestData.value.humidity.toFixed(0)}%
        - Recent Rainfall: ${latestData.value.rainfall.toFixed(1)} mm
      - 24-Hour History:
        - Total Rainfall: ${historicalSummary.value?.totalRainfall24h.toFixed(1) || 0} mm

      Task: Generate exactly three actionable recommendations.
      Instructions:
      1. Categorize each as "Crop Management", "Health & Safety", or "Typhoon Preparedness".
      2. Provide expert rationale referencing the data.
      3. Format: Valid JSON array of { "category": string, "recommendation": string }.
    `

    const rawResponse = await generateAIAssistantResponse(prompt)

    // Clean response
    const cleanedResponse = rawResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    recommendations.value = JSON.parse(cleanedResponse)
  } catch (err) {
    console.error('Error generating recommendations:', err)
    generationError.value = `An error occurred: ${err.message}`
  } finally {
    isGenerating.value = false
  }
}

// --- Category Icons ---
const getIconDetails = (category) => {
  switch (category) {
    case 'Typhoon Preparedness':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-600 dark:text-blue-300',
        icon: 'ph:wind-bold',
      }
    case 'Crop Management':
      return {
        bg: 'bg-green-100 dark:bg-green-900/40',
        text: 'text-green-600 dark:text-green-300',
        icon: 'ph:plant-bold',
      }
    case 'Health & Safety':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/40',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: 'ph:first-aid-kit-bold',
      }
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-300',
        icon: 'ph:info-bold',
      }
  }
}
</script>
