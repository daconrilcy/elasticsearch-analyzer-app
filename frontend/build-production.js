#!/usr/bin/env node

/**
 * Script de build de production pour Mapping Studio V2.2
 * Optimise le bundle et génère les métadonnées de production
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Building Mapping Studio V2.2 for production...\n');

try {
  // 1. Nettoyage du dossier dist
  console.log('📁 Cleaning dist folder...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // 2. Vérification des variables d'environnement
  console.log('🔍 Checking environment variables...');
  const envFile = '.env.production.local';
  if (!existsSync(envFile)) {
    console.log('⚠️  Warning: .env.production.local not found');
    console.log('   Using default production values');
  }

  // 3. Build TypeScript et Vite
  console.log('🔨 Building with TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. Génération des métadonnées de build
  console.log('📊 Generating build metadata...');
  const buildInfo = {
    version: '2.2.0',
    buildDate: new Date().toISOString(),
    environment: 'production',
    features: [
      'Anti-drift schema (ETag + cache + offline)',
      'Robustness (fallback offline, masking)',
      'UI Performance (virtualization, debounce, rate limiting)',
      'Modern UX (drag & drop, templates, shortcuts)',
      'Accessibility (ARIA, keyboard, responsive)'
    ],
    components: [
      'SchemaBanner',
      'DocsPreviewVirtualized', 
      'PipelineDnD',
      'TemplatesMenu',
      'DiffView',
      'ToastsContainer',
      'ShortcutsHelp'
    ],
    hooks: [
      'useSchema',
      'useDebounce',
      'useAbortable',
      'useShortcuts',
      'useToasts'
    ]
  };

  writeFileSync(
    'dist/build-info.json',
    JSON.stringify(buildInfo, null, 2)
  );

  // 5. Génération du manifeste de production
  console.log('📋 Generating production manifest...');
  const manifest = {
    name: 'Mapping Studio V2.2',
    version: '2.2.0',
    description: 'Modern Elasticsearch mapping management interface',
    author: 'Mapping Studio Team',
    license: 'MIT',
    homepage: '/',
    build: {
      timestamp: new Date().toISOString(),
      environment: 'production',
      features: buildInfo.features
    }
  };

  writeFileSync(
    'dist/manifest.json',
    JSON.stringify(manifest, null, 2)
  );

  // 6. Vérification de la taille du bundle
  console.log('📏 Analyzing bundle size...');
  try {
    const distStats = execSync('du -sh dist', { encoding: 'utf8' });
    console.log(`   Bundle size: ${distStats.trim()}`);
  } catch (e) {
    console.log('   Bundle size analysis skipped (Windows)');
  }

  // 7. Vérification des fichiers critiques
  console.log('🔍 Verifying critical files...');
  const criticalFiles = [
    'index.html',
    'assets/index-*.js',
    'assets/index-*.css',
    'build-info.json',
    'manifest.json'
  ];

  criticalFiles.forEach(file => {
    if (existsSync(`dist/${file}`) || existsSync(`dist/${file.replace('*', '')}`)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
    }
  });

  console.log('\n🎉 Production build completed successfully!');
  console.log('\n📁 Output directory: dist/');
  console.log('🚀 Ready for deployment');
  console.log('\n📋 Next steps:');
  console.log('   1. Update VITE_API_BASE in your environment');
  console.log('   2. Configure your web server (nginx, Apache, etc.)');
  console.log('   3. Set up SSL certificates');
  console.log('   4. Configure CDN if needed');
  console.log('   5. Deploy to your hosting platform');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
