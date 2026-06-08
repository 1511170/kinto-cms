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

# List workers
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/services',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print('Workers:')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'Error listing workers: {e}')

# List KV namespaces
req2 = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/storage/kv/namespaces',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req2) as response:
        data2 = json.loads(response.read().decode())
        print('\nKV Namespaces:')
        print(json.dumps(data2, indent=2))
except Exception as e:
    print(f'\nError listing KV: {e}')
