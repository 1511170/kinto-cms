---
name: design-bridge
category: community
version: 0.1.0
description: Puente opt-in para importar diseños desde open-design.ai (con stubs para Stitch y Claude Design) a tokens CSS y componentes Astro
tags: [design, tokens, import, open-design]
requires: []
needs: [open-design-api-key]
recommendedFor: [static, ecommerce]
---

# Skill: design-bridge

Skill **opt-in** que conecta KINTO CMS con herramientas de diseño generativo. La
implementación principal es para **open-design.ai**; hay stubs documentados para
**Google Stitch** y **Claude Design** que la comunidad puede completar vía PR.

> Esta skill **no se activa por defecto**. Si no la instalas, el flujo de diseño
> manual sigue funcionando: traes los tokens y componentes a mano desde cualquier
> herramienta.

## Qué hace

1. **Adaptador genérico** (`adapters/*`) con un contrato común:
   ```ts
   interface DesignAdapter {
     id: string;
     importDesign(source: string, opts?: ImportOptions): Promise<DesignBundle>;
   }
   interface DesignBundle {
     tokens: Record<string, string>; // colores, tipografías, spacing…
     components: ComponentSpec[]; // estructura de componentes detectada
     assets: AssetRef[]; // imágenes/iconos
   }
   ```
2. **Importer CLI** (`scripts/import.mjs`): toma un identificador de proyecto de la
   herramienta elegida y escribe:
   - `src/styles/design-tokens.css` (variables CSS)
   - `src/components/_imported/<Name>.astro` (esqueletos de componentes)
   - `public/assets/design/` (assets exportados)
3. **Helper Astro** (`components/DesignTokens.astro`) que inyecta los tokens en
   el `<head>` del layout.

## Uso

```bash
# Instalar la skill en un sitio
kinto skill add design-bridge --site=mi-sitio

# Configurar credenciales (en sites/mi-sitio/.env)
OPEN_DESIGN_API_KEY=...

# Importar un diseño
node skills/community/design-bridge/scripts/import.mjs \
  --adapter=open-design \
  --source=<projectId> \
  --site=mi-sitio
```

Después, en tu layout:

```astro
---
import { DesignTokens } from 'design-bridge';
---
<head>
  <DesignTokens />
</head>
```

## Adaptadores

| Adaptador                | Estado          | Archivo                      |
| ------------------------ | --------------- | ---------------------------- |
| `open-design`            | ✅ Implementado | `adapters/open-design.mjs`   |
| `stitch` (Google Stitch) | 🚧 Stub         | `adapters/stitch.mjs`        |
| `claude-design`          | 🚧 Stub         | `adapters/claude-design.mjs` |

## Cómo añadir un adaptador nuevo

1. Crea `adapters/<id>.mjs` exportando un objeto que cumpla la interfaz
   `DesignAdapter`.
2. Registra el adaptador en `adapters/index.mjs`.
3. Abre un PR siguiendo `CONTRIBUTING.md` — el CI valida el contrato.

Encaja con el marketplace de la Fase 4: nuevos adaptadores = nuevos PRs validados.
