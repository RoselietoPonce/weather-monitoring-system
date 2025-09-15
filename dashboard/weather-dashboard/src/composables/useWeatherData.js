  // src/composables/useWeatherData.js
  import { ref, readonly } from 'vue';
  import { rtdb } from '@/firebase.js';
  import { ref as dbRef, query, orderByChild, limitToLast, onValue } from 'firebase/database';

  // --- Module-level state ---
  // These are created only ONCE and shared by the entire application.
  const latestData = ref(null);
  const isLoading = ref(true);
  const error = ref(null);

  // --- Connection Logic ---
  // This function will only run ONCE in the entire application's lifecycle.
  const connect = () => {
    console.log("Establishing permanent connection to Firebase Realtime Database...");
    try {
      const sensorLogsQuery = query(dbRef(rtdb, 'sensor_logs'), orderByChild('timestamp'), limitToLast(1));

      onValue(sensorLogsQuery, (snapshot) => {
        if (snapshot.exists()) {
          latestData.value = Object.values(snapshot.val())[0];
          error.value = null; // Clear previous errors on successful fetch
        } else {
          error.value = "No sensor data available in the database.";
        }
        isLoading.value = false; // Set loading to false after the first data arrives
      }, (err) => {
        console.error("Firebase connection error:", err);
        error.value = "Failed to connect to the data source.";
        isLoading.value = false;
      });
    } catch (err) {
      console.error("Critical error setting up Firebase listener:", err);
      error.value = "An unexpected error occurred.";
      isLoading.value = false;
    }
  };

  // --- Initialize the connection ---
  // This line runs automatically the very first time any component imports this file.
  connect();

  /**
   * A robust, singleton Vue Composable that provides a persistent,
   * real-time weather data stream for the entire application.
   */
  export function useWeatherData() {
    // Every component that calls this function gets access to the SAME set of reactive variables.
    // We use readonly to prevent components from accidentally modifying the shared state.
    return {
      latestData: readonly(latestData),
      isLoading: readonly(isLoading),
      error: readonly(error),
    };
  }
