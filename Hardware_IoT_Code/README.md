# ESP32 Sensor Dashboard

A Streamlit dashboard application that displays real-time sensor data from an ESP32 device.

## Features

- Real-time sensor data monitoring
- Historical data visualization
- Device information display
- Connection status monitoring
- Auto-refresh capability
- Interactive plots using Plotly

## Prerequisites

- Python 3.7 or higher
- ESP32 device running at IP: 192.168.40.51
- Network connectivity to the ESP32

## Installation

1. Clone this repository or download the files
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

To start the Streamlit dashboard:

```bash
streamlit run app.py
```

The application will open in your default web browser at `http://localhost:8501`

## Configuration

The application is configured to connect to an ESP32 at IP address 192.168.40.51. If your ESP32 has a different IP address, update the `ESP32_IP` variable in `app.py`.

## Available Endpoints

The ESP32 provides the following endpoints:
- `/ping` - Test connectivity
- `/data` - Get sensor readings

## Auto-refresh

The dashboard automatically refreshes every 5 seconds by default. You can toggle this feature using the checkbox in the interface. 