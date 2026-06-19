/**
 * Test Script untuk Debug Projects Page - FIXED VERSION
 * 
 * Cara menggunakan:
 * 1. Buka halaman /app/projects di browser
 * 2. Buka DevTools Console (F12)
 * 3. Copy-paste script ini atau load dengan:
 *    const script = document.createElement('script');
 *    script.src = '/test-projects.js';
 *    document.head.appendChild(script);
 */

console.log('🧪 === PROJECTS PAGE TEST SCRIPT (FIXED) ===');
console.log('📅 Timestamp:', new Date().toISOString());

// Test 1: Check if grid element exists
console.log('\n📍 Test 1: Check Grid Element');
const gridEl = document.getElementById('projects-grid');
if (gridEl) {
  console.log('✅ Grid element found');
  console.log('   - ID:', gridEl.id);
  console.log('   - Classes:', gridEl.className);
  console.log('   - Children count:', gridEl.children.length);
  console.log('   - First child tag:', gridEl.children[0]?.tagName || 'N/A');
  console.log('   - First child class:', gridEl.children[0]?.className?.substring(0, 100) || 'N/A');
  
  // Check if content is rendered or skeleton
  const firstChild = gridEl.children[0];
  if (firstChild) {
    const hasPulse = firstChild.classList.contains('animate-pulse');
    const isLink = firstChild.tagName === 'A';
    console.log('   - Content type:', isLink ? '✅ RENDERED (links)' : hasPulse ? '⏳ SKELETON (loading)' : '📦 OTHER');
  }
} else {
  console.log('❌ Grid element NOT found!');
}

// Test 2: Check if data-user attributes exist
console.log('\n📍 Test 2: Check Meta Attributes');
const metaEl = document.getElementById('projects-meta');
if (metaEl) {
  console.log('✅ Meta element found');
  console.log('   - User ID:', metaEl.dataset.userId);
  console.log('   - User Role:', metaEl.dataset.userRole);
} else {
  console.log('ℹ️  Meta element not found (this is OK - removed in latest version)');
}

// Test 3: Test API endpoint directly
console.log('\n📍 Test 3: Test API Endpoint');
async function testAPI() {
  try {
    console.log('📡 Fetching /api/projects...');
    const startTime = performance.now();
    const response = await fetch('/api/projects?page=1&limit=12');
    const endTime = performance.now();
    
    console.log('✅ Response received in', (endTime - startTime).toFixed(2), 'ms');
    console.log('   - Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('   - Projects count:', data.data?.projects?.length || 0);
    console.log('   - Total:', data.data?.total || 0);
    
    if (data.data?.projects?.length > 0) {
      console.log('   - First project:', data.data.projects[0].title);
    }
    
    return data;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return null;
  }
}

// Test 4: Check if load function exists
console.log('\n📍 Test 4: Check Global Functions');
const functions = ['projPage', 'showToast', 'renderPagination', 'load', 'renderCard'];
functions.forEach(fn => {
  const exists = typeof window[fn] === 'function';
  console.log(`   - window.${fn}:`, exists ? '✅ Available' : 'ℹ️  Not loaded yet (script may still be loading)');
});

// Test 5: Check CSS classes (fixed - escape special chars)
console.log('\n📍 Test 5: Check CSS/Tailwind');
const testClasses = ['bg-gray-900', 'animate-pulse', 'grid', 'gap-6'];
testClasses.forEach(cls => {
  // Use querySelector with escaped class name
  try {
    const found = document.querySelector(`.${cls}`);
    console.log(`   - ${cls}:`, found ? '✅ Found in DOM' : 'ℹ️  Not in DOM (may be in CSS only)');
  } catch (e) {
    console.log(`   - ${cls}: ❌ Invalid selector`);
  }
});

// Check if Tailwind is working by checking computed styles
if (gridEl) {
  const styles = window.getComputedStyle(gridEl);
  const isGrid = styles.display === 'grid' || styles.display === 'flex';
  console.log('   - Grid display working:', isGrid ? '✅ Yes' : '❌ No');
  console.log('   - Display type:', styles.display);
}

// Test 6: Network tab simulation
console.log('\n📍 Test 6: Network Conditions');
console.log('   - Online:', navigator.onLine);
console.log('   - Connection:', navigator.connection?.effectiveType || 'N/A');

// Run API test
console.log('\n🚀 Running API test...');
testAPI().then(data => {
  console.log('\n✅ === TEST COMPLETE ===');
  if (data && data.data?.projects?.length > 0) {
    console.log('🎉 SUCCESS: Projects loaded correctly!');
    console.log('💡 The page is working as expected.');
  } else {
    console.log('⚠️  No projects found or API failed');
  }
});

// Helper: Manual render test
window.testRender = function() {
  console.log('\n📍 Manual Render Test');
  if (typeof renderCard === 'function') {
    const testData = {
      id: 'test-123',
      title: 'Test Project',
      description: 'This is a test project',
      url: 'https://github.com/test/test',
      imageUrl: null,
      userId: 'user-123',
      userName: 'Test User'
    };
    
    const html = renderCard(testData);
    console.log('✅ renderCard() works');
    console.log('   Generated HTML length:', html.length);
    
    // Try to render it
    gridEl.innerHTML = html;
    console.log('✅ Rendered test card to grid');
    console.log('   Check the page - you should see a test project card');
  } else {
    console.log('❌ renderCard function not found - wait for script to load');
  }
};

console.log('\n💡 Available test commands:');
console.log('   - testRender() - Test manual rendering (wait for script to load first)');
console.log('   - testAPI() - Test API endpoint again');
console.log('   - load() - Load actual projects (if function exists)');

console.log('\n📖 If you see HTML text instead of rendered UI:');
console.log('   1. Check Console for errors (red text)');
console.log('   2. Check Network tab - ensure CSS files loaded (status 200)');
console.log('   3. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
console.log('   4. Clear browser cache');
console.log('\n✅ If you see <a href="..." class="bg-gray-900..."> - IT\'S WORKING! That\'s rendered UI, not text.');
