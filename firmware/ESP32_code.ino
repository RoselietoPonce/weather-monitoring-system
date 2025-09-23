#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

// --- IMPORTANT: CREDENTIALS MOVED TO SEPARATE FILE ---
// Create a file named "secrets.h" and define your credentials there.
#include "secrets.h"

// --- FIREBASE AUTH USER (create in Firebase Authentication -> Users) ---
#define USER_EMAIL "ponce.rn952@s.msumain.edu.ph" // <-- CHANGE THIS
#define USER_PASSWORD "Norhaina091402"            // <-- CHANGE THIS

// --- SENSOR CONFIGURATION ---
#define DHT_SENSOR_PIN 5
#define DHT_SENSOR_TYPE DHT22
#define RAIN_SENSOR_PIN 36

// --- DEVICE LOCATION ---
#define DEVICE_LATITUDE 7.99795
#define DEVICE_LONGITUDE 124.25324

// --- GLOBAL OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht_sensor(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);

// --- TIMING ---
unsigned long sendDataPrevMillis = 0;
unsigned long dataSendInterval = 3000;

// --- TOKEN STATUS CALLBACK ---
void tokenStatusCallback(TokenInfo info)
{
  if (info.status == token_status_ready)
  {
    Serial.println("Firebase token is ready, streaming data will begin shortly.");
  }
  else
  {
    Serial.printf("Firebase token status: %s\n", info.error.message.c_str());
  }
}

void setup()
{
  Serial.begin(115200);
  dht_sensor.begin();

  // --- CONNECT TO WIFI ---
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // --- NEW: TIME SYNCHRONIZATION (THIS IS THE FIX) ---
  Serial.println("Configuring time...");
  configTime(8 * 3600, 0, "pool.ntp.org"); // GMT+8
  Serial.print("Waiting for time synchronization");

  time_t now = time(nullptr);
  unsigned long start = millis();
  while (now < 24 * 3600 && millis() - start < 10000)
  { // 10-second timeout
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  if (now < 24 * 3600)
  {
    Serial.println("\nFailed to synchronize time!");
  }
  else
  {
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.println("\nCurrent time: " + String(asctime(&timeinfo)));
  }

  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.println("");
  Serial.print("Current time: ");
  Serial.print(asctime(&timeinfo));
  // --- END OF FIX ---

  // --- FIREBASE CONFIG ---
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  // --- SET USER EMAIL/PASSWORD ---
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // --- START FIREBASE ---
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop()
{
  // Use Firebase.ready() which confirms authentication is complete
  if (Firebase.ready() && (millis() - sendDataPrevMillis > dataSendInterval || sendDataPrevMillis == 0))
  {
    sendDataPrevMillis = millis();

    // --- READ SENSORS ---
    float temperature = dht_sensor.readTemperature();
    float humidity = dht_sensor.readHumidity();
    int rainRaw = analogRead(RAIN_SENSOR_PIN);
    int rainPercent = map(rainRaw, 4095, 0, 0, 100);

    if (isnan(temperature) || isnan(humidity))
    {
      Serial.println("Error: Failed to read from DHT sensor!");
      return;
    }

    Serial.println("----------------------------------------");
    Serial.println("Preparing to send data to Firebase...");
    Serial.printf("Temperature: %.2f °C\n", temperature);
    Serial.printf("Humidity: %.2f %%\n", humidity);
    Serial.printf("Rainfall Level: %d %%\n", rainPercent);

    // --- JSON DATA ---
    FirebaseJson jsonData;
    jsonData.set("temperature", temperature);
    jsonData.set("humidity", humidity);
    jsonData.set("rainfall", rainPercent);
    jsonData.set("timestamp/.sv", "timestamp");
    jsonData.set("location/lat", DEVICE_LATITUDE);
    jsonData.set("location/lng", DEVICE_LONGITUDE);

    // --- PUSH TO HISTORY ---
    String historyPath = "/sensor_logs";
    if (Firebase.RTDB.pushJSON(&fbdo, historyPath, &jsonData))
    {
      Serial.println("SUCCESS: Historical data pushed to Firebase.");
    }
    else
    {
      Serial.println("FAILED: Could not push historical data. REASON: " + fbdo.errorReason());
    }

    // --- UPDATE LATEST DATA ---
    String latestPath = "/sensor_data/latest";
    if (Firebase.RTDB.setJSON(&fbdo, latestPath, &jsonData))
    {
      Serial.println("SUCCESS: Latest data updated in Firebase.");
    }
    else
    {
      Serial.println("FAILED: Could not update latest data. REASON: " + fbdo.errorReason());
    }

    Serial.println("----------------------------------------");
  }
}