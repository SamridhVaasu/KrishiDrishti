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
  Grid,
  Divider,
  useTheme,
  Button,
  Stack,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Container,
  Fade,
  Zoom,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  InputAdornment,
  Collapse,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import NatureIcon from '@mui/icons-material/Nature';
import PersonIcon from '@mui/icons-material/Person';
import InsightsIcon from '@mui/icons-material/Insights';
import BugReportIcon from '@mui/icons-material/BugReport';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BuildIcon from '@mui/icons-material/Build';
import WaterIcon from '@mui/icons-material/Water';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ForestOutlinedIcon from '@mui/icons-material/ForestOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { fetchThingSpeakData } from '../utils/thingspeak';
import { generateAIResponse } from '../utils/gemini';
import { keyframes } from '@mui/system';

// Keyframe animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(46, 125, 50, 0.3); }
  50% { box-shadow: 0 0 15px rgba(46, 125, 50, 0.5); }
  100% { box-shadow: 0 0 5px rgba(46, 125, 50, 0.3); }
`;

// Suggested queries with enhanced categorization
const SUGGESTED_QUERIES = [
  {
    text: "What crops would grow best with my current soil moisture?",
    icon: <ForestOutlinedIcon />,
    category: "crop",
    tags: ["recommendation", "soil", "planning"]
  },
  {
    text: "How do I identify and treat tomato blight?",
    icon: <BugReportIcon />,
    category: "pest",
    tags: ["disease", "treatment", "prevention"]
  },
  {
    text: "How should I adjust irrigation with current humidity levels?",
    icon: <WaterIcon />,
    category: "water",
    tags: ["irrigation", "efficiency", "management"]
  },
  {
    text: "What are the projected prices for maize next season?",
    icon: <LocalOfferIcon />,
    category: "market",
    tags: ["price", "forecast", "economics"]
  },
  {
    text: "My tractor isn't starting. What should I check first?",
    icon: <BuildIcon />,
    category: "equipment",
    tags: ["troubleshooting", "maintenance", "repair"]
  },
  {
    text: "Give me organic fertilizer recommendations for tomatoes",
    icon: <TipsAndUpdatesOutlinedIcon />,
    category: "fertilizer",
    tags: ["organic", "sustainable", "nutrients"]
  }
];

// Message types
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: string; // Optional category for filtering
  attachments?: Array<{
    type: string;
    url: string;
    caption?: string;
  }>;
  typing?: boolean; // For showing typing animation
  id?: string; // Unique ID for messages
  tags?: string[]; // Tags for categorization
}

const AgriCounsel = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m AgriCounsel, your advanced agricultural assistant powered by Google Gemini 1.5 Flash. I can provide personalized farming recommendations, crop advice, pest management guidance, and much more. How can I assist you today?',
      timestamp: new Date(),
      category: 'general',
      id: 'welcome-msg-1',
      tags: ['welcome', 'introduction']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sensorData, setSensorData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isConditionsExpanded, setIsConditionsExpanded] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Tabs for different advice categories with enhanced labels
  const tabs = [
    { label: 'All Messages', icon: <InsightsIcon fontSize="small" />, value: 'all' },
    { label: 'Crop Advice', icon: <ForestOutlinedIcon fontSize="small" />, value: 'crop' },
    { label: 'Pest Management', icon: <BugReportIcon fontSize="small" />, value: 'pest' },
    { label: 'Weather Insights', icon: <WbSunnyIcon fontSize="small" />, value: 'weather' },
    { label: 'Market Analysis', icon: <LocalOfferIcon fontSize="small" />, value: 'market' },
    { label: 'Equipment Help', icon: <BuildIcon fontSize="small" />, value: 'equipment' },
  ];

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
      timestamp: new Date(),
      id: `user-msg-${Date.now()}`
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Show typing indicator
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '...',
        timestamp: new Date(),
        typing: true,
        id: `typing-indicator-${Date.now()}`
      }]);

      const context = sensorData 
        ? `Current farm conditions: Temperature is ${sensorData.field3}°C, Humidity is ${sensorData.field2}%, and Soil Moisture is ${sensorData.field1}%. `
        : 'Sensor data is currently unavailable. ';
      
      const aiResponse = await generateAIResponse(
        messages.filter(m => !m.typing).map(({ role, content }) => ({ role, content })),
        context
      );

      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.typing);
        return [...filtered, {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          id: `assistant-msg-${Date.now()}`,
          // Set category based on content analysis (simplified here)
          category: getCategoryFromContent(aiResponse),
          tags: getTagsFromContent(aiResponse)
        }];
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      setError('I apologize, but I encountered an error while processing your request. Please try again.');
      // Remove typing indicator and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.typing);
        return [...filtered, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
          id: `error-msg-${Date.now()}`
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  // Improved content category detection
  const getCategoryFromContent = (content: string): string => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('crop') || lowerContent.includes('plant') || lowerContent.includes('grow') || 
        lowerContent.includes('harvest') || lowerContent.includes('yield'))
      return 'crop';
    if (lowerContent.includes('pest') || lowerContent.includes('disease') || lowerContent.includes('insect') ||
        lowerContent.includes('blight') || lowerContent.includes('fungi'))
      return 'pest';
    if (lowerContent.includes('weather') || lowerContent.includes('rain') || lowerContent.includes('temperature') ||
        lowerContent.includes('forecast') || lowerContent.includes('climate'))
      return 'weather';
    if (lowerContent.includes('price') || lowerContent.includes('market') || lowerContent.includes('sell') ||
        lowerContent.includes('buy') || lowerContent.includes('trade'))
      return 'market';
    if (lowerContent.includes('equipment') || lowerContent.includes('tractor') || lowerContent.includes('tool') ||
        lowerContent.includes('machinery') || lowerContent.includes('implement'))
      return 'equipment';
    return 'general';
  };

  // Extract tags from content
  const getTagsFromContent = (content: string): string[] => {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Agricultural practices
    if (lowerContent.includes('organic')) tags.push('organic');
    if (lowerContent.includes('sustainable')) tags.push('sustainable');
    if (lowerContent.includes('irrigation')) tags.push('irrigation');
    if (lowerContent.includes('fertilizer')) tags.push('fertilizer');
    if (lowerContent.includes('soil')) tags.push('soil');
    
    // Crops and plants
    if (lowerContent.includes('tomato')) tags.push('tomato');
    if (lowerContent.includes('potato')) tags.push('potato');
    if (lowerContent.includes('corn') || lowerContent.includes('maize')) tags.push('corn');
    if (lowerContent.includes('wheat')) tags.push('wheat');
    if (lowerContent.includes('rice')) tags.push('rice');
    
    // Issues
    if (lowerContent.includes('blight')) tags.push('blight');
    if (lowerContent.includes('pest')) tags.push('pest');
    if (lowerContent.includes('disease')) tags.push('disease');
    if (lowerContent.includes('drought')) tags.push('drought');
    
    return tags;
  };

  // Filter messages based on active tab and filters
  const filteredMessages = messages.filter(msg => {
    // Filter by tab first
    if (activeTab !== 0 && msg.category !== tabs[activeTab].value.toLowerCase()) {
      return false;
    }
    
    // Then by selected tags if any
    if (activeFilters.length > 0 && msg.tags) {
      return msg.tags.some(tag => activeFilters.includes(tag));
    }
    
    return true;
  });

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Toggle a filter
  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // All available tags for filtering
  const allTags = Array.from(new Set(
    messages.flatMap(msg => msg.tags || [])
  )).sort();

  return (
    <Container maxWidth="xl" sx={{ p: 3, height: '100%' }}>
      <Fade in={true} timeout={800}>
        <Box sx={{ 
          p: 3, 
          bgcolor: theme.palette.background.default, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 4,
          boxShadow: theme.palette.mode === 'light' 
            ? '0 8px 32px rgba(0, 0, 0, 0.08)'
            : '0 8px 32px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          backgroundImage: theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom right, rgba(46, 125, 50, 0.03), rgba(200, 230, 201, 0.1))'
            : 'linear-gradient(to bottom right, rgba(46, 125, 50, 0.05), rgba(0, 0, 0, 0))'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.mode === 'light' ? 'rgba(46, 125, 50, 0.9)' : 'rgba(129, 199, 132, 0.9)',
                  color: '#fff',
                  width: 48,
                  height: 48,
                  animation: `${pulseAnimation} 3s infinite ease-in-out`,
                  boxShadow: theme.palette.mode === 'light' 
                    ? '0 0 15px rgba(46, 125, 50, 0.5)'
                    : '0 0 15px rgba(129, 199, 132, 0.5)',
                }}
              >
                <SmartToyOutlinedIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.primary.main, 
                  fontWeight: 700,
                  letterSpacing: '-0.5px'
                }}>
                  KrishiDrishti AI
                </Typography>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>
                  Your advanced agricultural assistant
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Filter conversations">
                <IconButton
                  color="primary"
                  onClick={handleMenuOpen}
                  sx={{
                    bgcolor: activeFilters.length > 0 ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(46, 125, 50, 0.15)'
                    }
                  }}
                >
                  <Badge
                    badgeContent={activeFilters.length}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                  >
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    minWidth: 180,
                    maxHeight: 300
                  }
                }}
              >
                <MenuItem disabled>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    FILTER BY TAG
                  </Typography>
                </MenuItem>
                <Divider />
                {allTags.map((tag) => (
                  <MenuItem key={tag} onClick={() => toggleFilter(tag)}>
                    <Chip
                      size="small"
                      label={tag}
                      variant={activeFilters.includes(tag) ? "filled" : "outlined"}
                      color="primary"
                      onClick={() => toggleFilter(tag)}
                      sx={{ 
                        mr: 1, 
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    />
                  </MenuItem>
                ))}
                {allTags.length === 0 && (
                  <MenuItem disabled>
                    <Typography variant="caption">
                      No tags available
                    </Typography>
                  </MenuItem>
                )}
                {activeFilters.length > 0 && (
                  <MenuItem onClick={() => setActiveFilters([])}>
                    <Typography variant="caption" color="error">
                      Clear all filters
                    </Typography>
                  </MenuItem>
                )}
              </Menu>
            </Stack>
          </Box>

          <Grid container spacing={3} sx={{ flexGrow: 1 }}>
            {/* Left sidebar with categories and quick links */}
            <Grid item xs={12} md={3}>
              <Zoom in={true} timeout={800} style={{ transitionDelay: '100ms' }}>
                <Paper sx={{ 
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'light' 
                    ? 'rgba(46, 125, 50, 0.1)' 
                    : 'rgba(129, 199, 132, 0.1)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'light' 
                      ? '0 6px 25px rgba(46, 125, 50, 0.15)'
                      : '0 6px 25px rgba(0, 0, 0, 0.3)',
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.primary.main, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <ForestOutlinedIcon fontSize="small" /> Farm Assistant
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        color: theme.palette.primary.main
                      }
                    }}
                    onClick={() => setIsConditionsExpanded(!isConditionsExpanded)}
                    >
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary, 
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <InsightsIcon fontSize="small" /> Farm Conditions
                      </Typography>
                      {isConditionsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </Box>
                    
                    <Collapse in={isConditionsExpanded} timeout="auto">
                      {sensorData ? (
                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                          <Card sx={{ 
                            bgcolor: theme.palette.mode === 'light' 
                              ? 'rgba(211, 47, 47, 0.07)' 
                              : 'rgba(211, 47, 47, 0.15)',
                            boxShadow: 'none',
                            borderRadius: 2,
                            overflow: 'hidden',
                            animation: `${glowAnimation} 4s infinite ease-in-out`,
                            animationDelay: '0.5s'
                          }}>
                            <CardContent sx={{ padding: '10px !important' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ 
                                  bgcolor: theme.palette.mode === 'light' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.3)',
                                  width: 36,
                                  height: 36
                                }}>
                                  <WbSunnyIcon sx={{ color: theme.palette.mode === 'light' ? '#d32f2f' : '#ef5350' }} />
                                </Avatar>
                                <Box>
                                  <Typography variant="caption" sx={{ color: theme.palette.mode === 'light' ? '#d32f2f' : '#ef5350' }}>
                                    Temperature
                                  </Typography>
                                  <Typography variant="h6" sx={{ 
                                    color: theme.palette.mode === 'light' ? '#d32f2f' : '#ef5350',
                                    lineHeight: 1
                                  }}>
                                    {sensorData.field3}°C
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ 
                            bgcolor: theme.palette.mode === 'light' 
                              ? 'rgba(25, 118, 210, 0.07)' 
                              : 'rgba(25, 118, 210, 0.15)',
                            boxShadow: 'none',
                            borderRadius: 2,
                            overflow: 'hidden',
                            animation: `${glowAnimation} 4s infinite ease-in-out`,
                            animationDelay: '1.0s'
                          }}>
                            <CardContent sx={{ padding: '10px !important' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ 
                                  bgcolor: theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.3)',
                                  width: 36,
                                  height: 36
                                }}>
                                  <WaterIcon sx={{ color: theme.palette.mode === 'light' ? '#1976d2' : '#42a5f5' }} />
                                </Avatar>
                                <Box>
                                  <Typography variant="caption" sx={{ color: theme.palette.mode === 'light' ? '#1976d2' : '#42a5f5' }}>
                                    Humidity
                                  </Typography>
                                  <Typography variant="h6" sx={{ 
                                    color: theme.palette.mode === 'light' ? '#1976d2' : '#42a5f5',
                                    lineHeight: 1
                                  }}>
                                    {sensorData.field2}%
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ 
                            bgcolor: theme.palette.mode === 'light' 
                              ? 'rgba(46, 125, 50, 0.07)' 
                              : 'rgba(46, 125, 50, 0.15)', 
                            boxShadow: 'none',
                            borderRadius: 2,
                            overflow: 'hidden',
                            animation: `${glowAnimation} 4s infinite ease-in-out`,
                            animationDelay: '1.5s'
                          }}>
                            <CardContent sx={{ padding: '10px !important' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ 
                                  bgcolor: theme.palette.mode === 'light' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.3)',
                                  width: 36,
                                  height: 36
                                }}>
                                  <NatureIcon sx={{ color: theme.palette.mode === 'light' ? '#2e7d32' : '#66bb6a' }} />
                                </Avatar>
                                <Box>
                                  <Typography variant="caption" sx={{ color: theme.palette.mode === 'light' ? '#2e7d32' : '#66bb6a' }}>
                                    Soil Moisture
                                  </Typography>
                                  <Typography variant="h6" sx={{ 
                                    color: theme.palette.mode === 'light' ? '#2e7d32' : '#66bb6a',
                                    lineHeight: 1
                                  }}>
                                    {sensorData.field1}%
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Stack>
                      ) : (
                        <Box sx={{ 
                          mb: 3, 
                          p: 1.5, 
                          bgcolor: 'rgba(211, 47, 47, 0.1)', 
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <ErrorOutlineIcon fontSize="small" color="error" />
                          <Typography variant="body2" color="error">Sensor data unavailable</Typography>
                        </Box>
                      )}
                    </Collapse>
                  </Box>

                  <Typography variant="subtitle2" sx={{ 
                    mb: 1.5, 
                    color: theme.palette.text.secondary, 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <TipsAndUpdatesOutlinedIcon fontSize="small" /> Quick Questions
                  </Typography>
                  
                  <List dense sx={{ pb: 0 }}>
                    {SUGGESTED_QUERIES.map((query, index) => (
                      <Zoom in key={index} style={{ transitionDelay: `${100 * index}ms` }}>
                        <ListItem 
                          button
                          onClick={() => handleSuggestedQuery(query.text)}
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            transition: 'all 0.2s ease',
                            border: '1px solid',
                            borderColor: 'transparent',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'light' 
                                ? 'rgba(46, 125, 50, 0.08)'
                                : 'rgba(129, 199, 132, 0.08)',
                              borderColor: theme.palette.mode === 'light' 
                                ? 'rgba(46, 125, 50, 0.2)'
                                : 'rgba(129, 199, 132, 0.2)',
                            }
                          }}
                        >
                          <ListItemIcon sx={{ 
                            minWidth: 36, 
                            color: theme.palette.primary.main 
                          }}>
                            {query.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={query.text} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              noWrap: true,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            secondary={query.tags.join(' · ')}
                            secondaryTypographyProps={{
                              variant: 'caption',
                              noWrap: true,
                              color: 'text.secondary',
                              fontSize: '0.65rem'
                            }}
                          />
                        </ListItem>
                      </Zoom>
                    ))}
                  </List>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <Fade in timeout={1000} style={{ transitionDelay: '500ms' }}>
                    <Box sx={{ 
                      mt: 2, 
                      pt: 2,
                      borderTop: '1px solid',
                      borderTopColor: theme.palette.mode === 'light' 
                        ? 'rgba(0, 0, 0, 0.06)'
                        : 'rgba(255, 255, 255, 0.06)'
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5
                      }}>
                        Powered by Google Gemini 1.5 Flash
                      </Typography>
                    </Box>
                  </Fade>
                </Paper>
              </Zoom>
            </Grid>

            {/* Main chat area */}
            <Grid item xs={12} md={9}>
              {error && (
                <Zoom in={true}>
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: theme.palette.mode === 'light' ? 'rgba(211, 47, 47, 0.05)' : 'rgba(211, 47, 47, 0.2)',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'light' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.3)',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorOutlineIcon color="error" />
                      <Typography color="error">{error}</Typography>
                    </Box>
                  </Paper>
                </Zoom>
              )}

              <Zoom in={true} timeout={800} style={{ transitionDelay: '300ms' }}>
                <Paper
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'light' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(129, 199, 132, 0.1)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Category tabs */}
                  <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                      px: 2,
                      pt: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: theme.palette.background.paper,
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        minHeight: 48,
                        fontSize: '0.875rem',
                        borderRadius: '12px 12px 0 0',
                      },
                      '& .Mui-selected': {
                        color: `${theme.palette.primary.main} !important`,
                        fontWeight: 700,
                      },
                      '& .MuiTabs-indicator': {
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                        backgroundColor: theme.palette.primary.main,
                      }
                    }}
                  >
                    {tabs.map((tab, index) => (
                      <Tab 
                        key={index} 
                        icon={tab.icon} 
                        iconPosition="start" 
                        label={tab.label} 
                        sx={{
                          minHeight: 'unset',
                          py: 1.5
                        }}
                      />
                    ))}
                  </Tabs>
                  
                  {/* Messages Area */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    bgcolor: theme.palette.mode === 'light' 
                      ? 'rgba(46, 125, 50, 0.02)' 
                      : 'rgba(0, 0, 0, 0.2)',
                  }}>
                    {filteredMessages.length === 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        opacity: 0.7
                      }}>
                        <ForestOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1" color="text.secondary">
                          No messages in this category
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Start a conversation or change filters
                        </Typography>
                      </Box>
                    ) : (
                      filteredMessages.map((message, index) => (
                        <Fade key={message.id || index} in={true} timeout={400}>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2,
                              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                              maxWidth: '80%',
                              opacity: message.typing ? 0.7 : 1,
                            }}
                          >
                            {message.role === 'assistant' && (
                              <Avatar
                                sx={{
                                  bgcolor: theme.palette.mode === 'light' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(129, 199, 132, 0.2)',
                                  color: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light
                                }}
                              >
                                <SmartToyOutlinedIcon />
                              </Avatar>
                            )}
                            <Card
                              sx={{
                                bgcolor: message.role === 'user' 
                                  ? theme.palette.mode === 'light' 
                                    ? 'rgba(46, 125, 50, 0.08)' 
                                    : 'rgba(129, 199, 132, 0.15)'
                                  : theme.palette.background.paper,
                                border: '1px solid',
                                borderColor: message.role === 'user'
                                  ? theme.palette.mode === 'light' 
                                    ? 'rgba(46, 125, 50, 0.15)' 
                                    : 'rgba(129, 199, 132, 0.15)'
                                  : theme.palette.mode === 'light' 
                                    ? 'rgba(0, 0, 0, 0.09)' 
                                    : 'rgba(255, 255, 255, 0.09)',
                                boxShadow: theme.palette.mode === 'light'
                                  ? '0 2px 12px rgba(0, 0, 0, 0.08)'
                                  : '0 2px 12px rgba(0, 0, 0, 0.2)',
                                borderRadius: 3
                              }}
                            >
                              <CardContent sx={{ pb: '16px !important' }}>
                                {message.typing ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                      AgriCounsel is analyzing and responding...
                                    </Typography>
                                  </Box>
                                ) : (
                                  <>
                                    <Typography variant="body1" sx={{ 
                                      color: message.role === 'user' 
                                        ? theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.light
                                        : theme.palette.text.primary,
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {message.content}
                                    </Typography>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      mt: 2,
                                      pt: 1,
                                      borderTop: '1px solid',
                                      borderTopColor: theme.palette.mode === 'light' 
                                        ? 'rgba(0, 0, 0, 0.06)'
                                        : 'rgba(255, 255, 255, 0.06)',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      gap: 1
                                    }}>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ color: theme.palette.text.secondary }}
                                      >
                                        {message.timestamp.toLocaleTimeString()}
                                      </Typography>
                                      
                                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {message.category && message.role === 'assistant' && (
                                          <Chip 
                                            label={message.category} 
                                            size="small" 
                                            sx={{ 
                                              height: 20, 
                                              fontSize: '0.625rem',
                                              bgcolor: theme.palette.mode === 'light' 
                                                ? 'rgba(46, 125, 50, 0.1)'
                                                : 'rgba(129, 199, 132, 0.2)',
                                              color: theme.palette.mode === 'light'
                                                ? theme.palette.primary.main
                                                : theme.palette.primary.light
                                            }}
                                          />
                                        )}
                                        {message.tags && message.tags.slice(0, 2).map(tag => (
                                          <Chip 
                                            key={tag}
                                            label={tag} 
                                            size="small" 
                                            sx={{ 
                                              height: 20, 
                                              fontSize: '0.625rem',
                                              bgcolor: 'transparent',
                                              border: '1px solid',
                                              borderColor: theme.palette.mode === 'light' 
                                                ? 'rgba(46, 125, 50, 0.3)'
                                                : 'rgba(129, 199, 132, 0.3)',
                                              color: theme.palette.text.secondary
                                            }}
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                            {message.role === 'user' && (
                              <Avatar
                                sx={{
                                  bgcolor: theme.palette.mode === 'light' 
                                    ? theme.palette.secondary.light
                                    : theme.palette.secondary.dark,
                                  color: '#fff'
                                }}
                              >
                                <PersonIcon />
                              </Avatar>
                            )}
                          </Box>
                        </Fade>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </Box>

                  {/* Input Area */}
                  <Box sx={{ 
                    p: 2, 
                    borderTop: '1px solid',
                    borderColor: theme.palette.mode === 'light' 
                      ? 'rgba(46, 125, 50, 0.1)' 
                      : 'rgba(129, 199, 132, 0.1)',
                    bgcolor: theme.palette.background.paper
                  }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Ask AgriCounsel about farming, plants, pests, weather..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        multiline
                        maxRows={4}
                        inputRef={inputRef}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ForestOutlinedIcon color="primary" sx={{ opacity: 0.7 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title="Coming soon: Attach files">
                                <IconButton 
                                  disabled
                                  size="small"
                                  sx={{ 
                                    opacity: 0.5,
                                    mr: 1
                                  }}
                                >
                                  <AttachFileIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: theme.palette.background.paper,
                            '& fieldset': {
                              borderColor: theme.palette.mode === 'light' 
                                ? 'rgba(46, 125, 50, 0.3)'
                                : 'rgba(129, 199, 132, 0.3)',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: theme.palette.mode === 'light' 
                                ? 'rgba(46, 125, 50, 0.5)'
                                : 'rgba(129, 199, 132, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                        sx={{
                          height: 56,
                          minWidth: 100,
                          bgcolor: theme.palette.primary.main,
                          color: '#fff',
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: theme.palette.mode === 'light'
                            ? '0 4px 12px rgba(46, 125, 50, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.3)',
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                            boxShadow: theme.palette.mode === 'light'
                              ? '0 6px 15px rgba(46, 125, 50, 0.4)'
                              : '0 6px 15px rgba(0, 0, 0, 0.4)',
                          }
                        }}
                      >
                        {isLoading ? 'Sending' : 'Send'}
                      </Button>
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        color: theme.palette.text.secondary,
                        mt: 1,
                        textAlign: 'center'
                      }}
                    >
                      Press Enter to send, Shift+Enter for new line • AgriCounsel provides general farming advice
                    </Typography>
                  </Box>
                </Paper>
              </Zoom>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default AgriCounsel;