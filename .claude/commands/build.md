# /build

Build and preview the current KINTO CMS site

## Usage
```
/build
```

## What it does
1. Verifies current directory is inside a site
2. Runs `npm run build`
3. If build passes, runs `npm run preview` for 5 seconds
4. Reports build status and any errors

## Requirements
- Must be inside a site directory (`sites/<name>/`)
