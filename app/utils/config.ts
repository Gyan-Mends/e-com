// Configuration for the e-commerce application

export const config = {
  // API URLs - hardcoded to localhost
  POS_API_URL: import.meta.env.VITE_POS_API_URL,

  
  // Paystack Configuration
  PAYSTACK_PUBLIC_KEY: 'pk_test_2a5fe03e4f2b193e9a6056d4683391e2aae03d21',
  
  // App Configuration
  APP_NAME: 'ShopHub',
  APP_ENV: 'development',
  
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