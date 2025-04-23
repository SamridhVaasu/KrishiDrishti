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
  Tooltip
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

const DiseaseDetecter = () => {
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
        setSnackbarMessage('Connecting to plant disease detection backend...');
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
          setSnackbarMessage('Connected to plant disease detection backend successfully');
          setSnackbarSeverity('success');
        } else {
          throw new Error('Backend health check failed with status: ' + response.status);
        }
      } catch (error) {
        console.error('Error connecting to backend:', error);
        setConnectionError(
          error.name === 'AbortError' 
            ? 'Connection timed out. The server is not responding.'
            : `Failed to connect to the ML backend. ${error.message || 'Please make sure the server is running.'}`
        );
        setSnackbarMessage('Failed to connect to plant disease detection backend. Please ensure the server is running.');
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
          : `Failed to connect to the ML backend. ${error.message || 'Please make sure the server is running.'}`
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
      setSnackbarMessage('Getting detailed advice for detected disease...');
      
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
        setSnackbarMessage(`Disease detected, but advice retrieval had issues: ${result.errorMessage}`);
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
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          minHeight: '85vh',
          maxHeight: '85vh',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScienceIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              KrishiDrishti Disease Detector
            </Typography>
          </Box>
          
          <Tooltip title="Help">
            <IconButton size="small" color="primary">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {/* Left Column - Upload & Image Preview */}
          <Grid item xs={12} md={4} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: { md: `1px solid ${theme.palette.divider}` },
            pr: { md: 2 },
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
                  p: 2,
                  flexGrow: 1,
                  border: '2px dashed',
                  borderColor: isDragging 
                    ? theme.palette.primary.main 
                    : theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 2,
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
                <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: theme.palette.primary.main }} />
                <Typography variant="body1" align="center" gutterBottom fontWeight={500}>
                  Drag & Drop or Click to Upload
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: theme.palette.text.secondary }}>
                  Supports: JPG, PNG, WEBP (max 5MB)
                </Typography>

                {connectionError && (
                  <Alert 
                    severity="warning" 
                    sx={{ mt: 2, width: '100%' }}
                    action={
                      <Button 
                        color="inherit" 
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
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <PhotoCameraIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                  Plant Image
                </Typography>
                
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center', 
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    borderRadius: 2,
                    p: 1,
                    mb: 2,
                    flexGrow: 1,
                    maxHeight: '55vh',
                    overflow: 'hidden',
                  }}
                >
                  <img 
                    ref={imageRef}
                    src={imagePreview} 
                    alt="Plant preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      objectFit: 'contain' 
                    }} 
                  />
                </Box>

                <Stack spacing={2}>
                  {selectedImage && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearImage}
                      fullWidth
                    >
                      Clear
                    </Button>
                    
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={!isBackendConnected || isAnalyzing || isLoadingAdvice}
                      onClick={handleAnalyze}
                      startIcon={
                        isAnalyzing || isLoadingAdvice ? 
                          <CircularProgress size={16} color="inherit" /> : 
                          <ScienceIcon />
                      }
                      fullWidth
                    >
                      {isAnalyzing ? 'Analyzing...' : 
                       isLoadingAdvice ? 'Getting Advice...' : 
                       'Detect Disease'}
                    </Button>
                  </Stack>
                </Stack>
                
                {connectionError && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {connectionError}
                  </Alert>
                )}
              </Box>
            )}
          </Grid>

          {/* Right Column - Results */}
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
                p: 3
              }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="h6" align="center" gutterBottom>
                  {isAnalyzing ? 'Analyzing Plant Image...' : 'Getting Detailed Advice...'}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  {isAnalyzing ? 
                    'Our ML model is examining the plant for signs of disease.' : 
                    'Getting expert recommendations for treatment and management.'}
                </Typography>
                <LinearProgress sx={{ width: '80%', mt: 3 }} />
              </Box>
            ) : detectionResult ? (
              <Stack spacing={2} sx={{ height: '100%', overflow: 'auto', pb: 2 }}>
                <Card sx={{ 
                  mb: 1,
                  borderLeft: `4px solid ${getSeverityColor(detectionResult.severity)}`,
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {detectionResult.diseaseName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <em>{detectionResult.scientificName}</em>
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            size="small" 
                            label={`${Math.round(detectionResult.confidence * 100)}% confidence`} 
                            color="primary"
                          />
                          <Chip 
                            size="small" 
                            label={detectionResult.severity} 
                            sx={{ 
                              bgcolor: getSeverityColor(detectionResult.severity) + '20',
                              color: getSeverityColor(detectionResult.severity),
                              fontWeight: 500
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
                    sx={{ mb: 1 }}
                    icon={<WarningAmberIcon />}
                  >
                    {detectionResult.errorMessage || 'Some advice could not be retrieved. Showing fallback recommendations.'}
                  </Alert>
                )}

                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    minHeight: '48px',
                    '& .MuiTab-root': {
                      minHeight: '48px',
                      py: 1
                    }
                  }}
                >
                  <Tab 
                    icon={<DescriptionIcon fontSize="small" />} 
                    label="Overview" 
                    id="tab-0"
                    sx={{ minWidth: 'auto', textTransform: 'none' }}
                  />
                  <Tab 
                    icon={<BiotechIcon fontSize="small" />}
                    label="Symptoms"
                    id="tab-1" 
                    sx={{ minWidth: 'auto', textTransform: 'none' }}
                  />
                  <Tab 
                    icon={<LocalHospitalIcon fontSize="small" />}
                    label="Treatment" 
                    id="tab-2"
                    sx={{ minWidth: 'auto', textTransform: 'none' }}
                  />
                  <Tab 
                    icon={<ShieldIcon fontSize="small" />}
                    label="Prevention" 
                    id="tab-3"
                    sx={{ minWidth: 'auto', textTransform: 'none' }}
                  />
                  <Tab 
                    icon={<NatureIcon fontSize="small" />}
                    label="Organic" 
                    id="tab-4"
                    sx={{ minWidth: 'auto', textTransform: 'none' }}
                  />
                </Tabs>

                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {/* Overview Tab */}
                  <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" sx={{ height: '100%' }}>
                    {activeTab === 0 && (
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>
                          {detectionResult.description}
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 1 }}>
                              <BiotechIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Key Symptoms
                            </Typography>
                            <List dense disablePadding>
                              {detectionResult.symptoms.slice(0, 3).map((symptom, index) => (
                                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <CheckCircleIcon fontSize="small" color="primary" />
                                  </ListItemIcon>
                                  <ListItemText primary={symptom} />
                                </ListItem>
                              ))}
                              {detectionResult.symptoms.length > 3 && (
                                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', display: 'block', mt: 0.5, ml: 3.5 }} onClick={() => setActiveTab(1)}>
                                  See all symptoms →
                                </Typography>
                              )}
                            </List>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Recovery Timeline
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 0.5 }}>
                              {detectionResult.expectedRecoveryTime}
                            </Typography>

                            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                              <LocalHospitalIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Key Treatments
                            </Typography>
                            <List dense disablePadding>
                              {detectionResult.treatments.slice(0, 2).map((treatment, index) => (
                                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <CheckCircleIcon fontSize="small" color="primary" />
                                  </ListItemIcon>
                                  <ListItemText primary={treatment} />
                                </ListItem>
                              ))}
                              {detectionResult.treatments.length > 2 && (
                                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', display: 'block', mt: 0.5, ml: 3.5 }} onClick={() => setActiveTab(2)}>
                                  See all treatments →
                                </Typography>
                              )}
                            </List>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RestartAltIcon />}
                            onClick={handleClearImage}
                          >
                            Scan Another Plant
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Symptoms Tab */}
                  <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" sx={{ height: '100%' }}>
                    {activeTab === 1 && (
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          All Symptoms
                        </Typography>
                        <List dense>
                          {detectionResult.symptoms.map((symptom, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={symptom} />
                            </ListItem>
                          ))}
                          {detectionResult.symptoms.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                              No specific symptoms listed for healthy plants.
                            </Typography>
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>

                  {/* Treatment Tab */}
                  <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-2" sx={{ height: '100%' }}>
                    {activeTab === 2 && (
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Recommended Treatments
                        </Typography>
                        <List dense>
                          {detectionResult.treatments.map((treatment, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={treatment} />
                            </ListItem>
                          ))}
                          {detectionResult.treatments.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                              No treatments needed for healthy plants.
                            </Typography>
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>

                  {/* Prevention Tab */}
                  <Box role="tabpanel" hidden={activeTab !== 3} id="tabpanel-3" sx={{ height: '100%' }}>
                    {activeTab === 3 && (
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Prevention Methods
                        </Typography>
                        <List dense>
                          {detectionResult.preventions.map((prevention, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={prevention} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>

                  {/* Organic Tab */}
                  <Box role="tabpanel" hidden={activeTab !== 4} id="tabpanel-4" sx={{ height: '100%' }}>
                    {activeTab === 4 && (
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Organic Solutions
                        </Typography>
                        <List dense>
                          {detectionResult.organicSolutions.map((solution, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckCircleIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={solution} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: { xs: 2, md: 4 }
              }}>
                <Box sx={{ p: 2, maxWidth: 450 }}>
                  <Typography variant="h6" color="primary" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                    KrishiDrishti Plant Disease Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, lineHeight: 1.6 }}>
                    Upload a clear image of your plant leaves or affected areas to detect diseases using our machine learning model. 
                    You'll receive detailed advice for treatment and prevention powered by agricultural expertise.
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BiotechIcon fontSize="small" color="primary" /> 
                          Disease Detection
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Our ML model can identify over 38 different plant diseases across various crops including tomato, potato, apple, corn, grape, and more.
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalHospitalIcon fontSize="small" color="primary" /> 
                          Expert Treatment Advice
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Get AI-powered recommendations for treating and preventing detected diseases, including organic solutions.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Stack>
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleUploadClick}
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 4, mx: 'auto', display: 'flex' }}
                    disabled={!isBackendConnected}
                  >
                    Upload Plant Image
                  </Button>
                </Box>
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
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DiseaseDetecter;