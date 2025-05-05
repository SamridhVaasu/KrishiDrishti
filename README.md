# AgroSense AI - Smart Agriculture Monitoring System

![AgroSense AI](https://img.shields.io/badge/AgroSense-AI-brightgreen)
![Version](https://img.shields.io/badge/Version-2.4.1-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178c6)
![MUI](https://img.shields.io/badge/Material%20UI-5.17.1-007FFF)

AgroSense AI is a comprehensive smart agriculture monitoring system that combines IoT sensor data analytics with advanced AI technologies to help farmers optimize crop management, detect plant diseases, and make data-driven farming decisions.

## 📋 Table of Contents

- [Features](#features)
- [System Design](#system-design)
  - [Flow Chart](#flow-chart-design)
  - [Data Flow Diagram](#data-flow-diagram)
  - [E-R Diagram](#e-r-diagram)
- [Methodology](#methodology)
  - [Algorithm Formulated](#algorithm-formulated)
  - [Mathematical Modeling](#mathematical-modeling)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Integration](#api-integration)
- [Future Developments](#future-developments)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🌱 Real-time Farm Monitoring
- **IoT Sensor Integration**: Monitors soil moisture, temperature, humidity, light levels, and more
- **Data Visualization**: Interactive charts and dashboards for environmental metrics
- **Farm Zone Management**: Organize and monitor different sections of agricultural land

### 🤖 AI-Powered Agricultural Assistance
- **AgriCounsel**: Advanced agricultural chat assistant powered by Google's Gemini 1.5 Flash
- **Contextual Recommendations**: AI provides personalized advice based on current farm conditions
- **Category-based Responses**: Smart categorization of agricultural queries for better organization

### 🔍 Plant Disease Detection
- **Machine Learning Analysis**: Upload plant images to detect diseases with confidence scores
- **Treatment Recommendations**: Receive customized treatment and prevention strategies
- **Scientific Information**: Get detailed information about detected plant diseases

### 📊 Advisory System
- **Environmental Analysis**: Comprehensive breakdown of current farm conditions
- **AI Recommendations**: Actionable advice for optimal crop management
- **Risk Assessment**: Proactive pest and disease risk monitoring

### 💡 Smart User Experience
- **Light/Dark Mode**: Customizable interface adapting to user preferences
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Updates**: Automatic data refresh and notifications

## 🎨 System Design

### Flow Chart Design

The system flow chart illustrates the operational workflow of AgroSense AI:

```
┌─────────────────────┐
│   User Interface    │
└─────────┬───────────┘
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│    User Selection   │     │   Sensor Module     │
│   ┌───────────────┐ │     │                     │
│   │  Dashboard    │◄┼─────┼─►┌───────────────┐  │
│   └───────────────┘ │     │  │ ThingSpeak    │  │
│   ┌───────────────┐ │     │  │ IoT Platform  │  │
│   │  AgriCounsel/ │◄┼─────┼─►└───────────────┘  │
│   │  KrishiGPT    │ │     └─────────────────────┘
│   └───────────────┘ │           ▲
│   ┌───────────────┐ │           │
│   │  Disease      │◄┼───────────┘
│   │  Detection    │ │     ┌─────────────────────┐
│   └───────────────┘ │     │   AI Processing     │
│   ┌───────────────┐ │     │                     │
│   │  Advisory     │◄┼─────┼─►┌───────────────┐  │
│   │  System       │ │     │  │ Google Gemini │  │
│   └───────────────┘ │     │  │ 1.5 Flash     │  │
└─────────────────────┘     │  └───────────────┘  │
                            │  ┌───────────────┐  │
                            │  │ TensorFlow    │  │
                            │  │ ML Models     │  │
                            │  └───────────────┘  │
                            └─────────────────────┘
                                      │
                                      ▼
┌─────────────────────┐     ┌─────────────────────┐
│   User Response     │     │   Data Storage      │
│                     │     │                     │
│  • Visualizations   │◄────┤  • Sensor readings  │
│  • AI Suggestions   │     │  • AI responses     │
│  • Disease Reports  │     │  • Disease data     │
│  • Recommendations  │     │                     │
└─────────────────────┘     └─────────────────────┘
```

### Data Flow Diagram

The data flow diagram demonstrates how information moves through the AgroSense AI system:

```
┌───────────────────────┐
│  External Data Sources│
│                       │
│  ┌─────────────────┐  │
│  │   ThingSpeak    │──┼────┐
│  │   IoT Platform  │  │    │
│  └─────────────────┘  │    │
│                       │    │
│  ┌─────────────────┐  │    │    ┌───────────────────────┐
│  │   User Input    │──┼────┼────►   Processing Layer    │
│  │ (Queries/Images)│  │    │    │                       │
│  └─────────────────┘  │    │    │  ┌─────────────────┐  │
└───────────────────────┘    └────┼──►   ThingSpeak    │  │
                                  │  │     API         │  │
                                  │  └────────┬────────┘  │
                                  │           │           │
                                  │  ┌────────▼────────┐  │    ┌───────────────────────┐
                                  │  │   Sensor Data   │  │    │  User Interface Layer │
                                  │  │   Processing    │──┼────►                       │
                                  │  └────────┬────────┘  │    │  ┌─────────────────┐  │
                                  │           │           │    │  │    Dashboard    │  │
                                  │  ┌────────▼────────┐  │    │  │    Component    │  │
                                  │  │ Google Gemini AI│──┼────►  └─────────────────┘  │
                                  │  │    Processing   │  │    │  ┌─────────────────┐  │
                                  │  └────────┬────────┘  │    │  │   KrishiGPT/    │  │
                                  │           │           │    │  │   AgriCounsel   │  │
                                  │  ┌────────▼────────┐  │    │  └─────────────────┘  │
                                  │  │  ML Models for  │──┼────►  ┌─────────────────┐  │
                                  │  │Disease Detection│  │    │  │   Disease       │  │
                                  │  └────────┬────────┘  │    │  │   Detection     │  │
                                  │           │           │    │  └─────────────────┘  │
                                  │  ┌────────▼────────┐  │    │  ┌─────────────────┐  │
                                  │  │ Advisory System │──┼────►  │   Advisory      │  │
                                  │  │    Analysis     │  │    │  │   Component     │  │
                                  │  └─────────────────┘  │    │  └─────────────────┘  │
                                  └───────────────────────┘    └───────────────────────┘
```

### E-R Diagram

The entity-relationship diagram illustrates the data structure of AgroSense AI:

```
┌──────────┐          ┌───────────┐          ┌──────────────┐
│   User   │1        *│   Query   │*        1│    Farm      │
├──────────┤◄─────────┼───────────┼─────────►├──────────────┤
│ userID   │          │ queryID   │          │ farmID       │
│ userName │          │ queryText │          │ location     │
│ settings │          │ timestamp │          │ farmName     │
└──────────┘          │ category  │          │ cropType     │
                      │ tags      │          └──────┬───────┘
                      └───────────┘                 │
                                                    │1
                                                    ▼
                      ┌───────────┐          ┌──────────────┐          ┌────────────────────┐
                      │   Image   │*        1│  SensorData  │1        1│  ThingSpeakChannel │
                      ├───────────┤◄─────────┼──────────────┼─────────►├────────────────────┤
                      │ imageID   │          │ readingID    │          │ channelID          │
                      │ imageData │          │ soilMoisture │          │ readAPIKey         │
                      │ uploadDate│          │ temperature  │          │ writeAPIKey        │
                      └─────┬─────┘          │ humidity     │          │ lastUpdated        │
                            │1               │ lightLevel   │          └────────────────────┘
                            │                │ soilPH       │
                            │                │ timestamp    │
                            ▼                └──────┬───────┘
┌─────────────────┐  *    1┌───────────────┐       │1
│    Disease      │◄───────┤DiseaseDetection│       │
├─────────────────┤        ├───────────────┤       │
│ diseaseID       │        │ detectionID   │       │
│ diseaseName     │        │ confidence    │       │
│ scientificName  │        │ diagnosisDate │       │
│ description     │        │ imageID       │       │
│ symptoms        │        │ diseaseID     │       │
│ treatments      │        └───────────────┘       │
│ preventions     │                                │
└─────────────────┘                                │
                                                   ▼
                                          ┌──────────────────┐
                                          │    Advisory      │
                                          ├──────────────────┤
                                          │ advisoryID       │
                                          │ recommendations  │
                                          │ riskLevel        │
                                          │ generatedDate    │
                                          │ readingID        │
                                          └──────────────────┘
```

## 🧠 Methodology Adopted

### Algorithm Formulated

#### 1. Sensor Data Acquisition and Processing Algorithm

```
Function getSensorData():
    Try:
        // Make API request to ThingSpeak channel
        response = fetch('https://api.thingspeak.com/channels/{channelID}/feeds.json?api_key={apiKey}&results=1')
        
        If response is successful:
            Parse JSON response
            Extract relevant fields:
                soilMoisture = response.feeds[0].field1
                temperature = response.feeds[0].field2
                humidity = response.feeds[0].field3
            
            // Process and normalize sensor data
            If soilMoisture exists:
                soilMoistureStatus = getSoilMoistureStatus(soilMoisture)
            
            If temperature exists:
                temperatureStatus = getTemperatureStatus(temperature)
                
            If humidity exists:
                humidityStatus = getHumidityStatus(humidity)
                
            Return {
                soilMoisture,
                temperature,
                humidity,
                soilMoistureStatus,
                temperatureStatus,
                humidityStatus,
                timestamp: response.feeds[0].created_at
            }
        Else:
            Log error: "Failed to fetch sensor data"
            Return simulated data as fallback
    Catch error:
        Log error message
        Return simulated data as fallback
```

#### 2. Agricultural AI Assistant Algorithm (KrishiGPT/AgriCounsel)

```
Function generateAIResponse(userQuery, sensorData):
    Try:
        // Create enhanced prompt with sensor context
        contextEnhancedPrompt = "You are AgriCounsel, an agricultural AI assistant. 
                              Current sensor readings from the farm:
                              - Soil Moisture: {sensorData.soilMoisture}%
                              - Temperature: {sensorData.temperature}°C
                              - Humidity: {sensorData.humidity}%
                              
                              User query: {userQuery}
                              
                              Provide a helpful response considering the current farm conditions."
        
        // Process with Google Gemini AI
        response = await geminiModel.generateContent(contextEnhancedPrompt)
        
        // Extract text response
        aiResponseText = response.text()
        
        // Determine agricultural category based on content
        category = determineCategory(aiResponseText)
        
        // Extract relevant tags
        tags = extractAgricultureTags(aiResponseText)
        
        // Return structured response
        return {
            content: aiResponseText,
            timestamp: new Date(),
            category: category,
            tags: tags
        }
    Catch error:
        Log error message
        Return error message as response
```

#### 3. Plant Disease Detection Algorithm

```
Function detectPlantDisease(imageData):
    Try:
        // Preprocess image for TensorFlow model
        processedImage = preprocessImage(imageData)
        
        // Get ML model prediction
        If using backend:
            // Send to Python Flask backend
            response = await fetch('/api/detect', {
                method: 'POST',
                body: imageData
            })
            prediction = await response.json()
        Else:
            // Use in-browser TensorFlow.js model
            prediction = tensorflowModel.predict(processedImage)
        
        // Extract disease classification and confidence
        diseaseName = prediction.class
        confidence = prediction.confidence
        
        // Get detailed information using Gemini AI
        diseaseInfo = await getDetailedDiseaseInfo(diseaseName, imageData)
        
        // Return comprehensive disease detection result
        return {
            diseaseName: diseaseName,
            confidence: confidence,
            scientificName: diseaseInfo.scientificName,
            description: diseaseInfo.description,
            symptoms: diseaseInfo.symptoms,
            treatments: diseaseInfo.treatments,
            preventions: diseaseInfo.preventions,
            organicSolutions: diseaseInfo.organicSolutions,
            severity: diseaseInfo.severity || getSeverityFromConfidence(confidence),
            expectedRecoveryTime: diseaseInfo.expectedRecoveryTime
        }
    Catch error:
        Log error message
        Return error status
```

#### 4. Farm Advisory Generation Algorithm

```
Function generateFarmAdvisory(sensorData):
    Try:
        // Calculate water requirements based on sensor data
        waterRequirements = calculateWaterRequirements(
            sensorData.soilMoisture, 
            sensorData.temperature, 
            sensorData.humidity
        )
        
        // Calculate plant stress index
        stressIndex = calculatePlantStressIndex(
            sensorData.soilMoisture,
            sensorData.temperature, 
            sensorData.humidity
        )
        
        // Determine disease risk based on environmental conditions
        diseaseRisk = calculateDiseaseRisk(
            sensorData.soilMoisture,
            sensorData.temperature, 
            sensorData.humidity
        )
        
        // Generate specific recommendations based on calculations
        recommendations = []
        
        If waterRequirements.status === 'high':
            recommendations.push("Increase irrigation immediately")
        Else if waterRequirements.status === 'low':
            recommendations.push("Reduce irrigation to prevent waterlogging")
            
        If stressIndex > 0.7:
            recommendations.push("Plants are under high stress. Consider shade cloth or misting.")
        
        If diseaseRisk > 0.6:
            recommendations.push("High risk of disease. Consider preventative fungicide application.")
            
        // Return comprehensive advisory
        return {
            timestamp: new Date(),
            recommendations: recommendations,
            soilMoistureStatus: getSoilMoistureStatus(sensorData.soilMoisture),
            temperatureStatus: getTemperatureStatus(sensorData.temperature),
            humidityStatus: getHumidityStatus(sensorData.humidity),
            waterRequirements: waterRequirements,
            stressIndex: stressIndex,
            diseaseRisk: diseaseRisk
        }
    Catch error:
        Log error message
        Return default recommendations
```

### Mathematical Modeling

The AgroSense AI system utilizes three primary sensors (soil moisture, temperature, and humidity) to create comprehensive mathematical models for agricultural decision-making:

#### 1. Water Requirement Model

This model determines optimal irrigation needs by analyzing the relationship between soil moisture, temperature, and humidity:

```
WR = f(SM, T, H) = α * (1 - SM/100) * (T/Topt) * (1 - H/100)^β

Where:
- WR = Water Requirement (normalized 0-1 scale)
- SM = Soil Moisture percentage (%)
- T = Temperature (°C)
- H = Humidity (%)
- Topt = Optimal temperature for the specific crop (typically 25°C for most crops)
- α = Scaling factor (typically 1.5)
- β = Humidity impact factor (typically 0.5)
```

**Decision Rules:**
- If SM < 30%: Immediate irrigation required
- If 30% ≤ SM < 45%: Schedule irrigation within 24 hours
- If 45% ≤ SM < 70%: Monitor conditions
- If SM ≥ 70%: No irrigation needed

The water requirement increases with:
1. Decreasing soil moisture
2. Increasing temperature (especially above optimal)
3. Decreasing humidity (as evapotranspiration increases)

#### 2. Plant Stress Index Model

This complex model quantifies plant stress based on environmental parameters:

```
PSI = w₁ * SM_stress + w₂ * T_stress + w₃ * H_stress

Where:
- PSI = Plant Stress Index (0-1 scale, higher means more stress)
- SM_stress = (SMopt - SM)² / SMrange if SM < SMopt, otherwise (SM - SMopt)² / SMrange
- T_stress = (T - Topt)² / Trange
- H_stress = (H - Hopt)² / Hrange
- SMopt = Optimal soil moisture (typically 55%)
- Topt = Optimal temperature (crop-specific)
- Hopt = Optimal humidity (typically 60%)
- SMrange, Trange, Hrange = Normalization factors
- w₁, w₂, w₃ = Weighting coefficients (typically 0.5, 0.3, 0.2)
```

The Plant Stress Index incorporates quadratic penalty functions that increase as conditions deviate from optimal values. Each parameter (moisture, temperature, humidity) contributes differently to the overall stress based on crop-specific physiological requirements.

#### 3. Disease Risk Assessment Model

This epidemiological model predicts disease likelihood based on environmental conditions:

```
DR = k₁ * H/100 * f₁(T) + k₂ * (1 - SM/100) * f₂(T)

Where:
- DR = Disease Risk (0-1 scale)
- H = Humidity (%)
- SM = Soil Moisture (%)
- T = Temperature (°C)
- f₁(T) = Temperature response function for humid conditions: exp(-(T-Topt_humid)²/σ₁²)
- f₂(T) = Temperature response function for soil conditions: exp(-(T-Topt_soil)²/σ₂²)
- Topt_humid = Optimal temperature for disease development in humid conditions (typically 18-22°C)
- Topt_soil = Optimal temperature for disease development in soil (typically 15-20°C)
- σ₁, σ₂ = Temperature sensitivity parameters
- k₁, k₂ = Weighting coefficients (typically 0.7, 0.3)
```

Disease risk increases exponentially with:
1. High humidity (>80%), especially when sustained over time
2. Temperatures in the optimal range for pathogen growth
3. Fluctuating soil moisture (especially when transitioning from wet to dry)

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           Frontend Layer            │
│  ┌───────────────┐ ┌───────────────┐│
│  │  React / TSX  │ │     MUI       ││
│  │  Components   │ │  UI Library   ││
│  └───────────────┘ └───────────────┘│
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│           Service Layer             │
│  ┌───────────────┐ ┌───────────────┐│
│  │   ThingSpeak  │ │Google Gemini  ││
│  │  Integration  │ │AI Integration ││
│  └───────────────┘ └───────────────┘│
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│           Backend Layer             │
│  ┌───────────────┐ ┌───────────────┐│
│  │  Python Flask │ │  TensorFlow   ││
│  │      API      │ │ML Model (Opt) ││
│  └───────────────┘ └───────────────┘│
└─────────────────────────────────────┘
```

### Component Flow
1. **User Interface (React/TypeScript)**: The frontend is built with React and TypeScript, providing an interactive user experience with components like Dashboard, AgriCounsel AI, Disease Detector, and Advisory sections.

2. **Data Integration**: 
   - Real-time sensor data is fetched from ThingSpeak IoT platform
   - AI responses are generated via Google Gemini 1.5 Flash API
   - ML-based disease detection is processed with TensorFlow models

3. **Backend Services**: 
   - A Python Flask backend handles machine learning tasks for plant disease detection
   - RESTful API endpoints manage communication between frontend and ML models

## 🛠️ Tech Stack

### Frontend
- **React 18**: Core UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tooling and development server
- **Material UI (MUI)**: Comprehensive UI component library
- **Emotion**: CSS-in-JS styling solution

### APIs & Services
- **ThingSpeak API**: IoT data platform for sensor analytics
- **Google Gemini 1.5 Flash**: Advanced large language model for agricultural AI assistance
- **TensorFlow.js**: In-browser machine learning capabilities

### Backend
- **Python Flask**: Lightweight backend server for ML operations
- **TensorFlow/Keras**: ML framework for disease detection model training and inference

### Development & Tooling
- **ESLint**: Code quality and style checking
- **Git**: Version control

## 📁 Project Structure

```
├── backend/                  # Python Flask backend for ML operations
│   ├── app.py                # Main Flask application
│   ├── requirements.txt      # Python dependencies
│   └── models/               # ML model files
├── Hardware_IoT_Code/        # ESP32 sensor code and IoT implementation
│   └── esp32_sensor_server.ino  # Sensor code for ESP32 microcontroller
├── public/                   # Static assets
│   └── textures/             # UI texture assets
│   └── models/               # TensorFlow ML models for client-side
├── src/
│   ├── components/           # React components
│   │   ├── Advisory.tsx      # Farm advisory component
│   │   ├── AgriCounsel.tsx   # Advanced AI chat assistant
│   │   ├── AIChat.tsx        # Simple AI chat interface
│   │   ├── ChatbotWidget.tsx # Floating chat widget
│   │   ├── Dashboard.tsx     # Main monitoring dashboard
│   │   ├── DiseaseDetecter.tsx # Plant disease detection
│   │   └── Sidebar.tsx       # Navigation sidebar
│   ├── utils/                # Utility functions
│   │   ├── gemini.ts         # Google Gemini API integration
│   │   ├── plantDiseaseGemini.ts # Disease detection with Gemini
│   │   └── thingspeak.ts     # ThingSpeak IoT integration
│   ├── App.tsx               # Main application component
│   └── main.tsx              # Application entry point
├── package.json              # Project dependencies
└── vite.config.ts            # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun
- Python 3.8+ (for backend)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/agrosense-ai.git
cd agrosense-ai
```

2. Install frontend dependencies
```bash
npm install
# or with bun
bun install
```

3. Set up environment variables
```bash
# Create a .env file with your API keys
GEMINI_API_KEY=your_gemini_api_key
THINGSPEAK_CHANNEL_ID=your_thingspeak_channel
THINGSPEAK_READ_API_KEY=your_thingspeak_key
```

4. Start the frontend development server
```bash
npm run dev
# or with bun
bun dev
```

5. (Optional) Set up the backend for disease detection
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Building for Production
```bash
npm run build
# or with bun
bun run build
```

## 🔌 API Integration

### ThingSpeak IoT Integration

The application is configured to work with ThingSpeak IoT platform for sensor data:

- **Channel Fields**:
  - `field1`: Soil Moisture (%)
  - `field2`: Humidity (%)
  - `field3`: Temperature (°C)
  - `field4`: Light level (lux)
  - `field5`: Rainfall (mm)
  - `field6`: Wind speed (km/h)
  - `field7`: Soil pH

To configure your own ThingSpeak channel:
1. Create a ThingSpeak account and channel
2. Update the channel ID and API key in `src/utils/thingspeak.ts`

### Google Gemini AI Integration

The application uses Google's Gemini 1.5 Flash for advanced AI assistance:

1. Obtain API key from Google AI Studio
2. Add the key to your `.env` file or update in `src/utils/gemini.ts`

## 🔮 Future Developments

- **Mobile Application**: Native mobile apps for iOS and Android
- **Expanded ML Models**: Additional crop variety and disease detection
- **Predictive Analytics**: Crop yield prediction using historical data
- **Automation Integration**: Control of irrigation systems and other farm equipment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2025 Smart Farm Technologies | AgroSense AI v2.4.1
