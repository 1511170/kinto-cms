#!/usr/bin/env pwsh
# KINTO CMS - instalador de una linea para Windows / PowerShell.
#
# Uso:
#   irm get.kinto.co | iex
#
# Clona el repo kinto-cms DENTRO de la carpeta actual (sin crear subcarpeta)
# y lanza el wizard `kinto start`. Ejecutalo en una carpeta vacia.

$ErrorActionPreference = 'Stop'
Write-Host ''
Write-Host 'KINTO CMS - instalador' -ForegroundColor Cyan
Write-Host ''

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'X  Node.js no encontrado. Instalalo desde https://nodejs.org (>= 18).' -ForegroundColor Red
    exit 1
}

$nodeMajor = [int]((node -v) -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 18) {
    Write-Host "X  Se requiere Node >= 18 (tienes $(node -v))." -ForegroundColor Red
    exit 1
}
Write-Host "OK Node $(node -v)" -ForegroundColor Green

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host 'X  git no encontrado. Instalalo desde https://git-scm.com' -ForegroundColor Red
    exit 1
}

$repoUrl = 'https://github.com/1511170/kinto-cms.git'
$cwd = (Get-Location).Path

if (Test-Path (Join-Path $cwd '.git')) {
    Write-Host '-> KINTO ya esta clonado aqui; actualizando con git pull...' -ForegroundColor Cyan
    git pull --ff-only
} elseif ((Get-ChildItem -Force -LiteralPath $cwd | Measure-Object).Count -gt 0) {
    Write-Host 'X  Esta carpeta no esta vacia.' -ForegroundColor Red
    Write-Host '   KINTO se instala DENTRO de la carpeta actual. Usa una carpeta vacia:' -ForegroundColor Yellow
    Write-Host '     mkdir mi-proyecto; cd mi-proyecto; irm get.kinto.co | iex' -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "-> Clonando KINTO CMS en $cwd ..." -ForegroundColor Cyan
    git clone $repoUrl .
}

Write-Host '-> Lanzando el wizard de KINTO...' -ForegroundColor Cyan
Write-Host ''

# Modo no-interactivo (agentes): si $env:KINTO_YES esta definido, pasamos
# los flags desde env vars a `kinto start --yes`. Si no, wizard interactivo.
if ($env:KINTO_YES) {
    $kintoArgs = @('bin/kinto.js', 'start', '--yes')
    if ($env:KINTO_SITE)       { $kintoArgs += "--site=$($env:KINTO_SITE)" }
    if ($env:KINTO_TEMPLATE)   { $kintoArgs += "--template=$($env:KINTO_TEMPLATE)" }
    if ($env:KINTO_SKILLS)     { $kintoArgs += "--skills=$($env:KINTO_SKILLS)" }
    if ($env:KINTO_DEV)        { $kintoArgs += '--dev' }
    if ($env:KINTO_NO_INSTALL) { $kintoArgs += '--no-install' }
    node @kintoArgs
} else {
    node bin/kinto.js start
}
