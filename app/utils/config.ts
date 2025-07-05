// Configuration for the e-commerce application

export const config = {
  // API URLs
  POS_API_URL: import.meta.env.VITE_POS_API_URL || 'http://localhost:5173',
  
  // Paystack Configuration
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_2a5fe03e4f2b193e9a6056d4683391e2aae03d21',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'ShopHub',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  
  // Payment Configuration (Ghana)
  CURRENCY: 'GHS', // Ghanaian Cedi
  COUNTRY: 'GH', // Ghana
  TEST_MOBILE_MONEY: '0551234987', // Paystack Test Mobile Money Number
  
  // API Endpoints
  endpoints: {
    paystack: '/api/paystack',
    cart: '/api/cart',
    wishlist: '/api/wishlist',
    products: '/api/products',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.POS_API_URL}${endpoint}`;
};

// Helper function to check if we're in development
export const isDevelopment = (): boolean => {
  return config.APP_ENV === 'development';
};

// Helper function to log only in development
export const devLog = (message: string, ...args: any[]): void => {
  if (isDevelopment()) {
    console.log(`[${config.APP_NAME}] ${message}`, ...args);
  }
}; 