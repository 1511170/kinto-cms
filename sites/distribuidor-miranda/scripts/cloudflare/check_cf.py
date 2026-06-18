import subprocess, os
os.chdir('/home/k41h4ck3r/work/kinto-miranda/kinto-cms-distribuidor-shopify-worker/sites/distribuidor-miranda')
with open('.cf.env') as f:
    env = dict(line.strip().split('=',1) for line in f if '=' in line and not line.startswith('#'))
token = env['CLOUDFLARE_API_TOKEN']
account = env['CLOUDFLARE_ACCOUNT_ID']
auth = 'Authorization: Bearer *** + token
r = subprocess.run(['curl','-sS','-H',auth,f'https://api.cloudflare.com/client/v4/accounts/{account}'], capture_output=True, text=True)
print(r.stdout[:500])
