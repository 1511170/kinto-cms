#!/bin/bash
# Interactive Cloudflare Tunnel Setup
# Usage: bash setup.sh [--port=4321]

set -e

# Parse port argument
PORT=4321
for arg in "$@"; do
  case $arg in
    --port=*) PORT="${arg#*=}" ;;
  esac
done

echo ""
echo "  Cloudflare Tunnel Setup (Interactive)"
echo "  ======================================"
echo ""

# --- Check/install cloudflared ---

CLOUDFLARED=""
if command -v cloudflared &>/dev/null; then
  CLOUDFLARED=$(which cloudflared)
elif [ -f ./cloudflared ]; then
  CLOUDFLARED="./cloudflared"
fi

if [ -z "$CLOUDFLARED" ]; then
  echo "  cloudflared is not installed."
  echo ""
  read -p "  Install it now? (y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  Downloading cloudflared..."
    curl -L --output /tmp/cloudflared.deb \
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i /tmp/cloudflared.deb || sudo apt-get install -f -y
    rm -f /tmp/cloudflared.deb
    CLOUDFLARED=$(which cloudflared)
    echo "  OK: cloudflared installed"
  else
    echo "  Aborted. Install cloudflared first."
    exit 1
  fi
fi

echo "  Using: $CLOUDFLARED ($($CLOUDFLARED --version 2>&1 | head -1))"
echo ""

# --- Authentication ---

echo "  Step 1: Authentication"
echo "  ----------------------"
echo "  This will open a browser to authenticate with Cloudflare."
echo ""
read -p "  Continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

$CLOUDFLARED tunnel login
echo ""

# --- Create tunnel ---

echo "  Step 2: Create tunnel"
echo "  ---------------------"
read -p "  Tunnel name (e.g. my-site-prod): " TUNNEL_NAME

TUNNEL_ID=$($CLOUDFLARED tunnel create "$TUNNEL_NAME" 2>&1 | grep -oP 'Created tunnel.*\K[0-9a-f-]{36}' || echo "")

if [ -z "$TUNNEL_ID" ]; then
  echo "  WARN: Tunnel may already exist. Listing tunnels..."
  $CLOUDFLARED tunnel list
  echo ""
  read -p "  Enter existing tunnel ID: " TUNNEL_ID
fi

echo "  OK: Tunnel ID: $TUNNEL_ID"
echo ""

# --- Configure domain ---

echo "  Step 3: Domain configuration"
echo "  ----------------------------"
read -p "  Production domain (e.g. example.com): " DOMAIN
read -p "  Development domain (optional, press Enter to skip): " DEV_DOMAIN
echo ""

# --- Configure DNS ---

echo "  Step 4: DNS setup"
echo "  -----------------"

$CLOUDFLARED tunnel route dns "$TUNNEL_NAME" "$DOMAIN" 2>/dev/null && \
  echo "  OK: DNS configured for $DOMAIN" || \
  echo "  WARN: Configure DNS manually in Cloudflare Dashboard"

$CLOUDFLARED tunnel route dns "$TUNNEL_NAME" "www.$DOMAIN" 2>/dev/null && \
  echo "  OK: DNS configured for www.$DOMAIN" || \
  echo "  WARN: Configure www DNS manually"

if [ -n "$DEV_DOMAIN" ]; then
  $CLOUDFLARED tunnel route dns "$TUNNEL_NAME" "$DEV_DOMAIN" 2>/dev/null && \
    echo "  OK: DNS configured for $DEV_DOMAIN" || \
    echo "  WARN: Configure dev DNS manually"
fi
echo ""

# --- Create config files ---

echo "  Step 5: Creating configuration files"
echo "  ------------------------------------"

CONFIG_DIR="$HOME/.cloudflared"
mkdir -p "$CONFIG_DIR"

# Production config
cat > "$CONFIG_DIR/config-prod.yml" << EOF
# Production tunnel - $DOMAIN
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:$PORT
  - hostname: www.$DOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
EOF
echo "  OK: $CONFIG_DIR/config-prod.yml"

# Development config (if domain provided)
if [ -n "$DEV_DOMAIN" ]; then
  cat > "$CONFIG_DIR/config-dev.yml" << EOF
# Development tunnel - $DEV_DOMAIN
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

ingress:
  - hostname: $DEV_DOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
EOF
  echo "  OK: $CONFIG_DIR/config-dev.yml"
fi
echo ""

# --- Summary ---

echo "  Setup Complete"
echo "  =============="
echo ""
echo "  To start the tunnel:"
echo "    $CLOUDFLARED tunnel --config ~/.cloudflared/config-prod.yml run"
echo ""
if [ -n "$DEV_DOMAIN" ]; then
  echo "  To start dev tunnel:"
  echo "    $CLOUDFLARED tunnel --config ~/.cloudflared/config-dev.yml run"
  echo ""
fi
echo "  To run in background:"
echo "    $CLOUDFLARED tunnel --config ~/.cloudflared/config-prod.yml run > /tmp/tunnel-prod.log 2>&1 &"
echo ""
echo "  URLs:"
echo "    https://$DOMAIN"
[ -n "$DEV_DOMAIN" ] && echo "    https://$DEV_DOMAIN"
echo ""
