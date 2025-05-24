// Performance Test Script for Journify
// Run this in the browser console to measure page load performance

(function() {
  console.log('Starting Journify Performance Test');
  
  // Entry page load time measurement
  function measureEntryPageLoad() {
    // Clear cache before testing (optional)
    // localStorage.removeItem('journify-entry-cache');
    
    console.log('Measuring entry page load time...');
    const startTime = performance.now();
    
    // Hook into route changes - adjust this selector based on your router implementation
    const observeUrlChange = () => {
      const targetNode = document.body;
      const config = { childList: true, subtree: true };
      
      const callback = (mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && document.querySelector('.prose')) {
            // Entry content has loaded
            const endTime = performance.now();
            const loadTime = (endTime - startTime) / 1000;
            console.log(`Entry page load completed in ${loadTime.toFixed(2)} seconds`);
            observer.disconnect();
            break;
          }
        }
      };
      
      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);
    };
    
    // Navigate to an entry page
    const entriesLinks = Array.from(document.querySelectorAll('a')).filter(a => 
      a.href.includes('/entry/') && !a.href.includes('/new') && !a.href.includes('/edit')
    );
    
    if (entriesLinks.length > 0) {
      observeUrlChange();
      console.log('Navigating to entry page...');
      entriesLinks[0].click();
    } else {
      console.error('No entry links found to test');
    }
  }
  
  // Execute the test when on dashboard
  if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
    setTimeout(() => {
      measureEntryPageLoad();
    }, 1000); // Wait for dashboard to fully load
  } else {
    console.log('Navigate to dashboard first to run this test');
  }
})();
