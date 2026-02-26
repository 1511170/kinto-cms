export const config = {
  name: 'image-optimizer',
  version: '1.0.0',
  description: 'Optimización de imágenes: convierte JPG/PNG a WebP con Sharp',
  category: 'performance',
  author: 'KINTO CMS',
  createdFor: 'kinto-cms',
  reusable: true,
  dependencies: ['sharp'],
  configFields: [
    {
      name: 'quality',
      type: 'number',
      label: 'Calidad WebP',
      description: 'Calidad de compresión WebP (1-100, default: 82)',
      required: false
    }
  ]
};

export function install(context: any) {
  const scriptBase = '../../skills/community/image-optimizer/scripts/optimize.cjs';

  // Modificar package.json para agregar scripts
  const fs = require('fs');
  const path = require('path');

  const pkgPath = path.join(context.sitePath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  pkg.scripts = pkg.scripts || {};
  pkg.scripts['images:optimize'] = `node ${scriptBase}`;
  pkg.scripts['images:optimize:dry'] = `node ${scriptBase} --dry-run`;
  pkg.scripts['images:optimize:full'] = `node ${scriptBase} --update-refs --clean`;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  console.log('✅ Skill image-optimizer instalada');
  console.log('   Scripts agregados a package.json:');
  console.log('   npm run images:optimize         → Convierte imágenes a WebP');
  console.log('   npm run images:optimize:dry     → Preview sin ejecutar');
  console.log('   npm run images:optimize:full    → Convierte + actualiza refs + limpia originales');
}
