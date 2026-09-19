/**
 * Safe Razorpay Checkout SDK Loader & Modal Trigger
 * Loads official Razorpay script from https://checkout.razorpay.com/v1/checkout.js
 */

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptLoadPromise: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-checkout-sdk');
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout SDK from CDN.');
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return scriptLoadPromise;
};

export const openRazorpayModal = async (
  options: RazorpayCheckoutOptions
): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    throw new Error(
      'Could not load payment gateway SDK. Please check your internet connection or try again.'
    );
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
};
