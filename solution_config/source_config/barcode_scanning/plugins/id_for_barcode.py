import requests
import urllib.parse

def function(name, value, extra):
    if name=="barcode":
        resp = requests.get(f'http://{extra["endpoint"]}/id/get/{extra["type"]}?full&identifier={urllib.parse.quote(value,safe="")}')
        if resp.status_code == 200:
            body = resp.json()
            id = body.get("id")
            if body.get("individual") and id:
                return [id]
    return []
