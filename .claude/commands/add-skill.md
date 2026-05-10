# /add-skill

Install a KINTO CMS skill into the current site

## Usage
```
/add-skill <skill-name>
```

## What it does
1. Verifies current directory is inside a site (`sites/*/`)  
2. Checks skill exists: `node scripts/skill-list.js`
3. Installs: `node scripts/skill-add.js <skill-name>`
4. Updates `skills-active.json`
5. Adds import example to the conversation
6. Runs `npm run build` to verify

## Example
```
/add-skill testimonials
/add-skill seo-ai-citations
```
