// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCtavnWUJxu5bpcEvv5_WQGEHbhlqYydBM',
  authDomain: 'weather-monitoring-syste-3c1ea.firebaseapp.com',
  databaseURL:
    'https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'weather-monitoring-syste-3c1ea',
  storageBucket: 'weather-monitoring-syste-3c1ea.firebasestorage.app',
  messagingSenderId: '522088136121',
  appId: '1:522088136121:web:0d4a62ec896bca53170a68',
  measurementId: 'G-DZPJWXG5J0',
}

const app = initializeApp(firebaseConfig)

// --- Definitive Exports ---
export const auth = getAuth(app)
// 'db' is ALWAYS Firestore (for Alerts, Profiles)
export const db = getFirestore(app)
// 'rtdb' is ALWAYS the Realtime Database (for sensor data)
export const rtdb = getDatabase(app)
