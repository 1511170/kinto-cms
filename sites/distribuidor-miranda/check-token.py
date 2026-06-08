import urllib.request
import json

with open('.cf.env', 'r') as f:
    content = f.read()

token = None
for line in content.split('\n'):
    if line.startswith('CLOUDFLARE_API_TOKEN='):
        token = line.split('=', 1)[1].strip()
        break

print(f"Token: {token[:20]}...")
print(f"Length: {len(token)}")

# Check token permissions
req = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/user/tokens/verify',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print(f"\nToken status: {data['result']['status']}")
    
# Check account access
req2 = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/accounts',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req2) as response:
    data2 = json.loads(response.read().decode())
    print(f"Accounts: {len(data2['result'])}")
    for acc in data2['result']:
        print(f"  - {acc['name']} ({acc['id']})")
