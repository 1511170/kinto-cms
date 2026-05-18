# /add-skill

Instala una site-skill en un sitio.

## Uso

```
/add-skill <skill-name> [--site=<sitio>]
```

## Qué hace

1. Ejecuta `kinto skill add <skill-name> --site=<sitio>`
   (el sitio se autodetecta si estás dentro de `sites/<nombre>/`)
2. Resuelve dependencias declaradas (`requires:`) e instala las que falten
3. Actualiza `skills-active.json`
4. Avisa de requisitos externos (`needs:`)
5. Verifica con `kinto build --site=<sitio>`

## Ejemplo

```
/add-skill testimonials
/add-skill shopify-ecommerce --site=mi-tienda
```
