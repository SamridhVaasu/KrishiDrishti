import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { fetchThingSpeakData } from '../utils/thingspeak';
import { generateAIResponse } from '../utils/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AgroSense AI assistant powered by Gemini. I can analyze your farm data and provide personalized recommendations. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sensorData, setSensorData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchThingSpeakData();
        setSensorData(data);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
        setError('Unable to fetch sensor data. Some features may be limited.');
      }
    };
    fetchData();

    // Refresh sensor data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const context = sensorData 
        ? `Current farm conditions: Temperature is ${sensorData.field1}°C, Humidity is ${sensorData.field2}%, and Soil Moisture is ${sensorData.field3}%. `
        : 'Sensor data is currently unavailable. ';
      
      const aiResponse = await generateAIResponse(
        messages.map(({ role, content }) => ({ role, content })),
        context
      );

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setError('I apologize, but I encountered an error while processing your request. Please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8faf9', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#1b5e20', fontWeight: 600 }}>
        AgroSense AI Assistant
      </Typography>

      {error && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'rgba(211, 47, 47, 0.1)',
            border: '1px solid rgba(211, 47, 47, 0.2)',
            borderRadius: 2,
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Chat Container */}
      <Paper
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff',
          borderRadius: 2,
          border: '1px solid rgba(52, 168, 83, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Sensor Data Summary */}
        {sensorData && (
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(52, 168, 83, 0.1)',
            background: 'linear-gradient(135deg, rgba(52, 168, 83, 0.05) 0%, rgba(46, 125, 50, 0.1) 100%)'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#1b5e20', mb: 1 }}>
              Current Farm Conditions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                size="small"
                icon={<AgricultureIcon sx={{ color: '#d32f2f' }} />}
                label={`${sensorData.field1}°C`}
                sx={{
                  bgcolor: 'rgba(211, 47, 47, 0.1)',
                  color: '#d32f2f',
                }}
              />
              <Chip
                size="small"
                icon={<AgricultureIcon sx={{ color: '#2e7d32' }} />}
                label={`${sensorData.field2}%`}
                sx={{
                  bgcolor: 'rgba(46, 125, 50, 0.1)',
                  color: '#2e7d32',
                }}
              />
              <Chip
                size="small"
                icon={<AgricultureIcon sx={{ color: '#558b2f' }} />}
                label={`${sensorData.field3}%`}
                sx={{
                  bgcolor: 'rgba(85, 139, 47, 0.1)',
                  color: '#558b2f',
                }}
              />
            </Box>
          </Box>
        )}

        {/* Messages Area */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              {message.role === 'assistant' && (
                <Avatar
                  sx={{
                    bgcolor: 'rgba(52, 168, 83, 0.1)',
                    color: '#1b5e20'
                  }}
                >
                  <SmartToyIcon />
                </Avatar>
              )}
              <Card
                sx={{
                  bgcolor: message.role === 'user' ? 'rgba(52, 168, 83, 0.1)' : '#ffffff',
                  border: '1px solid rgba(52, 168, 83, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <CardContent sx={{ pb: '16px !important' }}>
                  <Typography variant="body1" sx={{ color: message.role === 'user' ? '#1b5e20' : '#2e7d32' }}>
                    {message.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#558b2f', display: 'block', mt: 1 }}>
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <Avatar
                  sx={{
                    bgcolor: 'rgba(52, 168, 83, 0.1)',
                    color: '#1b5e20'
                  }}
                >
                  <PersonIcon />
                </Avatar>
              )}
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(52, 168, 83, 0.1)',
                  color: '#1b5e20'
                }}
              >
                <SmartToyIcon />
              </Avatar>
              <Card
                sx={{
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(52, 168, 83, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#1b5e20' }} />
                  <Typography variant="body2" sx={{ color: '#558b2f' }}>
                    Analyzing farm data...
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(52, 168, 83, 0.1)',
          background: 'linear-gradient(135deg, rgba(52, 168, 83, 0.05) 0%, rgba(46, 125, 50, 0.1) 100%)'
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask about your farm conditions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#ffffff',
                  '& fieldset': {
                    borderColor: 'rgba(52, 168, 83, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(52, 168, 83, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1b5e20',
                  },
                },
              }}
            />
            <IconButton 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              sx={{
                bgcolor: 'rgba(52, 168, 83, 0.1)',
                color: '#1b5e20',
                '&:hover': {
                  bgcolor: 'rgba(52, 168, 83, 0.2)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.05)',
                  color: 'rgba(0, 0, 0, 0.26)',
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChat; 