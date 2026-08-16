// Google Analytics 4 (GA4) Tracker Module for VU SIGMA

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics GA4 script dynamically if not already present
 */
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
  }

  // Prevent duplicate script injection if already added via index.html
  if (document.getElementById('ga-gtag-script') || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

/**
 * Track page view in GA4 (React Router SPA transitions)
 */
export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path
    });
  }
};

/**
 * Track custom event in GA4
 */
export const trackEvent = (action, category, label = '', value = 0) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};
