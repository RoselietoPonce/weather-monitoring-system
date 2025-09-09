#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

// --- IMPORTANT: CREDENTIALS MOVED TO SEPARATE FILE ---
// Create a file named "secrets.h" and define your credentials there.
#include "secrets.h"

// --- SENSOR AND PIN CONFIGURATION ---
#define DHT_SENSOR_PIN 5
#define DHT_SENSOR_TYPE DHT22
#define RAIN_SENSOR_PIN 36

// --- GLOBAL OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht_sensor(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);

// --- TIMING & STATE VARIABLES ---
unsigned long sendDataPrevMillis = 0;
// Let's send data every 10 seconds for now. You can increase this later.
unsigned long dataSendInterval = 3000;
bool signupOK = false;

// This is the missing callback function. It runs when Firebase token status changes.
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

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // This was the missing function
  config.token_status_callback = tokenStatusCallback;

  if (Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("Firebase anonymous sign-up OK");
    signupOK = true;
  }
  else
  {
    Serial.printf("Sign-up error: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop()
{
  // Check if Firebase is ready and if it's time to send data
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > dataSendInterval || sendDataPrevMillis == 0))
  {
    sendDataPrevMillis = millis();

    // --- 1. READ SENSOR DATA ---
    float temperature = dht_sensor.readTemperature();
    float humidity = dht_sensor.readHumidity();
    int rainRaw = analogRead(RAIN_SENSOR_PIN);
    // Your mapping is correct: lower raw value = more rain = higher percentage
    int rainPercent = map(rainRaw, 4095, 0, 0, 100);

    // --- 2. VALIDATE SENSOR DATA ---
    if (isnan(temperature) || isnan(humidity))
    {
      Serial.println("Error: Failed to read from DHT sensor!");
      return; // Exit this loop iteration if sensor fails
    }

    Serial.println("----------------------------------------");
    Serial.println("Preparing to send data to Firebase...");
    Serial.printf("Temperature: %.2f °C\n", temperature);
    Serial.printf("Humidity: %.2f %%\n", humidity);
    Serial.printf("Rainfall Level: %d %%\n", rainPercent);

    // --- 3. PREPARE DATA AS A JSON OBJECT ---
    FirebaseJson jsonData;
    jsonData.set("temperature", temperature);
    jsonData.set("humidity", humidity);
    jsonData.set("rainfall", rainPercent);
    // This special value tells Firebase to use its own server time as the timestamp.
    jsonData.set("timestamp/.sv", "timestamp");

    // --- 4. PUSH THE JSON OBJECT TO FIREBASE (FOR HISTORICAL LOGS) ---
    String historyPath = "/sensor_logs";
    if (Firebase.RTDB.pushJSON(&fbdo, historyPath, &jsonData))
    {
      Serial.println("SUCCESS: Historical data pushed to Firebase.");
      Serial.print("  > New log created with unique key: ");
      Serial.println(fbdo.pushName());
    }
    else
    {
      Serial.println("FAILED: Could not push historical data.");
      Serial.println("  > REASON: " + fbdo.errorReason());
    }

    // --- 5. SET THE JSON OBJECT TO THE 'LATEST' PATH (FOR THE DASHBOARD) ---
    // This is the key change. We use 'set' to overwrite the data at a fixed path.
    // Your Vue.js app is listening for this specific path!
    String latestPath = "/sensor_data/latest";
    if (Firebase.RTDB.setJSON(&fbdo, latestPath, &jsonData))
    {
      Serial.println("SUCCESS: Latest data updated in Firebase.");
    }
    else
    {
      Serial.println("FAILED: Could not update latest data.");
      Serial.println("  > REASON: " + fbdo.errorReason());
    }

    Serial.println("----------------------------------------");
  }
}