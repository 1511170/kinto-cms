#!/usr/bin/env node

/**
 * KINTO CMS - Image Optimizer
 * Convierte JPG/PNG a WebP usando Sharp (rápido, mantenido, ya incluido en Astro)
 */

const fs = require('fs');
const path = require('path');

// --- Parse CLI args ---
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const DRY_RUN = hasFlag('dry-run');
const UPDATE_REFS = hasFlag('update-refs');
const CLEAN = hasFlag('clean');

// --- Load config ---
const configPath = path.join(__dirname, '..', 'config', 'defaults.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const QUALITY = parseInt(getArg('quality') || config.quality, 10);
const EXTENSIONS = config.extensions;
const SCAN_DIR = config.scanDir;
const REF_DIRS = config.refDirs;
const REF_EXTENSIONS = config.refExtensions;

// --- Find site root (walk up until we find package.json with "astro" dep) ---
let siteRoot = process.cwd();
while (!fs.existsSync(path.join(siteRoot, 'package.json'))) {
  const parent = path.dirname(siteRoot);
  if (parent === siteRoot) {
    console.error('❌ No se encontró package.json. Ejecuta desde el directorio del sitio.');
    process.exit(1);
  }
  siteRoot = parent;
}

const publicDir = path.join(siteRoot, SCAN_DIR);

// --- Scan for images ---
function findImages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// --- Find files with image references ---
function findRefFiles(dirs) {
  const results = [];
  for (const dir of dirs) {
    const absDir = path.join(siteRoot, dir);
    if (!fs.existsSync(absDir)) continue;
    scanRefDir(absDir, results);
  }
  return results;
}

function scanRefDir(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      scanRefDir(fullPath, results);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (REF_EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
}

// --- Format bytes ---
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// --- Main ---
async function main() {
  // Resolve sharp from site's node_modules using require
  const Module = require('module');
  const requireFromSite = Module.createRequire(path.join(siteRoot, 'package.json'));
  const sharp = requireFromSite('sharp');

  console.log('');
  console.log('🖼️  Image Optimizer - KINTO CMS (Sharp)');
  console.log('─'.repeat(45));
  console.log(`   Calidad WebP: ${QUALITY}`);
  console.log(`   Directorio: ${SCAN_DIR}/`);
  if (DRY_RUN) console.log('   ⚡ Modo dry-run (no se ejecutarán cambios)');
  if (UPDATE_REFS) console.log('   📝 Actualizar referencias en archivos');
  if (CLEAN) console.log('   🧹 Eliminar originales después de convertir');
  console.log('─'.repeat(45));
  console.log('');

  // Find images
  const images = findImages(publicDir);

  if (images.length === 0) {
    console.log('No se encontraron imágenes JPG/PNG en ' + SCAN_DIR + '/');
    return;
  }

  console.log(`📂 Encontradas ${images.length} imágenes para optimizar:\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;
  const conversions = [];

  for (const imgPath of images) {
    const relPath = '/' + path.relative(publicDir, imgPath);
    const webpPath = imgPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const relWebp = '/' + path.relative(publicDir, webpPath);
    const originalSize = fs.statSync(imgPath).size;
    totalOriginal += originalSize;

    if (DRY_RUN) {
      console.log(`   📋 ${relPath} (${formatBytes(originalSize)}) → ${path.basename(webpPath)}`);
      conversions.push({ original: imgPath, webp: webpPath, relPath, relWebp });
      continue;
    }

    try {
      await sharp(imgPath)
        .webp({ quality: QUALITY })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;
      totalOptimized += webpSize;
      const savings = ((1 - webpSize / originalSize) * 100).toFixed(0);
      console.log(`   ✅ ${relPath} → ${path.basename(webpPath)} (${formatBytes(originalSize)} → ${formatBytes(webpSize)}, -${savings}%)`);
      conversions.push({ original: imgPath, webp: webpPath, relPath, relWebp });
    } catch (err) {
      console.log(`   ❌ ${relPath} — error: ${err.message}`);
      totalOptimized += originalSize;
    }
  }

  console.log('');
  console.log('─'.repeat(45));

  if (DRY_RUN) {
    console.log(`📊 ${images.length} imágenes serían convertidas | Total: ${formatBytes(totalOriginal)}`);
    console.log('   (ejecuta sin --dry-run para convertir)');
  } else {
    const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(0);
    console.log(`📊 ${conversions.length} imágenes | ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} | Ahorro: ${totalSavings}%`);
  }

  // Update references
  if (UPDATE_REFS && !DRY_RUN && conversions.length > 0) {
    console.log('');
    console.log('📝 Actualizando referencias...');
    const refFiles = findRefFiles(REF_DIRS);
    let updatedFiles = 0;

    for (const refFile of refFiles) {
      let content = fs.readFileSync(refFile, 'utf8');
      let modified = false;

      for (const conv of conversions) {
        if (content.includes(conv.relPath)) {
          content = content.replaceAll(conv.relPath, conv.relWebp);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(refFile, content);
        const relRef = path.relative(siteRoot, refFile);
        console.log(`   ✅ ${relRef}`);
        updatedFiles++;
      }
    }

    console.log(`   ${updatedFiles} archivo(s) actualizado(s)`);
  }

  // Clean originals
  if (CLEAN && UPDATE_REFS && !DRY_RUN && conversions.length > 0) {
    console.log('');
    console.log('🧹 Eliminando originales...');
    let cleaned = 0;
    for (const conv of conversions) {
      if (fs.existsSync(conv.original) && fs.existsSync(conv.webp)) {
        fs.unlinkSync(conv.original);
        cleaned++;
      }
    }
    console.log(`   ${cleaned} archivo(s) eliminado(s)`);
  }

  console.log('');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
