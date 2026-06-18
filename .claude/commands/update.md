# /update

Actualiza el motor de KINTO CMS desde upstream.

## Uso

```
/update [--ref=<git-ref>] [--remote=<name>]
```

Flags:

- `--ref=<git-ref>` — ref desde el cual hacer checkout selectivo. Default: `origin/main`.
- `--remote=<name>` — remoto git. Default: `origin`.

## Qué hace

Ejecuta `kinto update`, que:

1. Verifica que el working tree esté limpio (aborta si hay cambios sin commitear).
2. Hace `git fetch <remote>` del remoto.
3. Crea un backup en `.kinto-backup/<timestamp>/` de las rutas gestionadas.
4. Actualiza **solo** `core/`, `skills/official/`, `templates/`, `.claude/`, `cli/` y `bin/`
   mediante `git checkout <ref> -- <ruta>`.
5. **Nunca toca** `sites/` ni `skills/community/` (trabajo del cliente).

Tras actualizar, revisa con `git diff --staged` y `kinto doctor`.
