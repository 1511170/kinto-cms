import urllib.request
import json
import os
import gzip

os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')

# Read token
with open('.cf.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('CLOUDFLARE_API_TOKEN='):
            token = line.split('=', 1)[1]
            break

print(f"Token: {token[:20]}...")
print(f"Length: {len(token)}")

ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'
WORKER_NAME = 'distribuidor-miranda-storefront'

# Read worker script
with open('worker/index.js', 'r') as f:
    worker_script = f.read()

print(f"Worker script length: {len(worker_script)}")

# Create multipart form data
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

# Build body
body_parts = []
body_parts.append(f'--{boundary}\r\n')
body_parts.append('Content-Disposition: form-data; name="metadata"; filename="metadata.json"\r\n')
body_parts.append('Content-Type: application/json\r\n\r\n')
body_parts.append(json.dumps(metadata))
body_parts.append(f'\r\n--{boundary}\r\n')
body_parts.append('Content-Disposition: form-data; name="index.js"; filename="index.js"\r\n')
body_parts.append('Content-Type: application/javascript+module\r\n\r\n')
body_parts.append(worker_script)
body_parts.append(f'\r\n--{boundary}--\r\n')

body = ''.join(body_parts).encode('utf-8')

print(f"Body size: {len(body)} bytes")

# Make request
req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}',
    data=body,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    },
    method='PUT'
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print('\n✅ Worker deploy successful!')
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print(f'\n❌ HTTP Error {e.code}:')
    error_body = e.read().decode()
    print(error_body)
    try:
        error_json = json.loads(error_body)
        if error_json.get('errors'):
            for err in error_json['errors']:
                print(f"\nError code: {err.get('code')}")
                print(f"Message: {err.get('message')}")
    except:
        pass
except Exception as e:
    print(f'\n❌ Error: {e}')

# Now upload assets
print('\n📁 Uploading assets...')

assets_dir = 'dist'
if os.path.exists(assets_dir):
    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, assets_dir)
            
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Upload asset
            asset_req = urllib.request.Request(
                f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}/assets',
                data=file_content,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': f'attachment; filename="{relative_path}"'
                },
                method='PUT'
            )
            
            try:
                with urllib.request.urlopen(asset_req) as response:
                    print(f'  ✅ {relative_path}')
            except Exception as e:
                print(f'  ❌ {relative_path}: {e}')
else:
    print('  ⚠️ No assets directory found')
