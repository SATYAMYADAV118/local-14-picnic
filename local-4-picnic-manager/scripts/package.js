const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const zipPath = path.join(distDir, 'local-4-picnic-manager.zip');

if (!existsSync(distDir)) {
  mkdirSync(distDir);
}

const command = [
  'zip',
  '-r',
  zipPath,
  '.',
  '-x',
  'node_modules/*',
  'dist/*',
  'assets/src/*',
  'scripts/*',
  'postcss.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'package.json',
  'package-lock.json',
  'composer.lock'
];

try {
  execSync(command.join(' '), { cwd: root, stdio: 'inherit' });
  console.log(`Created ${zipPath}`);
} catch (error) {
  console.error('Failed to package plugin:', error.message);
  process.exit(1);
}
