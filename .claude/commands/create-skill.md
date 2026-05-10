# /create-skill

Create a new reusable KINTO CMS skill

## Usage
```
/create-skill <skill-name>
```

## What it does
1. Creates directory `skills/community/<skill-name>/`
2. Generates:
   - `SKILL.md` with template documentation
   - `index.ts` with install function scaffold
   - `components/` directory
   - `config/` directory
3. Shows the structure and prompts for implementation

## Example
```
/create-skill pricing-calculator
```
