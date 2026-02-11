#!/usr/bin/env node
/**
 * Cloudflare Tunnel Setup - KINTO CMS Skill
 *
 * Configures permanent Cloudflare tunnels with custom domains.
 * Supports separate tunnel IDs for production and development.
 *
 * Usage:
 *   node setup-tunnel.js --token="eyJ..." --domain="example.com" [options]
 *
 * Options:
 *   --token          JWT token from Cloudflare Dashboard (required)
 *   --domain         Production domain (required)
 *   --dev-token      Separate JWT token for dev tunnel (optional, uses --token if omitted)
 *   --dev-domain     Development domain (optional)
 *   --port           Local server port (default: 4321)
 *   --name           Tunnel name label (default: derived from domain)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// --- Argument parsing ---

const args = process.argv.slice(2).reduce((acc, arg) => {
  const match = arg.match(/^--([^=]+)=(.+)$/);
  if (match) {
    acc[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return acc;
}, {});

const CONFIG = {
  token: args.token || process.env.CF_TUNNEL_TOKEN,
  devToken: args['dev-token'] || process.env.CF_TUNNEL_TOKEN_DEV || null,
  domain: args.domain || null,
  devDomain: args['dev-domain'] || null,
  port: parseInt(args.port) || 4321,
  tunnelName: args.name || null,
  cloudflaredDir: path.join(process.env.HOME || '/root', '.cloudflared'),
  projectDir: process.cwd()
};

// --- Logging helpers ---

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', dim: '\x1b[2m'
};

const log = (msg, color = 'reset') => console.log(`${C[color]}${msg}${C.reset}`);
const info = (msg) => log(`  ${msg}`, 'blue');
const success = (msg) => log(`  OK: ${msg}`, 'green');
const warning = (msg) => log(`  WARN: ${msg}`, 'yellow');
const fatal = (msg) => { log(`  ERROR: ${msg}`, 'red'); process.exit(1); };

// --- Core functions ---

function findCloudflared() {
  // 1. Check in project directory
  const local = path.join(CONFIG.projectDir, 'cloudflared');
  if (fs.existsSync(local)) return local;

  // 2. Check PATH
  try {
    const which = execSync('which cloudflared 2>/dev/null').toString().trim();
    if (which) return which;
  } catch {}

  // 3. Common locations
  const locations = [
    '/usr/local/bin/cloudflared',
    '/usr/bin/cloudflared',
    path.join(process.env.HOME || '', '.local/bin/cloudflared')
  ];
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }

  fatal(
    'cloudflared not found.\n' +
    '  Install it: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/\n' +
    '  Or place the binary in the project directory or add it to PATH.'
  );
}

function decodeToken(token) {
  try {
    // JWT tokens can have padding issues; handle both base64 and base64url
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const data = JSON.parse(decoded);
    if (!data.a || !data.t || !data.s) {
      throw new Error('Missing fields');
    }
    return data;
  } catch {
    fatal('Invalid JWT token. Make sure you copied the full token from Cloudflare Dashboard.');
  }
}

function checkServer() {
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${CONFIG.port}/`, { timeout: 5000 });
    success(`Local server responding on port ${CONFIG.port}`);
  } catch {
    warning(`Server not responding on port ${CONFIG.port}. Tunnel will start but won't serve content until the server is running.`);
  }
}

function createCredentials(tokenData) {
  const credentials = {
    AccountTag: tokenData.a,
    TunnelSecret: tokenData.s,
    TunnelID: tokenData.t
  };

  const credPath = path.join(CONFIG.cloudflaredDir, `${tokenData.t}.json`);

  // Don't overwrite existing credentials
  if (fs.existsSync(credPath)) {
    info(`Credentials already exist: ${credPath}`);
    return tokenData.t;
  }

  fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2));
  fs.chmodSync(credPath, 0o600);
  success(`Credentials saved: ${credPath}`);
  return tokenData.t;
}

function createConfig(tunnelId, hostname, filename, extraHostnames = []) {
  const configPath = path.join(CONFIG.cloudflaredDir, filename);
  const credPath = path.join(CONFIG.cloudflaredDir, `${tunnelId}.json`);

  let ingress = '';
  for (const h of [hostname, ...extraHostnames]) {
    ingress += `  - hostname: ${h}\n    service: http://localhost:${CONFIG.port}\n`;
  }
  ingress += '  - service: http_status:404\n';

  const config = `# ${filename.includes('dev') ? 'Development' : 'Production'} tunnel - ${hostname}
tunnel: ${tunnelId}
credentials-file: ${credPath}

ingress:
${ingress}`;

  fs.writeFileSync(configPath, config);
  success(`Config saved: ${configPath}`);
  return configPath;
}

function configureDNS(cloudflaredBin, tunnelId, hostname) {
  info(`Configuring DNS for ${hostname}...`);
  try {
    execSync(`${cloudflaredBin} tunnel route dns ${tunnelId} ${hostname}`, {
      stdio: 'pipe', timeout: 30000
    });
    success(`DNS configured: ${hostname}`);
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString() : e.message;
    if (msg.includes('already exists')) {
      info(`DNS record already exists for ${hostname}`);
    } else {
      warning(`Could not configure DNS automatically for ${hostname}`);
      info('Configure manually in Cloudflare Dashboard: Zero Trust > Networks > Tunnels');
    }
  }
}

function stopExistingTunnels(tunnelIds) {
  for (const id of tunnelIds) {
    try {
      execSync(`pkill -f "cloudflared.*${id}" 2>/dev/null`);
    } catch {}
  }
  execSync('sleep 2');
}

function startTunnel(cloudflaredBin, configPath, logFile) {
  info(`Starting tunnel: ${path.basename(configPath)}`);

  const child = spawn(cloudflaredBin, ['tunnel', '--config', configPath, 'run'], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);
  child.unref();

  return child.pid;
}

function verifyTunnel(hostname, maxAttempts = 12) {
  info(`Verifying https://${hostname}...`);

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const code = execSync(
        `curl -s -o /dev/null -w "%{http_code}" https://${hostname}/`,
        { timeout: 10000 }
      ).toString().trim();

      if (['200', '301', '302', '304'].includes(code)) {
        success(`https://${hostname} responding (HTTP ${code})`);
        return true;
      }
      info(`Attempt ${i}/${maxAttempts}: HTTP ${code}, waiting...`);
    } catch {
      info(`Attempt ${i}/${maxAttempts}: not responding, waiting...`);
    }
    execSync('sleep 3');
  }

  warning(`https://${hostname} not responding after ${maxAttempts} attempts.`);
  info('The tunnel may need 1-2 more minutes. Check logs with: tail -f /tmp/tunnel-*.log');
  return false;
}

function createStartScript(cloudflaredBin, prodTunnelId, devTunnelId) {
  const scriptPath = path.join(CONFIG.projectDir, 'start-tunnels.sh');

  const stopIds = [prodTunnelId, devTunnelId].filter(Boolean);
  const stopCommands = stopIds.map(id => `pkill -f "cloudflared.*${id}" 2>/dev/null`).join('\n');

  const script = `#!/bin/bash
# Start Cloudflare tunnels - generated by cloudflare-tunnel skill
# Usage: ./start-tunnels.sh [prod|dev|both|status|stop]

CLOUDFLARED="${cloudflaredBin}"
ACTION=\${1:-both}

case "$ACTION" in
  prod)
    echo "Starting production tunnel..."
    ${stopCommands}
    sleep 1
    $CLOUDFLARED tunnel --config ~/.cloudflared/config-prod.yml run > /tmp/tunnel-prod.log 2>&1 &
    echo "Production tunnel started (PID: $!)"
    ${CONFIG.domain ? `echo "  URL: https://${CONFIG.domain}"` : ''}
    ;;

  dev)
    echo "Starting development tunnel..."
    ${stopCommands}
    sleep 1
    $CLOUDFLARED tunnel --config ~/.cloudflared/config-dev.yml run > /tmp/tunnel-dev.log 2>&1 &
    echo "Development tunnel started (PID: $!)"
    ${CONFIG.devDomain ? `echo "  URL: https://${CONFIG.devDomain}"` : ''}
    ;;

  both)
    echo "Starting all tunnels..."
    ${stopCommands}
    sleep 1

    if [ -f ~/.cloudflared/config-prod.yml ]; then
      $CLOUDFLARED tunnel --config ~/.cloudflared/config-prod.yml run > /tmp/tunnel-prod.log 2>&1 &
      echo "Production tunnel started (PID: $!)"
      ${CONFIG.domain ? `echo "  URL: https://${CONFIG.domain}"` : ''}
    fi

    sleep 2

    if [ -f ~/.cloudflared/config-dev.yml ]; then
      $CLOUDFLARED tunnel --config ~/.cloudflared/config-dev.yml run > /tmp/tunnel-dev.log 2>&1 &
      echo "Development tunnel started (PID: $!)"
      ${CONFIG.devDomain ? `echo "  URL: https://${CONFIG.devDomain}"` : ''}
    fi

    echo ""
    echo "Tunnels started. Logs: tail -f /tmp/tunnel-*.log"
    ;;

  status|s)
    echo "Tunnel processes:"
    ps aux | grep "[c]loudflared" || echo "  No tunnels running"
    echo ""
    echo "Quick connectivity check:"
    ${CONFIG.domain ? `printf "  ${CONFIG.domain}: "; curl -s -o /dev/null -w "%{http_code}" https://${CONFIG.domain}/ 2>/dev/null; echo ""` : ''}
    ${CONFIG.devDomain ? `printf "  ${CONFIG.devDomain}: "; curl -s -o /dev/null -w "%{http_code}" https://${CONFIG.devDomain}/ 2>/dev/null; echo ""` : ''}
    ;;

  stop|kill)
    echo "Stopping tunnels..."
    ${stopCommands}
    echo "Done."
    ;;

  *)
    echo "Usage: $0 [prod|dev|both|status|stop]"
    echo ""
    echo "  prod    Start production tunnel only"
    echo "  dev     Start development tunnel only"
    echo "  both    Start all tunnels (default)"
    echo "  status  Show running tunnels and connectivity"
    echo "  stop    Stop all tunnels"
    ;;
esac
`;

  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, 0o755);
  success(`Start script created: ${scriptPath}`);
}

// --- Main ---

async function main() {
  log('\n  Cloudflare Tunnel Setup', 'cyan');
  log('  ' + '='.repeat(50), 'dim');

  // Validate required args
  if (!CONFIG.token) {
    log('\n  To get a tunnel token:', 'yellow');
    log('  1. Go to https://dash.cloudflare.com', 'dim');
    log('  2. Zero Trust > Networks > Tunnels', 'dim');
    log('  3. Create a tunnel > Cloudflared', 'dim');
    log('  4. Copy the token (starts with eyJ...)', 'dim');
    fatal('Missing --token argument.');
  }

  if (!CONFIG.domain) {
    fatal('Missing --domain argument. Example: --domain="example.com"');
  }

  // Find cloudflared
  const cloudflaredBin = findCloudflared();
  info(`Using cloudflared: ${cloudflaredBin}`);

  // Show config
  log('\n  Configuration:', 'cyan');
  info(`Domain: ${CONFIG.domain}`);
  if (CONFIG.devDomain) info(`Dev domain: ${CONFIG.devDomain}`);
  info(`Local port: ${CONFIG.port}`);

  // Check server
  checkServer();

  // Ensure config directory
  if (!fs.existsSync(CONFIG.cloudflaredDir)) {
    fs.mkdirSync(CONFIG.cloudflaredDir, { recursive: true });
  }

  // --- Production tunnel ---
  log('\n  Production Tunnel', 'cyan');
  const prodTokenData = decodeToken(CONFIG.token);
  info(`Tunnel ID: ${prodTokenData.t}`);
  const prodTunnelId = createCredentials(prodTokenData);
  const prodConfig = createConfig(prodTunnelId, CONFIG.domain, 'config-prod.yml', [`www.${CONFIG.domain}`]);
  configureDNS(cloudflaredBin, prodTunnelId, CONFIG.domain);
  configureDNS(cloudflaredBin, prodTunnelId, `www.${CONFIG.domain}`);

  // --- Development tunnel (optional) ---
  let devTunnelId = null;
  let devConfig = null;

  if (CONFIG.devDomain) {
    log('\n  Development Tunnel', 'cyan');

    const devTokenRaw = CONFIG.devToken || CONFIG.token;
    const devTokenData = decodeToken(devTokenRaw);

    // If using same token, reuse same tunnel id; otherwise create separate credentials
    if (devTokenData.t === prodTokenData.t) {
      info('Using same tunnel ID as production');
      devTunnelId = prodTunnelId;
    } else {
      info(`Tunnel ID: ${devTokenData.t}`);
      devTunnelId = createCredentials(devTokenData);
    }

    devConfig = createConfig(devTunnelId, CONFIG.devDomain, 'config-dev.yml');
    configureDNS(cloudflaredBin, devTunnelId, CONFIG.devDomain);
  }

  // --- Start tunnels ---
  log('\n  Starting Tunnels', 'cyan');
  stopExistingTunnels([prodTunnelId, devTunnelId].filter(Boolean));

  const prodPid = startTunnel(cloudflaredBin, prodConfig, '/tmp/tunnel-prod.log');
  info(`Production started (PID: ${prodPid})`);

  if (devConfig) {
    execSync('sleep 3');
    const devPid = startTunnel(cloudflaredBin, devConfig, '/tmp/tunnel-dev.log');
    info(`Development started (PID: ${devPid})`);
  }

  // Wait for connection
  info('Waiting for Cloudflare connection (10s)...');
  execSync('sleep 10');

  // --- Verify ---
  log('\n  Verification', 'cyan');
  verifyTunnel(CONFIG.domain);
  if (CONFIG.devDomain) {
    execSync('sleep 2');
    verifyTunnel(CONFIG.devDomain);
  }

  // --- Create helper script ---
  createStartScript(cloudflaredBin, prodTunnelId, devTunnelId);

  // --- Summary ---
  log('\n  Setup Complete', 'green');
  log('  ' + '='.repeat(50), 'dim');

  log('\n  URLs:', 'cyan');
  log(`    Production:  https://${CONFIG.domain}`);
  if (CONFIG.devDomain) log(`    Development: https://${CONFIG.devDomain}`);

  log('\n  Files:', 'cyan');
  log(`    ~/.cloudflared/${prodTunnelId}.json`);
  log('    ~/.cloudflared/config-prod.yml');
  if (devConfig) {
    if (devTunnelId !== prodTunnelId) log(`    ~/.cloudflared/${devTunnelId}.json`);
    log('    ~/.cloudflared/config-dev.yml');
  }
  log('    ./start-tunnels.sh');

  log('\n  Commands:', 'cyan');
  log('    ./start-tunnels.sh status   Check tunnel status');
  log('    ./start-tunnels.sh stop     Stop all tunnels');
  log('    tail -f /tmp/tunnel-*.log   Watch logs');
  log('');
}

main().catch(err => fatal(err.message));
