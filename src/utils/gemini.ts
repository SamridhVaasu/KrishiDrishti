import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Google Generative AI with API key
// In production, this would be stored in environment variables
const API_KEY = 'AIzaSyA1pypVDaPb3muOAaHd65NH9P30v0zoSTw'
const genAI = new GoogleGenerativeAI(API_KEY);

// Set up safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Additional agricultural prompting for the model
const SYSTEM_PROMPT = `You are AgriCounsel, an advanced agricultural AI assistant specializing in:

- Crop recommendations based on soil conditions, climate, and market trends
- Pest and disease identification and management advice
- Weather-based farming recommendations
- Sustainable farming practices
- Water management and irrigation scheduling
- Equipment troubleshooting
- Market price predictions and agricultural economics
- Seasonal planting and harvesting advice

Respond with accurate, actionable agricultural guidance. Use clear language that farmers can understand and implement. 
When providing recommendations, always consider sustainability and best environmental practices. If you're uncertain, 
acknowledge the limits of your knowledge and suggest consulting a local agricultural extension service.

Current date: ${new Date().toLocaleDateString()}
`;

// Message history type
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate an AI response using Gemini
 * @param history - Previous message history
 * @param additionalContext - Any additional context to include
 * @returns Promise with the generated response
 */
export const generateAIResponse = async (
  history: Message[], 
  additionalContext: string = ''
): Promise<string> => {
  try {
    // Get Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings,
    });
    
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 800,
      },
    });

    // Format the prompt with system instructions and additional context
    const prompt = `${SYSTEM_PROMPT}\n${additionalContext}`;

    // Generate content
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate response from Gemini API.');
  }
};

/**
 * Process an image with Gemini for plant disease detection
 * @param imageData - Base64 encoded image data
 * @returns Promise with the analysis result
 */
export const analyzePlantImage = async (imageData: string): Promise<any> => {
  try {
    // Get Gemini 1.5 Flash model with vision capabilities
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings,
    });

    const prompt = `
    Analyze this plant image and identify any diseases or pest issues. 
    For each identified issue, provide:
    1. Disease/pest name and scientific name
    2. Confidence level of your identification (as a percentage)
    3. Severity assessment (Low, Medium, High)
    4. Detailed description of visible symptoms
    5. Recommended treatment options
    6. Prevention measures for the future

    Format your response as structured data in JSON format with the following structure:
    {
      "disease": {
        "name": "Common name",
        "scientificName": "Scientific name",
        "confidence": 0.92
      },
      "severity": "High/Medium/Low",
      "symptoms": ["symptom1", "symptom2"],
      "treatment": ["treatment1", "treatment2"],
      "prevention": ["prevention1", "prevention2"]
    }
    `;

    // Convert the base64 data to a Uint8Array
    const base64Data = imageData.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // If JSON parsing fails, return the text response
      return { 
        error: true, 
        message: 'Could not parse the response data',
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error analyzing plant image:', error);
    throw new Error('Failed to analyze image with Gemini API.');
  }
};

// Mock function to simulate sensor data calculation for crop recommendations
export const getRecommendedCrops = async (
  soilType: string,
  temperature: number,
  humidity: number,
  soilMoisture: number,
  region: string
): Promise<string[]> => {
  try {
    // Format the prompt for crop recommendation
    const prompt = `As an agricultural expert, recommend 5 suitable crops based on the following conditions:
    - Soil Type: ${soilType}
    - Average Temperature: ${temperature}°C
    - Humidity: ${humidity}%
    - Soil Moisture: ${soilMoisture}%
    - Geographic Region: ${region}
    
    Return just a simple JSON array of crop names, like: ["Wheat", "Corn", "Soybeans", "Rice", "Cotton"]`;
    
    // Get Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings,
    });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON crop recommendations:', parseError);
      return ['Wheat', 'Corn', 'Soybeans', 'Tomatoes', 'Potatoes'];
    }
  } catch (error) {
    console.error('Error generating crop recommendations:', error);
    // Return default crops if the API fails
    return ['Wheat', 'Corn', 'Soybeans', 'Tomatoes', 'Potatoes'];
  }
};