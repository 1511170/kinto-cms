# /verify

Suite de verificación de un sitio de KINTO CMS. Invoca el comando real
`kinto verify --site=<sitio>` (composite implementado en `cli/commands/verify.js`).

## Uso

```
/verify --site=<sitio>
```

O directamente:

```
kinto verify --site=<sitio>
```

## Qué hace

1. **`skill validate`** — regenera y valida `skills/registry.json` y `MARKETPLACE.md`.
2. **`npm run build`** del sitio — build estático debe pasar.
3. **Checks de estructura**:
   - `skills-active.json` presente
   - `astro.config.mjs` presente
   - `package.json` presente
   - `.env.example` presente si alguna skill activa lo aporta

## Exit code

`0` si todo OK, `1` si algo falla. Pensado para usar como gate antes de
`kinto deploy` y en CI.
