# /verify

Suite de verificación de un sitio de KINTO CMS.

## Uso

```
/verify [--site=<sitio>]
```

## Qué hace

1. `kinto build --site=<sitio>` — debe pasar
2. `kinto skill validate` — registry y MARKETPLACE.md en sync
3. Verifica que `skills-active.json` coincide con lo importado
4. Verifica `config/site.config.ts`
5. Busca anti-patrones (ver AGENTS.md): hardcode de cliente, schema.org faltante,
   imports sin usar
6. Reporta pass/fail por cada check

## Output

```
✅ Build: PASS
✅ Registry: SYNC
⚠️  SEO: 2 avisos
❌ Anti-patrones: 1 problema
```
