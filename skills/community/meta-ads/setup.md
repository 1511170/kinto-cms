# `meta-ads` — Setup multi-cliente

Guía paso a paso para dejar el Meta Ads CLI listo y autenticado **para un cliente específico** de KINTO BI. Sigue este flujo desde cero la **primera vez por cliente**; luego solo se repiten las fases 5-8 si rota un token.

> **Modo express**: si el usuario es experto y no necesita guía visual, set `KINTO_SETUP_MODE=express` y la skill saltará las pausas para screenshots. Por defecto el modo es `guided` (pide screenshot en cada paso de UI).

---

## Pre-requisito: elegir cliente

```bash
export KINTO_CLIENT=<slug>
# si el cliente no existe todavía:
#   /new-client <slug>     (slash command)
#   o manualmente: cp -r clients/_template clients/<slug>
```

Editar `clients/<slug>/client.json` con: `name`, `currency`, `timezone`, `sst_source` (puede quedar `null` por ahora).

---

## Fase 1 — Pre-flight (terminal local)

```bash
python3 --version    # >= 3.12
which uv             # ideal; si no, usar pip3
pip3 --version       # fallback
```

Si Python < 3.12: `brew install python@3.12` (mac), instalador de python.org (Windows), `apt install python3.12` (linux).

Si no hay `uv`: `curl -LsSf https://astral.sh/uv/install.sh | sh`. Aísla mejor el CLI que pip global.

> **⚠️ Windows nativo NO funciona.** El paquete `meta-ads` (v1.0.1) **no publica wheel para `win_amd64`** — solo Linux y macOS arm64. En Windows, instala WSL Ubuntu y corre todo desde adentro:
>
> ```powershell
> # PowerShell (Admin)
> wsl --install -d Ubuntu-24.04
> ```
>
> Después, dentro de WSL:
>
> ```bash
> curl -LsSf https://astral.sh/uv/install.sh | sh
> export PATH="$HOME/.local/bin:$PATH"
> uv tool install meta-ads
> meta --version
> ```
>
> El proyecto local sigue accesible desde `/mnt/c/Users/<tu-usuario>/DEVS/dashboard-kinto/`. Para invocar el CLI desde scripts ejecutados por Claude Code en Windows: usar `wsl.exe -d Ubuntu-24.04 -- bash <ruta-a-script>` con el script **escrito como archivo** (NO inline `bash -c`, porque PowerShell expande `$PATH` con paths Windows que rompen el shell de WSL).

---

## Fase 2 — Instalar el CLI

```bash
uv tool install meta-ads
# o:
pip3 install meta-ads

meta --version    # → "meta, version 1.x.x"
meta --help       # debe listar `ads` y `auth`
```

Si `meta: command not found` tras instalar con uv: `uv tool update-shell` o agregar `export PATH="$HOME/.local/bin:$PATH"` a `.zshrc`/`.bashrc`.

---

## Fase 3 — Meta Business Suite (UI)

> Modo `guided`: pedir screenshot al final de cada sub-paso.

### 3.1 Business Portfolio

[business.facebook.com](https://business.facebook.com) → Configuración → Información del negocio. Si no hay portfolio, crear uno.

### 3.2 System User

Configuración → Usuarios → Usuarios del sistema → **+ Agregar**.

- Nombre: `kinto-<slug>` (sin espacios; Meta rechaza nombres con espacios con error genérico).
- Rol: **Admin**.

Anotar el ID del system user.

### 3.3 Ad Account

Cuentas → Cuentas publicitarias.

- Si vacío: **+ Agregar → Crear nueva**. Nombre, timezone, moneda (USD recomendado para clientes internacionales).
- Una vez creada **no se puede sacar del portfolio**.
- No requiere método de pago para listar/crear PAUSED.

### 3.4 Asignar Ad Account al system user

Click en la cuenta → **Asignar acceso** → buscar `kinto-<slug>` → **Control total**.

### 3.5 Asignar Page al system user

Cuentas → Páginas → seleccionar la Page → **Asignar acceso** → `kinto-<slug>` → **Control total**.

Sin Page no se pueden crear creatives.

### 3.6 (Opcional) Pixel/Dataset y Catalog

Si el cliente usará conversion tracking o catalog ads, asignar también:

- Orígenes de datos → Dataset/Pixel → asignar al system user.
- Cuentas → Catálogos → asignar al system user.

---

## Fase 4 — Meta for Developers (App)

### 4.1 Crear App

[developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App**.

- Nombre: `kinto-<slug>-ads-cli` (interno).
- Caso de uso: **Other**.
- Tipo: **Business**.
- Portfolio: el del paso 3.1.

### 4.2 Caso de uso "Marketing API"

En el modal de "Agregar casos de uso", marcar SOLO **Crear y administrar anuncios con la API de marketing**.

### 4.3 Asignar la App al System User

> Esto NO se hace desde "Roles de la app" en developers.facebook.com — es un foot-gun común.

Volver a **Business Suite → Configuración → Cuentas → Apps** → buscar la app → **Asignar acceso** → `kinto-<slug>` → **Administrar app**.

---

## Fase 5 — Generar el token

Configuración → Usuarios del sistema → `kinto-<slug>` → **Generar token**.

- App: la del paso 4.
- Caducidad: **Nunca**.
- Scopes (todos):
  - ✅ `business_management`
  - ✅ `ads_management`
  - ✅ `ads_read`
  - ✅ `pages_show_list`
  - ✅ `pages_read_engagement`
  - ✅ `pages_manage_ads`
  - ✅ `catalog_management` (si usará catálogos)

> ⚠️ El token se muestra **una sola vez**. Copiar inmediatamente.

---

## Fase 6 — Guardar credenciales del cliente

> 🛡️ **No pegar el token al chat.** Usar `Write` para escribirlo directo al archivo. Si el usuario lo pegó accidentalmente, escribir el archivo y mencionarlo sin repetir el valor.

Crear `clients/<slug>/.env-meta-ads` con:

```
ACCESS_TOKEN=<token>
AD_ACCOUNT_ID=act_<id-numérico>
```

Notas:

- `AD_ACCOUNT_ID` siempre con prefijo `act_`. Si no lo recuerdas, lo obtienes con `meta ads adaccount list` (después de cargar el token).
- `chmod 600 clients/<slug>/.env-meta-ads` (Linux/mac). En Windows: `icacls "clients\<slug>\.env-meta-ads" /inheritance:r /grant:r "$env:USERNAME:F"`.

El archivo está gitignored (`clients/*/.env-meta-ads` en `.gitignore`).

---

## Fase 7 — Activar el cliente en la sesión

```bash
export KINTO_CLIENT=<slug>
set -a && source clients/<slug>/.env-meta-ads && set +a
```

Helper equivalente: `bash skills/integrations/meta-ads/scripts/client-switch.sh <slug>` (imprime los `export` que se deben evaluar).

> No hacer auto-load global de credenciales en `~/.zshrc` — KINTO BI es multi-cliente, el activo se elige por sesión.

---

## Fase 8 — Validación final (obligatoria)

```bash
meta auth status
# → "Authenticated (token: EAA...)"

meta ads adaccount list
# → tabla con la ad account del cliente

meta ads page list
# → tabla con la(s) Page(s)

meta ads campaign list
# → "No results." si la cuenta es nueva (esperado)
```

**Solo declara setup OK si los cuatro responden bien.** Si `meta auth status` da OK pero `meta ads adaccount list` falla con `(#200)` o `(#100)`, faltan scopes — regenerar token (volver a Fase 5).

Resumen al usuario:

- ✅ CLI: `meta` v1.x
- ✅ Cliente activo: `<slug>`
- ✅ Credenciales: `clients/<slug>/.env-meta-ads` (chmod 600)
- ✅ Ad Account: `act_xxxxx`
- ✅ Page: nombre + ID

Sugerir paso siguiente:

- "Para reportes: `/meta-report <slug> last_7d` o ver `recipes/daily-report.md`."
- "Para validar atribución vs tu SST: `/attribution-check <slug>` o ver `recipes/attribution-validation.md`."

---

## Troubleshooting

Ver [`references/troubleshooting.md`](references/troubleshooting.md) — incluye los errores específicos de cada fase y la sección "discrepancias Meta vs realidad" que santmun no cubre.
