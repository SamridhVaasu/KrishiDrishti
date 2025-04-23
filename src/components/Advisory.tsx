import { Box, Paper, Typography, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import GrassIcon from '@mui/icons-material/Grass';
import { useState, useEffect } from 'react';
import { fetchThingSpeakData } from '../utils/thingspeak';
import { useTheme } from '@mui/material/styles';

const Advisory = () => {
  const theme = useTheme();
  const [conditions, setConditions] = useState({
    humidity: 0,
    temperature: 0,
    moisture: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchThingSpeakData();
      if (data) {
        setConditions({
          humidity: parseFloat(data.field2),
          temperature: parseFloat(data.field3),
          moisture: parseFloat(data.field1)
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getAdvice = () => {
    const advice = [];
    
    // Humidity advice
    if (conditions.humidity < 40) {
      advice.push({
        title: 'Humidity Alert',
        message: 'Current humidity is low. Consider using humidity enhancement techniques:',
        recommendations: [
          'Use mulching to retain moisture',
          'Install drip irrigation system',
          'Consider adding humidity trays'
        ]
      });
    }

    // Moisture advice
    if (conditions.temperature > 23) {
      advice.push({
        title: 'Soil Moisture Management',
        message: 'Soil moisture levels need attention:',
        recommendations: [
          'Adjust irrigation schedule',
          'Check soil drainage',
          'Consider soil amendments for better moisture retention'
        ]
      });
    }

    // Temperature advice
    if (conditions.moisture < 25) {
      advice.push({
        title: 'Temperature Control',
        message: 'Temperature conditions require adjustment:',
        recommendations: [
          'Monitor greenhouse ventilation',
          'Adjust shading if necessary',
          'Consider time of day for operations'
        ]
      });
    }

    return advice;
  };

  const getConditionStatus = (value: number, type: string) => {
    switch (type) {
      case 'humidity':
        return {
          status: value < 40 ? 'Low' : value > 70 ? 'High' : 'Optimal',
          color: value < 40 ? '#ff9800' : value > 70 ? '#f44336' : '#4caf50',
          value: Math.min(100, (value / 70) * 100)
        };
      case 'moisture':
        return {
          status: value < 18 ? 'Low' : value > 25 ? 'High' : 'Optimal',
          color: value < 18 ? '#ff9800' : value > 25 ? '#f44336' : '#4caf50',
          value: Math.min(100, (value / 30) * 100)
        };
      case 'temperature':
        return {
          status: value < 25 ? 'Low' : value > 45 ? 'High' : 'Optimal',
          color: value < 25 ? '#ff9800' : value > 45 ? '#f44336' : '#4caf50',
          value: Math.min(100, (value / 45) * 100)
        };
      default:
        return { status: 'Unknown', color: '#grey', value: 0 };
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8faf9' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: theme.palette.primary.main, fontWeight: 600 }}>
        KrishiDrishti Insights
      </Typography>

      <Grid container spacing={3}>
        {/* Current Conditions */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: '#ffffff',
            borderRadius: 2,
            border: '1px solid rgba(52, 168, 83, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1b5e20', fontWeight: 500 }}>
              Environmental Analysis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <WaterDropIcon sx={{ mr: 1, color: '#1976d2' }} />
                      <Typography variant="h6" sx={{ color: '#1976d2' }}>Humidity</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom sx={{ color: '#1976d2' }}>
                      {conditions.humidity}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={getConditionStatus(conditions.humidity, 'humidity').value}
                      sx={{ 
                        height: 8, 
                        borderRadius: 5,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getConditionStatus(conditions.humidity, 'humidity').color
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ mt: 1, color: getConditionStatus(conditions.humidity, 'humidity').color }}>
                      {getConditionStatus(conditions.humidity, 'humidity').status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  border: '1px solid rgba(46, 125, 50, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GrassIcon sx={{ mr: 1, color: '#2e7d32' }} />
                      <Typography variant="h6" sx={{ color: '#2e7d32' }}>Soil Moisture</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32' }}>
                      {conditions.temperature}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={getConditionStatus(conditions.temperature, 'moisture').value}
                      sx={{ 
                        height: 8, 
                        borderRadius: 5,
                        bgcolor: 'rgba(46, 125, 50, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getConditionStatus(conditions.temperature, 'moisture').color
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ mt: 1, color: getConditionStatus(conditions.temperature, 'moisture').color }}>
                      {getConditionStatus(conditions.temperature, 'moisture').status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  border: '1px solid rgba(211, 47, 47, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ThermostatIcon sx={{ mr: 1, color: '#d32f2f' }} />
                      <Typography variant="h6" sx={{ color: '#d32f2f' }}>Temperature</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom sx={{ color: '#d32f2f' }}>
                      {conditions.moisture}°C
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={getConditionStatus(conditions.moisture, 'temperature').value}
                      sx={{ 
                        height: 8, 
                        borderRadius: 5,
                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getConditionStatus(conditions.moisture, 'temperature').color
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ mt: 1, color: getConditionStatus(conditions.moisture, 'temperature').color }}>
                      {getConditionStatus(conditions.moisture, 'temperature').status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            bgcolor: '#ffffff',
            borderRadius: 2,
            border: '1px solid rgba(52, 168, 83, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1b5e20', fontWeight: 500 }}>
              AI Recommendations
            </Typography>
            <Grid container spacing={3}>
              {getAdvice().map((advice, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ 
                    border: '1px solid rgba(52, 168, 83, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                    }
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#1b5e20', mb: 2 }}>
                        {advice.title}
                      </Typography>
                      <Typography variant="body1" paragraph sx={{ color: '#558b2f' }}>
                        {advice.message}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {advice.recommendations.map((rec, idx) => (
                          <Typography component="li" key={idx} sx={{ mb: 1, color: '#2e7d32' }}>
                            {rec}
                          </Typography>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Advisory;