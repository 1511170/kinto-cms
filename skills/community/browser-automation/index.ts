/**
 * Skill: browser-automation
 * Automatización de navegador con Puppeteer
 */

import type { Skill } from '../../../core/types/skill';

const skill: Skill = {
  name: 'browser-automation',
  version: '1.0.0',
  description: 'Testing visual y funcional con Puppeteer + Chromium',
  
  install: async (sitePath: string) => {
    console.log('🎭 Instalando Browser Automation...');
    
    // Agregar scripts al package.json
    const fs = await import('fs');
    const path = await import('path');
    
    const pkgPath = path.join(sitePath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['test:visual'] = 'node skills/community/browser-automation/test-runner.js --action=screenshot';
    pkg.scripts['test:e2e'] = 'node skills/community/browser-automation/test-runner.js --action=full-test';
    pkg.scripts['test:ci'] = 'node skills/community/browser-automation/test-runner.js --url=http://localhost:3000';
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    
    console.log('✅ Scripts agregados a package.json');
    console.log('📦 Instala Puppeteer: npm install puppeteer --legacy-peer-deps');
    console.log('');
    console.log('🚀 Uso:');
    console.log('  npm run test:visual    # Screenshots de todas las páginas');
    console.log('  npm run test:e2e       # Testing completo');
    console.log('  npm run test:ci        # Para CI/CD');
    
    return true;
  },
  
  uninstall: async (sitePath: string) => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Remover scripts
    const pkgPath = path.join(sitePath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    delete pkg.scripts?.['test:visual'];
    delete pkg.scripts?.['test:e2e'];
    delete pkg.scripts?.['test:ci'];
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    
    console.log('✅ Browser Automation desinstalado');
    return true;
  }
};

export default skill;
