import { Box, ThemeProvider, createTheme, CssBaseline, PaletteMode, alpha } from '@mui/material';
import { useState, useMemo, createContext } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Advisory from './components/Advisory';
import ChatbotWidget from './components/ChatbotWidget';
import PlantDiagnostic from './components/PlantDiagnostic';
import KrishiGPT from './components/KrishiGPT';

// Create a context for theme mode
export const ColorModeContext = createContext({ 
  toggleColorMode: () => {} 
});

// Modern agricultural-themed colors
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode - Unique KrishiDrishti palette
          primary: {
            main: '#2e7d32', // Deep green
            light: '#6fbf73',
            dark: '#005005',
            contrastText: '#fff',
          },
          secondary: {
            main: '#8d6e63', // Earthy brown
            light: '#be9c91',
            dark: '#5f4339',
            contrastText: '#fff',
          },
          accent: '#fbc02d', // Golden yellow accent
          background: {
            default: '#f6f5ee', // Soft off-white
            paper: '#fffdfa',
            subtle: 'rgba(46, 125, 50, 0.03)',
          },
          text: {
            primary: '#263238',
            secondary: '#5d7262',
          },
          soil: { main: '#a98274' },
          wheat: { main: '#fbc02d' },
          leaf: { main: '#6fbf73' },
        }
      : {
          // Dark mode - Unique KrishiDrishti palette
          primary: {
            main: '#43a047', // Lush green
            light: '#76d275',
            dark: '#00701a',
            contrastText: '#fff',
          },
          secondary: {
            main: '#bcaaa4', // Muted brown
            light: '#efdcd5',
            dark: '#8c7b75',
            contrastText: '#fff',
          },
          accent: '#ffd600', // Bright yellow accent
          background: {
            default: '#181c1a', // Deep earthy
            paper: '#232a25',
            subtle: 'rgba(67, 160, 71, 0.04)',
          },
          text: {
            primary: '#f0f6fc',
            secondary: '#b0bfae',
          },
          soil: { main: '#bcaaa4' },
          wheat: { main: '#ffd600' },
          leaf: { main: '#76d275' },
        }),
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    subtitle1: {
      fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    button: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(17, 20, 24, 0.04), 0px 0px 2px rgba(17, 20, 24, 0.03)',
    '0px 4px 8px rgba(17, 20, 24, 0.04), 0px 0px 4px rgba(17, 20, 24, 0.03)',
    '0px 8px 16px rgba(17, 20, 24, 0.04), 0px 0px 6px rgba(17, 20, 24, 0.03)',
    '0px 12px 24px rgba(17, 20, 24, 0.04), 0px 0px 8px rgba(17, 20, 24, 0.03)',
    '0px 18px 30px rgba(17, 20, 24, 0.04), 0px 0px 10px rgba(17, 20, 24, 0.03)',
    // ... rest of the shadows array
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme: any) => ({
        body: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.palette.mode === 'light' ? '#cbd5e1' : '#475569'} transparent`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'light' ? '#94a3b8' : '#64748b',
          },
        }
      }),
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'light' 
            ? '0px 2px 8px rgba(17, 20, 24, 0.04), 0px 0px 4px rgba(17, 20, 24, 0.03)'
            : '0px 2px 8px rgba(0, 0, 0, 0.2)',
          ...(mode === 'light' && {
            backgroundImage: 'url("/textures/subtle_dots.png")', // Subtle texture background
            backgroundRepeat: 'repeat',
            backgroundSize: '100px',
            backgroundBlendMode: 'overlay',
            backgroundOpacity: 0.05,
          }),
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' 
              ? '0px 6px 12px rgba(17, 20, 24, 0.1), 0px 0px 4px rgba(17, 20, 24, 0.05)'
              : '0px 6px 12px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: mode === 'light' 
              ? '0px 6px 12px rgba(17, 20, 24, 0.1), 0px 0px 4px rgba(17, 20, 24, 0.05)'
              : '0px 6px 12px rgba(0, 0, 0, 0.3)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: mode === 'light'
            ? '0px 4px 20px rgba(17, 20, 24, 0.06), 0px 0px 6px rgba(17, 20, 24, 0.03)'
            : '0px 4px 20px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'light'
              ? '0px 12px 24px rgba(17, 20, 24, 0.08), 0px 0px 8px rgba(17, 20, 24, 0.04)'
              : '0px 12px 24px rgba(0, 0, 0, 0.35)',
          },
          border: mode === 'light' ? '1px solid rgba(230, 235, 240, 0.9)' : '1px solid rgba(50, 60, 70, 0.35)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease-in-out',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          '&.MuiChip-filled': {
            boxShadow: mode === 'light'
              ? '0px 2px 4px rgba(17, 20, 24, 0.04)'
              : '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
        icon: {
          color: 'inherit',
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          }
        },
        indicator: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          transition: 'all 0.3s ease',
          textTransform: 'none',
          '&.Mui-selected': {
            fontWeight: 600,
          },
          minWidth: 'unset',
          padding: '12px 16px',
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: alpha(mode === 'light' ? '#1e8a54' : '#4ecca3', 0.08),
            transform: 'scale(1.05)',
          }
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: mode === 'light' 
            ? 'rgba(17, 20, 24, 0.05)' 
            : 'rgba(255, 255, 255, 0.08)',
        },
        bar: {
          borderRadius: 4,
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        icon: {
          alignItems: 'center'
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: '0.75rem',
          backgroundColor: mode === 'light' ? 'rgba(17, 20, 24, 0.9)' : 'rgba(240, 246, 252, 0.9)',
          color: mode === 'light' ? '#fff' : '#000',
          boxShadow: mode === 'light' 
            ? '0px 4px 8px rgba(17, 20, 24, 0.1), 0px 0px 2px rgba(17, 20, 24, 0.1)'
            : '0px 4px 8px rgba(0, 0, 0, 0.2), 0px 0px 2px rgba(0, 0, 0, 0.2)',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: 'none',
          boxShadow: mode === 'light' 
            ? '0px 0px 24px rgba(17, 20, 24, 0.08), 0px 0px 8px rgba(17, 20, 24, 0.04)'
            : '0px 0px 24px rgba(0, 0, 0, 0.3), 0px 0px 8px rgba(0, 0, 0, 0.2)',
        }
      }
    }
  },
});

// Add custom theme types for TypeScript
declare module '@mui/material/styles' {
  interface Palette {
    soil: Palette['primary'];
    wheat: Palette['primary'];
    leaf: Palette['primary'];
    accent: string;
  }

  interface PaletteOptions {
    soil?: PaletteOptions['primary'];
    wheat?: PaletteOptions['primary'];
    leaf?: PaletteOptions['primary'];
    accent?: string;
  }

  interface TypeBackground {
    subtle: string;
  }
}

function App() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [mode, setMode] = useState<PaletteMode>('light');

  // Color mode context for toggling light/dark mode
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  // Update the theme based on the mode
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'advisory':
        return <Advisory />;
      case 'plant-diagnostic':
        return <PlantDiagnostic />;
      case 'krishigpt':
        return <KrishiGPT />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: theme.palette.background.default,
        }}>
          <Sidebar onMenuSelect={setSelectedMenu} colorMode={colorMode} mode={mode} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              background: theme.palette.background.default,
              position: 'relative',
              transition: 'all 0.3s ease',
              p: { xs: 0, sm: 1, md: 2 },
            }}
          >
            {renderContent()}
            <ChatbotWidget />
          </Box>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
