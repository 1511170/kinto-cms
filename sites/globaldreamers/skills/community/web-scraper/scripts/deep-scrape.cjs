#!/usr/bin/env node
/**
 * Deep Web Scraper - Extrae TODO el contenido detalladamente
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) acc[key.replace('--', '')] = value;
  return acc;
}, {});

const config = {
  url: args.url || 'https://serviworldlogistics.com',
  output: args.output || './scraped-deep',
  maxPages: parseInt(args.maxPages) || 50
};

// Crear directorios
const dirs = {
  root: config.output,
  pages: path.join(config.output, 'pages'),
  images: path.join(config.output, 'images'),
  content: path.join(config.output, 'content')
};

Object.values(dirs).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const allContent = {
  site: { url: config.url, scrapedAt: new Date().toISOString() },
  home: {},
  about: {},
  services: {},
  servicePages: [],
  contact: {},
  images: [],
  testimonials: [],
  team: [],
  certifications: []
};

async function extractServiceDetails(page, url) {
  console.log(`🔍 Extrayendo detalles de servicio: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(3000);
    
    const data = await page.evaluate(() => {
      const result = {
        url: window.location.href,
        title: document.title,
        heroTitle: '',
        heroSubtitle: '',
        description: '',
        features: [],
        process: [],
        images: [],
        faqs: []
      };
      
      // Título del hero
      const h1 = document.querySelector('h1');
      if (h1) result.heroTitle = h1.innerText.trim();
      
      // Subtítulo (primer párrafo después del h1)
      const firstP = document.querySelector('h1 + p, .service-description, .entry-content p');
      if (firstP) result.heroSubtitle = firstP.innerText.trim();
      
      // Descripción larga
      const contentPs = document.querySelectorAll('.entry-content p, .service-content p, .wpb_text_column p');
      contentPs.forEach(p => {
        const text = p.innerText.trim();
        if (text.length > 100) {
          result.description += text + '\n\n';
        }
      });
      
      // Características (listas)
      document.querySelectorAll('ul li, .service-list li').forEach(li => {
        const text = li.innerText.trim();
        if (text && text.length > 10 && text.length < 200) {
          result.features.push(text);
        }
      });
      
      // Proceso paso a paso
      document.querySelectorAll('.process-step, .timeline-item, .step').forEach((step, idx) => {
        const title = step.querySelector('h3, h4, .step-title')?.innerText.trim();
        const desc = step.querySelector('p')?.innerText.trim();
        if (title) {
          result.process.push({
            step: idx + 1,
            title: title,
            description: desc || ''
          });
        }
      });
      
      // Imágenes
      document.querySelectorAll('img').forEach(img => {
        if (img.src && !img.src.includes('data:image')) {
          result.images.push({
            src: img.src,
            alt: img.alt || '',
            title: img.title || ''
          });
        }
      });
      
      return result;
    });
    
    return data;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function scrapeHome(page) {
  console.log('🏠 Scrapeando HOME...');
  
  await page.goto(config.url + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);
  
  const data = await page.evaluate(() => {
    const result = {
      hero: {
        title: '',
        subtitle: '',
        cta: ''
      },
      about: {
        headline: '',
        description: ''
      },
      features: [],
      services: [],
      testimonials: [],
      stats: []
    };
    
    // Hero
    const heroH1 = document.querySelector('h1, .hero-title');
    if (heroH1) result.hero.title = heroH1.innerText.trim();
    
    const heroSubtitle = document.querySelector('.hero-subtitle, h1 + p');
    if (heroSubtitle) result.hero.subtitle = heroSubtitle.innerText.trim();
    
    // About section
    const aboutH2 = Array.from(document.querySelectorAll('h2')).find(h => 
      h.innerText.includes('Quiénes') || h.innerText.includes('Nosotros')
    );
    if (aboutH2) {
      result.about.headline = aboutH2.innerText.trim();
      const aboutSection = aboutH2.closest('section');
      if (aboutSection) {
        const aboutPs = aboutSection.querySelectorAll('p');
        aboutPs.forEach(p => {
          if (p.innerText.length > 50) {
            result.about.description += p.innerText.trim() + '\n\n';
          }
        });
      }
    }
    
    // Features (4 items)
    document.querySelectorAll('.feature-box, .icon-box, .service-box').forEach((box, idx) => {
      if (idx < 4) {
        const title = box.querySelector('h3, h4, .title')?.innerText.trim();
        const desc = box.querySelector('p, .description')?.innerText.trim();
        if (title) {
          result.features.push({ title, description: desc || '' });
        }
      }
    });
    
    // Services preview
    document.querySelectorAll('.service-item, .service-card').forEach(item => {
      const title = item.querySelector('h3, h4')?.innerText.trim();
      const desc = item.querySelector('p')?.innerText.trim();
      if (title && title.length < 100) {
        result.services.push({ title, description: desc || '' });
      }
    });
    
    // Testimonials
    document.querySelectorAll('.testimonial, .quote').forEach(t => {
      const quote = t.querySelector('blockquote, p')?.innerText.trim();
      const author = t.querySelector('.author, h4, h5')?.innerText.trim();
      const role = t.querySelector('.role, span')?.innerText.trim();
      if (quote && quote.length > 50) {
        result.testimonials.push({ quote, author, role });
      }
    });
    
    return result;
  });
  
  allContent.home = data;
  console.log('   ✅ Home extraído');
}

async function scrapeAbout(page) {
  console.log('👥 Scrapeando NOSOTROS...');
  
  try {
    await page.goto(config.url + '/nosotros/', { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(3000);
    
    const data = await page.evaluate(() => {
      const result = {
        headline: '',
        mission: '',
        vision: '',
        history: '',
        team: [],
        values: []
      };
      
      const h1 = document.querySelector('h1');
      if (h1) result.headline = h1.innerText.trim();
      
      // Misión y Visión
      document.querySelectorAll('h2, h3').forEach(h => {
        const text = h.innerText.toLowerCase();
        const section = h.closest('section') || h.parentElement;
        
        if (text.includes('misión')) {
          result.mission = section?.querySelector('p')?.innerText.trim() || '';
        }
        if (text.includes('visión')) {
          result.vision = section?.querySelector('p')?.innerText.trim() || '';
        }
        if (text.includes('historia')) {
          result.history = section?.querySelector('p')?.innerText.trim() || '';
        }
      });
      
      // Equipo
      document.querySelectorAll('.team-member, .member').forEach(member => {
        const name = member.querySelector('h3, h4, .name')?.innerText.trim();
        const role = member.querySelector('.role, .position')?.innerText.trim();
        const img = member.querySelector('img')?.src;
        if (name) {
          result.team.push({ name, role, image: img });
        }
      });
      
      return result;
    });
    
    allContent.about = data;
    console.log('   ✅ Nosotros extraído');
    
  } catch (error) {
    console.log('   ⚠️  Error en Nosotros:', error.message);
  }
}

async function scrapeServices(page) {
  console.log('🔧 Scrapeando SERVICIOS...');
  
  const serviceUrls = [
    '/services/',
    '/servicios/',
    '/transporte-maritimo/',
    '/transporte-aereo/',
    '/transporte-terrestre/',
    '/agenciamiento-aduanero/',
    '/almacenamiento/'
  ];
  
  for (const servicePath of serviceUrls) {
    try {
      const url = config.url + servicePath;
      const data = await extractServiceDetails(page, url);
      
      if (data && (data.description || data.features.length > 0)) {
        allContent.servicePages.push(data);
        console.log(`   ✅ ${servicePath} - ${data.features.length} features`);
        
        // Guardar HTML
        const html = await page.content();
        const filename = servicePath.replace(/\//g, '_') + '.html';
        fs.writeFileSync(path.join(dirs.pages, filename), html);
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error en ${servicePath}: ${error.message}`);
    }
  }
}

async function downloadAllImages(page) {
  console.log('📸 Descargando imágenes...');
  
  const allImages = [];
  
  // Recolectar todas las imágenes de todas las páginas
  allContent.servicePages.forEach(page => {
    page.images?.forEach(img => {
      if (img.src && !img.src.includes('data:image')) {
        allImages.push(img.src);
      }
    });
  });
  
  // Descargar únicas
  const uniqueImages = [...new Set(allImages)].slice(0, 50);
  
  for (let i = 0; i < uniqueImages.length; i++) {
    try {
      const imgUrl = uniqueImages[i];
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const filename = `service_img_${i}${ext}`;
      
      const { execSync } = require('child_process');
      execSync(`curl -sL "${imgUrl}" -o "${path.join(dirs.images, filename)}" --max-time 30`, { timeout: 35000 });
      
      allContent.images.push({
        original: imgUrl,
        local: filename
      });
      
      console.log(`   📸 ${filename}`);
      
    } catch (e) {
      // Ignorar errores
    }
  }
}

async function main() {
  console.log('🔬 Deep Scrape Iniciado...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await scrapeHome(page);
    await scrapeAbout(page);
    await scrapeServices(page);
    await downloadAllImages(page);
    
    // Guardar todo el contenido
    fs.writeFileSync(
      path.join(dirs.content, 'all-content.json'),
      JSON.stringify(allContent, null, 2)
    );
    
    console.log('\n✅ Deep Scrape Completado!');
    console.log(`📁 Páginas de servicio: ${allContent.servicePages.length}`);
    console.log(`📸 Imágenes descargadas: ${allContent.images.length}`);
    console.log(`📄 Contenido guardado en: ${dirs.content}/all-content.json`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();
