# Mini Market Tracker

A compact market-tracking demo that fetches real stock data using Python (`yfinance`), generates JSON files, and visualizes price, volume, and comparisons using a clean Chart.js frontend.  
A lightweight Node server runs the Python generator on demand for local development.

---

## How to run locally

### 1. Activate the Python environment
```bash
source venv/bin/activate
```

### 2. Generate stock data  
Example: **30-day AAPL**
```bash
./venv/bin/python generate_data.py AAPL 30
```

### 3. Start the Node server
```bash
node server.js
```

### 4. Open the app in your browser
```
http://localhost:3000
```

---

## Project structure
```
├── generate_data.py      # Python script that downloads stock data using yfinance
├── server.js             # Node server that can run the Python script on demand
├── public/
│   ├── index.html        # UI + Chart.js graphs
│   ├── main.js           # Frontend logic (fetch JSON + render charts)
│   ├── AAPL.json         # Auto-generated stock data
│   └── ...               # Other tickers
├── venv/                 # Python virtual environment
├── package.json          # Node dependencies
└── README.md             # (You’re reading this)
```

---

## Technologies used
- **Python:** yfinance, pandas  
- **Node.js:** Express server, child process to run Python  
- **JavaScript:** Chart.js, Fetch API  
- **HTML/CSS:** simple, clean UI

---

## Features
- Fetches real-time market data using Python  
- Generates ticker-specific JSON files (AAPL.json, MSFT.json, etc.)  
- Switch between tickers  
- Light/Dark theme toggle  
- Trend comparison, averages, quick stats  
- Node backend connects Python + frontend nicely  

---

## Notes
This is a learning-friendly project combining **Python, JavaScript, and Node.js** — perfect as a starter full-stack data tool.
