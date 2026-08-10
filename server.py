import http.server
import socketserver
import urllib.request
import json
import urllib.parse
import os

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/api/quotes':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            try:
                # Fetch raw prices from Yahoo Finance in cents (USX)
                soy_price = self.fetch_yahoo_price("ZS=F")
                cotton_price = self.fetch_yahoo_price("CT=F")
                
                # Conversion formulas:
                # Soja (ZS=F): price in USX (cents/bushel). 
                # 1 saca (60kg) = 2.20462 bushels.
                # Price in USD per saca = (USX / 100) * 2.20462.
                soy_usd_per_saca = round((soy_price / 100.0) * 2.20462, 4) if soy_price else 25.50
                
                # Algodão (CT=F): price in USX (cents/lb).
                # Price in USD per lb = USX / 100.
                cotton_usd_per_lb = round(cotton_price / 100.0, 4) if cotton_price else 0.85
                
                response_data = {
                    "success": True,
                    "soybeans": {
                        "symbol": "ZS=F",
                        "raw_price_usx": soy_price,
                        "usd_per_saca": soy_usd_per_saca
                    },
                    "cotton": {
                        "symbol": "CT=F",
                        "raw_price_usx": cotton_price,
                        "usd_per_lb": cotton_usd_per_lb
                    }
                }
            except Exception as e:
                response_data = {
                    "success": False,
                    "error": str(e),
                    "defaults": {
                        "soybeans": {
                            "usd_per_saca": 25.50
                        },
                        "cotton": {
                            "usd_per_lb": 0.85
                        }
                    }
                }
            
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            # Standard static file serving
            super().do_GET()

    def fetch_yahoo_price(self, symbol):
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                meta = data['chart']['result'][0]['meta']
                return meta['regularMarketPrice']
        except Exception as e:
            print(f"Error fetching quote for {symbol}: {e}")
            return None

# Ensure we are in the directory of the script to serve correct static files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Barter Simulator custom API server running on port {PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
