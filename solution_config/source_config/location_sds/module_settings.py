INCLUDED_APPS = ["state"]

URL_ROUTING = [
    ("state/", "state.urls"),
    ("events/", "state.event_urls"),
    ("settings/", "state.settings_urls"),
]

MQTT = {
    "broker": "mqtt.docker.local",
    "port": 1883,
    "id": "locations_db",
    "subscriptions": [
        {"topic": "transfer_operation/+/+", "qos": 1},
        {"topic": "transfer_operation/+", "qos": 1},
        {"topic": "production_operation/+", "qos": 1},
    ],
    "publish_qos": 1,
    "base_topic_template": "",
    "reconnect": {"initial": 5, "backoff": 2, "limit": 60},
}

ADMIN_HEADER = "Location Tracking Admin"
ADMIN_TITLE = "Location Tracking Admin Portal"
ADMIN_INDEX = "Welcome to Location Tracking Administration Portal"

ID_SERVICE_URL = "identity-sds.docker.local"
