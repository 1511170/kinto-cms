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

# Get token info
req = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/user/tokens/verify',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print('Token Info:')
    print(json.dumps(data, indent=2))

# List accounts
req2 = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/accounts',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req2) as response:
        data2 = json.loads(response.read().decode())
        print('\nAccounts:')
        print(json.dumps(data2, indent=2))
except Exception as e:
    print(f'\nError listing accounts: {e}')
