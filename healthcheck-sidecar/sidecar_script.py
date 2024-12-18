import http.server
import socketserver
import json
import threading
import time
import requests
import os
import logging
from datetime import datetime

################## SETUP LOGGING AND VALIDATE ENV ##################

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

file_handler = logging.FileHandler('sidecar.log')
file_handler.setLevel(logging.DEBUG)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

API_REQUEST_HEADERS = {
    "Content-Type": "application/json"
}

def validate_env() -> None:
    if not os.getenv("IL_GRANITE_API"):
        error = "expecting granite API endpoint as env variable `$IL_GRANITE_API`, which does not exist."
        logging.error(error)
        raise ValueError(error)
    if not os.getenv("IL_GRANITE_MODEL_NAME"):
        error = "expecting granite model name as env variable `$IL_GRANITE_MODEL_NAME`, which does not exist."
        logging.error(error)
        raise ValueError(error)

################################ CLASSES ####################################

class ModelsAPIStatus:
    def __init__(self, status: str, model_name: str, models: list, available: bool):
        self.status = status
        self.model_name = model_name
        self.models = models
        self.available = available
    def to_dict(self):
        return {
            "status": self.status,
            "model_name": self.model_name,
            "models": self.models,
            "available": self.available,
        }

class APIHealthStatus:
    def __init__(self, health_api_status: str, models_api_status: ModelsAPIStatus):
        self.health_api_status = health_api_status
        self.models_api_status = models_api_status
    def to_dict(self):
        return {
            "health_api_status": self.health_api_status,
            "models_api_status": self.models_api_status.to_dict(),
        }

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            tmp_write_copy = {}
            for model_name, api_health_status in health_status.items():
                if isinstance(api_health_status, dict):
                    health_status[model_name] = APIHealthStatus(
                        api_health_status["health_api_status"],
                        ModelsAPIStatus(
                            api_health_status["models_api_status"]["status"], 
                            api_health_status["models_api_status"]["model_name"],
                            api_health_status["models_api_status"]["models"],
                            api_health_status["models_api_status"]["available"]
                        )
                    ),
                tmp_write_copy[model_name] = api_health_status.to_dict()
            self.wfile.write(json.dumps(tmp_write_copy).encode())
        else:
            self.send_response(404)
            self.end_headers()


def extract_model_ids(response_json: dict) -> list:
    """
    Extracts the 'id' values from all entries in the 'data' field of the response JSON.

    Args:
        response_json (dict): The JSON response containing the 'data' field.

    Returns:
        list: A list of 'id' values from the entries in 'data'.
    """
    models = []
    for model in response_json["data"]:
        models.append(model["id"])
    return models

def send_slack_notification(payload: dict, slack_webhook_url: str) -> None:
    try:
        response = requests.post(
            slack_webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        if response.status_code != 200:
            logger.error(f"Failed to send Slack notification: {response.status_code} - {response.text}")
        else:
            logger.info("Successfully sent slack notification of the incident.")
    except Exception as e:
        logger.error(f"Error sending Slack notification: {e}")

def create_slack_message(granite_status: APIHealthStatus, incident_type: str,  granite_health_api_url: str, granite_models_api_url: str) -> dict:
    """
    Creates a Slack message payload for the Granite outage incident.

    Args:
        granite_status (dict): The current status of the Granite endpoint.
        incident_type (str): Either 'outage' or 'resolution'.

    Returns:
        dict: Slack message payload.
    """
    if incident_type == "outage":
        header = ":meow_outage: Granite Outage Incident"
        status_text = "Granite endpoint went DOWN"
        color = "#FF0000"  # Red for outage
    elif incident_type == "resolution":
        header = ":meow_green: Granite Outage Resolved"
        status_text = "Granite endpoint is BACK UP"
        color = "#36A64F"  # Green for resolution
    else:
        raise ValueError("Invalid incident type. Must be 'outage' or 'resolution'.")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    granite_status_dict = granite_status.to_dict()
    granite_status_dict["health_api_url"] = granite_health_api_url
    granite_status_dict["models_api_url"] = granite_models_api_url
    granite_status_json = json.dumps(granite_status_dict, indent=2)

    slack_message = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": header
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Look alive @Anil Vishnoi @brent-salisbury @grpereir ."
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{status_text} at *{timestamp}*."
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Granite Status Details:*\n```json\n" + granite_status_json + "\n```"
                }
            }
        ],
        "attachments": [
            {
                "color": color,
                "blocks": []
            }
        ]
    }

    return slack_message

def check_health_api(health_api_url: str,  api_health_status: APIHealthStatus) -> APIHealthStatus:
    try:
        health_api_response = requests.get(url=health_api_url, headers=API_REQUEST_HEADERS, timeout=5)
        if health_api_response.ok:
            api_health_status.health_api_status = "healthy"
        else:
            api_health_status.health_api_status = "unhealthy"
        
    except Exception as healthAPIConnectionError:
        exception = f"Cannot connect to {api_health_status.models_api_status.model_name} Health API at {health_api_url}. Excpetion: {healthAPIConnectionError}"
        logger.debug(exception)

    return api_health_status

def check_models_api(models_api_url: str,  api_health_status: APIHealthStatus) -> APIHealthStatus:
    try:
        models_api_response = requests.get(url=models_api_url, headers=API_REQUEST_HEADERS, timeout=5)
        if models_api_response.ok:
            api_health_status.models_api_status.status = "healthy"
        else:
            api_health_status.models_api_status.status = "unhealthy"
        if len(models_api_response.json()["data"]) > 0:
            models = extract_model_ids(models_api_response.json())
            api_health_status.models_api_status.models = models
            api_health_status.models_api_status.available = api_health_status.models_api_status.model_name in api_health_status.models_api_status.models
        else:
            api_health_status.models_api_status.models = []
            api_health_status.models_api_status.available = False
    except Exception as modelsAPIConnectionError:
        exception = f"{datetime.now()}: Cannot connect to {api_health_status.models_api_status.model_name} Models API at {models_api_url}. Excpetion: {modelsAPIConnectionError}"
        logger.debug(exception)
    return api_health_status

def check_health_and_models_api(health_api_url: str, models_api_url: str, model_name: str) -> APIHealthStatus:
    local_health_status = APIHealthStatus("unknown", ModelsAPIStatus("unknown", model_name, [], False))
    local_health_status = check_health_api(health_api_url=health_api_url, api_health_status=local_health_status)
    local_health_status = check_models_api(models_api_url=models_api_url, api_health_status=local_health_status)
    return local_health_status

def update_health_status():
    global health_status, incident_state, status_initialized
    while True:
        try:
            new_granite_status = check_health_and_models_api(
                health_api_url=granite_health_api_url,
                models_api_url=granite_models_api_url,
                model_name=granite_model_name,
            )
            if new_granite_status is not None:
                with health_status_lock:
                    health_status["granite"] = new_granite_status
                    logger.info(f"Updated health_status: {health_status['granite']}")
                    if (health_status["granite"].health_api_status != "healthy" or not health_status["granite"].models_api_status.available) and not incident_state["granite"] and status_initialized:
                        incident_state["granite"] = True
                        if enable_slack_posts:
                            outage_notification_payload = create_slack_message(health_status["granite"], "outage", granite_health_api_url, granite_models_api_url)
                            send_slack_notification(payload=outage_notification_payload, slack_webhook_url=slack_webhook_url)
                    elif (health_status["granite"].health_api_status == "healthy" and health_status["granite"].models_api_status.available) and incident_state["granite"] and status_initialized:
                        incident_state["granite"] = False
                        if enable_slack_posts:
                            resolution_notification_payload = create_slack_message(health_status["granite"], "resolution", granite_health_api_url, granite_models_api_url )
                            send_slack_notification(payload=resolution_notification_payload, slack_webhook_url=slack_webhook_url)
                    status_initialized = True
            else:
                logger.info(f"check_health_and_models_api returned None for {granite_model_name}")
                status_initialized = True
        except Exception as e:
            logger.error(f"Error updating health status: {e}")
            status_initialized = True
        time.sleep(10)


if __name__ == "__main__":
    validate_env()

    enable_slack_posts = False

    if os.getenv("SLACK_WEBHOOK_URL"):
        logger.info("Env variable \`$SLACK_WEBHOOK_URL\`, running with slack posting functionality.")
        logger.info("Warning, slack posting functionality is prone to be noise and fragility against local model server deployment and manipulation. Be warned.")
        enable_slack_posts = True
        slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")

    granite_health_api_url = f"{os.getenv('IL_GRANITE_API')}/health"
    granite_models_api_url = f"{os.getenv('IL_GRANITE_API')}/v1/models"
    granite_model_name = os.getenv("IL_GRANITE_MODEL_NAME")

    incident_state = {
        "granite": False,
    }

    health_status = {
        "granite": APIHealthStatus("unknown", ModelsAPIStatus("unknown", granite_model_name, [], False)),
    }

    status_initialized = False

    health_status_lock = threading.Lock()  # Lock for synchronizing access

    threading.Thread(target=update_health_status, daemon=True).start()

    with socketserver.TCPServer(("", 8080), HealthHandler) as httpd:
        print("Serving health status on port 8080")
        logger.info("Serving health status on port 8080")
        httpd.serve_forever()

