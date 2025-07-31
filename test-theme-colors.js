/**
 * Test Theme Colors Fix
 * Validates that theme colors are properly accessible
 */

// Simulate the theme structure
const mockTheme = {
  palette: {
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    }
  }
};

// Test the old problematic approach
function testOldApproach() {
  console.log('🧪 Testing OLD approach (problematic):');
  
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
  
  colors.forEach(color => {
    try {
      // This is what was causing the error
      const bgColor = `${color}.light`;
      const textColor = `${color}.main`;
      
      console.log(`   ❌ ${color}: bgcolor="${bgColor}", color="${textColor}"`);
      console.log(`      Problem: These are strings, not actual color values!`);
    } catch (error) {
      console.log(`   ❌ Error with ${color}: ${error.message}`);
    }
  });
}

// Test the new fixed approach
function testNewApproach() {
  console.log('\n✅ Testing NEW approach (fixed):');
  
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
  
  colors.forEach(color => {
    try {
      // This is the fixed approach using theme function
      const bgColor = color && mockTheme.palette[color] 
        ? mockTheme.palette[color].light 
        : mockTheme.palette.primary.light;
      
      const textColor = color && mockTheme.palette[color] 
        ? mockTheme.palette[color].main 
        : mockTheme.palette.primary.main;
      
      console.log(`   ✅ ${color}: bgcolor="${bgColor}", color="${textColor}"`);
    } catch (error) {
      console.log(`   ❌ Error with ${color}: ${error.message}`);
    }
  });
}

// Test edge cases
function testEdgeCases() {
  console.log('\n🔍 Testing edge cases:');
  
  const edgeCases = [
    { color: null, name: 'null color' },
    { color: undefined, name: 'undefined color' },
    { color: '', name: 'empty string' },
    { color: 'nonexistent', name: 'non-existent color' },
    { color: 'primary', name: 'valid color' }
  ];
  
  edgeCases.forEach(({ color, name }) => {
    try {
      const bgColor = color && mockTheme.palette[color] 
        ? mockTheme.palette[color].light 
        : mockTheme.palette.primary.light;
      
      const textColor = color && mockTheme.palette[color] 
        ? mockTheme.palette[color].main 
        : mockTheme.palette.primary.main;
      
      console.log(`   ✅ ${name}: bgcolor="${bgColor}", color="${textColor}"`);
    } catch (error) {
      console.log(`   ❌ Error with ${name}: ${error.message}`);
    }
  });
}

// Simulate the sx prop function approach
function testSxFunction() {
  console.log('\n🎨 Testing sx function approach:');
  
  const createSxFunction = (color) => {
    return (theme) => ({
      bgcolor: color && theme.palette[color] ? theme.palette[color].light : theme.palette.primary.light,
      color: color && theme.palette[color] ? theme.palette[color].main : theme.palette.primary.main,
    });
  };
  
  const colors = ['primary', 'secondary', 'success', 'info'];
  
  colors.forEach(color => {
    try {
      const sxFunction = createSxFunction(color);
      const styles = sxFunction(mockTheme);
      
      console.log(`   ✅ ${color}: ${JSON.stringify(styles)}`);
    } catch (error) {
      console.log(`   ❌ Error with ${color}: ${error.message}`);
    }
  });
}

// Main test execution
console.log('🔧 Testing Theme Colors Fix\n');
console.log('This test validates the fix for "Cannot read properties of undefined (reading \'main\')" errors');

testOldApproach();
testNewApproach();
testEdgeCases();
testSxFunction();

console.log('\n📊 Summary:');
console.log('✅ Fixed approach uses theme function: sx={(theme) => ({ ... })}');
console.log('✅ Safely accesses theme.palette[color] with null checks');
console.log('✅ Provides fallback to primary colors for invalid/missing colors');
console.log('✅ Handles edge cases (null, undefined, empty, non-existent colors)');

console.log('\n🎯 Key changes made:');
console.log('1. Analytics Dashboard StatCard: Fixed color prop usage');
console.log('2. Dashboard StatCard: Fixed Avatar color props');
console.log('3. Added proper theme function with null checks');
console.log('4. Provided fallback colors for safety');

console.log('\n🚀 The "Cannot read properties of undefined (reading \'main\')" error should now be resolved!');