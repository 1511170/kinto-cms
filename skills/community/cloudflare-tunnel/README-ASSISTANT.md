# AI Assistant Guide: Cloudflare Tunnel Skill

Instructions for AI assistants (Claude Code, Cursor, Copilot, etc.) to configure Cloudflare tunnels.

## When to use this skill

User requests related to:
- Setting up a Cloudflare tunnel
- Connecting a local site to a custom domain
- Exposing a local server to the internet
- Configuring cloudflared
- Production/development tunnel setup

## Setup flow

### Step 1: Ask the user for their tunnel token

```
To set up the Cloudflare tunnel I need you to:

1. Go to https://dash.cloudflare.com
2. Navigate to: Zero Trust > Networks > Tunnels
3. Click "Create a tunnel"
4. Select "Cloudflared"
5. Give it a name (e.g. my-site-prod)
6. Click "Save tunnel"
7. Copy the token shown (starts with eyJ...)

Paste the token here when ready.
```

### Step 2: Gather configuration

Once the token is provided, confirm:

```
Configuration:
1. Production domain? (e.g. example.com)
2. Development domain? (optional, e.g. dev.example.com)
3. Local server port? (default: 4321 for Astro)
```

If the user wants separate prod/dev tunnels, ask for a second token.

### Step 3: Run setup

#### Option A: Use the automation script (recommended)

```bash
node skills/community/cloudflare-tunnel/setup-tunnel.js \
  --token="USER_TOKEN" \
  --domain="USER_DOMAIN" \
  --dev-domain="USER_DEV_DOMAIN" \
  --port=4321
```

For separate prod/dev tunnels:
```bash
node skills/community/cloudflare-tunnel/setup-tunnel.js \
  --token="PROD_TOKEN" \
  --domain="USER_DOMAIN" \
  --dev-token="DEV_TOKEN" \
  --dev-domain="USER_DEV_DOMAIN" \
  --port=4321
```

#### Option B: Manual step-by-step

If the script is unavailable, follow these steps:

**B.1 Find cloudflared**

```bash
# Check PATH first, then project directory
which cloudflared 2>/dev/null || ls ./cloudflared 2>/dev/null
```

**B.2 Decode the JWT token**

The token is base64-encoded JSON with these fields:
- `a`: AccountTag
- `t`: TunnelID
- `s`: TunnelSecret

```bash
echo "USER_TOKEN" | base64 -d
```

**B.3 Create credentials file**

```bash
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/TUNNEL_ID.json << 'EOF'
{
    "AccountTag": "ACCOUNT_TAG",
    "TunnelSecret": "TUNNEL_SECRET",
    "TunnelID": "TUNNEL_ID"
}
EOF

chmod 600 ~/.cloudflared/TUNNEL_ID.json
```

**B.4 Create configuration files**

Production (`~/.cloudflared/config-prod.yml`):
```yaml
# Production tunnel - example.com
tunnel: TUNNEL_ID
credentials-file: /home/USERNAME/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: example.com
    service: http://localhost:4321
  - hostname: www.example.com
    service: http://localhost:4321
  - service: http_status:404
```

Development (`~/.cloudflared/config-dev.yml`) - optional:
```yaml
# Development tunnel - dev.example.com
tunnel: TUNNEL_ID
credentials-file: /home/USERNAME/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: dev.example.com
    service: http://localhost:4321
  - service: http_status:404
```

**B.5 Configure DNS**

```bash
cloudflared tunnel route dns TUNNEL_ID example.com
cloudflared tunnel route dns TUNNEL_ID www.example.com
cloudflared tunnel route dns TUNNEL_ID dev.example.com  # if using dev
```

**B.6 Start tunnels**

```bash
# Stop existing tunnels for this ID
pkill -f "cloudflared.*TUNNEL_ID" 2>/dev/null
sleep 2

# Start production
cloudflared tunnel --config ~/.cloudflared/config-prod.yml run > /tmp/tunnel-prod.log 2>&1 &

sleep 3

# Start development (if configured)
cloudflared tunnel --config ~/.cloudflared/config-dev.yml run > /tmp/tunnel-dev.log 2>&1 &

sleep 5
```

**B.7 Verify**

```bash
# Check processes
ps aux | grep "[c]loudflared"

# Check logs
tail -5 /tmp/tunnel-prod.log
tail -5 /tmp/tunnel-dev.log

# Test connectivity (may take 10-30 seconds)
curl -s -o /dev/null -w "%{http_code}" https://example.com/
curl -s -o /dev/null -w "%{http_code}" https://dev.example.com/
```

### Step 4: Report result

```
Setup complete.

URLs:
  Production:  https://example.com
  Development: https://dev.example.com

Files created:
  ~/.cloudflared/TUNNEL_ID.json
  ~/.cloudflared/config-prod.yml
  ~/.cloudflared/config-dev.yml
  ./start-tunnels.sh

Commands:
  ./start-tunnels.sh status   Check tunnel status
  ./start-tunnels.sh stop     Stop all tunnels
  tail -f /tmp/tunnel-*.log   Watch logs
```

## Common errors

### "Provided Tunnel token is not valid"
- Credentials JSON file missing or malformed
- Verify token was decoded correctly
- Recreate the JSON file from the token

### HTTP 502 Bad Gateway
- Config has `https://localhost` but server uses plain HTTP
- Fix: change service to `http://localhost:PORT` in the config
- Or update in Cloudflare Dashboard: Zero Trust > Tunnels > edit hostname

### "cannot find tunnel"
- Credentials file not in `~/.cloudflared/`
- Filename must match the TunnelID exactly: `TUNNEL_ID.json`

### "Failed to create QUIC connection"
- Network/firewall blocking UDP port 7844
- cloudflared will fall back to HTTP/2 automatically

## Security notes

1. Credentials file should have permissions 600 (owner read-only)
2. Never expose the JWT token in logs or user-facing messages
3. Local service should bind to localhost, not 0.0.0.0
4. The JWT token contains full credentials (AccountTag + Secret + TunnelID)

## Persistence options

For tunnels that survive reboots:

**systemd** (recommended for Linux):
```bash
sudo cp skills/community/cloudflare-tunnel/cloudflared@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared@prod
```

**Background process** (simpler, doesn't survive reboot):
```bash
./start-tunnels.sh
```
