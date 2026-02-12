#!/usr/bin/env node
/**
 * Browser Automation Test Runner
 * 
 * Uso:
 *   node test-runner.js --url=https://tusitio.com --action=screenshot
 *   node test-runner.js --url=http://localhost:3000 --action=full-test
 *   node test-runner.js --config=../../../config/site.config.ts
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Parsear argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) acc[key.replace('--', '')] = value;
  return acc;
}, {});

// Configuración por defecto
const config = {
  baseUrl: args.url || 'http://localhost:3000',
  action: args.action || 'full-test',
  outputDir: path.join(__dirname, '../../../test-results'),
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ],
  pagesToTest: ['/', '/servicios', '/nosotros', '/contacto', '/blog'],
  waitTime: 2000 // ms para esperar carga completa
};

// Crear directorio de salida
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}
if (!fs.existsSync(path.join(config.outputDir, 'screenshots'))) {
  fs.mkdirSync(path.join(config.outputDir, 'screenshots'), { recursive: true });
}

// Resultados
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: config.baseUrl,
  tests: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, pagePath, viewportName) {
  const filename = `${pagePath.replace(/\//g, '_') || 'home'}_${viewportName}.png`;
  const filepath = path.join(config.outputDir, 'screenshots', filename);
  
  await page.screenshot({ 
    path: filepath,
    fullPage: true 
  });
  
  return filepath;
}

async function testNavigation(page, url) {
  const errors = [];
  
  // Test: Links del menú principal
  const menuLinks = await page.$$eval('header nav a', links => 
    links.map(l => ({ text: l.textContent.trim(), href: l.href, exists: true }))
  );
  
  // Test: Botón CTA
  const ctaButtons = await page.$$eval('a[href*="contacto"], button', buttons =>
    buttons.map(b => ({ 
      text: b.textContent.trim(), 
      tag: b.tagName,
      visible: b.offsetParent !== null 
    }))
  );
  
  // Test: Imágenes cargadas
  const images = await page.$$eval('img', imgs =>
    imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      complete: img.complete,
      naturalWidth: img.naturalWidth
    }))
  );
  
  // Test: Verificar CSS aplicado (colores de fondo, fuentes)
  const bodyStyles = await page.evaluate(() => {
    const body = document.body;
    const styles = window.getComputedStyle(body);
    return {
      fontFamily: styles.fontFamily,
      backgroundColor: styles.backgroundColor,
      color: styles.color
    };
  });
  
  // Test: Menú móvil (si existe)
  const mobileMenu = await page.$('#mobile-menu-btn');
  let mobileMenuWorks = false;
  if (mobileMenu) {
    await mobileMenu.click();
    await sleep(500);
    const mobileNav = await page.$('#mobile-menu');
    if (mobileNav) {
      const isVisible = await mobileNav.evaluate(el => 
        el.classList.contains('hidden') === false || el.style.display !== 'none'
      );
      mobileMenuWorks = isVisible;
    }
  }
  
  // Test: Scroll suave
  const hasSmoothScroll = await page.evaluate(() => {
    return document.documentElement.style.scrollBehavior === 'smooth' ||
           getComputedStyle(document.documentElement).scrollBehavior === 'smooth';
  });
  
  return {
    url,
    menuLinks,
    ctaButtons,
    images: images.filter(img => img.src && !img.src.includes('data:image')),
    brokenImages: images.filter(img => !img.complete || img.naturalWidth === 0),
    bodyStyles,
    mobileMenuWorks,
    hasSmoothScroll,
    errors
  };
}

async function testForms(page) {
  const forms = await page.$$eval('form', forms => 
    forms.map(f => ({
      action: f.action,
      method: f.method,
      inputs: Array.from(f.querySelectorAll('input, textarea, select')).map(i => ({
        type: i.type || i.tagName.toLowerCase(),
        name: i.name,
        required: i.required,
        placeholder: i.placeholder
      }))
    }))
  );
  
  return forms;
}

async function runTests() {
  console.log('🚀 Iniciando Browser Automation...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    for (const pagePath of config.pagesToTest) {
      const url = `${config.baseUrl}${pagePath}`;
      console.log(`📄 Testing: ${url}`);
      
      const pageResults = {
        page: pagePath || 'home',
        url,
        viewports: []
      };
      
      for (const viewport of config.viewports) {
        console.log(`  📱 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        const page = await browser.newPage();
        await page.setViewport({ width: viewport.width, height: viewport.height });
        
        // Navegar a la página
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(config.waitTime);
          
          // Capturar screenshot
          const screenshotPath = await captureScreenshot(page, pagePath, viewport.name);
          console.log(`     📸 Screenshot: ${path.basename(screenshotPath)}`);
          
          // Tests de navegación (solo en desktop para optimizar)
          let navTest = null;
          if (viewport.name === 'desktop') {
            navTest = await testNavigation(page, url);
            console.log(`     ✅ Links: ${navTest.menuLinks.length}`);
            console.log(`     ✅ Botones: ${navTest.ctaButtons.length}`);
            console.log(`     ✅ Imágenes: ${navTest.images.length}`);
            if (navTest.brokenImages.length > 0) {
              console.log(`     ⚠️  Imágenes rotas: ${navTest.brokenImages.length}`);
            }
          }
          
          // Test forms (solo en contacto)
          let formTest = null;
          if (pagePath === '/contacto' && viewport.name === 'desktop') {
            formTest = await testForms(page);
            console.log(`     📝 Forms: ${formTest.length}`);
          }
          
          pageResults.viewports.push({
            name: viewport.name,
            screenshot: screenshotPath,
            navigation: navTest,
            forms: formTest
          });
          
        } catch (error) {
          console.error(`     ❌ Error: ${error.message}`);
          pageResults.viewports.push({
            name: viewport.name,
            error: error.message
          });
        }
        
        await page.close();
      }
      
      results.tests.push(pageResults);
      console.log('');
    }
    
    // Guardar resultados
    const resultsPath = path.join(config.outputDir, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    // Generar reporte HTML
    await generateHTMLReport(results);
    
    console.log('\n✅ Tests completados!');
    console.log(`📊 Reporte: ${path.join(config.outputDir, 'report.html')}`);
    console.log(`📁 Screenshots: ${path.join(config.outputDir, 'screenshots')}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

async function generateHTMLReport(results) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Browser Automation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; }
    .meta { color: #94a3b8; margin-bottom: 2rem; }
    .page { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .page h2 { color: #60a5fa; margin-bottom: 1rem; }
    .viewport { background: #334155; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .viewport h3 { color: #a78bfa; margin-bottom: 0.5rem; }
    .screenshot { max-width: 100%; border-radius: 4px; margin: 0.5rem 0; border: 1px solid #475569; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .stat { background: #1e293b; padding: 1rem; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #4ade80; }
    .stat-label { font-size: 0.875rem; color: #94a3b8; }
    .error { background: #7f1d1d; color: #fecaca; padding: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>🧪 Browser Automation Report</h1>
  <div class="meta">
    <p><strong>URL:</strong> ${results.baseUrl}</p>
    <p><strong>Fecha:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
  </div>
  
  ${results.tests.map(test => `
    <div class="page">
      <h2>📄 ${test.page === 'home' ? 'Home' : test.page}</h2>
      ${test.viewports.map(vp => `
        <div class="viewport">
          <h3>📱 ${vp.name}</h3>
          ${vp.error ? `<div class="error">❌ ${vp.error}</div>` : ''}
          ${vp.screenshot ? `<img class="screenshot" src="./screenshots/${path.basename(vp.screenshot)}" alt="Screenshot ${vp.name}">` : ''}
          ${vp.navigation ? `
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${vp.navigation.menuLinks.length}</div>
                <div class="stat-label">Links</div>
              </div>
              <div class="stat">
                <div class="stat-value">${vp.navigation.ctaButtons.length}</div>
                <div class="stat-label">Botones</div>
              </div>
              <div class="stat">
                <div class="stat-value">${vp.navigation.images.length}</div>
                <div class="stat-label">Imágenes</div>
              </div>
              ${vp.forms ? `
                <div class="stat">
                  <div class="stat-value">${vp.forms.length}</div>
                  <div class="stat-label">Formularios</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>`;
  
  fs.writeFileSync(path.join(config.outputDir, 'report.html'), html);
}

// Ejecutar
runTests();
