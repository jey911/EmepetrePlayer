/**
 * Script para generar íconos PNG para la PWA.
 * Ejecutar con: node scripts/generate-icons.mjs
 * 
 * Genera íconos placeholder usando un canvas en Node.js (con sharp si disponible)
 * o SVG como fallback que los navegadores pueden utilizar.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.resolve(__dirname, '../apps/web/public/icons');

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function crearSVG(size) {
  const cornerRadius = Math.round(size * 0.1875);
  const noteRadius = Math.round(size * 0.0977);
  const barWidth = Math.round(size * 0.03125);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#6366f1"/>
  <g transform="translate(${size / 2},${size / 2})">
    <circle cx="0" cy="${Math.round(size * 0.117)}" r="${noteRadius}" fill="white" opacity="0.95"/>
    <circle cx="${-Math.round(size * 0.156)}" cy="${Math.round(size * 0.156)}" r="${noteRadius}" fill="white" opacity="0.95"/>
    <rect x="${-Math.round(size * 0.254)}" y="${-Math.round(size * 0.234)}" width="${barWidth}" height="${Math.round(size * 0.39)}" rx="${Math.round(barWidth / 2)}" fill="white" opacity="0.95"/>
    <rect x="${-Math.round(size * 0.098)}" y="${-Math.round(size * 0.273)}" width="${barWidth}" height="${Math.round(size * 0.39)}" rx="${Math.round(barWidth / 2)}" fill="white" opacity="0.95"/>
    <rect x="${-Math.round(size * 0.254)}" y="${-Math.round(size * 0.254)}" width="${Math.round(size * 0.1875)}" height="${Math.round(size * 0.039)}" rx="${Math.round(size * 0.02)}" fill="white" opacity="0.95"/>
  </g>
</svg>`;
}

// Intentar usar sharp para generar PNGs reales
async function generarConSharp() {
  try {
    const sharp = (await import('sharp')).default;
    const svgBase = crearSVG(512);
    
    for (const size of SIZES) {
      const buffer = await sharp(Buffer.from(svgBase))
        .resize(size, size)
        .png()
        .toBuffer();
      
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Generado: icon-${size}.png`);
    }
    return true;
  } catch {
    return false;
  }
}

// Fallback: generar SVGs que se pueden renombrar a PNG placeholder
function generarSVGFallback() {
  for (const size of SIZES) {
    const svg = crearSVG(size);
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.svg`);
    fs.writeFileSync(outputPath, svg, 'utf-8');
    console.log(`✅ Generado (SVG): icon-${size}.svg`);
  }
  
  // También generar favicon
  const faviconSvg = crearSVG(32);
  fs.writeFileSync(path.join(OUTPUT_DIR, '..', 'favicon.svg'), faviconSvg, 'utf-8');
  console.log('✅ Generado: favicon.svg');
}

async function main() {
  console.log('🎨 Generando íconos de EmepetrePlayer...\n');
  
  const pngGenerado = await generarConSharp();
  
  if (!pngGenerado) {
    console.log('⚠️ sharp no disponible, generando íconos SVG como alternativa...\n');
    generarSVGFallback();
  }
  
  console.log('\n✨ ¡Íconos generados exitosamente!');
}

main().catch(console.error);
