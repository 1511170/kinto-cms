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

ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'
WORKER_NAME = 'distribuidor-miranda-storefront'

# Try to get worker details
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/services/{WORKER_NAME}',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print('Worker details:')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'Error getting worker: {e}')

# Try to list worker scripts
req2 = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req2) as response:
        data2 = json.loads(response.read().decode())
        print('\nWorker scripts:')
        print(json.dumps(data2, indent=2))
except Exception as e:
    print(f'\nError listing scripts: {e}')
