# /doctor

Diagnostica el entorno de KINTO CMS.

## Uso

```
/doctor
```

## Qué hace

Ejecuta `kinto doctor`, que verifica:

- Node >= 18, npm, git
- Python (opcional — solo para la agent-skill graphify)
- `skills/registry.json` presente
- agent-skills vendorizadas (`boris`, `graphify`)

Reporta cada check con ✅ o ⚠️ y una pista de cómo resolverlo.
