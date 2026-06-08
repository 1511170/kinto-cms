import urllib.request
import json
import os
import base64

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
KV_NAMESPACE_ID = '45f129649a6c49668cf9b9ad5d645138'

assets_dir = 'dist'
uploaded = 0
failed = 0

if os.path.exists(assets_dir):
    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, assets_dir)
            key = f"asset:/{relative_path}"
            
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Upload to KV
            req = urllib.request.Request(
                f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/storage/kv/namespaces/{KV_NAMESPACE_ID}/values/{urllib.parse.quote(key, safe="")}',
                data=file_content,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/octet-stream'
                },
                method='PUT'
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read().decode())
                    if data.get('success'):
                        print(f'  ✅ {relative_path}')
                        uploaded += 1
                    else:
                        print(f'  ❌ {relative_path}: {data}')
                        failed += 1
            except Exception as e:
                print(f'  ❌ {relative_path}: {e}')
                failed += 1
else:
    print('  ⚠️ No assets directory found')

print(f'\n📊 Upload complete: {uploaded} uploaded, {failed} failed')
