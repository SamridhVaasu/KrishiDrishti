import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  IconButton,
  Tooltip,
  PaletteMode,
  useTheme,
  Avatar,
  Stack,
  Badge,
  Divider,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import HealingIcon from '@mui/icons-material/Healing';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ScienceIcon from '@mui/icons-material/Science';
import ChatIcon from '@mui/icons-material/Chat';
import { useState, useEffect } from 'react';
import { ColorModeContext } from '../App';

const drawerWidth = 280;

interface SidebarProps {
  onMenuSelect: (menu: string) => void;
  colorMode: {
    toggleColorMode: () => void;
  };
  mode: PaletteMode;
}

const Sidebar = ({ onMenuSelect, colorMode, mode }: SidebarProps) => {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const theme = useTheme();
  const [time, setTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleMenuClick = (menu: string) => {
    setSelectedMenu(menu);
    onMenuSelect(menu);
  };

  const menuItems = [
    {
      id: 'dashboard',
      icon: <DashboardIcon />,
      text: 'Dashboard',
      tooltip: 'View farm monitoring data and analytics',
      badge: 0,
    },
    {
      id: 'krishigpt',
      icon: <ChatIcon />,
      text: 'KrishiGPT',
      tooltip: 'Chat with KrishiGPT about farming and agriculture',
      badge: 0,
    },
    {
      id: 'plant-diagnostic',
      icon: <LocalFloristIcon />,
      text: 'Plant Diagnostic',
      tooltip: 'Advanced plant health analysis and disease detection',
      badge: 0,
    },
    {
      id: 'advisory',
      icon: <AgricultureIcon />,
      text: 'Advisory',
      tooltip: 'Get seasonal farming recommendations',
      badge: 2,
    }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: theme.palette.background.paper,
          borderRight: '1px solid',
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(0, 0, 0, 0.05)'
            : 'rgba(255, 255, 255, 0.05)',
          backgroundImage: theme.palette.mode === 'light'
            ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.8)), url("/textures/subtle_dots.png")'
            : 'none',
          backgroundRepeat: 'repeat',
          backgroundSize: '100px',
          backgroundBlendMode: 'overlay',
        },
      }}
    >
      {/* Logo Header with Glassmorphic Effect */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, rgba(30, 138, 84, 0.9) 0%, rgba(0, 131, 158, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(78, 204, 163, 0.9) 0%, rgba(20, 184, 166, 0.85) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '0 0 24px 24px',
        boxShadow: theme.palette.mode === 'light'
          ? '0 4px 24px rgba(0, 0, 0, 0.12)'
          : '0 4px 24px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        mb: 2,
      }}>
        {/* Decorative background elements */}
        <Box sx={{ 
          position: 'absolute', 
          width: '120px', 
          height: '120px', 
          borderRadius: '60%', 
          background: alpha(theme.palette.primary.main, 0.2), 
          top: '-30px', 
          left: '-30px'
        }} />
        <Box sx={{ 
          position: 'absolute', 
          width: '80px', 
          height: '80px', 
          borderRadius: '40%', 
          background: alpha(theme.palette.secondary.main, 0.15), 
          bottom: '-20px', 
          right: '-10px'
        }} />
        
        {/* Logo and title */}
        <Avatar 
          sx={{
            bgcolor: 'transparent',
            color: '#ffffff',
            width: 64,
            height: 64,
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 12px rgba(0, 0, 0, 0.15)'
              : '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '2px solid',
            borderColor: alpha('#ffffff', 0.8),
          }}
        >
          <LocalFloristIcon sx={{ fontSize: 36 }} />
        </Avatar>
        
        <Box sx={{ textAlign: 'center', zIndex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5, letterSpacing: '0.5px' }}>
            KrishiDrishti
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#2e7d32', 0.85), fontWeight: 500 }}>
            Smart Agriculture Vision
          </Typography>
        </Box>
        
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          <IconButton 
            onClick={colorMode.toggleColorMode} 
            sx={{ 
              position: 'absolute',
              right: 12,
              top: 12,
              color: '#ffffff',
              bgcolor: alpha('#ffffff', 0.2),
              backdropFilter: 'blur(8px)',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
              }
            }}
            size="small"
          >
            {mode === 'light' ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Current Date Display */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" sx={{ opacity: 0.6, fontWeight: 500 }}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.id} title={item.tooltip} placement="right" arrow>
            <ListItem 
              button 
              onClick={() => handleMenuClick(item.id)}
              sx={{ 
                mb: 1.5,
                borderRadius: 2,
                bgcolor: selectedMenu === item.id 
                  ? alpha(theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.dark, 
                      theme.palette.mode === 'light' ? 0.12 : 0.24)
                  : 'transparent',
                color: selectedMenu === item.id 
                  ? theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light
                  : theme.palette.text.primary,
                padding: '10px 16px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  bgcolor: selectedMenu === item.id 
                    ? alpha(theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.dark, 
                        theme.palette.mode === 'light' ? 0.18 : 0.3)
                    : alpha(theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light, 0.08),
                  transform: 'translateX(4px)',
                },
                boxShadow: selectedMenu === item.id
                  ? theme.palette.mode === 'light'
                    ? '0 2px 8px rgba(0,0,0,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.2)'
                  : 'none',
              }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  bgcolor: selectedMenu === item.id
                    ? theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.light, 0.12)
                    : theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.light, 0.05),
                  color: selectedMenu === item.id 
                    ? theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light
                    : theme.palette.mode === 'light' ? theme.palette.text.primary : theme.palette.text.secondary
                }}>
                  {item.icon}
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: selectedMenu === item.id ? 600 : 500,
                  fontSize: '0.95rem',
                }}
              />
              {item.badge > 0 && (
                <Badge 
                  badgeContent={item.badge} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 10,
                      height: 18,
                      minWidth: 18,
                    }
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ 
        mx: 2, 
        my: 2, 
        opacity: 0.2,
      }} />
      
      {/* System Status */}
      <Box sx={{ 
        mx: 2,
        mb: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.mode === 'light' ? theme.palette.info.light : theme.palette.info.dark, 0.08),
        border: '1px solid',
        borderColor: alpha(theme.palette.mode === 'light' ? theme.palette.info.main : theme.palette.info.light, 0.12),
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            bgcolor: theme.palette.success.main, 
            boxShadow: `0 0 8px ${theme.palette.success.main}`,
          }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              System Status
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              All Systems Operational
            </Typography>
          </Box>
        </Stack>
      </Box>
      
      <Box sx={{ 
        p: 2, 
        textAlign: 'center',
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          AgroSense AI Assistant v2.4.1
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          © {new Date().getFullYear()} KrishiDrishti
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;