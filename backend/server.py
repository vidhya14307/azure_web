
import json
import os
import threading
from datetime import datetime, timezone
from dotenv import load_dotenv

from flask import Flask, jsonify
from flask_cors import CORS
from azure.eventhub import EventHubConsumerClient

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
        ]
    }
})

# Use environment variables for Azure credentials
CONNECTION_STRING = os.getenv(
    "AZURE_EVENTHUB_CONNECTION_STRING",
    "Endpoint=sb://your-endpoint.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=your-key;EntityPath=your-entity-path"
)

CONSUMER_GROUP = "$default"

# Mock mode for testing without Azure
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"

latest = {
    "message": "Waiting for Azure telemetry...",
    "timestamp": None,
}
data_lock = threading.Lock()


def decode_message(raw):
    text = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else str(raw)
    text = text.strip()

    # JSON ASCII array: [72,101,108,108,111] -> Hello
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list) and all(
            isinstance(x, int) and 0 <= x <= 127 for x in parsed
        ):
            return "".join(chr(x) for x in parsed)
    except (json.JSONDecodeError, TypeError):
        pass

    # Comma-separated ASCII: 72,101,108,108,111 -> Hello
    parts = text.split(",")
    if len(parts) > 1:
        try:
            codes = [int(x.strip()) for x in parts]
            if all(0 <= x <= 127 for x in codes):
                return "".join(chr(x) for x in codes)
        except ValueError:
            pass

    return text


def mock_data_generator():
    """Generate mock telemetry data for testing without Azure"""
    import time
    import random
    
    mock_messages = [
        "72,101,108,108,111",  # Hello
        "87,111,114,108,100",  # World
        "65,122,117,114,101",  # Azure
        "73,79,84",  # IOT
        "84,101,115,116",  # Test
        "68,97,116,97",  # Data
        "83,101,110,115,111,114",  # Sensor
    ]
    
    while True:
        # Select a random mock message
        message = random.choice(mock_messages)
        timestamp = datetime.now(timezone.utc).isoformat()
        
        with data_lock:
            latest["message"] = message
            latest["timestamp"] = timestamp
        
        print(f"[MOCK] Sent: {message} at {timestamp}", flush=True)
        time.sleep(2)  # Send mock data every 2 seconds


def receive_events():
    client = EventHubConsumerClient.from_connection_string(
        conn_str=CONNECTION_STRING,
        consumer_group=CONSUMER_GROUP,
    )

    def on_event(partition_context, event):
        if event is None:
            return

        raw = event.body_as_str(encoding="UTF-8")
        message = decode_message(raw)
        timestamp = (
            event.enqueued_time.isoformat()
            if event.enqueued_time
            else datetime.now(timezone.utc).isoformat()
        )

        with data_lock:
            latest["message"] = message
            latest["timestamp"] = timestamp

        print("Received:", message, flush=True)

    try:
        print("Connecting to Azure Event Hubs...", flush=True)
        with client:
            client.receive(
                on_event=on_event,
                starting_position="@latest",
            )
    except Exception as exc:
        print(f"Azure receiver error: {exc}", flush=True)


@app.route("/api/latest", methods=["GET"])
def get_latest():
    with data_lock:
        return jsonify(latest.copy())


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    if USE_MOCK_DATA:
        print("Starting in MOCK mode - sending simulated telemetry data", flush=True)
        receiver_thread = threading.Thread(
            target=mock_data_generator,
            daemon=True,
        )
    else:
        print("Starting in AZURE mode - connecting to Event Hub", flush=True)
        receiver_thread = threading.Thread(
            target=receive_events,
            daemon=True,
        )
    
    receiver_thread.start()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
    )
