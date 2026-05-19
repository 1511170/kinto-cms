#!/usr/bin/env bash
# KINTO CMS — instalador de una línea para macOS / Linux.
#
# Uso:
#   curl -fsSL get.kinto.co | bash
#
# Clona el repo kinto-cms DENTRO de la carpeta actual (sin crear subcarpeta)
# y lanza el wizard `kinto start`. Ejecútalo en una carpeta vacía.

set -euo pipefail

echo ""
echo "KINTO CMS — instalador"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js no encontrado. Instálalo desde https://nodejs.org (>= 18)."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Se requiere Node >= 18 (tienes $(node -v))."
  exit 1
fi
echo "✅ Node $(node -v)"

if ! command -v git >/dev/null 2>&1; then
  echo "❌ git no encontrado. Instálalo desde https://git-scm.com"
  exit 1
fi

REPO_URL="https://github.com/1511170/kinto-cms.git"

if [ -d ".git" ]; then
  echo "▸ KINTO ya está clonado aquí; actualizando con git pull..."
  git pull --ff-only
elif [ -n "$(ls -A 2>/dev/null)" ]; then
  echo "❌ Esta carpeta no está vacía."
  echo "   KINTO se instala DENTRO de la carpeta actual. Usa una carpeta vacía:"
  echo "     mkdir mi-proyecto && cd mi-proyecto && curl -fsSL get.kinto.co | bash"
  exit 1
else
  echo "▸ Clonando KINTO CMS en $(pwd) ..."
  git clone "$REPO_URL" .
fi

echo "▸ Lanzando el wizard de KINTO..."
echo ""
# `curl | bash` deja el script en stdin; el wizard es interactivo, así que
# redirigimos stdin al terminal controlador.
exec node bin/kinto.js start < /dev/tty
