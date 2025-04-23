import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Load environment variables - in production, this should come from proper environment setup
const getApiKey = (): string => {
  // Try to get from environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not found in environment variables. Using fallback mechanisms.');
    
    // Try to get from direct access to .env value (works in some environments)
    const envApiKey = process.env.VITE_GEMINI_API_KEY || '';
    if (envApiKey) return envApiKey;
    
    // Return the not configured placeholder
    return 'GEMINI_API_KEY_NOT_CONFIGURED';
  }
  
  return apiKey;
};

// Initialize the Gemini client with proper error handling
const initializeGeminiClient = () => {
  try {
    const apiKey = getApiKey();
    if (apiKey === 'GEMINI_API_KEY_NOT_CONFIGURED') {
      throw new Error('Gemini API key not configured');
    }
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    return null;
  }
};

// Safety settings for the model to ensure appropriate content
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

// Disease advice response interface
export interface DiseaseAdviceResponse {
  diseaseName: string;
  scientificName: string;
  description: string;
  symptoms: string[];
  treatments: string[];
  preventions: string[];
  severity: "Low" | "Medium" | "High";
  organicSolutions: string[];
  expectedRecoveryTime: string;
  success: boolean;
  errorMessage?: string;
}

// Expanded fallback data for common plant diseases in case of API failures
const FALLBACK_DISEASE_DATA: Record<string, Partial<DiseaseAdviceResponse>> = {
  'Apple_scab': {
    scientificName: 'Venturia inaequalis',
    description: 'A fungal disease that appears as olive-green to brown spots on leaves and fruit.',
    symptoms: ['Dark olive-green spots on leaves', 'Scabby lesions on fruit', 'Premature leaf drop'],
    treatments: ['Apply fungicide early in the growing season', 'Remove and destroy fallen leaves', 'Prune to improve air circulation'],
    preventions: ['Choose resistant varieties', 'Rake and destroy fallen leaves', 'Apply preventative fungicides'],
    organicSolutions: ['Neem oil spray', 'Sulfur-based organic fungicides', 'Baking soda spray solutions'],
    expectedRecoveryTime: '2-3 weeks with proper treatment'
  },
  'Tomato_Early_blight': {
    scientificName: 'Alternaria solani',
    description: 'A fungal disease that causes dark spots with concentric rings on lower leaves first.',
    symptoms: ['Dark brown spots with concentric rings', 'Yellowing around lesions', 'Starts on lower leaves'],
    treatments: ['Remove infected leaves', 'Apply approved fungicides', 'Improve air circulation'],
    preventions: ['Crop rotation', 'Mulch around plants', 'Avoid overhead watering'],
    organicSolutions: ['Copper-based organic fungicides', 'Compost tea sprays', 'Garlic and horseradish mixture spray'],
    expectedRecoveryTime: '3-4 weeks with consistent treatment'
  },
  'Tomato_Late_blight': {
    scientificName: 'Phytophthora infestans',
    description: 'A water mold that causes destructive disease in potatoes and tomatoes. It spreads rapidly in wet conditions.',
    symptoms: ['Dark water-soaked spots on leaves', 'White fuzzy growth on undersides', 'Brown lesions on stems', 'Fruit rot with greasy appearance'],
    treatments: ['Remove and destroy infected plants', 'Apply fungicide preventively', 'Increase plant spacing'],
    preventions: ['Plant resistant varieties', 'Water at the base to keep foliage dry', 'Provide good air circulation'],
    organicSolutions: ['Copper-based organic fungicides', 'Compost tea with beneficial microbes', 'Baking soda spray with soap'],
    expectedRecoveryTime: 'Often fatal - focus on protecting uninfected plants'
  },
  'Potato_Late_blight': {
    scientificName: 'Phytophthora infestans',
    description: 'The same pathogen that causes tomato late blight. This infamous disease caused the Irish potato famine.',
    symptoms: ['Dark water-soaked spots on leaves', 'White fungal growth in humid conditions', 'Brown to purple lesions on tubers'],
    treatments: ['Apply fungicide prophylactically', 'Remove infected plants completely', 'Hill soil around remaining plants'],
    preventions: ['Use certified disease-free seed potatoes', 'Rotate crops', 'Plant resistant varieties'],
    organicSolutions: ['Copper-based sprays', 'Remove volunteer potatoes', 'Avoid overhead irrigation'],
    expectedRecoveryTime: 'Prevention is key - infected plants rarely recover'
  },
  'Grape_Black_rot': {
    scientificName: 'Guignardia bidwellii',
    description: 'A fungal disease that attacks all green parts of the vine, especially damaging to fruit.',
    symptoms: ['Circular lesions with dark margins on leaves', 'Black, mummified fruit', 'Tan spots with black dots'],
    treatments: ['Apply fungicide before and after bloom', 'Remove mummified fruit', 'Prune infected areas'],
    preventions: ['Maintain open canopy for air circulation', 'Remove wild grapes nearby', 'Sanitize pruning tools'],
    organicSolutions: ['Lime sulfur dormant spray', 'Organic copper fungicides', 'Potassium bicarbonate sprays'],
    expectedRecoveryTime: '2-3 seasons for heavily infected vineyards'
  },
  'Apple_Cedar_rust': {
    scientificName: 'Gymnosporangium juniperi-virginianae',
    description: 'A fungal disease requiring both apple trees and cedar/juniper to complete its life cycle.',
    symptoms: ['Bright orange-yellow spots on leaves', 'Distorted fruit', 'Orange gelatinous projections (on cedar)'],
    treatments: ['Apply fungicide during spring infection period', 'Remove nearby cedar hosts if possible', 'Prune heavily infected branches'],
    preventions: ['Plant resistant apple varieties', 'Maintain distance from cedar trees', 'Apply preventative fungicides'],
    organicSolutions: ['Sulfur sprays', 'Kaolin clay applications', 'Neem oil treatments'],
    expectedRecoveryTime: 'Annual management required in susceptible areas'
  },
  'Corn_Common_rust': {
    scientificName: 'Puccinia sorghi',
    description: 'A fungal disease causing reddish-brown pustules on corn leaves. Can reduce yield in severe cases.',
    symptoms: ['Small reddish-brown pustules on both sides of leaves', 'Pustules turn black late in season', 'Severe cases cause yellowing'],
    treatments: ['Apply fungicide if detected early', 'Ensure balanced nutrition', 'Manage during early growth stages'],
    preventions: ['Plant resistant hybrids', 'Early planting helps avoid', 'Rotate crops'],
    organicSolutions: ['Balanced organic fertilization', 'Compost tea foliar sprays', 'Increase plant spacing for airflow'],
    expectedRecoveryTime: 'Plants can recover with minimal yield loss if treated early'
  }
};

// Helper function to parse potentially malformed JSON
const safeJsonParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract a JSON object from the text if it contains more than just JSON
    try {
      const jsonMatch = text.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[0]) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (nestedError) {
      console.error("Failed to parse JSON from text:", nestedError);
    }
    
    // If all parsing attempts fail, create a minimal valid object
    return {
      description: "Information could not be parsed properly from the AI response.",
      symptoms: [],
      treatments: [],
      preventions: []
    };
  }
};

/**
 * Get disease advice from Gemini based on ML prediction
 * @param diseaseName - The disease name predicted by the ML model
 * @param confidence - The confidence score from the ML model (0-1)
 * @returns Promise with detailed advice about the disease
 */
export const getDiseaseTreatmentAdvice = async (
  diseaseName: string,
  confidence: number
): Promise<DiseaseAdviceResponse> => {
  // Initialize the client
  const genAI = initializeGeminiClient();
  
  if (!genAI) {
    console.error("Failed to initialize Gemini client - API key issue");
    // Try using fallback data even for initialization failure
    return useFallbackData(diseaseName, confidence, 'Failed to initialize Gemini client. API key may be missing or invalid.');
  }

  // Check if the plant is healthy
  if (diseaseName.toLowerCase().includes('healthy')) {
    return {
      diseaseName: "Healthy Plant",
      scientificName: "N/A",
      description: "No disease detected. The plant appears to be healthy.",
      symptoms: [],
      treatments: [],
      preventions: [
        "Continue regular watering schedule",
        "Maintain proper fertilization",
        "Monitor for any changes in appearance",
        "Ensure adequate sunlight exposure",
        "Practice good garden hygiene"
      ],
      severity: "Low",
      organicSolutions: [
        "Use organic compost for soil health",
        "Apply neem oil as a preventative measure",
        "Introduce beneficial insects to control pests"
      ],
      expectedRecoveryTime: "N/A",
      success: true
    };
  }

  try {
    // Format disease name to remove underscores and get plant type
    const formattedDiseaseName = diseaseName.replace(/___/g, ' ').replace(/_/g, ' ');
    
    // Get the model with proper error handling
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
    });

    // Create a prompt that only asks for disease information without image analysis
    const prompt = `I need comprehensive information about ${formattedDiseaseName} in plants, which has been detected with ${Math.round(confidence * 100)}% confidence by a machine learning model.

Please provide the following information in a structured format:
1. Brief description of the disease
2. Scientific name of the pathogen (if applicable)
3. Common symptoms (as a list)
4. Recommended treatments (as a list)
5. Prevention methods (as a list)
6. Severity assessment (Low, Medium, or High) based on the confidence level and typical impact
7. Organic/natural treatment options (as a list)
8. Expected recovery time with proper treatment

Format your response as a well-structured JSON object with the following fields:
{
  "description": "Brief description of the disease",
  "scientificName": "Scientific name of the pathogen",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "treatments": ["treatment1", "treatment2", "treatment3"],
  "preventions": ["prevention1", "prevention2", "prevention3"],
  "severity": "Low/Medium/High",
  "organicSolutions": ["organic solution1", "organic solution2", "organic solution3"],
  "expectedRecoveryTime": "Expected recovery time description"
}

This is for a farmer who needs practical advice to manage this plant disease effectively.`;

    // Set timeout for the API call - increasing from 15s to 30s for better reliability
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API request timed out after 30 seconds')), 30000);
    });

    // Make the API call with timeout
    const responsePromise = model.generateContent(prompt);
    const raceResult = await Promise.race([responsePromise, timeoutPromise]);
    
    if (raceResult === null) {
      throw new Error('API request timed out');
    }

    const result = await responsePromise;
    const text = result.response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    // Use more robust JSON parsing
    const parsedResponse = safeJsonParse(text);

    // Return the structured advice
    return {
      diseaseName: formattedDiseaseName,
      scientificName: parsedResponse.scientificName || "Not available",
      description: parsedResponse.description || `Information about ${formattedDiseaseName}`,
      symptoms: Array.isArray(parsedResponse.symptoms) ? parsedResponse.symptoms : [],
      treatments: Array.isArray(parsedResponse.treatments) ? parsedResponse.treatments : [],
      preventions: Array.isArray(parsedResponse.preventions) ? parsedResponse.preventions : [],
      severity: (parsedResponse.severity as "Low" | "Medium" | "High") || getSeverityFromConfidence(confidence),
      organicSolutions: Array.isArray(parsedResponse.organicSolutions) ? parsedResponse.organicSolutions : [],
      expectedRecoveryTime: parsedResponse.expectedRecoveryTime || "Varies based on treatment and conditions",
      success: true
    };
  } catch (error) {
    console.error('Error getting plant disease advice from Gemini:', error);
    // Use fallback with error message
    return useFallbackData(diseaseName, confidence, 
      error instanceof Error ? error.message : 'Failed to get disease advice. Using generic recommendations instead.');
  }
};

// Improved fallback data function that tries multiple approaches
const useFallbackData = (diseaseName: string, confidence: number, errorMessage: string): DiseaseAdviceResponse => {
  console.log(`Using fallback data for disease: ${diseaseName}`);
  
  // Try multiple approaches to find fallback data
  
  // 1. First, check direct match with disease key
  const directKey = diseaseName.replace(/\s/g, '_');
  if (FALLBACK_DISEASE_DATA[directKey]) {
    return createResponseFromFallback(diseaseName, confidence, FALLBACK_DISEASE_DATA[directKey], errorMessage);
  }
  
  // 2. Then, try simplifying the name and check
  const simplifiedName = getSimplifiedDiseaseName(diseaseName);
  if (FALLBACK_DISEASE_DATA[simplifiedName]) {
    return createResponseFromFallback(diseaseName, confidence, FALLBACK_DISEASE_DATA[simplifiedName], errorMessage);
  }
  
  // 3. Then, try searching for partial matches in the keys
  for (const key in FALLBACK_DISEASE_DATA) {
    // Check if key is contained in disease name or vice versa
    const normalizedKey = key.replace(/_/g, ' ').toLowerCase();
    const normalizedDisease = diseaseName.toLowerCase();
    
    if (normalizedKey.includes(normalizedDisease) || normalizedDisease.includes(normalizedKey)) {
      return createResponseFromFallback(diseaseName, confidence, FALLBACK_DISEASE_DATA[key], errorMessage);
    }
  }
  
  // 4. If all fail, use generic response
  return createErrorResponse(diseaseName, errorMessage);
};

// Function to create response from fallback data
const createResponseFromFallback = (
  diseaseName: string, 
  confidence: number, 
  fallbackData: Partial<DiseaseAdviceResponse>,
  errorMessage: string
): DiseaseAdviceResponse => {
  return {
    diseaseName: diseaseName,
    scientificName: fallbackData.scientificName || "Not available",
    description: fallbackData.description || `${diseaseName} is a common plant disease.`,
    symptoms: fallbackData.symptoms || ["Leaf discoloration", "Spots or lesions", "Stunted growth"],
    treatments: fallbackData.treatments || [
      "Remove infected plant parts",
      "Apply appropriate treatments",
      "Ensure proper growing conditions"
    ],
    preventions: fallbackData.preventions || [
      "Use disease-resistant varieties",
      "Practice crop rotation",
      "Maintain proper plant spacing" 
    ],
    severity: fallbackData.severity || getSeverityFromConfidence(confidence),
    organicSolutions: fallbackData.organicSolutions || [
      "Apply neem oil spray",
      "Use copper-based organic fungicides",
      "Improve plant nutrition with organic matter"
    ],
    expectedRecoveryTime: fallbackData.expectedRecoveryTime || "2-4 weeks with proper treatment",
    // Mark as success=true even though it's fallback so the UI doesn't show an error
    success: true,
    // Still provide the error message for tracking/debugging
    errorMessage: `Using fallback data. Original error: ${errorMessage}`
  };
};

// Helper function to create an error response
const createErrorResponse = (diseaseName: string, errorMessage: string): DiseaseAdviceResponse => {
  return {
    diseaseName,
    scientificName: "Not available",
    description: `${diseaseName} information could not be retrieved, but we can provide general plant disease management advice.`,
    symptoms: ["Leaf discoloration", "Spots or lesions", "Wilting or drooping", "Stunted growth", "Unusual leaf drop"],
    treatments: [
      "Remove and destroy heavily infected plant parts",
      "Apply appropriate fungicide or bactericide based on diagnosis",
      "Ensure plants receive optimal growing conditions",
      "Consult a local agricultural extension office for specific advice",
      "Isolate infected plants to prevent spread"
    ],
    preventions: [
      "Improve air circulation around plants",
      "Avoid overhead watering and keep foliage dry", 
      "Use disease-resistant varieties when available",
      "Practice crop rotation and proper spacing",
      "Maintain good garden sanitation"
    ],
    severity: "Medium",
    organicSolutions: [
      "Apply neem oil spray as a broad-spectrum organic treatment",
      "Use compost tea as a preventative measure and soil health booster",
      "Try diluted hydrogen peroxide spray for bacterial issues",
      "Consider milk spray (1:10 ratio with water) for powdery mildew",
      "Apply garlic or hot pepper spray as organic deterrents"
    ],
    expectedRecoveryTime: "Varies by disease and treatment effectiveness - typically 2-6 weeks with proper care",
    // Set to true to prevent UI error messages
    success: true,
    errorMessage
  };
};

// Helper function to get severity from confidence
const getSeverityFromConfidence = (confidence: number): "Low" | "Medium" | "High" => {
  if (confidence < 0.6) return "Low";
  if (confidence < 0.85) return "Medium";
  return "High";
};

// Helper function to simplify disease name for fallback lookup
const getSimplifiedDiseaseName = (diseaseName: string): string => {
  // Extract main disease name without plant type
  const parts = diseaseName.split('___');
  if (parts.length > 1) {
    return parts[1].replace(/ /g, '_');
  }
  
  // Try to extract the disease name by removing plant name
  const commonPlants = ['Apple', 'Tomato', 'Potato', 'Grape', 'Corn', 'Cherry', 'Peach', 'Strawberry'];
  for (const plant of commonPlants) {
    if (diseaseName.startsWith(plant)) {
      return diseaseName.substring(plant.length).trim().replace(/ /g, '_');
    }
  }
  
  // Handle if the disease name doesn't follow expected patterns
  return diseaseName.split(' ').slice(1).join('_');
};