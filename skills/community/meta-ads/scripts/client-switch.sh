#!/usr/bin/env bash
# client-switch.sh — activa un cliente KINTO BI en la sesión actual.
#
# Uso (importante: el usuario debe `source` el output, no ejecutar el script):
#   eval "$(bash skills/integrations/meta-ads/scripts/client-switch.sh <slug>)"
#
# o más simple:
#   export KINTO_CLIENT=<slug>
#   set -a && source clients/<slug>/.env-meta-ads && set +a

set -euo pipefail

SLUG="${1:?Uso: client-switch.sh <slug>}"
ENV_FILE="clients/${SLUG}/.env-meta-ads"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: no existe $ENV_FILE" >&2
  echo "       crea el cliente con /new-client $SLUG y completa el setup." >&2
  exit 1
fi

# Imprime los exports para que el caller los evalúe
echo "export KINTO_CLIENT='${SLUG}'"
grep -E '^(ACCESS_TOKEN|AD_ACCOUNT_ID)=' "$ENV_FILE" | sed 's/^/export /'
echo "# Cliente activo: ${SLUG}" >&2
