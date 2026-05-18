# /create-skill

Crea el scaffold de una site-skill nueva.

## Uso

```
/create-skill <skill-name>
```

## Qué hace

1. Ejecuta `kinto skill create <skill-name>`
2. Genera `skills/community/<skill-name>/` con:
   - `SKILL.md` con frontmatter de registry listo
   - `index.ts` que exporta el componente
   - `components/<Pascal>.astro`
3. Regenera `skills/registry.json` y `MARKETPLACE.md`
4. Indica los siguientes pasos (implementar, validar, abrir PR — ver CONTRIBUTING.md)

## Ejemplo

```
/create-skill pricing-calculator
```
