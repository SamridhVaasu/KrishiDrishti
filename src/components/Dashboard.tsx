import { 
  Box, 
  Grid, 
  Typography, 
  IconButton, 
  Collapse, 
  Card,
  CardContent, 
  Chip,
  Stack,
  Paper,
  Divider,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
  Badge,
  Alert,
  AlertTitle,
  Button,
  Menu,
  MenuItem,
  useMediaQuery,
  Zoom,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import LightModeIcon from '@mui/icons-material/LightMode';
import AirIcon from '@mui/icons-material/Air';
import SensorsIcon from '@mui/icons-material/Sensors';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GrassIcon from '@mui/icons-material/Grass';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudIcon from '@mui/icons-material/Cloud';
import BoltIcon from '@mui/icons-material/Bolt';
import FilterListIcon from '@mui/icons-material/FilterList';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect } from 'react';
import { fetchThingSpeakData, getSoilMoistureStatus } from '../utils/thingspeak';

// Interface for sensor status data
interface SensorStatus {
  value: number;
  status: 'Optimal' | 'Warning' | 'Critical';
  color: string;
  icon: JSX.Element;
  unit: string;
  name: string;
}

// Farm Zone interface
interface FarmZone {
  id: string;
  name: string;
  status: 'optimal' | 'warning' | 'alert';
  crop: string;
  area: string;
}

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(true);
  const [sensorData, setSensorData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'warning' | 'error'>('operational');
  const [activeZone, setActiveZone] = useState<string>('zone1');
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Sample farm zones data
  const farmZones: FarmZone[] = [
    { id: 'zone1', name: 'North Field', status: 'optimal', crop: 'Corn', area: '2.4 hectares' },
    { id: 'zone2', name: 'East Field', status: 'warning', crop: 'Wheat', area: '1.8 hectares' },
    { id: 'zone3', name: 'South Field', status: 'optimal', crop: 'Soybeans', area: '3.2 hectares' }
  ];

  // Collection of ThingSpeak chart URLs with updated styling
  const thingSpeakUrls = {
    temperature: `https://thingspeak.mathworks.com/channels/2864340/charts/1?bgcolor=%23ffffff&color=${encodeURIComponent('#d32f2f')}&dynamic=true&results=60&type=line&update=15&width=auto&height=auto&title=Temperature`,
    humidity: `https://thingspeak.mathworks.com/channels/2864340/charts/2?bgcolor=%23ffffff&color=${encodeURIComponent('#0277bd')}&dynamic=true&results=60&type=line&update=15&width=auto&height=auto&title=Humidity`,
    moisture: `https://thingspeak.mathworks.com/channels/2864340/charts/3?bgcolor=%23ffffff&color=${encodeURIComponent('#2e7d32')}&dynamic=true&results=60&type=line&update=15&width=auto&height=auto&title=Soil+Moisture`,
  };

  // Function to fetch sensor data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const data = await fetchThingSpeakData();
      setSensorData(data);
      setLastUpdated(new Date());
      
      // Calculate system status based on sensor readings
      if (parseFloat(data.field3) > 30 || parseFloat(data.field1) < 20) {
        setSystemStatus('warning');
      } else if (parseFloat(data.field2) > 80) {
        setSystemStatus('error');
      } else {
        setSystemStatus('operational');
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setSystemStatus('error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch data on component mount and set up interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Get sensor status information
  const getSensorInfo = (type: string): SensorStatus | null => {
    if (!sensorData) return null;
    
    const value = parseFloat(sensorData[type === 'temperature' ? 'field3' : type === 'humidity' ? 'field2' : 'field1']);
    
    switch (type) {
      case 'temperature':
        return {
          value,
          status: value > 30 ? 'Warning' : value > 35 ? 'Critical' : 'Optimal',
          color: value > 30 ? theme.palette.warning.main : value > 35 ? theme.palette.error.main : theme.palette.success.main,
          icon: <ThermostatIcon />,
          unit: '°C',
          name: 'Temperature'
        };
      case 'humidity':
        return {
          value,
          status: value < 30 ? 'Warning' : value < 20 ? 'Critical' : value > 80 ? 'Warning' : value > 90 ? 'Critical' : 'Optimal',
          color: (value < 30 || value > 80) ? theme.palette.warning.main : (value < 20 || value > 90) ? theme.palette.error.main : theme.palette.success.main,
          icon: <WaterDropIcon />,
          unit: '%',
          name: 'Humidity'
        };
      case 'moisture':
        const moistureStatus = getSoilMoistureStatus(value);
        return {
          value,
          status: moistureStatus.status === 'Dry' || moistureStatus.status === 'Wet' ? 'Warning' : 'Optimal',
          color: moistureStatus.color,
          icon: <OpacityIcon />,
          unit: '%',
          name: 'Soil Moisture'
        };
      default:
        return null;
    }
  };

  // Manual refresh of data
  const handleRefresh = () => {
    fetchData(true);
  };

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Get system status attributes
  const getSystemStatusAttrs = () => {
    switch (systemStatus) {
      case 'operational':
        return {
          color: theme.palette.success.main,
          text: 'All Systems Operational',
          severity: 'success' as const,
          message: 'All sensors are reporting optimal readings.'
        };
      case 'warning':
        return {
          color: theme.palette.warning.main,
          text: 'System Warning',
          severity: 'warning' as const,
          message: 'Some sensor readings are outside normal parameters. Monitor closely.'
        };
      case 'error':
        return {
          color: theme.palette.error.main,
          text: 'System Alert',
          severity: 'error' as const,
          message: 'Critical sensor readings detected. Immediate attention required.'
        };
    }
  };

  // Status attributes
  const statusAttrs = getSystemStatusAttrs();

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.default,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Main Dashboard Content */}
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Stats Overview */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={3} 
          alignItems={{ xs: 'stretch', md: 'center' }} 
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" sx={{ 
              mb: 0.5, 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              letterSpacing: '-0.01em',
            }}>
              KrishiDrishti Dashboard
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary, 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              <Box component="span" sx={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                color: statusAttrs.color,
              }}>
                <Box 
                  component="span"
                  sx={{ 
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: statusAttrs.color,
                    mr: 0.7,
                    boxShadow: `0 0 6px ${statusAttrs.color}`,
                  }}
                />
                {statusAttrs.text}
              </Box>
              
              {lastUpdated && (
                <Tooltip title="Last data refresh time" arrow>
                  <Typography variant="body2" sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    color: theme.palette.text.secondary,
                    ml: 2,
                  }}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Typography>
                </Tooltip>
              )}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {systemStatus !== 'operational' && (
              <Alert 
                severity={statusAttrs.severity}
                sx={{ 
                  py: 0, 
                  alignItems: 'center', 
                  '& .MuiAlert-icon': { fontSize: '1.25rem', my: 'auto', alignItems: 'center' } 
                }}
              >
                {statusAttrs.message}
              </Alert>
            )}
            
            <Tooltip title="Farm Zones" arrow>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<GrassIcon />}
                onClick={handleMenuOpen}
                sx={{
                  borderRadius: 8,
                  px: 2,
                }}
              >
                {farmZones.find(zone => zone.id === activeZone)?.name || 'Select Zone'}
              </Button>
            </Tooltip>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  boxShadow: theme.shadows[3],
                }
              }}
            >
              {farmZones.map((zone) => (
                <MenuItem 
                  key={zone.id}
                  onClick={() => {
                    setActiveZone(zone.id);
                    handleMenuClose();
                  }}
                  selected={zone.id === activeZone}
                  sx={{
                    borderLeft: zone.id === activeZone ? `3px solid ${theme.palette.primary.main}` : 'none',
                    pl: zone.id === activeZone ? 2 : 3,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: zone.status === 'optimal' ? theme.palette.success.main : 
                                zone.status === 'warning' ? theme.palette.warning.main : theme.palette.error.main,
                      }}
                    />
                    <Typography variant="body2">{zone.name}</Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      ({zone.crop})
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Menu>
            
            <Tooltip title="Refresh data" arrow>
              <IconButton 
                onClick={handleRefresh} 
                color="primary" 
                disabled={loading}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  }
                }}
              >
                <RefreshIcon sx={{ 
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Sensor Cards with Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {['temperature', 'humidity', 'moisture'].map((sensorType) => {
            const sensorInfo = getSensorInfo(sensorType);
            if (!sensorInfo) return null;
            
            return (
              <Grid item xs={12} md={4} key={sensorType}>
                <Zoom in={true} style={{ transitionDelay: `${['temperature', 'humidity', 'moisture'].indexOf(sensorType) * 150}ms` }}>
                  <Card sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    borderTop: `3px solid ${sensorInfo.color}`,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute',
                      top: -20,
                      left: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Avatar sx={{ 
                        bgcolor: sensorInfo.color,
                        boxShadow: `0 4px 14px ${alpha(sensorInfo.color, 0.4)}`,
                        color: '#fff',
                        width: 48,
                        height: 48,
                      }}>
                        {sensorInfo.icon}
                      </Avatar>
                    </Box>
                    
                    <CardContent sx={{ pt: 4, pb: 3 }}>
                      <Box sx={{ ml: 5, mb: 2 }}>
                        <Typography variant="overline" sx={{ 
                          fontSize: '0.75rem', 
                          color: theme.palette.text.secondary,
                          letterSpacing: '1px',
                        }}>
                          {sensorInfo.name}
                        </Typography>
                        
                        <Typography variant="h3" sx={{ 
                          lineHeight: 1.2,
                          fontWeight: 600,
                          color: theme.palette.mode === 'light' ? theme.palette.text.primary : '#fff',
                        }}>
                          {sensorInfo.value.toFixed(1)}<Typography component="span" variant="h6">{sensorInfo.unit}</Typography>
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ mb: 2, opacity: 0.1 }} />
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          size="small"
                          sx={{
                            bgcolor: alpha(sensorInfo.color, 0.1),
                            color: sensorInfo.color,
                            fontWeight: 500,
                          }}
                          label={sensorInfo.status}
                        />
                        
                        <Tooltip title={`View ${sensorInfo.name.toLowerCase()} details`} arrow>
                          <IconButton 
                            size="small"
                            sx={{
                              color: sensorInfo.color,
                              '&:hover': {
                                bgcolor: alpha(sensorInfo.color, 0.1),
                              }
                            }}
                          >
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>

        {/* Sensor Analytics Section */}
        <Paper 
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: theme.shadows[2],
            mb: 3,
          }}
        >
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            background: theme.palette.mode === 'light'
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.01)}, ${alpha(theme.palette.secondary.main, 0.03)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.1)}, ${alpha(theme.palette.secondary.dark, 0.1)})`,
          }}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SensorsIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light 
                }}>
                  Sensor Analytics
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Real-time IoT sensor data visualization
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                icon={<GrassIcon />}
                label={farmZones.find(zone => zone.id === activeZone)?.name || 'Field Zone 1'} 
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light,
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light,
                  }
                }}
              />
              
              <IconButton 
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light,
                  transition: 'transform 0.3s ease',
                  transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  }
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ 
            flexGrow: 1,
            p: { xs: 1.5, sm: 2 }, 
            overflow: 'auto',
            bgcolor: theme.palette.background.paper,
            transition: 'all 0.3s ease',
          }}>
            <Collapse in={expanded} sx={{ height: '100%' }}>
              <Grid container spacing={3}>
                {/* Temperature Chart */}
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    height: '450px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.error.main, 0.2),
                    borderRadius: 2,
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.error.main, 0.02)
                      : alpha(theme.palette.error.dark, 0.05),
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      padding: '1px',
                      background: `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0)}, ${alpha(theme.palette.error.main, 0.5)})`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'destination-out',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                    },
                  }}>
                    <Box sx={{ 
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderBottom: '1px solid',
                      borderColor: alpha(theme.palette.error.main, 0.1),
                    }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                        }}
                      >
                        <ThermostatIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                          Temperature
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Last 24 hours
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, px: 1, py: 2 }}>
                      <iframe
                        src={thingSpeakUrls.temperature}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Temperature"
                      />
                    </Box>
                  </Card>
                </Grid>

                {/* Humidity Chart */}
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    height: '450px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.2),
                    borderRadius: 2,
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.info.main, 0.02)
                      : alpha(theme.palette.info.dark, 0.05),
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      padding: '1px',
                      background: `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0)}, ${alpha(theme.palette.info.main, 0.5)})`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'destination-out',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                    },
                  }}>
                    <Box sx={{ 
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderBottom: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.1),
                    }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main,
                        }}
                      >
                        <WaterDropIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                          Humidity
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Last 24 hours
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, px: 1, py: 2 }}>
                      <iframe
                        src={thingSpeakUrls.humidity}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Humidity"
                      />
                    </Box>
                  </Card>
                </Grid>

                {/* Soil Moisture Chart */}
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    height: '450px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.2),
                    borderRadius: 2,
                    background: theme.palette.mode === 'light'
                      ? alpha(theme.palette.success.main, 0.02)
                      : alpha(theme.palette.success.dark, 0.05),
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      padding: '1px',
                      background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0)}, ${alpha(theme.palette.success.main, 0.5)})`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'destination-out',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                    },
                  }}>
                    <Box sx={{ 
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      borderBottom: '1px solid',
                      borderColor: alpha(theme.palette.success.main, 0.1),
                    }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                        }}
                      >
                        <OpacityIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                          Soil Moisture
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Last 24 hours
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, px: 1, py: 2 }}>
                      <iframe
                        src={thingSpeakUrls.moisture}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Soil Moisture"
                      />
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Collapse>
          </Box>
        </Paper>

        {/* Farm Insights Section */}
        <Paper 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: theme.shadows[2],
          }}
        >
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            background: theme.palette.mode === 'light'
              ? `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.01)}, ${alpha(theme.palette.primary.main, 0.03)})`
              : `linear-gradient(45deg, ${alpha(theme.palette.secondary.dark, 0.1)}, ${alpha(theme.palette.primary.dark, 0.1)})`,
          }}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BoltIcon sx={{ color: theme.palette.secondary.main }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.mode === 'light' ? theme.palette.secondary.main : theme.palette.secondary.light 
                }}>
                  Farm Insights
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                AI-powered recommendations and alerts
              </Typography>
            </Stack>
            
            <IconButton 
              onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                color: theme.palette.mode === 'light' ? theme.palette.secondary.main : theme.palette.secondary.light,
                transition: 'transform 0.3s ease',
                transform: isInsightsExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                }
              }}
            >
              {isInsightsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Box sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: theme.palette.background.paper,
          }}>
            <Collapse in={isInsightsExpanded}>
              <Grid container spacing={3}>
                {/* Water Requirements Card */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ 
                    height: '100%',
                    backgroundImage: `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.info.main, 0.1)}, transparent 40%)`,
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.1),
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.2),
                              color: theme.palette.info.main,
                            }}
                          >
                            <WaterDropIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Water Requirements</Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {farmZones.find(zone => zone.id === activeZone)?.name}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Box sx={{ py: 2, px: 3, bgcolor: alpha(theme.palette.info.main, 0.03), borderRadius: 2 }}>
                          <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">Status:</Typography>
                              <Chip 
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                }}
                                icon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
                                label="Optimal" 
                              />
                            </Stack>
                            
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">Recommended Schedule:</Typography>
                              <Typography variant="body2">Morning Only</Typography>
                            </Stack>
                            
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">Recommended Amount:</Typography>
                              <Typography variant="body2">5 liters/m²</Typography>
                            </Stack>
                          </Stack>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: theme.palette.info.main }}>
                          <InfoOutlinedIcon fontSize="small" />
                          <Typography variant="body2">
                            Based on current conditions, soil moisture is optimal for {farmZones.find(zone => zone.id === activeZone)?.crop}.
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Pest Risk Assessment Card */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ 
                    height: '100%',
                    backgroundImage: `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.warning.main, 0.1)}, transparent 40%)`,
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.warning.main, 0.1),
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.2),
                              color: theme.palette.warning.main,
                            }}
                          >
                            <BugReportIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Pest Risk Assessment</Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Updated today
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Box sx={{ py: 2, px: 3, bgcolor: alpha(theme.palette.warning.main, 0.03), borderRadius: 2 }}>
                          <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">Current Risk:</Typography>
                              <Chip 
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  color: theme.palette.warning.main,
                                }}
                                label="Moderate" 
                              />
                            </Stack>
                            
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">Potential Pests:</Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip size="small" label="Aphids" />
                                <Chip size="small" label="Caterpillars" />
                              </Stack>
                            </Stack>
                          </Stack>
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                          <b>Recommendation:</b> Regular monitoring recommended. Check undersides of leaves.
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Weather Impact Card */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ 
                    height: '100%',
                    backgroundImage: `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.1)}, transparent 40%)`,
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              color: theme.palette.primary.main,
                            }}
                          >
                            <CloudIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Weather Impact</Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              3-day forecast
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Box sx={{ py: 2, px: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Today:</Typography>
                              <Chip 
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                }}
                                label="Ideal growing conditions" 
                              />
                            </Stack>
                            
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Tomorrow:</Typography>
                              <Chip 
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  color: theme.palette.warning.main,
                                }}
                                label="High temperatures expected" 
                              />
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Day after:</Typography>
                              <Chip 
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main,
                                }}
                                label="Light rain possible" 
                              />
                            </Stack>
                          </Stack>
                        </Box>

                        <Alert severity="info" sx={{ py: 0.5 }}>
                          Consider extra irrigation tomorrow due to expected high temperatures.
                        </Alert>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Collapse>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;