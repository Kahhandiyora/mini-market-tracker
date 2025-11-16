/*
 server.js — Express wrapper to run the Python generator (local dev only)
 Uses app.use fallback (no route pattern) to avoid path-to-regexp errors.
*/
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend from ./public
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/ping", (req, res) => res.json({ ok: true }));

app.get("/api/generate", (req, res) => {
  const ticker = (req.query.ticker || "").trim().toUpperCase();
  const days = parseInt(req.query.days || "7", 10) || 7;
  if (!ticker.match(/^[A-Z0-9.-]{1,10}$/)) {
    return res.status(400).json({ ok: false, error: "invalid ticker" });
  }

  const pythonPath = path.join(__dirname, "venv", "bin", "python");
  const script = path.join(__dirname, "generate_data.py");
  if (!fs.existsSync(script)) {
    return res.status(500).json({ ok: false, error: "generate_data.py not found" });
  }

  const child = spawn(pythonPath, [script, ticker, String(days)], { cwd: __dirname });

  let stdout = "", stderr = "";
  child.stdout.on("data", (d) => { stdout += d.toString(); process.stdout.write(d.toString()); });
  child.stderr.on("data", (d) => { stderr += d.toString(); process.stderr.write(d.toString()); });

  child.on("close", (code) => {
    if (code === 0) {
      const outFile = path.join(__dirname, "public", `${ticker}.json`);
      if (fs.existsSync(outFile)) {
        return res.json({ ok: true, ticker, file: `public/${ticker}.json`, stdout });
      } else {
        return res.status(500).json({ ok: false, error: "file not created", stdout, stderr });
      }
    } else {
      return res.status(500).json({ ok: false, error: "python failed", code, stdout, stderr });
    }
  });

  // safety timeout (30s)
  setTimeout(() => {
    try { child.kill("SIGKILL"); } catch(e){}
  }, 30000);
});

// FALLBACK: serve index.html for any other request using middleware (avoids path-to-regexp)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
