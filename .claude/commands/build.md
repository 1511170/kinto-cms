# /build

Build de un sitio de KINTO CMS.

## Uso

```
/build [--site=<sitio>]
```

## Qué hace

1. Ejecuta `kinto build --site=<sitio>` (autodetecta el sitio si estás dentro de él)
2. Reporta el estado del build y cualquier error
3. Si pasa, sugiere `kinto dev --site=<sitio>` para previsualizar

## Requisitos

- El sitio debe existir en `sites/<sitio>/`
