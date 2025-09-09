// Import the functions you need from the SDKs you need
  import { initializeApp } from "firebase/app";
  import { getAuth } from "firebase/auth"; // <-- ADD THIS LINE

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firebase Authentication and export it for use in other files
  export const auth = getAuth(app); // <-- CHANGE THIS LINE
