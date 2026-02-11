# Skill: cloudflare-tunnel

Automated setup of permanent Cloudflare tunnels with custom domains.

## What it does

- **Permanent tunnels** - No expiration like trycloudflare.com
- **Custom domains** - Use your real domain
- **Auto SSL** - Free Cloudflare certificates
- **Built-in CDN** - Global caching and optimization
- **Auto-reconnect** - Stays connected automatically
- **Separate prod/dev** - Supports different tunnel IDs for each environment

## Requirements

1. **Cloudflare account** (free) - https://dash.cloudflare.com
2. **Domain added** to Cloudflare with nameservers pointed
3. **cloudflared** installed (the script can detect it in PATH or project directory)
4. **Local web server** running (default port: 4321 for Astro)

## Quick Setup (Automated)

### Step 1: Create the tunnel in Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to: **Zero Trust** > **Networks** > **Tunnels**
3. Click **"Create a tunnel"**
4. Select **"Cloudflared"**
5. Name it (e.g. `my-site-prod`)
6. Click **"Save tunnel"**
7. Copy the **token** (starts with `eyJ...`)

### Step 2: Run the setup script

```bash
# Automated (recommended)
node skills/community/cloudflare-tunnel/setup-tunnel.js \
  --token="eyJ..." \
  --domain="yourdomain.com" \
  --dev-domain="dev.yourdomain.com" \
  --port=4321

# Interactive alternative
bash skills/community/cloudflare-tunnel/setup.sh --port=4321
```

### Step 3: Using separate tunnels for prod/dev

If you created two different tunnels in Cloudflare Dashboard (recommended for production):

```bash
node skills/community/cloudflare-tunnel/setup-tunnel.js \
  --token="eyJ...PROD_TOKEN" \
  --domain="yourdomain.com" \
  --dev-token="eyJ...DEV_TOKEN" \
  --dev-domain="dev.yourdomain.com" \
  --port=4321
```

## For AI Assistants

See [README-ASSISTANT.md](./README-ASSISTANT.md) for the full AI-guided setup flow.

## Managing Tunnels

After setup, use the generated `start-tunnels.sh`:

```bash
./start-tunnels.sh          # Start all tunnels
./start-tunnels.sh prod     # Production only
./start-tunnels.sh dev      # Development only
./start-tunnels.sh status   # Check status and connectivity
./start-tunnels.sh stop     # Stop all tunnels
```

## Persistence with systemd

For tunnels that survive reboots, use the included systemd template:

```bash
# Copy and edit the template
sudo cp skills/community/cloudflare-tunnel/cloudflared@.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable production tunnel
sudo systemctl enable --now cloudflared@prod

# Enable development tunnel
sudo systemctl enable --now cloudflared@dev

# Check status
sudo systemctl status cloudflared@prod
```

## Useful Commands

```bash
cloudflared tunnel list                    # List all tunnels
cloudflared tunnel info TUNNEL_NAME        # Tunnel details
cloudflared tunnel --url http://localhost:4321  # Quick temporary tunnel
tail -f /tmp/tunnel-*.log                  # Watch logs
```

## Permanent vs Temporary Tunnels

| Feature | Permanent Tunnel | Quick Tunnel |
|---------|-----------------|--------------|
| URL | Your domain | Random (changes each time) |
| Stability | 99.9% uptime | Variable |
| SSL | Automatic | Limited |
| CDN | Included | No |
| Analytics | Yes | No |
| Setup | Once | Every time |

## Troubleshooting

### Tunnel shows "Down" in dashboard
1. Check process: `ps aux | grep cloudflared`
2. Check logs: `tail -20 /tmp/tunnel-prod.log`
3. Restart: `./start-tunnels.sh stop && ./start-tunnels.sh`

### HTTP 502 Bad Gateway
1. Verify local server is running: `curl http://localhost:4321/`
2. Check config uses `http://` not `https://` for local service
3. In Cloudflare Dashboard, verify the service URL matches

### Domain doesn't resolve
1. Verify DNS is configured in Cloudflare
2. Check nameservers point to Cloudflare
3. Flush local DNS cache

### "credentials file doesn't exist"
1. Check file exists: `ls ~/.cloudflared/*.json`
2. File must be named `TUNNEL_ID.json`
3. Recreate from token if needed

### "Failed to create QUIC connection"
- Usually a network/firewall issue
- Cloudflared uses port 7844 (UDP) for QUIC
- Falls back to HTTP/2 if QUIC is blocked
