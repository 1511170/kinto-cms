import os
import subprocess
import json
import base64
import gzip

os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')

with open('.cf.env') as f:
    env = dict(line.strip().split('=',1) for line in f if '=' in line and not line.startswith('#'))

TOKEN = env['CLOUDFLARE_API_TOKEN']
ACCOUNT_ID = env['CLOUDFLARE_ACCOUNT_ID']
WORKER_NAME = 'distribuidor-miranda-storefront'

# Build the worker script first
print('Building worker...')
result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
if result.returncode != 0:
    print('Build failed:', result.stderr[-500:])
    exit(1)

# Use wrangler deploy with API token via environment
print('Deploying with API token...')
env_vars = os.environ.copy()
env_vars['CLOUDFLARE_API_TOKEN'] = TOKEN
env_vars['CLOUDFLARE_ACCOUNT_ID'] = ACCOUNT_ID

result = subprocess.run(
    ['npx', 'wrangler', 'deploy', '--config', '.wrangler.jsonc'],
    env=env_vars,
    capture_output=True,
    text=True,
    timeout=300
)

print('STDOUT:', result.stdout[-1000:])
print('STDERR:', result.stderr[-1000:])
print('Return code:', result.returncode)
