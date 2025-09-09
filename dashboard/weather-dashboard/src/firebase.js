// src/firebase.js

// 1. Import necessary Firebase functions from their respective SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // <-- ADD THIS IMPORT

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtavnWUJxu5bpcEvv5_WQGEHbhlqYydBM",
  authDomain: "weather-monitoring-syste-3c1ea.firebaseapp.com",
  databaseURL: "https://weather-monitoring-syste-3c1ea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "weather-monitoring-syste-3c1ea",
  storageBucket: "weather-monitoring-syste-3c1ea.firebasestorage.app",
  messagingSenderId: "522088136121",
  appId: "1:522088136121:web:0d4a62ec896bca53170a68",
  measurementId: "G-DZPJWXG5J0"
};

// 2. Initialize Firebase ONCE
const app = initializeApp(firebaseConfig);

// 3. Get references to Firebase services from the single 'app' instance and export them
export const auth = getAuth(app);
export const db = getDatabase(app);
