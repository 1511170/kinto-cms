import urllib.request
import json
import os
import gzip

os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')

# Leer token
with open('.cf.env', 'r') as f:
    content = f.read()

token = None
for line in content.split('\n'):
    if line.startswith('CLOUDFLARE_API_TOKEN='):
        token = line.split('=', 1)[1].strip()
        break

print(f"Token: {token[:20]}...")
print(f"Length: {len(token)}")

ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'
WORKER_NAME = 'distribuidor-miranda-storefront'

# Leer el script del worker
with open('worker/index.ts', 'r') as f:
    worker_script = f.read()

# Comprimir el script
compressed = gzip.compress(worker_script.encode())

# Subir el script
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}',
    data=compressed,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/javascript',
        'Content-Encoding': 'gzip'
    },
    method='PUT'
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print('\nDeploy result:')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'\nError: {e}')
