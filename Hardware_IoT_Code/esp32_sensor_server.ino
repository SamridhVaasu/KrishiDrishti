#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "ONE PLUS 7T PRO";
const char* password = "goforit200";

// Pin definitions
#define DHTPIN 4        // DHT11 data pin
#define DHTTYPE DHT11   // DHT11 sensor type
#define MOISTURE_PIN 34 // Soil moisture sensor analog pin

// Initialize DHT sensor
DHT dht(DHTPIN, DHTTYPE);

// Initialize web server
WebServer server(80);

// Global variables for sensor readings
struct SensorData {
  float temperature = 0;
  float humidity = 0;
  float moisture = 0;
  unsigned long lastDHTRead = 0;
  bool isValid = false;
};

SensorData sensorData;
const unsigned long DHT_READ_INTERVAL = 2000; // Read DHT every 2 seconds

// Function to read DHT sensor
bool readDHTSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (!isnan(h) && !isnan(t)) {
    sensorData.humidity = h;
    sensorData.temperature = t;
    return true;
  }
  return false;
}

// Function to read moisture sensor
float readMoistureSensor() {
  int rawValue = analogRead(MOISTURE_PIN);
  // Convert to percentage (0-100%)
  float percentage = (100 - ((rawValue / 4095.0) * 100));
  // Constrain values to valid range
  return constrain(percentage, 0, 100);
}

// Function to update all sensor readings
void updateSensorReadings() {
  unsigned long currentMillis = millis();
  
  // Update DHT readings every DHT_READ_INTERVAL
  if (currentMillis - sensorData.lastDHTRead >= DHT_READ_INTERVAL) {
    if (readDHTSensor()) {
      sensorData.lastDHTRead = currentMillis;
      sensorData.isValid = true;
    }
  }
  
  // Update moisture reading
  sensorData.moisture = readMoistureSensor();
}

// Function to print WiFi status
void printWiFiStatus() {
  Serial.println("\n=== WiFi Status ===");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Gateway IP: ");
  Serial.println(WiFi.gatewayIP());
  Serial.print("Subnet Mask: ");
  Serial.println(WiFi.subnetMask());
  Serial.print("Signal Strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());
  Serial.println("Network Status: ");
  switch (WiFi.status()) {
    case WL_CONNECTED:
      Serial.println("Connected");
      break;
    case WL_NO_SHIELD:
      Serial.println("No WiFi shield");
      break;
    case WL_IDLE_STATUS:
      Serial.println("Idle");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("No SSID available");
      break;
    case WL_SCAN_COMPLETED:
      Serial.println("Scan completed");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("Connection failed");
      break;
    case WL_CONNECTION_LOST:
      Serial.println("Connection lost");
      break;
    case WL_DISCONNECTED:
      Serial.println("Disconnected");
      break;
    default:
      Serial.println("Unknown status");
  }
  Serial.println("================");
}

// Handle CORS preflight requests
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.send(204);
}

// Handle ping requests
void handlePing() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "pong");
}

// Handle sensor data requests
void handleData() {
  // Add CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  
  // Handle preflight request
  if (server.method() == HTTP_OPTIONS) {
    server.send(204);
    return;
  }
  
  // Update sensor readings
  updateSensorReadings();
  
  // Check if we have valid readings
  if (!sensorData.isValid) {
    server.send(500, "application/json", "{\"error\":\"No valid sensor data available\"}");
    return;
  }
  
  // Create JSON response
  StaticJsonDocument<200> doc;
  doc["temperature"] = sensorData.temperature;
  doc["humidity"] = sensorData.humidity;
  doc["moisture"] = sensorData.moisture;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  server.send(200, "application/json", jsonString);
}

// Handle root page
void handleRoot() {
  String html = "<html><body style='font-family: Arial, sans-serif; margin: 20px;'>";
  html += "<h1>ESP32 Sensor Server</h1>";
  
  html += "<h2>Network Information</h2>";
  html += "<ul>";
  html += "<li>ESP32 IP: " + WiFi.localIP().toString() + "</li>";
  html += "<li>Gateway IP: " + WiFi.gatewayIP().toString() + "</li>";
  html += "<li>Subnet Mask: " + WiFi.subnetMask().toString() + "</li>";
  html += "<li>Signal Strength: " + String(WiFi.RSSI()) + " dBm</li>";
  html += "<li>MAC Address: " + WiFi.macAddress() + "</li>";
  html += "</ul>";
  
  html += "<h2>Client Information</h2>";
  html += "<ul>";
  html += "<li>Your IP: " + server.client().remoteIP().toString() + "</li>";
  html += "</ul>";
  
  html += "<h2>Available Endpoints</h2>";
  html += "<ul>";
  html += "<li><a href='/ping'>/ping</a> - Test connectivity</li>";
  html += "<li><a href='/data'>/data</a> - Get sensor readings</li>";
  html += "</ul>";
  
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\nInitializing...");
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT sensor initialized");
  
  // Initialize moisture sensor pin
  pinMode(MOISTURE_PIN, INPUT);
  
  // Configure WiFi
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setTxPower(WIFI_POWER_19_5dBm);
  
  // Disconnect from any previous WiFi
  WiFi.disconnect(true);
  delay(1000);
  
  // Scan for networks
  Serial.println("Scanning for networks...");
  int n = WiFi.scanNetworks();
  if (n == 0) {
    Serial.println("No networks found!");
  } else {
    Serial.print(n);
    Serial.println(" networks found:");
    for (int i = 0; i < n; ++i) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" (");
      Serial.print(WiFi.RSSI(i));
      Serial.print("dBm) ");
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?" ":"*");
      delay(10);
    }
  }
  
  // Connect to WiFi
  Serial.print("\nConnecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  // Wait for connection with timeout and more detailed status
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    if (attempts % 5 == 0) {
      Serial.print("\nStatus: ");
      switch (WiFi.status()) {
        case WL_IDLE_STATUS:
          Serial.println("Idle");
          break;
        case WL_NO_SSID_AVAIL:
          Serial.println("Cannot find SSID");
          break;
        case WL_SCAN_COMPLETED:
          Serial.println("Scan completed");
          break;
        case WL_CONNECT_FAILED:
          Serial.println("Connection failed");
          break;
        case WL_CONNECTION_LOST:
          Serial.println("Connection lost");
          break;
        case WL_DISCONNECTED:
          Serial.println("Disconnected");
          break;
        default:
          Serial.println("Unknown status");
      }
    }
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi! Restarting...");
    ESP.restart();
  }
  
  Serial.println("\nWiFi Connected!");
  printWiFiStatus();
  
  // Setup server routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/ping", HTTP_GET, handlePing);
  server.on("/data", HTTP_GET, handleData);
  server.on("/data", HTTP_OPTIONS, handleOptions);
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
  
  // Initial sensor reading
  updateSensorReadings();
}

void loop() {
  server.handleClient();
  
  // Check WiFi connection
  static unsigned long lastWiFiCheck = 0;
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastWiFiCheck >= 10000) { // Check every 10 seconds
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi connection lost! Reconnecting...");
      WiFi.reconnect();
      delay(5000); // Wait for reconnection
      
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Reconnection failed! Restarting...");
        ESP.restart();
      }
    }
    lastWiFiCheck = currentMillis;
  }
  
  delay(10); // Small delay to prevent watchdog timer issues
} 