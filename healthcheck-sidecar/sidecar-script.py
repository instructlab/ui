import http.server
import socketserver
import json
import threading
import time
import requests
import os
import logging

################## SETUP LOGGING AND VALIDATE ENV ##################

logger = logging.getLogger(__name__)

def validate_env():
    if not os.getenv("IL_GRANITE_API"):
        error = "expecting granite API endpoint as env variable `$IL_GRANITE_API`, which does not exist."
        logging.error(error)
        raise ValueError(error)
    if not os.getenv("IL_MERLINITE_API"):
        error = "expecting merlinite API endpoint as env variable `$IL_MERLINITE_API`, which does not exist."
        logging.error(error)
        raise ValueError(error)

validate_env()

################## GLOBALS ##################

health_status = {
    "granite_api": "unknown",
    "merlinite_api": "unknown"
}

granite_api_health_url = f"{os.getenv('IL_GRANITE_API')}/health"
merlinite_api_health_url = f"{os.getenv('IL_MERLINITE_API')}/health"

# Update health status function
def update_health_status():
    global health_status
    while True:
        try:
            granite_api_health_response = requests.get(granite_api_health_url, timeout=5)
            merlinite_api_health_response = requests.get(merlinite_api_health_url, timeout=5)
            health_status["granite_api"] = "healthy" if granite_api_health_response.ok else "unhealthy"
            health_status["merlinite_api"] = "healthy" if merlinite_api_health_response.ok else "unhealthy"
        except requests.exceptions.RequestException:
            health_status["granite_api"] = "unhealthy"
            health_status["merlinite_api"] = "unhealthy"
        time.sleep(10)

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(health_status).encode())
        else:
            self.send_response(404)
            self.end_headers()

threading.Thread(target=update_health_status, daemon=True).start()

with socketserver.TCPServer(("", 8080), HealthHandler) as httpd:
    print("Serving health status on port 8080")
    httpd.serve_forever()
