# Azure IoT Hub Live Telemetry Web Dashboard (`azure_web`)

A real-time telemetry monitoring dashboard designed to ingest, decode, and display live IoT messages from **Azure IoT Hub** / **Azure Event Hubs** using a **Flask (Python)** backend and a **React (JavaScript)** web interface.

---

## 🎯 What We Are Going to Do

The objective of this project is to build an end-to-end telemetry monitoring pipeline that receives messages sent to Azure IoT Hub from connected devices/sensors and presents them live in a web browser.

### Step-by-Step Implementation Workflow:

1. **Telemetry Ingestion from Azure**:
   - IoT devices or simulation scripts transmit sensor data / messages to Azure IoT Hub.
   - Azure IoT Hub forwards messages to its built-in Event Hub-compatible endpoint (`EntityPath`).

2. **Backend Processing & Message Decoding (`server.py`)**:
   - A Python Flask backend runs an asynchronous background consumer thread using `EventHubConsumerClient` from the `azure-eventhub` SDK.
   - It listens for incoming events starting from `@latest`.
   - It decodes diverse payload formats into readable strings:
     - **Plain text / UTF-8 strings**.
     - **JSON ASCII code arrays** (e.g., `[72, 101, 108, 108, 111]` $\rightarrow$ `"Hello"`).
     - **Comma-separated ASCII integers** (e.g., `"72,101,108,108,111"` $\rightarrow$ `"Hello"`).
   - In-memory state (`latest` message and ISO UTC timestamp) is kept thread-safe via `threading.Lock`.

3. **REST API Exposure**:
   - The backend provides two endpoints on port `5000` with CORS enabled:
     - `GET /api/latest`: Returns the most recent decoded telemetry message and timestamp.
     - `GET /health`: Health check endpoint returning service status.

4. **Frontend Dashboard (`src/azure_web.js`)**:
   - A dedicated React component for telemetry monitoring.
   - Polls backend API once every second (`1000ms`).
   - Renders:
     - **Connection Status indicator**: `CONNECTED` (green), `CONNECTING` (yellow), or `DISCONNECTED` (red).
     - **Student Information**: Student name and roll number.
     - **Decoded Message panel**: Real-time display of the latest message payload.
     - **ASCII Values Display**: Shows received ASCII values.
     - **Converted String**: ASCII-to-string conversion result.
     - **Timestamp**: Formatted local date and time of the last received event.

---

## 🏗️ Architecture & Data Pipeline

```
+-------------------------------------------------------------+
|                     IoT Device / Sensor                     |
|           (Sends ASCII codes, byte arrays, or text)         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                       Azure IoT Hub                         |
|             (Built-in Event Hubs Endpoint)                  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     Flask Backend Service                   |
|                          (server.py)                        |
|   - EventHubConsumerClient (Background listener)            |
|   - Payload Decoder (ASCII array / comma-separated / UTF-8) |
|   - REST API: GET /api/latest & GET /health                 |
+------------------------------+------------------------------+
                               |
                               v (HTTP Polling every 1s)
+-------------------------------------------------------------+
|                   React Web Frontend                        |
|                  (src/App.js → azure_web.js)                |
|   - Student Information Display                            |
|   - Real-time message card                                  |
|   - ASCII to String Conversion                              |
|   - Live connection state (CONNECTED / DISCONNECTED)        |
|   - Localized event timestamp                               |
+-------------------------------------------------------------+
```

---

## 📁 Project Structure

```
azure_web/
├── backend 
│   ├── server.py             # Flask backend: Azure Event Hub consumer & REST API
│   ├── requirements.txt      # Python dependencies
│   └── .env.example         # Environment variables template
├── package.json             # React frontend dependencies and scripts
├── vercel.json              # Vercel deployment configuration
├── .env.example             # Frontend environment variables template
├── public/                  # Static assets (HTML template, icons)
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── azure_web.js         # Main React telemetry dashboard component
│   ├── App.js               # Main App component
│   ├── App.test.js          # Component tests
│   ├── index.js             # React entry point
│   ├── App.css              # Component styles
│   ├── index.css            # Global typography and base styles
│   └── setupTests.js        # Testing configuration
└── README.md                # Project documentation and roadmap
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Python**: Version 3.9 or higher
- **Node.js**: Version 18 or higher (with `npm`)
- **Azure IoT Hub**: Active Azure subscription with IoT Hub and Event Hub connection string.

### 2. Backend Setup (`backend/server.py`)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Azure credentials:
   ```
   AZURE_EVENTHUB_CONNECTION_STRING=Endpoint=sb://your-endpoint.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=your-key;EntityPath=your-entity-path
   ```

5. Start the Flask backend:
   ```bash
   python server.py
   ```
   The backend will start on `http://127.0.0.1:5000` and begin listening for telemetry from Azure Event Hubs.

### 3. Frontend Setup

1. Install npm dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your backend API URL:
   ```
   REACT_APP_API_URL=http://127.0.0.1:5000
   ```

4. Launch the React development server:
   ```bash
   npm start
   ```
   The web application will open at `http://localhost:3000`.

### 4. Update Student Information

Edit `src/azure_web.js` and replace the placeholder values:
```javascript
const [studentName] = useState("[YOUR NAME]");
const [rollNumber] = useState("[YOUR ROLL NUMBER]");
```

Replace `[YOUR NAME]` and `[YOUR ROLL NUMBER]` with your actual details.

---

## 📡 API Reference

| Endpoint | Method | Description | Example Response |
| :--- | :--- | :--- | :--- |
| `/api/latest` | `GET` | Returns the latest received telemetry message and UTC timestamp | `{"message": "Hello World", "timestamp": "2026-10-11T15:20:00Z"}` |
| `/health` | `GET` | Health check probe | `{"status": "ok"}` |

---

## 🔧 Changes Made

### Bug Fixes
1. **Port Mismatch**: Fixed frontend API URL from port 8000 to port 5000 to match backend configuration
2. **App.js Structure**: Converted App.js from a test file to a proper React component
3. **Index.js Import**: Updated index.js to import App component instead of azure_web directly
4. **App.test.js**: Updated test to import App component and check for new title

### New Features
1. **Student Information Display**: Added student name and roll number display in the dashboard
2. **ASCII Values Display**: Added section to show received ASCII values
3. **ASCII to String Conversion**: Implemented JavaScript function to convert ASCII values to readable text
4. **Environment Variables**: Added support for environment variables in both frontend and backend
5. **Vercel Configuration**: Added vercel.json for deployment configuration

### Security Improvements
1. **Environment Variables**: Azure credentials now loaded from environment variables instead of hardcoded
2. **.env.example Files**: Created template files for environment variables (never commit actual .env files)
3. **python-dotenv**: Added python-dotenv for loading environment variables in backend

### File Changes Summary
- `src/azure_web.js`: Added ASCII conversion function, student info display, ASCII values display, environment variable support
- `src/App.js`: Converted from test file to proper React component
- `src/App.test.js`: Updated to test App component
- `src/index.js`: Updated to import App component
- `backend/server.py`: Added environment variable support with python-dotenv
- `backend/requirements.txt`: Created Python dependencies file
- `backend/.env.example`: Created environment variables template for backend
- `.env.example`: Created environment variables template for frontend
- `vercel.json`: Created Vercel deployment configuration
- `README.md`: Updated with new setup instructions and changes documentation

---

## 🚀 Deployment

### Frontend Deployment to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Build the React application**:
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Follow the prompts to configure your deployment.

4. **Set Environment Variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add `REACT_APP_API_URL` with your production backend URL
   - Example: `https://your-backend-api.com`

5. **Redeploy** after setting environment variables:
   ```bash
   vercel --prod
   ```

### Backend Deployment Options

The Flask backend can be deployed to various platforms:

**Option 1: Azure App Service**
- Create an Azure App Service
- Deploy the backend code
- Set environment variables in Azure App Service settings
- Configure CORS to allow your Vercel frontend domain

**Option 2: Render**
- Create a Render account
- Connect your GitHub repository
- Render will automatically deploy the Flask backend
- Set environment variables in Render dashboard

**Option 3: Railway**
- Similar to Render, Railway supports Python Flask
- Connect repository and configure environment variables

**Important**: When deploying the backend, ensure:
- CORS is configured to allow your production frontend domain
- Azure credentials are set as environment variables
- The backend is accessible via HTTPS

---

## 🧪 Testing

### ASCII Conversion Test
To test the ASCII-to-string conversion function:
1. Send telemetry with ASCII values: `72,101,108,108,111`
2. The dashboard should display:
   - ASCII Values: `72,101,108,108,111`
   - Converted String: `Hello`

### Local Testing Without Azure
To test the frontend without live Azure connectivity:
1. Modify `backend/server.py` to use mock data
2. Or use a tool like Postman to send test data to the `/api/latest` endpoint

---

