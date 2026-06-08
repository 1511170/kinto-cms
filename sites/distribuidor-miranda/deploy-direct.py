import urllib.request
import json
import os

os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')

with open('.cf.env', 'r') as f:
    content = f.read()

token = None
for line in content.split('\n'):
    if line.startswith('CLOUDFLARE_API_TOKEN=***        token = line.split('=', 1)[1].strip()
        break

ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'
WORKER_NAME = 'distribuidor-miranda-storefront'

with open('worker/index.ts', 'r') as f:
    worker_script = f.read()

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

body = json.dumps({
    'metadata': metadata,
    'script': worker_script
}).encode()

req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}',
    data=body,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/javascript'
    },
    method='PUT'
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print('Deploy result:')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'Error: {e}')
