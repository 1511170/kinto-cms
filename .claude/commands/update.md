# /update

Actualiza el motor de KINTO CMS desde upstream.

## Uso

```
/update
```

## Qué hace

Ejecuta `kinto update`, que:

1. Verifica que el working tree esté limpio
2. Hace `git fetch` del remoto
3. Crea un backup en `.kinto-backup/<timestamp>/`
4. Actualiza **solo** `core/`, `skills/official/`, `templates/`, `.claude/` y `cli/`
5. **Nunca toca** `sites/` ni `skills/community/`

Tras actualizar, revisa con `git diff --staged` y `kinto doctor`.
