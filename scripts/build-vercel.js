const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and create public
if (fs.existsSync(publicDir)) fs.rmSync(publicDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

// Copy OmegaOS_Website
console.log('Copying OmegaOS_Website...');
copyDir(path.join(root, 'OmegaOS_Website'), path.join(publicDir, 'OmegaOS_Website'));

// Copy AVAX Arcade
console.log('Copying AVAX Arcade...');
copyDir(path.join(root, 'AVAX Arcade'), path.join(publicDir, 'AVAX Arcade'));

// Build dapp.fun
console.log('Building dapp.fun...');
execSync('npm ci', { cwd: path.join(root, 'dapp.fun'), stdio: 'inherit' });
execSync('npm run build', { cwd: path.join(root, 'dapp.fun'), stdio: 'inherit' });

// Copy dapp.fun dist to public/dapp.fun
console.log('Copying dapp.fun dist...');
const dappDist = path.join(root, 'dapp.fun', 'dist');
copyDir(dappDist, path.join(publicDir, 'dapp.fun'));

console.log('Build complete. Output in public/');
