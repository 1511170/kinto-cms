# /create-site

Crea un sitio nuevo de KINTO CMS desde un template.

## Uso

```
/create-site <nombre> [static|ecommerce]
```

## Qué hace

1. Ejecuta `kinto create-site <nombre> --template=<static|ecommerce>`
2. Ejecuta `npm install` dentro de `sites/<nombre>/`
3. Para `static`: sugiere `kinto skill add cms-sveltia`
4. Para `ecommerce`: recuerda copiar `.env.example` a `.env` (credenciales Shopify)
5. Ejecuta `kinto build --site=<nombre>` para verificar

## Ejemplo

```
/create-site acme-corp static
/create-site mi-tienda ecommerce
```
