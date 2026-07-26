#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'www');

const files = [
  'index.html',
  'admin.html',
  'manifest.json',
  'service-worker.js'
];

const directories = [
  'assets',
  'css',
  'js',
  'pages'
];

async function copyIfExists(source, destination) {
  try {
    await fs.cp(source, destination, {
      recursive: true,
      force: true,
      dereference: true
    });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`Arquivo obrigatório não encontrado: ${path.relative(root, source)}`);
    }
    throw error;
  }
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  for (const file of files) {
    await copyIfExists(path.join(root, file), path.join(outDir, file));
  }

  for (const directory of directories) {
    await copyIfExists(path.join(root, directory), path.join(outDir, directory));
  }

  await fs.access(path.join(outDir, 'index.html'));
  console.log('✅ Arquivos web preparados em www/ para o Capacitor.');
}

main().catch(error => {
  console.error('❌ Falha ao preparar arquivos web para o Capacitor.');
  console.error(error.message || error);
  process.exit(1);
});
