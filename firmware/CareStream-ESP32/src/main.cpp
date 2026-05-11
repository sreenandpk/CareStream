#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

// --- CLINICAL IDENTITY ---
const char *deviceSerial = "ESP32-DEV-01";
const char *deviceKey = "3IVHcMS33is8VbU7yf_A9Dqpv4GGVOXeRhXX8E-aYqs"; 
const char *serverUrl = "http://172.20.10.5:8000/api/vitals/device/ingest/";

// --- NETWORK SETTINGS ---
const char *ssid = "Sreenand";     
const char *password = "00000000"; 

MAX30105 particleSensor;

// --- SIGNAL PROCESSING BUFFERS ---
const byte RATE_SIZE = 4; 
byte rates[RATE_SIZE]; 
byte rateSpot = 0;
long lastBeat = 0; 
int beatAvg = 0;

// SpO2 Estimation Vars
float dcRed = 0;
float dcIr = 0;
float acRed = 0;
float acIr = 0;
int spo2Avg = 0;
const byte SPO2_SIZE = 4;
int spo2History[SPO2_SIZE];
byte spo2Spot = 0;

// Timing
unsigned long lastSendTime = 0;
unsigned long lastWifiCheck = 0;
unsigned long lastSignalTime = 0;

// Manual Pulse Tracking
long lastIrValue = 0;
long peakThreshold = 350; 

// --- CONNECTIVITY LOGIC ---
void checkWiFi() {
    if (WiFi.status() != WL_CONNECTED && (millis() - lastWifiCheck > 5000)) {
        Serial.println("📡 WiFi Lost. Reconnecting...");
        WiFi.disconnect();
        WiFi.begin(ssid, password);
        lastWifiCheck = millis();
    }
}

// --- CLINICAL SIGNAL ACQUISITION STATES ---
// Decouples Hardware State from Patient Physiology
String getSignalState(long irValue) {
    if (irValue < 20000) return "LOST";      // Probe removed
    if (irValue > 180000) return "SATURATED"; // Signal clipping
    if (beatAvg == 0) return "WEAK";         // Searching for pulse
    return "GOOD";                           // Valid acquisition
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
        Serial.println("CRITICAL: MAX30102 not found!");
        while (1);
    }

    // Clinical Mode: Red + IR, 100Hz
    particleSensor.setup(45, 1, 2, 100, 411, 16384);
}

void loop() {
    checkWiFi();

    long irValue = particleSensor.getIR();
    long redValue = particleSensor.getRed();

    // 🩺 ACQUISITION LOGIC
    if (irValue > 25000) {
        lastSignalTime = millis();
        long deltaSignal = irValue - lastIrValue;
        lastIrValue = irValue;

        // Detect Pulse Surge
        if (deltaSignal > peakThreshold && (millis() - lastBeat > 500)) {
            Serial.println("💓 PULSE SURGE");
            long deltaT = millis() - lastBeat;
            lastBeat = millis();

            float currentBPM = 60 / (deltaT / 1000.0);
            if (currentBPM < 200 && currentBPM > 40) {
                rates[rateSpot++] = (byte)currentBPM;
                rateSpot %= RATE_SIZE;
                
                long sum = 0; int count = 0;
                for (byte x = 0; x < RATE_SIZE; x++) {
                    if (rates[x] > 0) { sum += rates[x]; count++; }
                }
                if (count > 0) beatAvg = sum / count;
            }
        }

        // 🩸 SpO2 Logic
        dcRed = (dcRed * 0.98) + (redValue * 0.02);
        dcIr = (dcIr * 0.98) + (irValue * 0.02);
        float currentAcRed = abs(redValue - dcRed);
        float currentAcIr = abs(irValue - dcIr);
        acRed = (acRed * 0.95) + (currentAcRed * 0.05);
        acIr = (acIr * 0.95) + (currentAcIr * 0.05);

        if (acIr > 20 && dcIr > 0) {
            float R = (acRed / dcRed) / (acIr / dcIr);
            int currentSpo2 = 104 - (17 * R);
            if (currentSpo2 > 70 && currentSpo2 <= 100) {
                spo2History[spo2Spot++] = currentSpo2;
                spo2Spot %= SPO2_SIZE;
                long sSum = 0; int sCount = 0;
                for (byte x = 0; x < SPO2_SIZE; x++) {
                    if (spo2History[x] > 0) { sSum += spo2History[x]; sCount++; }
                }
                if (sCount > 0) spo2Avg = sSum / sCount;
            }
        }
    } else if (millis() - lastSignalTime > 1500) {
        // Patient "Persistence" logic: reset history only after 1.5s of zero signal
        beatAvg = 0; spo2Avg = 0;
        for(int i=0; i<RATE_SIZE; i++) rates[i]=0;
        for(int i=0; i<SPO2_SIZE; i++) spo2History[i]=0;
    }

    // 🚀 PROFESSIONAL TELEMETRY PACKAGING (2Hz)
    if (millis() - lastSendTime > 500) {
        lastSendTime = millis();
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(serverUrl);
            http.addHeader("Content-Type", "application/json");
            http.addHeader("X-DEVICE-KEY", deviceKey);

            StaticJsonDocument<512> doc;
            doc["serial_number"] = deviceSerial;
            
            String sigState = getSignalState(irValue);
            doc["signal_state"] = sigState;

            // ⚠️ CLINICAL DIFFERENTIATION
            if (sigState == "LOST") {
                doc["heart_rate"] = nullptr;
                doc["spo2"] = nullptr;
            } else {
                if (beatAvg > 0) doc["heart_rate"] = beatAvg;
                else doc["heart_rate"] = nullptr;
                
                if (spo2Avg > 0) doc["spo2"] = spo2Avg;
                else doc["spo2"] = nullptr;
            }

            doc["rssi"] = WiFi.RSSI();
            doc["uptime"] = millis() / 1000;

            String body;
            serializeJson(doc, body);
            http.POST(body);
            http.end();
            
            Serial.printf("ACQUISITION: %s | HR: %d | SpO2: %d\n", 
                          sigState.c_str(), beatAvg, spo2Avg);
        }
    }
    delay(10); 
}
