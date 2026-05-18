# /deploy

Despliega un sitio de KINTO CMS a Cloudflare.

## Uso

```
/deploy [--site=<sitio>]
```

## Qué hace

Ejecuta `kinto deploy --site=<sitio>`, que:

1. Hace `kinto build` previo
2. Si hay `wrangler.jsonc` (modo ecommerce) → despliega el Worker
3. Si no → sube `dist/` a Cloudflare Pages

## Requisitos

- `wrangler` instalado y autenticado
