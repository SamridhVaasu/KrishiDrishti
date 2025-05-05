import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Stack,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ScienceIcon from '@mui/icons-material/Science';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Type for ML prediction result
interface MLPredictionResult {
  className: string;
  probability: number;
}

// Type for disease detection result
interface DiseaseDetectionResult {
  diseaseName: string;
  scientificName: string;
  confidence: number;
  severity: "Low" | "Medium" | "High";
  recommendations: string[];
}

const DiseaseDetecter = () => {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DiseaseDetectionResult | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('info');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Check if backend is running
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setSnackbarMessage('Connecting to plant disease detection backend...');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        
        const response = await fetch('http://localhost:8000/api/health');
        
        if (response.ok) {
          console.log('Backend health check successful');
          setIsBackendConnected(true);
          setSnackbarMessage('Connected to plant disease detection backend successfully');
          setSnackbarSeverity('success');
        } else {
          throw new Error('Backend health check failed');
        }
      } catch (error) {
        console.error('Error connecting to backend:', error);
        setSnackbarMessage('Failed to connect to plant disease detection backend. Please make sure the server is running.');
        setSnackbarSeverity('error');
        setIsBackendConnected(false);
      } finally {
        setSnackbarOpen(true);
      }
    };
    
    checkBackendHealth();
  }, []);

  // Send image to backend for analysis
  const processImageWithML = async (imageData: string): Promise<MLPredictionResult> => {
    try {
      console.log('Sending image to backend for analysis...');
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend API error response:', errorData);
        throw new Error(errorData.error || 'Failed to process image with backend API');
      }
      
      const result = await response.json();
      console.log('Backend API prediction result:', result);
      
      if (!result.className || typeof result.probability !== 'number') {
        console.error('Invalid prediction result format:', result);
        throw new Error('Backend returned invalid prediction format');
      }
      
      return {
        className: result.className,
        probability: result.probability
      };
    } catch (error) {
      console.error('Error processing image with backend API:', error);
      throw new Error('Failed to process image with the plant disease detection model');
    }
  };

  // Format disease name from class name
  const parseDiseaseClassName = (className: string): string => {
    const parts = className.split('___');
    if (parts.length !== 2) return className;
    
    const plant = parts[0];
    const disease = parts[1].replace(/_/g, ' ');
    
    if (disease.toLowerCase() === 'healthy') {
      return `${plant} (Healthy)`;
    }
    
    return `${plant} ${disease}`;
  };

  // Get scientific name for disease
  const getScientificName = (className: string): string => {
    // Map some common diseases to their scientific names
    const scientificNames: Record<string, string> = {
      'Apple___Apple_scab': 'Venturia inaequalis',
      'Apple___Black_rot': 'Botryosphaeria obtusa',
      'Tomato___Early_blight': 'Alternaria solani',
      'Tomato___Late_blight': 'Phytophthora infestans',
      'Potato___Late_blight': 'Phytophthora infestans',
      'Grape___Black_rot': 'Guignardia bidwellii',
      'Corn___Common_rust': 'Puccinia sorghi'
    };
    
    return scientificNames[className] || 'Scientific name unavailable';
  };

  // Get severity based on disease name
  const getSeverityFromDiseaseName = (className: string): "Low" | "Medium" | "High" => {
    if (className.includes('healthy')) return 'Low';
    if (className.includes('blight') || className.includes('virus')) return 'High';
    return 'Medium';
  };

  // Get recommendations based on disease
  const getRecommendations = (className: string): string[] => {
    if (className.includes('healthy')) {
      return [
        "Continue regular maintenance and care",
        "Monitor for any changes in plant health",
        "Maintain proper watering schedule"
      ];
    }
    
    if (className.includes('blight')) {
      return [
        "Remove and destroy infected plant tissue",
        "Apply appropriate fungicides",
        "Ensure proper air circulation between plants", 
        "Avoid overhead irrigation"
      ];
    }
    
    if (className.includes('virus')) {
      return [
        "Remove and destroy infected plants",
        "Control insect vectors like aphids or whiteflies",
        "Disinfect gardening tools",
        "Plant virus-resistant varieties next season"
      ];
    }
    
    // Generic recommendations
    return [
      "Remove affected plant parts",
      "Apply appropriate treatments",
      "Improve plant spacing for better air circulation",
      "Consider resistant varieties for future planting"
    ];
  };

  // Get color based on severity
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Low':
        return theme.palette.success.main;
      case 'Medium':
        return theme.palette.warning.main;
      case 'High':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const processSelectedFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setSnackbarMessage('Please select an image file');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbarMessage('Image size should be less than 5MB');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset previous analysis
    setDetectionResult(null);
  };

  // Handle drag and drop events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setDetectionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Analyze the uploaded image
  const handleAnalyze = async () => {
    if (!selectedImage || !imagePreview || !isBackendConnected) return;
    
    setIsAnalyzing(true);
    setSnackbarMessage('Analyzing plant image...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    try {
      // Get prediction from ML model
      const prediction = await processImageWithML(imagePreview);
      console.log('ML prediction successful:', prediction);
      
      // Parse the disease name and create result
      const diseaseName = parseDiseaseClassName(prediction.className);
      const scientificName = getScientificName(prediction.className);
      const severity = getSeverityFromDiseaseName(prediction.className);
      const recommendations = getRecommendations(prediction.className);
      
      // Create detection result
      const result: DiseaseDetectionResult = {
        diseaseName,
        scientificName,
        confidence: prediction.probability,
        severity,
        recommendations
      };
      
      setDetectionResult(result);
      setSnackbarMessage(`Analysis complete! ${diseaseName} detected with ${Math.round(prediction.probability * 100)}% confidence.`);
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error analyzing plant image:', error);
      setSnackbarMessage('Failed to analyze plant image. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setIsAnalyzing(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="md" sx={{ p: 3 }}>
      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScienceIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            KrishiDrishti Disease Detector
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
          Upload a clear image of a plant leaf or affected area for disease detection using machine learning.
        </Typography>

        {/* Upload Section */}
        {!imagePreview ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
              mb: 3,
              border: '2px dashed',
              borderColor: isDragging 
                ? theme.palette.primary.main 
                : theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
              borderRadius: 3,
              bgcolor: isDragging 
                ? theme.palette.mode === 'light' ? 'rgba(46, 125, 50, 0.04)' : 'rgba(129, 199, 132, 0.04)'
                : theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
              transition: 'all 0.3s ease-in-out',
              cursor: 'pointer',
            }}
            onClick={handleUploadClick}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <CloudUploadIcon sx={{ fontSize: 60, mb: 2, color: theme.palette.primary.main }} />
            <Typography variant="h6" align="center" gutterBottom fontWeight={500}>
              Drag & Drop or Click to Upload
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: theme.palette.text.secondary }}>
              Supports: JPG, PNG, WEBP (max 5MB)
            </Typography>

            {!isBackendConnected && (
              <Alert severity="warning" sx={{ mt: 3, width: '100%' }}>
                Backend connection failed. Make sure the ML server is running.
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ mb: 2, position: 'relative' }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 1, 
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <PhotoCameraIcon fontSize="small" color="primary" />
                Plant Image
              </Typography>
              
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  borderRadius: 2,
                  p: 2,
                  maxHeight: '300px',
                  overflow: 'hidden',
                }}
              >
                <img 
                  ref={imageRef}
                  src={imagePreview} 
                  alt="Plant preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    objectFit: 'contain' 
                  }} 
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mb: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleClearImage}
                sx={{ borderRadius: 2 }}
              >
                Clear Image
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                disabled={!isBackendConnected || isAnalyzing}
                onClick={handleAnalyze}
                startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
                sx={{ borderRadius: 2, px: 3 }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Detect Disease'}
              </Button>
            </Stack>

            {selectedImage && (
              <Typography variant="caption" align="center" color="text.secondary" sx={{ display: 'block' }}>
                {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
              </Typography>
            )}
          </Box>
        )}

        {/* Results Section */}
        {detectionResult && (
          <Card sx={{ 
            mt: 3, 
            borderLeft: `4px solid ${getSeverityColor(detectionResult.severity)}`,
            boxShadow: `0 0 12px ${getSeverityColor(detectionResult.severity)}25`,
            borderRadius: 2
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {detectionResult.diseaseName}
                </Typography>
                <Chip 
                  size="small" 
                  label={`${Math.round(detectionResult.confidence * 100)}% confidence`} 
                  color="primary"
                  sx={{ borderRadius: 1 }}
                />
              </Box>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Scientific Name:</strong> <em>{detectionResult.scientificName}</em>
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Severity:</strong> <span style={{ color: getSeverityColor(detectionResult.severity) }}>{detectionResult.severity}</span>
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Recommendations:
              </Typography>

              <List dense disablePadding sx={{ mb: 1 }}>
                {detectionResult.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={handleClearImage}
                  sx={{ borderRadius: 2 }}
                >
                  Scan Another Plant
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DiseaseDetecter;