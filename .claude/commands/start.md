# /start

Wizard de arranque out-of-the-box de KINTO CMS.

## Uso

```
/start
```

## Qué hace

Ejecuta `kinto start`, que:

1. Diagnostica el entorno (Node, npm, git)
2. Pregunta nombre y tipo de sitio (static / ecommerce)
3. Sugiere e instala las skills recomendadas
4. Crea el sitio, instala dependencias y hace un build de verificación
5. Deja todo listo para `kinto dev`

## Modo no-interactivo

```
kinto start --site=acme --template=static --skills=cms-sveltia,testimonials --yes
```
