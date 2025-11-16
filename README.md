# Mini Market Tracker

**A compact market-tracker demo** — Python (`yfinance`) downloads historical price + volume, a Node helper runs the generator on demand, and a Chart.js frontend visualizes price, volume and enables quick comparisons.

Live locally:
- Start the Python environment: `source venv/bin/activate`
- Generate data (example): `./venv/bin/python generate_data.py AAPL 30`
- Start the Node server: `node server.js`
- Open: http://localhost:3000

Files
- `generate_data.py` — downloads data and writes `public/<TICKER>.json` (includes `close`, `high`, `low`, `volume`).
- `server.js` — small Express wrapper that runs the Python generator when the frontend requests `/api/generate`.
- `public/` — static frontend (Chart.js) and generated JSON files.

Features
- Interactive Chart.js visualization with:
  - Price line + volume bars (dual axis)
  - Overlay comparison (normalize second ticker as % change)
  - Theme toggle, auto-refresh, and quick generator button (server-side)
- Easy to extend: CSV export, backtest metrics, or a hosted API.

How I built it (quick)
- Used `yfinance` to fetch market data and wrote JSON files to `public/`.
- Built a minimal Node Express server to run the generator via an API endpoint (`/api/generate`) for local demos.
- Frontend uses Chart.js and plain JS for a compact, dependency-light demo.

Notes
- This repo is a demo for local development. The Node endpoint executes local Python — **do not** deploy that endpoint publicly without authentication and sandboxing.
- To publish a static demo on GitHub Pages, pre-generate the JSON files you want shown (commit them under `public/`) and set Pages source to the `/public` folder on the `main` branch.

---

**Author:** Kahhan Diyora  
**Repo:** https://github.com/Kahhandiyora/mini-market-tracker
