/* main.js — comparison + volume chart */
const TICKER_EL = document.getElementById('ticker');
const PRICE_EL = document.getElementById('price');
const PCT_EL = document.getElementById('pct');
const TICKER_INPUT = document.getElementById('ticker-input');
const TICKER2_INPUT = document.getElementById('ticker2-input');
const DAYS_INPUT = document.getElementById('days-input');
const FETCH_BTN = document.getElementById('fetch-btn');
const GEN_BTN = document.getElementById('generate-btn');
const AUTO_BTN = document.getElementById('auto-btn');
const PRESET_SELECT = document.getElementById('preset-select');
const THEME_SELECT = document.getElementById('theme-select');

const AVG_EL = document.getElementById('avg');
const HIGH_EL = document.getElementById('high');
const LOW_EL = document.getElementById('low');
const VOL_EL = document.getElementById('vol');

let chart = null;
let autoTimer = null;
let autoOn = false;

const savedTheme = localStorage.getItem('mm_theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
THEME_SELECT.value = savedTheme;
THEME_SELECT.addEventListener('change', ()=> {
  const t = THEME_SELECT.value;
  document.body.setAttribute('data-theme', t);
  localStorage.setItem('mm_theme', t);
});

function pickTicker(){
  const custom = (TICKER_INPUT.value||'').trim();
  return custom.length ? custom.toUpperCase() : (PRESET_SELECT.value || 'AAPL');
}
function pickTicker2(){
  const custom = (TICKER2_INPUT.value||'').trim();
  return custom.length ? custom.toUpperCase() : null;
}

async function fetchJson(path){
  try{
    const res = await fetch(path,{cache:'no-store'});
    if(!res.ok) throw new Error('not found');
    return await res.json();
  }catch(e){ return null; }
}

function calcSummary(series){
  if(!series || !series.length) return {avg:0,high:0,low:0,vol:0};
  const vals = series.map(d=>d.close);
  const sum = vals.reduce((a,b)=>a+b,0);
  const avg = sum/vals.length;
  const high = Math.max(...vals);
  const low = Math.min(...vals);
  const vol = series[series.length-1].volume || 0;
  return {avg, high, low, vol};
}

// normalize a series to percent change from first point (for visual comparison)
function normalizeSeries(series){
  if(!series.length) return series.map(d=>({date:d.date, value:0}));
  const base = series[0].close || 1;
  return series.map(d=>({date:d.date, value: ((d.close - base)/base) * 100}));
}

function formatNumber(n){ return Number(n).toLocaleString(undefined, {maximumFractionDigits:2}); }

function renderCombined(primaryJson, secondaryJson){
  // primary: price line + volume bars, secondary: overlay normalized percent line if present
  const labels = primaryJson.series.map(s=>s.date);
  const priceData = primaryJson.series.map(s=>s.close);
  const volumeData = primaryJson.series.map(s=>s.volume || 0);

  const datasets = [
    {
      type:'line',
      label: primaryJson.ticker,
      data: priceData,
      yAxisID: 'y',
      borderColor: 'rgba(10,132,255,0.95)',
      backgroundColor: 'rgba(10,132,255,0.12)',
      tension:0.3,
      pointRadius:2,
      order:1
    },
    {
      type:'bar',
      label: primaryJson.ticker + ' volume',
      data: volumeData,
      yAxisID: 'y_vol',
      backgroundColor: 'rgba(0,0,0,0.08)',
      order:0
    }
  ];

  if(secondaryJson){
    // normalize and plot on secondary axis as percent
    const norm = normalizeSeries(secondaryJson.series);
    // ensure labels align — if lengths mismatch, attempt to match by date keys (simple approach)
    const secMap = new Map(norm.map(d=>[d.date, d.value]));
    const secValuesAligned = labels.map(dt => secMap.has(dt) ? secMap.get(dt) : null);
    datasets.push({
      type:'line',
      label: secondaryJson.ticker + ' (% change)',
      data: secValuesAligned,
      yAxisID: 'y_perc',
      borderColor: 'rgba(255,99,132,0.95)',
      backgroundColor: 'rgba(255,99,132,0.12)',
      tension:0.3,
      pointRadius:2,
      borderDash: [4,4],
      order:2
    });
  }

  const ctx = document.getElementById('chart');
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    data: { labels, datasets },
    options: {
      responsive:true,
      interaction:{mode:'index', intersect:false},
      stacked:false,
      plugins:{ legend:{position:'top'} },
      scales:{
        x:{ display:true },
        y:{ type:'linear', display:true, position:'left', title:{display:true,text:'Price (USD)'} },
        y_vol:{ type:'linear', display:true, position:'right', title:{display:true, text:'Volume'}, grid:{display:false}, ticks:{callback: (v)=> v >= 1000 ? (v/1000)+'k' : v} },
        y_perc:{ type:'linear', display:false, position:'right', suggestedMin:-10, suggestedMax:10 }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context){
              const ds = context.dataset;
              if(ds.type === 'bar') return `Vol: ${context.parsed.y.toLocaleString()}`;
              if(ds.yAxisID === 'y_perc') return `${ds.label}: ${context.parsed.y.toFixed(2)}%`;
              return `${ds.label}: $${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

async function loadAndRender(){
  const t1 = pickTicker().toUpperCase();
  const t2 = pickTicker2();
  const days = Number(DAYS_INPUT.value) || 30;

  // try ticker-specific JSONs, fallback to data.json
  const [p1, p2] = await Promise.all([
    fetchJson(`${t1}.json`),
    t2 ? fetchJson(`${t2}.json`) : Promise.resolve(null)
  ]);

  if(!p1){
    alert(`${t1}.json not found. Click Generate to create it (server-side), or run: python generate_data.py ${t1} ${days}`);
    return;
  }

  renderPrimarySummary(p1);
  renderCombined(p1, p2);
}

function renderPrimarySummary(json){
  renderStats(json);
  const s = calcSummary(json.series || []);
  AVG_EL.textContent = s.avg ? s.avg.toFixed(2) : '-';
  HIGH_EL.textContent = s.high ? s.high.toFixed(2) : '-';
  LOW_EL.textContent = s.low ? s.low.toFixed(2) : '-';
  VOL_EL.textContent = s.vol ? s.vol.toLocaleString() : '-';
}

function renderStats(json){
  if(!json){ TICKER_EL.textContent='-'; PRICE_EL.textContent='-'; PCT_EL.textContent='-'; return; }
  TICKER_EL.textContent = json.ticker || '-';
  PRICE_EL.textContent = Number(json.current.price).toFixed(2);
  const sign = json.current.change >= 0 ? '+' : '';
  PCT_EL.textContent = `${sign}${Number(json.current.change).toFixed(2)} (${sign}${Number(json.current.pct).toFixed(2)}%)`;
  PCT_EL.className = json.current.change >= 0 ? 'green' : 'red';
}

// UI events
FETCH_BTN.addEventListener('click', ()=> loadAndRender());
PRESET_SELECT.addEventListener('change', ()=> { TICKER_INPUT.value = PRESET_SELECT.value; });
GEN_BTN.addEventListener('click', async ()=> {
  const t = pickTicker();
  const days = Number(DAYS_INPUT.value) || 30;
  // call /api/generate
  GEN_BTN.textContent = 'Generating...';
  GEN_BTN.disabled = true;
  try {
    const resp = await fetch(`/api/generate?ticker=${encodeURIComponent(t)}&days=${encodeURIComponent(days)}`);
    const json = await resp.json();
    if(resp.ok && json.ok){
      await loadAndRender();
      alert(`Generated ${json.file} ✓`);
    } else {
      alert('Generation failed: ' + (json.error||'unknown'));
      console.error(json);
    }
  } catch(e){
    alert('Network error: is Node server running?');
    console.error(e);
  } finally {
    GEN_BTN.textContent = 'Generate';
    GEN_BTN.disabled = false;
  }
});

AUTO_BTN.addEventListener('click', ()=> {
  autoOn = !autoOn;
  if(autoOn){
    AUTO_BTN.textContent = 'Auto: On';
    autoTimer = setInterval(()=> loadAndRender(), 10000);
  } else {
    AUTO_BTN.textContent = 'Auto: Off';
    clearInterval(autoTimer);
  }
});

window.addEventListener('load', ()=> {
  TICKER_INPUT.value = PRESET_SELECT.value || 'AAPL';
  loadAndRender();
});
