# /marketplace

Muestra el marketplace de site-skills.

## Uso

```
/marketplace [--tag=<tag>] [--for=static|ecommerce]
```

## Qué hace

Ejecuta `kinto marketplace`, que lista todas las site-skills instalables
agrupadas por categoría (oficiales / comunidad), con versión, descripción, tags
y requisitos externos.

Filtros opcionales: `--tag=<tag>` y `--for=<tipo de sitio>`.

Instala una skill con: `kinto skill add <nombre> --site=<sitio>`
