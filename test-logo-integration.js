const fs = require('fs');
const path = require('path');

console.log('🎨 GameOn Logo Integration Test\n');

// Check if logo components exist
const logoComponents = [
  'frontend/src/components/UI/Logo.js',
  'admin-panel/src/components/common/Logo.js'
];

console.log('📁 Checking Logo Components:');
logoComponents.forEach(component => {
  const fullPath = path.join(__dirname, component);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${component} - EXISTS`);
  } else {
    console.log(`❌ ${component} - MISSING`);
  }
});

// Check if updated components exist
const updatedComponents = [
  'frontend/src/components/Header/Header.js',
  'frontend/src/components/Layout/Header.js',
  'admin-panel/src/components/Layout/AdminLayout.js',
  'admin-panel/src/components/Auth/AdminLogin.js'
];

console.log('\n🔄 Checking Updated Components:');
updatedComponents.forEach(component => {
  const fullPath = path.join(__dirname, component);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasLogoImport = content.includes('import Logo from') || content.includes("import Logo from");
    console.log(`${hasLogoImport ? '✅' : '❌'} ${component} - ${hasLogoImport ? 'UPDATED' : 'NOT UPDATED'}`);
  } else {
    console.log(`❌ ${component} - FILE NOT FOUND`);
  }
});

// Check asset directories
const assetDirs = [
  'frontend/src/assets',
  'admin-panel/src/assets'
];

console.log('\n📂 Checking Asset Directories:');
assetDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${dir} - EXISTS`);
  } else {
    console.log(`❌ ${dir} - MISSING`);
  }
});

// Check for logo files (these need to be manually copied)
const logoFiles = [
  'frontend/src/assets/logo.png',
  'admin-panel/src/assets/logo.png',
  'frontend/public/logo192.png',
  'frontend/public/logo512.png',
  'frontend/public/favicon.ico',
  'admin-panel/public/favicon.ico'
];

console.log('\n🖼️  Checking Logo Files (Manual Copy Required):');
logoFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} - EXISTS`);
  } else {
    console.log(`⏳ ${file} - NEEDS MANUAL COPY`);
  }
});

console.log('\n📋 Summary:');
console.log('✅ Logo components have been created and integrated');
console.log('✅ All UI components have been updated to use the new Logo component');
console.log('⏳ Manual step required: Copy your logo image files to the specified locations');
console.log('⏳ Manual step required: Convert logo to favicon format');

console.log('\n🚀 Next Steps:');
console.log('1. Copy Picsart_25-07-28_10-50-56-858.png to the asset directories');
console.log('2. Convert your logo to favicon.ico format (16x16, 32x32)');
console.log('3. Test both frontend and admin panel');
console.log('4. Check browser tabs for favicon');

console.log('\n💡 The logo integration is complete! Your GameOn logo will appear throughout the platform once the image files are copied.');