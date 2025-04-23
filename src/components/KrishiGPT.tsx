import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  Container,
  Stack,
  useTheme,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ClearIcon from '@mui/icons-material/Clear';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import OpacityIcon from '@mui/icons-material/Opacity';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import RefreshIcon from '@mui/icons-material/Refresh';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { getSensorData } from '../utils/thingspeak';

// Define types for messages and sensor data
interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface SensorData {
  field1?: number; // soil moisture
  field2?: number; // temperature
  field3?: number; // humidity
  field4?: number; // light intensity
  field5?: number; // soil pH
  created_at?: string;
}

const KrishiGPT = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Namaste! I am KrishiGPT, your smart farming assistant. Ask me anything about crops, farming techniques, pest management, or check your farm sensors data.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [showSensorData, setShowSensorData] = useState(false);
  const [sensorLoading, setSensorLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('info');
  const [geminiModel, setGeminiModel] = useState<GenerativeModel | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini model
  useEffect(() => {
    const initializeGemini = () => {
      try {
        // Get API key from environment variables
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey || apiKey === '') {
          console.warn('VITE_GEMINI_API_KEY not found or empty in environment variables');
          setError('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
          return;
        }
        
        // Initialize the API client
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Configure safety settings
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
        
        // Create a model instance
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          safetySettings,
        });
        
        setGeminiModel(model);
        console.log('Gemini model initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        setError('Failed to initialize AI assistant. Please check console for details.');
      }
    };

    initializeGemini();
  }, []);

  // Fetch sensor data on component mount
  useEffect(() => {
    fetchSensorData();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch sensor data from ThingSpeak
  const fetchSensorData = async () => {
    try {
      setSensorLoading(true);
      const data = await getSensorData();
      setSensorData(data);
      setSensorLoading(false);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setSnackbarMessage('Failed to fetch sensor data. Please try again later.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setSensorLoading(false);
    }
  };

  // Send message to Gemini API
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !geminiModel) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Add farming context to the prompt
      let prompt = `You are KrishiGPT, an AI assistant for farmers in India. Provide accurate, practical advice about farming, crops, soil management, pest control, and other agricultural topics. Keep responses concise and farmer-friendly. The user asks: ${input}`;
      
      // Add sensor data to the prompt if available
      if (sensorData) {
        prompt += `\n\nCurrent farm sensor readings:
        - Soil Moisture: ${sensorData.field1 || 'N/A'}%
        - Temperature: ${sensorData.field2 || 'N/A'}°C
        - Humidity: ${sensorData.field3 || 'N/A'}%
        - Light Intensity: ${sensorData.field4 || 'N/A'} lux
        - Soil pH: ${sensorData.field5 || 'N/A'}
        - Last updated: ${sensorData.created_at || 'N/A'}`;
      }
      
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const aiResponseText = response.text();
      
      const aiMessage: Message = {
        role: 'ai',
        content: aiResponseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response from AI. Please try again.');
      setSnackbarMessage('Failed to get AI response. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
      // Focus input again after sending
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([
      {
        role: 'ai',
        content: 'Namaste! I am KrishiGPT, your smart farming assistant. Ask me anything about crops, farming techniques, pest management, or check your farm sensors data.',
        timestamp: new Date(),
      },
    ]);
  };

  // Toggle sensor data display
  const toggleSensorData = async () => {
    if (!showSensorData && !sensorData) {
      await fetchSensorData();
    }
    setShowSensorData(!showSensorData);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render a message bubble
  const renderMessage = (message: Message, index: number) => {
    const isAi = message.role === 'ai';
    
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isAi ? 'flex-start' : 'flex-end',
          mb: 2,
          maxWidth: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          {isAi && (
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 32,
                height: 32,
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Avatar>
          )}
          
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              maxWidth: '80%',
              bgcolor: isAi ? theme.palette.background.paper : theme.palette.primary.main,
              color: isAi ? theme.palette.text.primary : theme.palette.primary.contrastText,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              position: 'relative',
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                textAlign: isAi ? 'left' : 'right',
                opacity: 0.7,
              }}
            >
              {formatTime(message.timestamp)}
            </Typography>
          </Paper>
          
          {!isAi && (
            <Avatar
              sx={{
                bgcolor: theme.palette.success.main,
                width: 32,
                height: 32,
              }}
            >
              <PersonIcon fontSize="small" />
            </Avatar>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper
        sx={{
          p: 2,
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AgricultureIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              KrishiGPT
            </Typography>
            <Chip
              size="small"
              label="Powered by Gemini"
              color="primary"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Box>
          
          <Box>
            <Tooltip title="Refresh Sensor Data">
              <IconButton
                size="small"
                onClick={fetchSensorData}
                disabled={sensorLoading}
              >
                {sensorLoading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={showSensorData ? "Hide Sensor Data" : "Show Sensor Data"}>
              <IconButton
                size="small"
                onClick={toggleSensorData}
                color={showSensorData ? "primary" : "default"}
              >
                <InvertColorsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton size="small" onClick={clearChat}>
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Main content area - messages and sensor data */}
        <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {/* Chat area */}
          <Grid item xs={12} md={showSensorData ? 8 : 12} sx={{ height: '100%' }}>
            {/* Error message if any */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Messages container */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                height: 'calc(100% - 70px)',
                overflowY: 'auto',
                px: 2,
              }}
            >
              {messages.map(renderMessage)}
              
              {isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">KrishiGPT is thinking...</Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>
            
            {/* Input area */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                position: 'relative',
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about crops, pests, or farming techniques..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                inputRef={inputRef}
                multiline
                maxRows={2}
                InputProps={{
                  endAdornment: input && (
                    <IconButton size="small" onClick={() => setInput('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                  sx: {
                    borderRadius: 3,
                  },
                }}
                disabled={isLoading || !geminiModel}
              />
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !geminiModel}
                sx={{ borderRadius: 2 }}
              >
                Send
              </Button>
            </Box>
          </Grid>
          
          {/* Sensor data sidebar */}
          {showSensorData && (
            <Grid item md={4} sx={{ height: '100%' }}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ p: 2, pb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InvertColorsIcon fontSize="small" color="primary" />
                    Farm Sensor Data
                  </Typography>
                  
                  {sensorLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <CircularProgress size={40} />
                    </Box>
                  ) : sensorData ? (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            <OpacityIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Soil Moisture
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {sensorData.field1 !== undefined ? `${sensorData.field1}%` : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>
                            <ThermostatIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Temperature
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {sensorData.field2 !== undefined ? `${sensorData.field2}°C` : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36 }}>
                            <WaterDropIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Humidity
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {sensorData.field3 !== undefined ? `${sensorData.field3}%` : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 36, height: 36 }}>
                            <WbSunnyIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Light Intensity
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {sensorData.field4 !== undefined ? `${sensorData.field4} lux` : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
                            <FmdGoodIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Soil pH
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {sensorData.field5 !== undefined ? sensorData.field5 : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {sensorData.created_at && (
                        <Typography variant="caption" color="text.secondary" align="center">
                          Last updated: {new Date(sensorData.created_at).toLocaleString()}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      No sensor data available. Please refresh to try again.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
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

export default KrishiGPT;