// Device detection utilities
export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile user agents
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check for touch capability and screen size
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
};

export const isMobileApp = () => {
  // Check if running in a mobile app context
  // This could be enhanced with specific app detection logic
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches ||
         document.referrer.includes('android-app://') ||
         window.location.search.includes('mobile=true');
};

export const isWebBrowser = () => {
  return !isMobileApp();
};

// Get device type
export const getDeviceType = () => {
  if (isMobileApp()) return 'mobile-app';
  if (isMobileDevice()) return 'mobile-web';
  return 'desktop';
};