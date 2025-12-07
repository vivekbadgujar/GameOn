const fs = require('fs');
const path = require('path');

console.log('🔍 Admin Panel Build Verification\n');

const checks = {
  files: [
    'next.config.js',
    'middleware.js',
    'tsconfig.json',
    'package.json',
    '.npmrc',
    'app/layout.js',
    'app/page.js',
    'src/App.js',
  ],
  env: [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_FRONTEND_URL',
    'NEXT_PUBLIC_ADMIN_URL',
  ],
};

let allPassed = true;

console.log('📁 Checking required files...');
checks.files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) allPassed = false;
});

console.log('\n🌍 Checking environment variables (from .env.production)...');
const envFile = path.join(__dirname, '.env.production');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  checks.env.forEach((envVar) => {
    const exists = envContent.includes(envVar);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${envVar}`);
    if (!exists) allPassed = false;
  });
} else {
  console.log('  ❌ .env.production not found');
  allPassed = false;
}

console.log('\n📦 Checking package.json configuration...');
const pkgFile = path.join(__dirname, 'package.json');
if (fs.existsSync(pkgFile)) {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  
  const hasNextBuild = pkg.scripts && pkg.scripts.build === 'next build';
  console.log(`  ${hasNextBuild ? '✅' : '❌'} Build script: next build`);
  
  const hasNext = pkg.dependencies && pkg.dependencies.next;
  console.log(`  ${hasNext ? '✅' : '❌'} Next.js dependency exists`);
  
  const hasReact = pkg.dependencies && pkg.dependencies.react;
  console.log(`  ${hasReact ? '✅' : '❌'} React dependency exists`);
  
  if (!hasNextBuild || !hasNext || !hasReact) allPassed = false;
} else {
  console.log('  ❌ package.json not found');
  allPassed = false;
}

console.log('\n✨ Build Configuration Check Complete!\n');

if (allPassed) {
  console.log('✅ All checks passed! Ready for Vercel deployment.\n');
  console.log('📝 Next steps:');
  console.log('  1. npm install --legacy-peer-deps');
  console.log('  2. npm run build');
  console.log('  3. npm run start');
  console.log('  4. Push to git and deploy to Vercel\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.\n');
  process.exit(1);
}
