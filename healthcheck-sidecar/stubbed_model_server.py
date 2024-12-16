import json
import os
from http.server import SimpleHTTPRequestHandler, HTTPServer
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def validate_env() -> None:
    if not os.getenv("IL_GRANITE_MODEL_NAME"):
        error = "expecting granite model name as env variable `$IL_GRANITE_MODEL_NAME`, which does not exist."
        logging.error(error)
        raise ValueError(error)

class HealthHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        model_name = os.getenv("IL_GRANITE_MODEL_NAME")
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "healthy"}')
        elif self.path == "/v1/models":
            stubbed_models = {
                "object": "list",
                "data": [
                    {
                        "id": model_name,
                        "object": "model",
                        "owned_by": "vllm",
                        "max_model_len": 4096,
                        "permission": [
                            {
                                "object": "model_permission",
                                "allow_create_engine": False,
                                "allow_sampling": True,
                                "allow_logprobs": False,
                                "allow_fine_tuning": True,
                            }
                        ]
                    }
                ]
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(str.encode(json.dumps(stubbed_models)))
        else:
            self.send_response(404)
            self.end_headers()

# Start the server
def run(server_class=HTTPServer, handler_class=HealthHandler, port=8001):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Serving on http://localhost:{port}/health and http://localhost:{port}/v1/models")
    httpd.serve_forever()

if __name__ == "__main__":
    validate_env()
    run()
