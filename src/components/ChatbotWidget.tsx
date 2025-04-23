import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Avatar,
  Collapse,
  Zoom,
  Card,
  CardContent,
  Divider,
  useTheme,
  CircularProgress,
  Badge,
  Tooltip,
  alpha,
  InputAdornment,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import PersonIcon from '@mui/icons-material/Person';
import MicNoneIcon from '@mui/icons-material/MicNone';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { generateAIResponse } from '../utils/gemini';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  typing?: boolean;
  attachment?: {
    type: 'image' | 'data',
    url: string,
  }
}

const ChatbotWidget = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m AgriCounsel, your agricultural AI assistant. How can I help with your farming questions today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatRef.current && isOpen) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setUnreadCount(0); // Reset unread count when opened
    }
  }, [isOpen]);

  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setUnreadCount(0); // Reset unread count when opened
      setIsMinimized(false);
    }
  };

  const handleMinimizeChat = () => {
    setIsMinimized(prev => !prev);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      content: input,
      role: 'user' as const,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Show typing indicator
      setMessages(prev => [
        ...prev,
        {
          content: '...',
          role: 'assistant',
          timestamp: new Date(),
          typing: true,
        }
      ]);

      // Get AI response
      const response = await generateAIResponse(
        messages.filter(m => !m.typing).map(m => ({ role: m.role, content: m.content })),
        'This is a quick chat widget conversation. Keep answers brief, helpful, and focused on agricultural topics.'
      );

      // Remove typing indicator and add response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.typing);
        return [
          ...filtered,
          {
            content: response,
            role: 'assistant',
            timestamp: new Date(),
          }
        ];
      });

      // If chat is closed, increment unread counter
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => !m.typing);
        return [
          ...filtered,
          {
            content: 'Sorry, I encountered an error. Please try again.',
            role: 'assistant',
            timestamp: new Date(),
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      {/* Chat Button with Animation */}
      <Zoom in={true}>
        <Badge
          badgeContent={unreadCount}
          color="error"
          overlap="circular"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1200,
            '& .MuiBadge-badge': {
              minWidth: '18px',
              height: '18px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
            }
          }}
        >
          <IconButton
            onClick={handleToggleChat}
            size="large"
            sx={{
              width: 56,
              height: 56,
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.5)}`,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                transform: 'scale(1.05) rotate(5deg)',
                backgroundColor: theme.palette.primary.dark,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.65)}`,
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            {isOpen ? <CloseIcon /> : <ChatIcon />}
          </IconButton>
        </Badge>
      </Zoom>

      {/* Chat Window */}
      <Collapse
        in={isOpen}
        timeout="auto"
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          width: { xs: 'calc(100% - 40px)', sm: 380 },
          maxWidth: { xs: 'calc(100% - 40px)', sm: 380 },
          maxHeight: isMinimized ? 80 : 500,
          zIndex: 1200,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: `0 10px 40px ${alpha(theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.2)' 
            : 'rgba(0,0,0,0.4)')}`,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'translateY(0)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: isMinimized ? 80 : 500,
            bgcolor: theme.palette.background.paper,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: theme.palette.mode === 'light' 
              ? alpha(theme.palette.primary.main, 0.1) 
              : alpha(theme.palette.primary.dark, 0.2),
            transition: 'all 0.3s ease',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: alpha('#ffffff', 0.1),
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {/* Background decorative elements */}
            <Box sx={{ 
              position: 'absolute', 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: alpha('#ffffff', 0.1), 
              filter: 'blur(20px)',
              top: '-30px', 
              left: '-30px',
              zIndex: 0,
            }} />
            
            <Box sx={{ 
              position: 'absolute', 
              width: '60px', 
              height: '60px', 
              borderRadius: '30%', 
              background: alpha('#ffffff', 0.1), 
              filter: 'blur(15px)',
              bottom: '-20px', 
              right: '40px',
              zIndex: 0,
            }} />
            
            <Stack direction="row" spacing={2} alignItems="center" sx={{ zIndex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: alpha('#ffffff', 0.2),
                  color: 'white',
                  width: 38,
                  height: 38,
                  border: '2px solid',
                  borderColor: alpha('#ffffff', 0.3),
                }}
              >
                <LocalFloristIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  AgriCounsel AI
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Farming specialist assistant
                </Typography>
              </Box>
            </Stack>
            
            <Box sx={{ display: 'flex', gap: 1, zIndex: 1 }}>
              <Tooltip title={isMinimized ? "Expand chat" : "Minimize chat"} arrow>
                <IconButton
                  onClick={handleMinimizeChat}
                  size="small"
                  sx={{ 
                    color: 'white',
                    bgcolor: alpha('#ffffff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.2),
                    }
                  }}
                >
                  {isMinimized ? <ChatIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Close chat" arrow>
                <IconButton
                  onClick={handleToggleChat}
                  size="small"
                  sx={{ 
                    color: 'white',
                    bgcolor: alpha('#ffffff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.2),
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Messages */}
          {!isMinimized && (
            <Box
              ref={chatRef}
              sx={{
                flexGrow: 1,
                p: 2,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                bgcolor: theme.palette.mode === 'light' 
                  ? alpha(theme.palette.primary.light, 0.03)
                  : alpha(theme.palette.primary.dark, 0.05),
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.palette.mode === 'light' ? '#cbd5e1' : '#475569'} transparent`,
                '&::-webkit-scrollbar': {
                  width: '5px',
                  height: '5px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569',
                  borderRadius: '3px',
                },
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    maxWidth: '100%',
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: message.role === 'user'
                        ? theme.palette.secondary.main 
                        : theme.palette.primary.main,
                      color: '#fff',
                      fontSize: '0.8rem',
                      boxShadow: message.role === 'user'
                        ? `0 2px 8px ${alpha(theme.palette.secondary.main, 0.3)}`
                        : `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {message.role === 'user' ? (
                      <PersonIcon fontSize="small" />
                    ) : (
                      <LocalFloristIcon fontSize="small" />
                    )}
                  </Avatar>
                  
                  <Box sx={{ 
                    maxWidth: '75%',
                    position: 'relative',
                  }}>
                    <Card
                      sx={{
                        maxWidth: '100%',
                        borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        bgcolor: message.role === 'user'
                          ? theme.palette.mode === 'light' 
                            ? alpha(theme.palette.secondary.main, 0.1)
                            : alpha(theme.palette.secondary.main, 0.15)
                          : theme.palette.background.paper,
                        boxShadow: message.role === 'user'
                          ? 'none'
                          : theme.palette.mode === 'light'
                            ? '0 1px 3px rgba(0,0,0,0.05)'
                            : '0 1px 3px rgba(0,0,0,0.2)',
                        border: '1px solid',
                        borderColor: message.role === 'user'
                          ? theme.palette.mode === 'light'
                            ? alpha(theme.palette.secondary.main, 0.2)
                            : alpha(theme.palette.secondary.main, 0.25)
                          : theme.palette.mode === 'light'
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.divider, 0.2),
                        overflow: 'hidden',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {message.typing ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={12} color="inherit" />
                            <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                              Analyzing farm data...
                            </Typography>
                          </Box>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              color: message.role === 'user' 
                                ? theme.palette.mode === 'light'
                                  ? theme.palette.secondary.dark
                                  : theme.palette.secondary.contrastText
                                : theme.palette.text.primary,
                            }}
                          >
                            {message.content}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        color: theme.palette.text.secondary,
                        mt: 0.5,
                        opacity: 0.7,
                        fontSize: '0.65rem',
                        textAlign: message.role === 'user' ? 'right' : 'left',
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Input */}
          {!isMinimized && (
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1.5,
                bgcolor: theme.palette.background.paper,
                borderTop: '1px solid',
                borderColor: theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.07)'
                  : 'rgba(255, 255, 255, 0.07)',
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about farming..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                inputRef={inputRef}
                multiline
                maxRows={3}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Attach image" arrow>
                        <IconButton
                          size="small"
                          sx={{
                            color: theme.palette.mode === 'light'
                              ? alpha(theme.palette.primary.main, 0.7)
                              : alpha(theme.palette.primary.light, 0.7),
                            '&:hover': {
                              color: theme.palette.mode === 'light'
                                ? theme.palette.primary.main
                                : theme.palette.primary.light,
                            }
                          }}
                        >
                          <AttachFileIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light'
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.primary.main, 0.3),
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '1.5px',
                    },
                  },
                }}
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Tooltip title="Voice input" arrow>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <MicNoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    width: 36,
                    height: 36,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      transform: 'scale(1.05)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: alpha(theme.palette.action.disabled, 0.12),
                      color: theme.palette.action.disabled,
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SendIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>
      </Collapse>
    </>
  );
};

export default ChatbotWidget;