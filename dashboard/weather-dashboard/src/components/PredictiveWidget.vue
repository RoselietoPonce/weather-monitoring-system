<template>
  <div class="p-4 bg-surface rounded-lg shadow-sm">
    <h3 class="text-lg font-semibold mb-3">Predictive Insight (TF.js)</h3>

    <div class="space-y-3">
      <div class="text-sm text-text-light">
        This trains a small model locally (browser). Model is stored in IndexedDB and also uploaded
        to Firebase Storage.
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          @click="trainModel"
          :disabled="isTraining || isFetching"
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        >
          {{ isTraining ? 'Training...' : 'Train model' }}
        </button>

        <button
          @click="loadModel"
          :disabled="isTraining || isFetching"
          class="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-60"
        >
          Load saved model
        </button>

        <button
          @click="loadFromFirebase"
          :disabled="isTraining || isFetching"
          class="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-60"
        >
          Load from Firebase
        </button>

        <button
          @click="predictNow"
          :disabled="!modelLoaded || isFetching"
          class="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
        >
          Predict
        </button>

        <button
          @click="clearSavedModel"
          :disabled="isTraining || isFetching"
          class="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-60"
        >
          Clear saved model
        </button>
      </div>

      <div class="mt-4">
        <div v-if="isFetching" class="text-sm text-text-light">Fetching logs...</div>

        <div v-else>
          <div class="text-sm">
            Training examples: <strong>{{ examplesCount }}</strong>
          </div>

          <div v-if="trainingInfo" class="mt-2 text-sm text-text-light">
            Last training: loss={{ trainingInfo.loss.toFixed(4) }}, acc={{
              trainingInfo.acc !== null ? (trainingInfo.acc * 100).toFixed(1) + '%' : 'n/a'
            }}
          </div>

          <div v-if="prediction">
            <div class="mt-3 p-3 border rounded">
              <div class="font-medium">Prediction for tomorrow</div>
              <div class="mt-1">
                Probability of rain: <strong>{{ (prediction.prob * 100).toFixed(1) }}%</strong>
              </div>
              <div class="mt-1">
                Likelihood: <strong>{{ prediction.label }}</strong>
              </div>
              <div class="mt-1 text-xs text-text-light">
                Based on avgTemp, avgHumidity, totalRain (past day)
              </div>
            </div>
          </div>
          <div v-else class="mt-3 text-sm text-text-light">No prediction yet.</div>

          <div v-if="publishedSuccess" class="mt-2 text-sm text-green-500">
            ✅ Insight published successfully!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as tf from '@tensorflow/tfjs'
import { rtdb, storage } from '@/firebase.js'
import {
  ref as dbRef,
  query,
  orderByChild,
  startAt,
  get,
  set,
  serverTimestamp,
} from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// reactive state
const isFetching = ref(false)
const isTraining = ref(false)
const modelLoaded = ref(false)
const examplesCount = ref(0)
const trainingInfo = ref(null)
const prediction = ref(null)
const publishedSuccess = ref(false)
let model = null

// hyperparams
const RAIN_THRESHOLD = 1.0
const TRAIN_EPOCHS = 30
const BATCH_SIZE = 8

// --- fetch logs ---
async function fetchLogs(days = 14) {
  isFetching.value = true
  try {
    const now = Date.now()
    const startTs = now - days * 24 * 60 * 60 * 1000
    const logsRef = dbRef(rtdb, 'sensor_logs')
    const q = query(logsRef, orderByChild('timestamp'), startAt(startTs))
    const snap = await get(q)
    const data = snap.exists() ? Object.values(snap.val()) : []
    return data.map((r) => ({
      timestamp: Number(r.timestamp),
      temperature: Number(r.temperature || 0),
      humidity: Number(r.humidity || 0),
      rainfall: Number(r.rainfall || 0),
    }))
  } catch (err) {
    console.error('fetchLogs error', err)
    return []
  } finally {
    isFetching.value = false
  }
}

// --- prepare features ---
function prepareDailyExamples(logs) {
  const byDate = {}
  logs.forEach((row) => {
    const d = new Date(Number(row.timestamp))
    const key = d.toISOString().split('T')[0]
    if (!byDate[key]) byDate[key] = { temps: [], hums: [], rains: [] }
    byDate[key].temps.push(row.temperature)
    byDate[key].hums.push(row.humidity)
    byDate[key].rains.push(row.rainfall)
  })

  const dates = Object.keys(byDate).sort()
  const features = []
  const labels = []

  for (let i = 0; i < dates.length - 1; i++) {
    const d = dates[i]
    const next = dates[i + 1]
    const group = byDate[d]
    const nextGroup = byDate[next]

    const avgTemp = group.temps.reduce((a, b) => a + b, 0) / group.temps.length
    const avgHum = group.hums.reduce((a, b) => a + b, 0) / group.hums.length
    const totalRain = group.rains.reduce((a, b) => a + b, 0)

    const label = nextGroup.rains.reduce((a, b) => a + b, 0) > RAIN_THRESHOLD ? 1 : 0

    features.push([avgTemp, avgHum, totalRain])
    labels.push(label)
  }

  return { features, labels }
}

// --- build model ---
function createModel(inputDim = 3) {
  const m = tf.sequential()
  m.add(tf.layers.dense({ inputShape: [inputDim], units: 16, activation: 'relu' }))
  m.add(tf.layers.dropout({ rate: 0.2 }))
  m.add(tf.layers.dense({ units: 8, activation: 'relu' }))
  m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
  m.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  })
  return m
}

// --- train model ---
async function trainModel() {
  isTraining.value = true
  trainingInfo.value = null
  prediction.value = null

  try {
    const logs = await fetchLogs(21)
    const { features, labels } = prepareDailyExamples(logs)
    examplesCount.value = features.length

    if (features.length < 5) {
      alert('Not enough historical examples to train.')
      return
    }

    const x = tf.tensor2d(features)
    const y = tf.tensor2d(labels, [labels.length, 1])
    model = createModel(x.shape[1])

    const { mean, variance } = tf.moments(x, 0)
    const std = tf.sqrt(variance).add(tf.scalar(1e-6))
    model._norm = { mean: await mean.array(), std: await std.array() }

    const normX = x.sub(mean).div(std)

    await model.fit(normX, y, {
      epochs: TRAIN_EPOCHS,
      batchSize: Math.min(BATCH_SIZE, features.length),
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 5 === 0 || epoch === TRAIN_EPOCHS - 1) {
            trainingInfo.value = { loss: logs.loss, acc: logs.acc ?? null }
          }
        },
      },
    })

    try {
      // save locally
      await model.save('indexeddb://weather-model')
      localStorage.setItem('weather-model-norm', JSON.stringify(model._norm))
      modelLoaded.value = true
      console.log('Model saved to IndexedDB')

      // save to Firebase
      const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => artifacts))

      // 1. Create and upload correct model.json
      const modelJsonPayload = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest: [
          {
            paths: ['./weights.bin'],
            weights: modelArtifacts.weightSpecs,
          },
        ],
      }
      const modelJsonBlob = new Blob([JSON.stringify(modelJsonPayload)], {
        type: 'application/json',
      })
      await uploadBytes(storageRef(storage, 'models/model.json'), modelJsonBlob)
      console.log('✅ Model.json uploaded')

      // 2. Upload weights.bin
      if (modelArtifacts.weightData) {
        const weightsBlob = new Blob([modelArtifacts.weightData], {
          type: 'application/octet-stream',
        })
        await uploadBytes(storageRef(storage, 'models/weights.bin'), weightsBlob)
        console.log('✅ Weights uploaded')
      }

      // 3. Upload normalization data
      const normData = JSON.stringify(model._norm)
      const normBlob = new Blob([normData], { type: 'application/json' })
      await uploadBytes(storageRef(storage, 'models/norm.json'), normBlob)
      console.log('✅ Normalization data uploaded')
    } catch (err) {
      console.warn('Save error', err)
    }

    x.dispose()
    y.dispose()
    normX.dispose()
    mean.dispose()
    std.dispose()
  } finally {
    isTraining.value = false
  }
}

// --- load local model ---
async function loadModel() {
  try {
    isFetching.value = true
    model = await tf.loadLayersModel('indexeddb://weather-model')
    const normData = localStorage.getItem('weather-model-norm')
    if (normData) {
      model._norm = JSON.parse(normData)
    }
    modelLoaded.value = true
    console.log('Loaded model from IndexedDB')
  } catch (err) {
    console.error('Load model failed', err)
    alert('No saved model found.')
  } finally {
    isFetching.value = false
  }
}

// --- load from Firebase ---
async function loadFromFirebase() {
  try {
    isFetching.value = true
    const modelUrl = await getDownloadURL(storageRef(storage, 'models/model.json'))
    const normUrl = await getDownloadURL(storageRef(storage, 'models/norm.json'))

    model = await tf.loadLayersModel(modelUrl)

    const normResponse = await fetch(normUrl)
    model._norm = await normResponse.json()

    modelLoaded.value = true
    console.log('✅ Model and normalization data loaded from Firebase Storage')
  } catch (err) {
    console.error('loadFromFirebase error', err)
    alert('No model found in Firebase Storage.')
  } finally {
    isFetching.value = false
  }
}

// --- clear model ---
async function clearSavedModel() {
  try {
    await tf.io.removeModel('indexeddb://weather-model')
    localStorage.removeItem('weather-model-norm')
    model = null
    modelLoaded.value = false
    trainingInfo.value = null
    prediction.value = null
    alert('Saved model cleared locally.')
  } catch (err) {
    console.error('clearSavedModel', err)
  }
}

// --- update insight in RTDB ---
async function updateInsightInRtdb(predictionData) {
  if (!predictionData) return
  try {
    const insightRef = dbRef(rtdb, 'insights/daily_prediction')
    const message = `There's a ${predictionData.label} likelihood of rain tomorrow, with a probability of ${(predictionData.prob * 100).toFixed(0)}%.`
    await set(insightRef, {
      likelihood: predictionData.label,
      message: message,
      probability: predictionData.prob,
      updatedAt: serverTimestamp(),
    })
    console.log('✅ Predictive insight updated in Realtime Database.')
    publishedSuccess.value = true
    setTimeout(() => {
      publishedSuccess.value = false
    }, 4000)
  } catch (error) {
    console.error('Failed to update insight in RTDB:', error)
    alert('Failed to update global insight.')
  }
}

// --- prediction ---
async function predictNow() {
  if (!model) {
    alert('No model loaded. Train or load a model first.')
    return
  }
  isFetching.value = true
  publishedSuccess.value = false // reset on new prediction
  try {
    const now = Date.now()
    const yday = now - 24 * 60 * 60 * 1000
    const logs = await fetchLogs(2)
    const recent = logs.filter((r) => r.timestamp >= yday)
    if (!recent.length) {
      alert('No recent logs in the last 24 hours.')
      return
    }
    const avgTemp = recent.reduce((a, b) => a + b.temperature, 0) / recent.length
    const avgHum = recent.reduce((a, b) => a + b.humidity, 0) / recent.length
    const totalRain = recent.reduce((a, b) => a + b.rainfall, 0)

    let input = tf.tensor2d([[avgTemp, avgHum, totalRain]])

    if (model._norm && model._norm.mean && model._norm.std) {
      const mean = tf.tensor1d(model._norm.mean)
      const std = tf.tensor1d(model._norm.std).add(tf.scalar(1e-6))
      input = input.sub(mean).div(std)
      mean.dispose()
      std.dispose()
    }

    const out = model.predict(input)
    const prob = (await out.data())[0]
    input.dispose()
    out.dispose()

    const label = prob > 0.6 ? 'high' : prob > 0.3 ? 'moderate' : 'low'
    prediction.value = { prob, label, details: { avgTemp, avgHum, totalRain } }

    // publish to RTDB
    await updateInsightInRtdb(prediction.value)
  } catch (err) {
    console.error('predictNow error', err)
    alert('Prediction failed: ' + (err.message || err))
  } finally {
    isFetching.value = false
  }
}

// --- auto-load local model ---
;(async () => {
  try {
    model = await tf.loadLayersModel('indexeddb://weather-model')
    const normData = localStorage.getItem('weather-model-norm')
    if (normData) {
      model._norm = JSON.parse(normData)
    }
    modelLoaded.value = true
    console.log('Auto-loaded model from IndexedDB')
  } catch {
    model = null
    modelLoaded.value = false
    console.log('No local model found')
  } finally {
    isFetching.value = false
  }
})()
</script>

<style scoped>
.bg-surface {
  background: var(--color-surface);
}
.text-text-light {
  color: var(--color-text-light);
}
.text-text-main {
  color: var(--color-text-main);
}
</style>
