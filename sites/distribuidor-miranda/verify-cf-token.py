import urllib.request
import json
import os

os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')

with open('.cf.env', 'r') as f:
    content = f.read()

token = None
for line in content.split('\n'):
    if line.startswith('CLOUDFLARE_API_TOKEN='):
        token = line.split('=', 1)[1].strip()
        break

print(f'Token length: {len(token)}')
print(f'Token prefix: {token[:25]}...')

req = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/user/tokens/verify',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f'Success: {data.get("success")}')
        if data.get('result'):
            print(f'Status: {data["result"].get("status")}')
        if data.get('errors'):
            print(f'Errors: {data["errors"]}')
except Exception as e:
    print(f'Error: {e}')
