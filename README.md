# AgroSense AI - Smart Agriculture Monitoring System

![AgroSense AI](https://img.shields.io/badge/AgroSense-AI-brightgreen)
![Version](https://img.shields.io/badge/Version-2.4.1-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178c6)
![MUI](https://img.shields.io/badge/Material%20UI-5.17.1-007FFF)

AgroSense AI is a comprehensive smart agriculture monitoring system that combines IoT sensor data analytics with advanced AI technologies to help farmers optimize crop management, detect plant diseases, and make data-driven farming decisions.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Integration](#api-integration)
- [Screenshots](#screenshots)
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
├── public/                   # Static assets
│   └── textures/             # UI texture assets
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
