# /simplify

Review and improve code quality in the current site

## Usage
```
/simplify [path]
```

## What it does
1. Reviews recently modified files in the site
2. Looks for:
   - Duplicated code that could be a skill
   - Overly complex components
   - Missing TypeScript types
   - Opportunities to use existing skills
3. Suggests simplifications
4. Applies safe refactorings with your approval

## Example
```
/simplify
/simplify src/components/
```
