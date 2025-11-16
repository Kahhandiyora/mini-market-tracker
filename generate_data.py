#!/usr/bin/env python3
"""
generate_data.py — writes public/data.json and public/<TICKER>.json
Includes close, high, low, volume for each date.
Usage:
  python generate_data.py AAPL 7
"""
import sys, json
from pathlib import Path
import yfinance as yf
import pandas as pd

OUT_DIR = Path("public")
OUT_DIR.mkdir(exist_ok=True)
OUT_MAIN = OUT_DIR / "data.json"

def guess_columns(df):
    # prefer exact names, fallback to anything with the words
    mapping = {}
    cols = list(df.columns)
    for c in cols:
        name = str(c).lower()
        if name == "close": mapping['close'] = c
        if name == "high": mapping['high'] = c
        if name == "low": mapping['low'] = c
        if name == "volume": mapping['volume'] = c
    # second pass fuzzy
    for c in cols:
        name = str(c).lower()
        if 'close' in name and 'close' not in mapping: mapping['close'] = c
        if 'high' in name and 'high' not in mapping: mapping['high'] = c
        if 'low' in name and 'low' not in mapping: mapping['low'] = c
        if 'volume' in name and 'volume' not in mapping: mapping['volume'] = c
    return mapping

def format_date(d):
    try:
        return d.strftime("%Y-%m-%d")
    except:
        return str(d)

def fetch_and_write(ticker="AAPL", days=7):
    df = yf.download(ticker, period=f"{max(days*2,7)}d", interval="1d", progress=False)
    if df is None or df.empty:
        print("No data returned for", ticker); return False

    cols = guess_columns(df)
    if 'close' not in cols:
        print("Could not find a 'close' column. Columns:", list(df.columns)); return False

    df2 = df.dropna(subset=[cols['close']]).tail(days)

    series = []
    for idx, row in df2.iterrows():
        date_str = format_date(idx)
        try:
            close_val = float(row[cols['close']])
        except Exception:
            continue
        high_val = float(row[cols['high']]) if 'high' in cols and not pd.isna(row[cols['high']]) else close_val
        low_val = float(row[cols['low']]) if 'low' in cols and not pd.isna(row[cols['low']]) else close_val
        vol_val = int(row[cols['volume']]) if 'volume' in cols and not pd.isna(row[cols['volume']]) else 0
        series.append({
            "date": date_str,
            "close": round(close_val, 2),
            "high": round(high_val, 2),
            "low": round(low_val, 2),
            "volume": vol_val
        })

    if not series:
        print("No valid data for", ticker); return False

    current = series[-1]["close"]
    prev = series[-2]["close"] if len(series) > 1 else current
    change = round(current - prev, 2)
    pct = round((change / prev) * 100, 2) if prev != 0 else 0

    data = {
        "ticker": ticker.upper(),
        "series": series,
        "current": {"price": current, "change": change, "pct": pct}
    }

    OUT_MAIN.write_text(json.dumps(data, indent=2))
    ticker_file = OUT_DIR / f"{ticker.upper()}.json"
    ticker_file.write_text(json.dumps(data, indent=2))
    print(f"✔ wrote {OUT_MAIN} and {ticker_file} ({ticker.upper()}, {len(series)} days)")
    return True

if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    fetch_and_write(ticker, days)
