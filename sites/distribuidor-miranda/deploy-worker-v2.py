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

print(f"Token: {token[:20]}...")
print(f"Length: {len(token)}")

ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'
WORKER_NAME = 'distribuidor-miranda-storefront'

# Leer el script del worker
with open('worker/index.ts', 'r') as f:
    worker_script = f.read()

# Preparar el multipart form data
boundary = '----FormBoundary' + os.urandom(16).hex()

metadata = {
    'main_module': 'index.js',
    'bindings': [
        {'type': 'kv_namespace', 'name': 'SHOPIFY_CACHE', 'namespace_id': '45f129649a6c49668cf9b9ad5d645138'},
        {'type': 'plain_text', 'name': 'SHOPIFY_STORE_DOMAIN', 'text': 'distribuidor-miranda.myshopify.com'},
        {'type': 'plain_text', 'name': 'SHOPIFY_API_VERSION', 'text': '2026-04'},
        {'type': 'plain_text', 'name': 'SHOPIFY_REBUILD_DEBOUNCE_SECONDS', 'text': '90'}
    ],
    'compatibility_date': '2026-06-01'
}

# Construir el body
body = []
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"; filename="metadata.json"\r\nContent-Type: application/json\r\n\r\n{json.dumps(metadata)}\r\n')
body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="index.js"; filename="index.js"\r\nContent-Type: application/javascript+module\r\n\r\n{worker_script}\r\n')
body.append(f'--{boundary}--\r\n')

body_str = ''.join(body)

# Hacer el request
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}',
    data=body_str.encode(),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    },
    method='PUT'
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print('\nDeploy result:')
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print(f'\nHTTP Error: {e.code}')
    print(f'Response: {e.read().decode()}')
except Exception as e:
    print(f'\nError: {e}')
