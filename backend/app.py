from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables for model and class indices
model = None
class_indices = None

# List of plant disease classes in the same order as your model's output
DISEASE_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry___Powdery_mildew",
    "Cherry___healthy",
    "Corn___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn___Common_rust",
    "Corn___Northern_Leaf_Blight",
    "Corn___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

# Function to load and preprocess the image
def preprocess_image(image_data):
    # Decode the base64 image
    try:
        # Remove the prefix 'data:image/jpeg;base64,' if it exists
        if ',' in image_data:
            image_data = image_data.split(',')[1]
            
        # Decode base64 string to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Open image with PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Resize to target size (224x224 is common for many models)
        image = image.resize((224, 224))
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        # Scale pixel values to [0, 1]
        img_array = img_array.astype('float32') / 255.0
        
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}")
        return None

def load_model_function():
    global model
    try:
        print("Loading model...")
        model_path = os.path.join(os.path.dirname(__file__), '../public/models/plant_disease_prediction_model.h5')
        model = tf.keras.models.load_model(model_path)
        print(f"Model loaded successfully from {model_path}")
        return True
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False

# Route for model prediction
@app.route('/api/predict', methods=['POST'])
def predict():
    global model
    
    # Check if model is loaded
    if model is None:
        success = load_model_function()
        if not success:
            return jsonify({'error': 'Failed to load the model'}), 500
    
    # Get image data from request
    if 'image' not in request.json:
        print("Error: No image data found in request")
        return jsonify({'error': 'No image data provided'}), 400
    
    image_data = request.json['image']
    print(f"Received image data of length: {len(image_data)}")
    
    try:
        # Preprocess the image
        processed_image = preprocess_image(image_data)
        if processed_image is None:
            print("Error: Failed to preprocess image")
            return jsonify({'error': 'Failed to process image'}), 400
        
        print(f"Image preprocessed successfully. Shape: {processed_image.shape}")
        
        # Make prediction
        try:
            print("Running prediction on processed image...")
            predictions = model.predict(processed_image)
            # Get the predicted class index
            predicted_class_index = np.argmax(predictions[0])
            probability = float(predictions[0][predicted_class_index])
            
            # Get the class name from the DISEASE_CLASSES list
            if predicted_class_index < len(DISEASE_CLASSES):
                class_name = DISEASE_CLASSES[predicted_class_index]
            else:
                class_name = f"Unknown Class {predicted_class_index}"
            
            print(f"Prediction successful: {class_name} with probability {probability}")
            
            return jsonify({
                'className': class_name,
                'probability': probability
            })
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            return jsonify({'error': f'Prediction failed: {str(e)}'}), 500
    except Exception as e:
        print(f"General error during image processing: {str(e)}")
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

# Health check route
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Plant disease detection API is running'})

if __name__ == '__main__':
    # Load model on startup 
    load_model_function()
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 8000))  # Changed default port from 5000 to 8000
    print(f"Starting Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)

