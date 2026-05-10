# /verify

Run full verification suite on the current KINTO CMS site

## Usage
```
/verify
```

## What it does
1. Runs `npm run build` — must pass
2. Checks `skills-active.json` matches installed skills
3. Verifies `config/site.config.ts` is valid
4. Checks for common anti-patterns:
   - Hardcoded values that should be in config
   - Missing schema.org on visible content
   - Unused imports
5. Reports pass/fail for each check

## Output
```
✅ Build: PASS
✅ Config: VALID
⚠️  SEO: 2 warnings
❌ Anti-patterns: 1 issue found
```
