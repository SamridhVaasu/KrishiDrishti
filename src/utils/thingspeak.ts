/**
 * Thingspeak API utilities for fetching IoT sensor data
 */

// In production, these would be stored in environment variables
const THINGSPEAK_CHANNEL_ID = '12345'; // Replace with actual channel ID
const THINGSPEAK_READ_API_KEY = 'YOUR_API_KEY'; // Replace with actual API key

interface ThingSpeakData {
  created_at: string;
  entry_id: number;
  field1: string; // Soil Moisture (%)
  field2: string; // Humidity (%)
  field3: string; // Temperature (°C)
  field4: string; // Light level (lux)
  field5: string; // Rainfall (mm)
  field6: string; // Wind speed (km/h)
  field7: string; // Soil pH
  field8: string; // Additional sensor
}

interface ProcessedSensorData {
  timestamp: Date;
  soilMoisture: number;
  humidity: number;
  temperature: number;
  light: number;
  rainfall?: number;
  windSpeed?: number;
  soilPH?: number;
}

/**
 * Format sensor values with appropriate units based on sensor type
 * @param value The sensor value to format
 * @param type The type of sensor
 * @returns Formatted string with value and unit
 */
export const formatSensorValue = (value: string, type: string): string => {
  if (!value) return 'N/A';
  
  switch (type.toLowerCase()) {
    case 'temperature':
      return `${parseFloat(value).toFixed(1)}°C`;
    case 'humidity':
    case 'moisture':
      return `${parseFloat(value).toFixed(1)}%`;
    case 'light':
      return `${parseInt(value, 10)} lux`;
    case 'rainfall':
      return `${parseFloat(value).toFixed(1)} mm`;
    case 'wind':
      return `${parseFloat(value).toFixed(1)} km/h`;
    case 'ph':
      return `pH ${parseFloat(value).toFixed(1)}`;
    default:
      return value;
  }
};

/**
 * Fetch the latest data from ThingSpeak channel
 * @returns Promise with the sensor data
 */
export const fetchThingSpeakData = async (): Promise<ThingSpeakData> => {
  try {
    // In real application, this would fetch from the ThingSpeak API
    // For development, we'll simulate the data
    if (process.env.NODE_ENV === 'development') {
      return simulateSensorData();
    }

    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${THINGSPEAK_READ_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ThingSpeak data:', error);
    // Return simulated data in case of error
    return simulateSensorData();
  }
};

/**
 * Process the raw ThingSpeak data into a more usable format
 * @param rawData Raw ThingSpeak data
 * @returns Processed sensor data
 */
export const processSensorData = (rawData: ThingSpeakData): ProcessedSensorData => {
  return {
    timestamp: new Date(rawData.created_at),
    soilMoisture: parseFloat(rawData.field1) || 0,
    humidity: parseFloat(rawData.field2) || 0,
    temperature: parseFloat(rawData.field3) || 0,
    light: parseFloat(rawData.field4) || 0,
    rainfall: rawData.field5 ? parseFloat(rawData.field5) : undefined,
    windSpeed: rawData.field6 ? parseFloat(rawData.field6) : undefined,
    soilPH: rawData.field7 ? parseFloat(rawData.field7) : undefined,
  };
};

/**
 * Generate simulated sensor data for development
 * @returns Simulated ThingSpeak data
 */
const simulateSensorData = (): ThingSpeakData => {
  // Generate realistic values for a farm environment
  const soilMoisture = (35 + Math.random() * 15).toFixed(1); // 35-50%
  const humidity = (60 + Math.random() * 20).toFixed(1); // 60-80%
  const temperature = (18 + Math.random() * 10).toFixed(1); // 18-28°C
  const light = (15000 + Math.random() * 30000).toFixed(0); // 15k-45k lux
  const rainfall = Math.random() > 0.7 ? (Math.random() * 5).toFixed(1) : '0.0'; // 70% chance of 0, otherwise 0-5mm
  const windSpeed = (2 + Math.random() * 8).toFixed(1); // 2-10 km/h
  const soilPH = (6 + Math.random() * 2).toFixed(1); // 6-8 pH
  
  return {
    created_at: new Date().toISOString(),
    entry_id: Math.floor(Math.random() * 10000),
    field1: soilMoisture,
    field2: humidity,
    field3: temperature,
    field4: light,
    field5: rainfall,
    field6: windSpeed,
    field7: soilPH,
    field8: '0',
  };
};

/**
 * Calculate soil status based on moisture level
 * @param moisturePercentage Soil moisture percentage
 * @returns Status description
 */
export const getSoilMoistureStatus = (moisturePercentage: number): {
  status: 'Dry' | 'Optimal' | 'Wet';
  color: string;
  recommendation: string;
} => {
  if (moisturePercentage < 30) {
    return {
      status: 'Dry',
      color: '#ff9800', // Amber
      recommendation: 'Irrigation recommended soon',
    };
  } else if (moisturePercentage > 60) {
    return {
      status: 'Wet',
      color: '#2196f3', // Blue
      recommendation: 'Reduce irrigation, check drainage',
    };
  } else {
    return {
      status: 'Optimal',
      color: '#4caf50', // Green
      recommendation: 'Moisture levels ideal for most crops',
    };
  }
};

/**
 * Calculate water requirements based on crop type and current conditions
 * @param crop Crop type
 * @param temperature Current temperature
 * @param humidity Current humidity
 * @param soilMoisture Current soil moisture
 * @returns Water requirement assessment
 */
export const getWaterRequirements = (
  crop: string,
  temperature: number,
  humidity: number,
  soilMoisture: number
): {
  needsWater: boolean;
  schedule: string;
  amount: string;
} => {
  // Simplified water calculation logic (would be more complex in a real system)
  const cropWaterFactors: Record<string, number> = {
    'corn': 1.2,
    'wheat': 0.9,
    'rice': 1.5,
    'soybeans': 1.0,
    'cotton': 1.1,
    'potatoes': 1.1,
    'tomatoes': 1.2,
  };
  
  const cropFactor = cropWaterFactors[crop.toLowerCase()] || 1.0;
  const tempFactor = temperature > 25 ? 1.3 : temperature < 15 ? 0.8 : 1.0;
  const humidityFactor = humidity < 40 ? 1.2 : humidity > 80 ? 0.7 : 1.0;
  const moistureFactor = soilMoisture < 30 ? 1.5 : soilMoisture > 60 ? 0.5 : 1.0;
  
  const waterNeed = cropFactor * tempFactor * humidityFactor * moistureFactor;
  const needsWater = waterNeed > 1.2 && soilMoisture < 50;
  
  if (needsWater) {
    return {
      needsWater: true,
      schedule: temperature > 28 ? 'Morning and evening' : 'Morning only',
      amount: `${Math.round(waterNeed * 5)} liters per square meter`,
    };
  } else {
    return {
      needsWater: false,
      schedule: 'No irrigation needed for next 24 hours',
      amount: '0 liters',
    };
  }
};

/**
 * Calculate pest risk based on weather conditions
 * @param temperature Current temperature
 * @param humidity Current humidity
 * @returns Pest risk assessment
 */
export const calculatePestRisk = (
  temperature: number,
  humidity: number
): {
  risk: 'Low' | 'Moderate' | 'High';
  pests: string[];
  recommendation: string;
} => {
  // Higher temperatures and humidity generally increase pest risk
  if (temperature > 25 && humidity > 70) {
    return {
      risk: 'High',
      pests: ['Aphids', 'Spider mites', 'Whiteflies', 'Fungal diseases'],
      recommendation: 'Increase monitoring frequency. Consider preventative treatment.'
    };
  } else if (temperature > 20 && humidity > 60) {
    return {
      risk: 'Moderate',
      pests: ['Aphids', 'Caterpillars'],
      recommendation: 'Regular monitoring recommended. Check undersides of leaves.'
    };
  } else {
    return {
      risk: 'Low',
      pests: [],
      recommendation: 'Standard monitoring procedures sufficient.'
    };
  }
};

/**
 * Get sensor data for displaying in KrishiGPT
 * @returns Promise with sensor data as needed by KrishiGPT
 */
export const getSensorData = async () => {
  try {
    const data = await fetchThingSpeakData();
    return {
      field1: parseFloat(data.field1),      // soil moisture
      field2: parseFloat(data.field3),      // temperature (note: field3 is temperature in this setup)
      field3: parseFloat(data.field2),      // humidity (note: field2 is humidity in this setup)
      field4: parseFloat(data.field4),      // light intensity
      field5: parseFloat(data.field7),      // soil pH
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error getting sensor data:', error);
    return null;
  }
};