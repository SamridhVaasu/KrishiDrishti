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
  ListItemText,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  alpha
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ScienceIcon from '@mui/icons-material/Science';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DescriptionIcon from '@mui/icons-material/Description';
import BiotechIcon from '@mui/icons-material/Biotech';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ShieldIcon from '@mui/icons-material/Shield';
import NatureIcon from '@mui/icons-material/Nature';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import EcoIcon from '@mui/icons-material/Nature';
import PestControlIcon from '@mui/icons-material/PestControl';
import SpaIcon from '@mui/icons-material/Spa';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { getDiseaseTreatmentAdvice, DiseaseAdviceResponse } from '../utils/plantDiseaseGemini';

// Type for ML prediction result
interface MLPredictionResult {
  className: string;
  probability: number;
}

// Enhanced type for disease detection result that integrates with Gemini advice
interface DiseaseDetectionResult extends DiseaseAdviceResponse {
  confidence: number;
}

const PlantDiagnostic = () => {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DiseaseDetectionResult | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('info');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if backend is running
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setSnackbarMessage('Connecting to plant health diagnostics service...');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        setConnectionError(null);
        
        // Set timeout to avoid long wait
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://localhost:8000/api/health', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('Backend health check successful');
          setIsBackendConnected(true);
          setSnackbarMessage('Connected to plant diagnostic backend successfully');
          setSnackbarSeverity('success');
        } else {
          throw new Error('Backend health check failed with status: ' + response.status);
        }
      } catch (error) {
        console.error('Error connecting to backend:', error);
        setConnectionError(
          error.name === 'AbortError' 
            ? 'Connection timed out. The server is not responding.'
            : `Failed to connect to the diagnostic backend. ${error.message || 'Please make sure the server is running.'}`
        );
        setSnackbarMessage('Failed to connect to plant diagnostic backend. Please ensure the server is running.');
        setSnackbarSeverity('error');
        setIsBackendConnected(false);
      } finally {
        setSnackbarOpen(true);
      }
    };
    
    checkBackendHealth();
  }, []);

  // Send image to backend for analysis with improved error handling
  const processImageWithML = async (imageData: string): Promise<MLPredictionResult> => {
    try {
      console.log('Sending image to backend for analysis...');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend API error response:', errorData);
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Backend API prediction result:', result);
      
      if (!result.className || typeof result.probability !== 'number') {
        console.error('Invalid prediction result format:', result);
        throw new Error('Backend returned invalid prediction format. Expected className and probability.');
      }
      
      return {
        className: result.className,
        probability: result.probability
      };
    } catch (error) {
      console.error('Error processing image with backend API:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server took too long to respond.');
      }
      throw error;
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

  // Validate image dimensions and format
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Validate dimensions (minimum size requirements)
          if (img.width < 100 || img.height < 100) {
            reject(new Error('Image is too small. Please use an image at least 100x100 pixels.'));
            return;
          }
          resolve(true);
        };
        img.onerror = () => {
          reject(new Error('Invalid image format. Please use a valid JPG, PNG, or WEBP file.'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Error reading the image file.'));
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const processSelectedFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setSnackbarMessage('Please select an image file (JPG, PNG, or WEBP)');
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

    try {
      // Validate image dimensions and format
      await validateImage(file);
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset previous analysis
      setDetectionResult(null);
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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

  // Change tab
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Retry connection to backend
  const handleRetryConnection = async () => {
    setSnackbarMessage('Retrying connection to backend...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/health', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setIsBackendConnected(true);
        setConnectionError(null);
        setSnackbarMessage('Successfully connected to backend!');
        setSnackbarSeverity('success');
      } else {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setConnectionError(
        error.name === 'AbortError'
          ? 'Connection timed out. The server is not responding.'
          : `Failed to connect to the diagnostic backend. ${error.message || 'Please make sure the server is running.'}`
      );
      setSnackbarMessage('Failed to connect to backend. Please ensure the server is running.');
      setSnackbarSeverity('error');
      setIsBackendConnected(false);
    } finally {
      setSnackbarOpen(true);
    }
  };

  // Analyze the uploaded image
  const handleAnalyze = async () => {
    if (!selectedImage || !imagePreview || !isBackendConnected) return;
    
    setIsAnalyzing(true);
    setSnackbarMessage('Analyzing plant image...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    try {
      // Step 1: Get prediction from ML model
      const prediction = await processImageWithML(imagePreview);
      console.log('ML prediction successful:', prediction);
      
      // Step 2: Parse the disease name
      const diseaseName = parseDiseaseClassName(prediction.className);
      
      // Step 3: Get detailed advice from Gemini LLM
      setIsLoadingAdvice(true);
      setSnackbarMessage('Getting detailed advice for detected condition...');
      
      const adviceResult = await getDiseaseTreatmentAdvice(diseaseName, prediction.probability);
      console.log('Disease advice result:', adviceResult);
      
      // Step 4: Create full detection result with Gemini advice
      const result: DiseaseDetectionResult = {
        ...adviceResult,
        confidence: prediction.probability
      };
      
      setDetectionResult(result);
      
      // Show appropriate message based on success of advice retrieval
      if (result.success) {
        setSnackbarMessage(`Analysis complete! ${diseaseName} detected with ${Math.round(prediction.probability * 100)}% confidence.`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage(`Condition detected, but advice retrieval had issues: ${result.errorMessage}`);
        setSnackbarSeverity('warning');
      }
    } catch (error) {
      console.error('Error analyzing plant image:', error);
      setSnackbarMessage(`Failed to analyze plant image: ${error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setIsAnalyzing(false);
      setIsLoadingAdvice(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }} ref={containerRef}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          minHeight: '85vh',
          maxHeight: '85vh',
          overflow: 'hidden',
          backgroundImage: theme.palette.mode === 'light' 
            ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.95)), url("/textures/subtle_dots.png")'
            : 'none',
          backgroundRepeat: 'repeat',
          borderTop: `4px solid ${theme.palette.primary.main}`,
        }}
      >
        {/* Header with improved gradient and design */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <SpaIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main, lineHeight: 1.2 }}>
                Plant Diagnostic
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                AI-powered plant health analysis and treatment recommendations
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Help & Information">
            <IconButton 
              size="small" 
              color="primary"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.07),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                }
              }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {/* Left Column - Upload & Image Preview */}
          <Grid item xs={12} md={4} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            maxHeight: '75vh',
            overflow: 'hidden'
          }}>
            {!imagePreview ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 3,
                  flexGrow: 1,
                  border: '2px dashed',
                  borderColor: isDragging 
                    ? theme.palette.primary.main 
                    : alpha(theme.palette.primary.main, 0.2),
                  borderRadius: 3,
                  bgcolor: isDragging 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.02),
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  backgroundImage: theme.palette.mode === 'light' 
                    ? 'radial-gradient(circle at 50% 50%, rgba(46, 125, 50, 0.03) 0%, rgba(255, 255, 255, 0) 70%)'
                    : 'none',
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
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 80,
                    height: 80,
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                  Upload Plant Image
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                  Drag & drop or click to select a photo
                </Typography>
                <Typography variant="caption" align="center" sx={{ 
                  color: theme.palette.text.secondary,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }}>
                  Supports JPG, PNG, WEBP (max 5MB)
                </Typography>

                {connectionError && (
                  <Alert 
                    severity="warning" 
                    sx={{ mt: 3, width: '100%' }}
                    icon={<WarningAmberIcon />}
                    action={
                      <Button 
                        color="warning" 
                        size="small" 
                        onClick={handleRetryConnection}
                        startIcon={<RefreshIcon />}
                      >
                        Retry
                      </Button>
                    }
                  >
                    {connectionError}
                  </Alert>
                )}
              </Box>
            ) : (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 3,
                p: 2,
              }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <PhotoCameraIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Plant Image Analysis
                </Typography>
                
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center', 
                    borderRadius: 2,
                    p: 1,
                    mb: 2,
                    flexGrow: 1,
                    maxHeight: '55vh',
                    overflow: 'hidden',
                    bgcolor: '#fff',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img 
                    ref={imageRef}
                    src={imagePreview} 
                    alt="Plant preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }} 
                  />
                </Box>

                <Stack spacing={2}>
                  {selectedImage && (
                    <Typography variant="caption" color="text.secondary" align="center">
                      {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
                    </Typography>
                  )}

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearImage}
                      fullWidth
                      sx={{
                        borderColor: alpha(theme.palette.error.main, 0.5),
                        color: theme.palette.error.main,
                        '&:hover': {
                          borderColor: theme.palette.error.main,
                          bgcolor: alpha(theme.palette.error.main, 0.05),
                        }
                      }}
                    >
                      Clear
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!isBackendConnected || isAnalyzing || isLoadingAdvice}
                      onClick={handleAnalyze}
                      startIcon={
                        isAnalyzing || isLoadingAdvice ? 
                          <CircularProgress size={20} color="inherit" /> : 
                          <BiotechIcon />
                      }
                      fullWidth
                      sx={{
                        fontWeight: 600,
                        boxShadow: '0 4px 10px rgba(46, 125, 50, 0.2)',
                        '&:hover': {
                          boxShadow: '0 6px 15px rgba(46, 125, 50, 0.25)',
                        }
                      }}
                    >
                      {isAnalyzing ? 'Analyzing...' : 
                       isLoadingAdvice ? 'Getting Advice...' : 
                       'Diagnose Plant'}
                    </Button>
                  </Stack>
                </Stack>
                
                {connectionError && (
                  <Alert severity="warning" sx={{ mt: 2, fontSize: '0.85rem' }}>
                    {connectionError}
                  </Alert>
                )}
              </Box>
            )}
          </Grid>

          {/* Right Column - Results with enhanced styling */}
          <Grid item xs={12} md={8} sx={{ 
            maxHeight: '75vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {(isAnalyzing || isLoadingAdvice) ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                p: 4,
                textAlign: 'center',
              }}>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    mb: 3, 
                    width: 80, 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <CircularProgress 
                    size={80} 
                    thickness={3} 
                    sx={{ 
                      color: theme.palette.primary.main,
                      opacity: 0.3,
                      position: 'absolute'
                    }} 
                  />
                  <CircularProgress 
                    size={80} 
                    thickness={3} 
                    variant="determinate" 
                    value={isAnalyzing ? 50 : 75} 
                    sx={{ 
                      color: theme.palette.primary.main,
                      position: 'absolute'
                    }} 
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isAnalyzing ? <BiotechIcon sx={{ fontSize: 28 }} /> : <LocalHospitalIcon sx={{ fontSize: 28 }} />}
                  </Box>
                </Box>
                
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {isAnalyzing ? 'Analyzing Plant Image...' : 'Getting Treatment Advice...'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>
                  {isAnalyzing ? 
                    'Our advanced AI model is examining your plant to identify any health issues or diseases.' : 
                    'Generating personalized care recommendations based on the identified condition.'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'inline-block',
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }}>
                  This usually takes 15-20 seconds
                </Typography>
              </Box>
            ) : detectionResult ? (
              <Box 
                sx={{ 
                  height: '100%', 
                  overflow: 'auto', 
                  pr: 1,
                  bgcolor: theme.palette.mode === 'light' ? alpha(theme.palette.background.paper, 0.5) : 'transparent',
                  borderRadius: 3,
                }}
              >
                {/* Status Card with Animation */}
                <Card sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden',
                  borderLeft: `5px solid ${getSeverityColor(detectionResult.severity)}`,
                  position: 'relative',
                }}>
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: '100%',
                      background: `linear-gradient(90deg, ${alpha(getSeverityColor(detectionResult.severity), 0.15)} 0%, rgba(255,255,255,0) 50%)`,
                      display: theme.palette.mode === 'light' ? 'block' : 'none',
                    }} 
                  />
                  
                  <CardContent sx={{ position: 'relative', p: 3 }}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>
                        <Avatar
                          sx={{
                            bgcolor: alpha(getSeverityColor(detectionResult.severity), 0.2),
                            color: getSeverityColor(detectionResult.severity),
                            width: 56,
                            height: 56,
                            border: `2px solid ${alpha(getSeverityColor(detectionResult.severity), 0.3)}`,
                          }}
                        >
                          {detectionResult.diseaseName.includes('Healthy') ? 
                            <CheckCircleIcon sx={{ fontSize: 30 }} /> : 
                            <EcoIcon sx={{ fontSize: 30 }} />}
                        </Avatar>
                      </Grid>
                      <Grid item xs>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {detectionResult.diseaseName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <em>{detectionResult.scientificName}</em>
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Stack direction="column" spacing={1} alignItems="flex-end">
                          <Chip 
                            size="medium" 
                            label={`${Math.round(detectionResult.confidence * 100)}% confidence`} 
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            size="small" 
                            label={`${detectionResult.severity} severity`} 
                            sx={{ 
                              bgcolor: alpha(getSeverityColor(detectionResult.severity), 0.15),
                              color: getSeverityColor(detectionResult.severity),
                              fontWeight: 600,
                              border: `1px solid ${alpha(getSeverityColor(detectionResult.severity), 0.3)}`,
                            }}
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {!detectionResult.success && (
                  <Alert 
                    severity="warning" 
                    variant="outlined"
                    sx={{ mb: 3 }}
                    icon={<WarningAmberIcon />}
                  >
                    {detectionResult.errorMessage || 'Some advice could not be retrieved. Showing fallback recommendations.'}
                  </Alert>
                )}

                {/* Enhanced tab design */}
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ 
                    mb: 3,
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                    '& .MuiTab-root': {
                      minHeight: '48px',
                      py: 1.5,
                      px: 2,
                      mx: 0.5,
                      borderRadius: '8px 8px 0 0',
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }
                    }
                  }}
                >
                  <Tab 
                    icon={<DescriptionIcon fontSize="small" />} 
                    label="Overview" 
                    id="tab-0"
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                  <Tab 
                    icon={<BiotechIcon fontSize="small" />}
                    label="Symptoms"
                    id="tab-1" 
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                  <Tab 
                    icon={<LocalHospitalIcon fontSize="small" />}
                    label="Treatment" 
                    id="tab-2"
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                  <Tab 
                    icon={<ShieldIcon fontSize="small" />}
                    label="Prevention" 
                    id="tab-3"
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                  <Tab 
                    icon={<NatureIcon fontSize="small" />}
                    label="Organic" 
                    id="tab-4"
                    iconPosition="start"
                    sx={{ fontWeight: 600 }}
                  />
                </Tabs>

                <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                  {/* Overview Tab */}
                  <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" sx={{ height: '100%' }}>
                    {activeTab === 0 && (
                      <Box sx={{ px: 1 }}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 3, 
                            mb: 3, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}
                        >
                          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                            {detectionResult.description}
                          </Typography>
                        </Paper>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                borderRadius: 2,
                                height: '100%',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                              }}
                            >
                              <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 600, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  mb: 2,
                                  color: theme.palette.primary.main 
                                }}>
                                  <BiotechIcon fontSize="small" sx={{ mr: 1 }} />
                                  Key Symptoms
                                </Typography>
                                <List disablePadding>
                                  {detectionResult.symptoms.slice(0, 3).map((symptom, index) => (
                                    <ListItem key={index} sx={{ py: 0.75, px: 0 }}>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Box sx={{ 
                                          width: 24, 
                                          height: 24, 
                                          borderRadius: '50%', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                                        }}>
                                          <CheckCircleIcon fontSize="small" color="primary" />
                                        </Box>
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={symptom} 
                                        primaryTypographyProps={{ 
                                          variant: 'body2',
                                          sx: { lineHeight: 1.5 }
                                        }} 
                                      />
                                    </ListItem>
                                  ))}
                                  {detectionResult.symptoms.length > 3 && (
                                    <Button
                                      variant="text"
                                      size="small"
                                      onClick={() => setActiveTab(1)}
                                      sx={{ ml: 4.5, mt: 1 }}
                                    >
                                      See all symptoms
                                    </Button>
                                  )}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                borderRadius: 2,
                                height: '100%',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                              }}
                            >
                              <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 600, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  mb: 1.5,
                                  color: theme.palette.primary.main 
                                }}>
                                  <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                                  Recovery Timeline
                                </Typography>
                                <Box sx={{ 
                                  p: 1.5, 
                                  mb: 2, 
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  borderRadius: 1.5,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                }}>
                                  <Typography variant="body2">
                                    {detectionResult.expectedRecoveryTime}
                                  </Typography>
                                </Box>

                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 600, 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  mb: 1.5,
                                  color: theme.palette.primary.main
                                }}>
                                  <LocalHospitalIcon fontSize="small" sx={{ mr: 1 }} />
                                  Treatment Actions
                                </Typography>
                                <List disablePadding>
                                  {detectionResult.treatments.slice(0, 2).map((treatment, index) => (
                                    <ListItem key={index} sx={{ py: 0.75, px: 0 }}>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Box sx={{ 
                                          width: 24, 
                                          height: 24, 
                                          borderRadius: '50%', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center',
                                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                                        }}>
                                          <CheckCircleIcon fontSize="small" color="primary" />
                                        </Box>
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={treatment} 
                                        primaryTypographyProps={{ 
                                          variant: 'body2',
                                          sx: { lineHeight: 1.5 }
                                        }} 
                                      />
                                    </ListItem>
                                  ))}
                                  {detectionResult.treatments.length > 2 && (
                                    <Button
                                      variant="text"
                                      size="small"
                                      onClick={() => setActiveTab(2)}
                                      sx={{ ml: 4.5, mt: 1 }}
                                    >
                                      See all treatments
                                    </Button>
                                  )}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<RestartAltIcon />}
                            onClick={handleClearImage}
                            sx={{
                              fontWeight: 600,
                              px: 3,
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                              '&:hover': {
                                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                              }
                            }}
                          >
                            Analyze Another Plant
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Symptoms Tab with enhanced styling */}
                  <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" sx={{ height: '100%' }}>
                    {activeTab === 1 && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.background.paper, 0.7),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                      >
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 2, 
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <BiotechIcon sx={{ mr: 1 }} /> 
                          Symptoms & Identification
                        </Typography>
                        
                        {detectionResult.symptoms.length === 0 ? (
                          <Alert severity="success" variant="outlined" sx={{ my: 2 }}>
                            No symptoms identified - this plant appears to be healthy.
                          </Alert>
                        ) : (
                          <List>
                            {detectionResult.symptoms.map((symptom, index) => (
                              <ListItem key={index} sx={{ 
                                py: 1.5, 
                                px: 2, 
                                mb: 1.5, 
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` 
                              }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: theme.palette.primary.main,
                                    }}
                                  >
                                    {index + 1}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText 
                                  primary={symptom} 
                                  primaryTypographyProps={{ variant: 'body1', sx: { fontWeight: 500 } }} 
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                        
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mb: 2, 
                            color: theme.palette.text.secondary 
                          }}>
                            Accuracy: {Math.round(detectionResult.confidence * 100)}% confidence in this assessment
                          </Typography>
                          
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setActiveTab(2)}
                            endIcon={<LocalHospitalIcon />}
                          >
                            View Treatment Options
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>

                  {/* Treatment Tab with enhanced styling */}
                  <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-2" sx={{ height: '100%' }}>
                    {activeTab === 2 && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.background.paper, 0.7),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                      >
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 2, 
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <LocalHospitalIcon sx={{ mr: 1 }} /> 
                          Recommended Treatments
                        </Typography>
                        
                        {detectionResult.treatments.length === 0 ? (
                          <Alert severity="success" variant="outlined" sx={{ my: 2 }}>
                            No treatments needed - this plant appears to be healthy.
                          </Alert>
                        ) : (
                          <>
                            <Box sx={{ 
                              p: 2, 
                              mb: 3, 
                              borderRadius: 2, 
                              bgcolor: alpha(theme.palette.info.main, 0.08),
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5
                            }}>
                              <AccessTimeIcon color="info" />
                              <Typography variant="body2">
                                {detectionResult.expectedRecoveryTime}
                              </Typography>
                            </Box>
                            
                            <Box
                              sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                              }}
                            >
                              {detectionResult.treatments.map((treatment, index) => (
                                <Card 
                                  key={index} 
                                  variant="outlined"
                                  sx={{ 
                                    borderRadius: 2,
                                    bgcolor: theme.palette.background.paper,
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                                  }}
                                >
                                  <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                      <Avatar
                                        sx={{
                                          bgcolor: theme.palette.primary.main,
                                          width: 28,
                                          height: 28,
                                        }}
                                      >
                                        {index + 1}
                                      </Avatar>
                                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {treatment}
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Box>
                          </>
                        )}
                        
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setActiveTab(3)}
                            endIcon={<ShieldIcon />}
                          >
                            View Prevention Methods
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>

                  {/* Prevention Tab with enhanced styling */}
                  <Box role="tabpanel" hidden={activeTab !== 3} id="tabpanel-3" sx={{ height: '100%' }}>
                    {activeTab === 3 && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.background.paper, 0.7),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                      >
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 2.5, 
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <ShieldIcon sx={{ mr: 1 }} /> 
                          Prevention Strategies
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Follow these preventive measures to avoid future occurrences and maintain plant health.
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {detectionResult.preventions.map((prevention, index) => (
                            <Grid item xs={12} key={index}>
                              <Box sx={{ 
                                p: 2, 
                                borderRadius: 2,
                                bgcolor: theme.palette.background.paper,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                display: 'flex',
                                gap: 2
                              }}>
                                <Box 
                                  sx={{ 
                                    width: 36, 
                                    height: 36, 
                                    borderRadius: '50%', 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <CheckCircleIcon color="primary" />
                                </Box>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {prevention}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setActiveTab(4)}
                            endIcon={<NatureIcon />}
                          >
                            View Organic Solutions
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>

                  {/* Organic Tab with enhanced styling */}
                  <Box role="tabpanel" hidden={activeTab !== 4} id="tabpanel-4" sx={{ height: '100%' }}>
                    {activeTab === 4 && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.background.paper, 0.7),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                      >
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 2.5, 
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <NatureIcon sx={{ mr: 1 }} /> 
                          Organic & Natural Solutions
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Eco-friendly alternatives that are gentle on your plants and the environment.
                        </Typography>
                        
                        <Box
                          sx={{
                            display: 'grid',
                            gap: 2.5,
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                          }}
                        >
                          {detectionResult.organicSolutions.map((solution, index) => (
                            <Card 
                              key={index} 
                              variant="outlined"
                              sx={{ 
                                borderRadius: 2,
                                borderColor: alpha(theme.palette.success.main, 0.3),
                                bgcolor: alpha(theme.palette.success.main, 0.02),
                              }}
                            >
                              <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                                  <Avatar
                                    sx={{
                                      bgcolor: alpha(theme.palette.success.main, 0.2),
                                      color: theme.palette.success.main,
                                      width: 32,
                                      height: 32,
                                    }}
                                  >
                                    <NatureIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                    Organic Solution {index + 1}
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  {solution}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                        
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RestartAltIcon />}
                            onClick={handleClearImage}
                            sx={{
                              fontWeight: 600,
                              px: 3,
                              py: 1.25,
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                              '&:hover': {
                                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                              }
                            }}
                          >
                            Analyze Another Plant
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: { xs: 2, md: 4 },
                textAlign: 'center',
              }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 80,
                    height: 80,
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <LocalFloristIcon sx={{ fontSize: 40 }} />
                </Avatar>
                
                <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 700, maxWidth: 600 }}>
                  AI-Powered Plant Health Analysis
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, color: theme.palette.text.secondary }}>
                  Upload a clear image of your plant to detect diseases, identify pests, and get personalized treatment recommendations.
                </Typography>
                
                <Grid container spacing={3} sx={{ maxWidth: 800, mb: 4 }}>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ 
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                            <BiotechIcon />
                          </Avatar>
                        </Box>
                        <Typography gutterBottom variant="subtitle1" align="center" sx={{ fontWeight: 600 }}>
                          Rapid Detection
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ flexGrow: 1 }}>
                          Identify 38+ plant diseases across various crops in seconds using AI technology.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ 
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                            <LocalHospitalIcon />
                          </Avatar>
                        </Box>
                        <Typography gutterBottom variant="subtitle1" align="center" sx={{ fontWeight: 600 }}>
                          Treatment Plans
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ flexGrow: 1 }}>
                          Get customized treatment recommendations and recovery timelines.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ 
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                            <NatureIcon />
                          </Avatar>
                        </Box>
                        <Typography gutterBottom variant="subtitle1" align="center" sx={{ fontWeight: 600 }}>
                          Organic Solutions
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ flexGrow: 1 }}>
                          Discover eco-friendly, natural remedies for plant health issues.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleUploadClick}
                  startIcon={<PhotoCameraIcon />}
                  disabled={!isBackendConnected}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(46, 125, 50, 0.25)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(46, 125, 50, 0.3)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Analyze Your Plant
                </Button>
                
                {connectionError && (
                  <Alert 
                    severity="warning" 
                    sx={{ mt: 4, maxWidth: 500 }}
                    action={
                      <Button color="inherit" size="small" onClick={handleRetryConnection}>
                        Retry Connection
                      </Button>
                    }
                  >
                    {connectionError}
                  </Alert>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PlantDiagnostic;