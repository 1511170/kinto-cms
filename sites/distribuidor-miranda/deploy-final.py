import urllib.request
import json
import os
import gzip

os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')

# Leer token del archivo .cf.env
with open('.cf.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('CLOUDFLARE_API_TOKEN='):
            token = line.split('=', 1)[1]
            break

print(f"Token length: {len(token)}")
print(f"Token prefix: {token[:20]}...")

ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'
WORKER_NAME = 'distribuidor-miranda-storefront'

# Leer el script del worker
with open('worker/index.ts', 'r') as f:
    worker_script = f.read()

print(f"\nWorker script length: {len(worker_script)}")

# Comprimir el script
compressed = gzip.compress(worker_script.encode())
print(f"Compressed size: {len(compressed)}")

# Subir el script usando la API v4
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
        print('\n✅ Deploy successful!')
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print(f'\n❌ HTTP Error {e.code}:')
    error_body = e.read().decode()
    print(error_body)
    
    # Intentar parsear el error
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
