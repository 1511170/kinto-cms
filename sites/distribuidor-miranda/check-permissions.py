import urllib.request
import json

with open('.cf.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('CLOUDFLARE_API_TOKEN=***            token = line.split('=', 1)[1]
            break

print(f"Token: {token[:20]}...")

# Check token permissions
req = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/user/tokens/verify',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print(f"\nToken status: {data['result']['status']}")
    if data['result'].get('permissions'):
        print(f"Permissions: {data['result']['permissions']}")

# Try to list workers
ACCOUNT_ID = '948994a95e4d7d23badec650fa303120'

req2 = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req2) as response:
        data2 = json.loads(response.read().decode())
        print(f"\nWorkers list: Success")
        print(f"Count: {len(data2.get('result', []))}")
except Exception as e:
    print(f"\nWorkers list error: {e}")

# Try to get specific worker
req3 = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/distribuidor-miranda-storefront',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req3) as response:
        data3 = json.loads(response.read().decode())
        print(f"\nWorker get: Success")
except Exception as e:
    print(f"\nWorker get error: {e}")
