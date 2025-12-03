import requests
import urllib.parse

def function(name, value, extra):
    if name=="barcode":
        resp = requests.get(f'http://{extra["endpoint"]}/id/get/{extra["type"]}/{urllib.parse.quote(value,safe="")}?full')
        if resp.status_code == 200:
            body = resp.json()
            id = body.get("id")
            if body.get("individual") and id:
                return [id]
    return []
