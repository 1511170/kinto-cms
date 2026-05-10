# /create-site

Create a new KINTO CMS client site with base setup

## Usage
```
/create-site <site-name>
```

## What it does
1. Runs `./kinto create-site <site-name>`
2. cd into `sites/<site-name>/`
3. Installs base skill: `node scripts/skill-add.js cms-sveltia`
4. Runs `npm install`
5. Scaffolds a basic `src/pages/index.astro` with Layout
6. Runs `npm run build` to verify

## Example
```
/create-site acme-corp
```
