from http.server import BaseHTTPRequestHandler
import json
import akshare as ak

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        query = parse_qs(urlparse(self.path).query)
        symbol = query.get('symbol', [None])[0]
        sentiment = query.get('sentiment', ['bullish'])[0]

        if not symbol:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing symbol"}).encode())
            return

        news_results = []
        
        # Primary: AkShare for A-Shares/HK
        try:
            # Simple check: if symbol is numeric, it's likely A-share
            if symbol.isdigit():
                news_df = ak.stock_zh_a_hist_news(symbol=symbol)
                if news_df is not None and not news_df.empty:
                    news_results = news_df.head(10).to_dict('records')
        except Exception as e:
            print(f"AkShare Error: {e}")

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "symbol": symbol, 
            "sentiment": sentiment, 
            "news": news_results,
            "source": "akshare" if news_results else "none"
        }).encode())
