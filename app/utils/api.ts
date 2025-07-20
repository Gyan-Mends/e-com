import axios from 'axios';

// Create axios instance pointing to POS system
const api = axios.create({
  baseURL: typeof window !== 'undefined' 
    ? 'https://pos-online-rho.vercel.app/' // POS system URL when running in browser
    : 'https://pos-online-rho.vercel.app/', // POS system URL when running on server
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiRequest = {
  get: async <T>(url: string, params?: any): Promise<T> => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  
  post: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const config: any = {};
      
      // If data is FormData, let axios handle the Content-Type
      if (!(data instanceof FormData)) {
        config.headers = {
          'Content-Type': 'application/json'
        };
      }
      
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Products API - consume POS system endpoints
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    apiRequest.get('/api/products', params),
  
  getById: (id: string) => 
    apiRequest.get(`/api/products/${id}`),
  
  getBestSellers: (limit: number = 8) => 
    apiRequest.get('/api/products', { limit, page: 1 }),
};

// Categories API - consume POS system endpoints
export const categoriesAPI = {
  getAll: () => apiRequest.get('/api/categories'),
};

// Sales API - for analytics and best sellers
export const salesAPI = {
  getAll: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    apiRequest.get('/api/sales', params),
};

// Orders API - consume POS system endpoints
export const ordersAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    source?: string; 
    search?: string; 
    dateFrom?: string; 
    dateTo?: string; 
    customerId?: string;
  }) =>
    apiRequest.get('/api/orders', params),
  
  getById: (id: string) => 
    apiRequest.get(`/api/orders/${id}`),
  
  getByCustomer: (customerId: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiRequest.get('/api/orders', { ...params, customerId }),
  
  getByTrackingNumber: (trackingNumber: string) =>
    apiRequest.get('/api/orders', { search: trackingNumber }),
  
  updateStatus: (orderId: string, status: string, notes?: string) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('orderId', orderId);
    formData.append('status', status);
    if (notes) formData.append('notes', notes);
    return apiRequest.post('/api/orders', formData);
  },
  
  createOrder: (orderData: any) => {
    const formData = new FormData();
    formData.append('_method', 'POST');
    formData.append('orderData', JSON.stringify(orderData));
    return apiRequest.post('/api/orders', formData);
  },
  
  getReturnRequests: (params?: { page?: number; limit?: number; status?: string; customerId?: string }) =>
    apiRequest.get('/api/orders/returns', params),
  
  createReturnRequest: (returnData: any) => {
    const formData = new FormData();
    formData.append('_method', 'POST');
    formData.append('returnData', JSON.stringify(returnData));
    return apiRequest.post('/api/orders/returns', formData);
  },
};

// Cart API - consume POS system endpoints
export const cartAPI = {
  getCart: (userId?: string, sessionId?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);
    return apiRequest.get(`/api/cart?${params.toString()}`);
  },
  
  addToCart: (userId: string | undefined, sessionId: string | undefined, productId: string, quantity: number, variations?: any[]) =>
    apiRequest.post('/api/cart', {
      action: 'add',
      userId,
      sessionId,
      productId,
      quantity,
      variations
    }),
  
  updateCartItem: (userId: string | undefined, sessionId: string | undefined, productId: string, quantity: number, variations?: any[]) =>
    apiRequest.post('/api/cart', {
      action: 'update',
      userId,
      sessionId,
      productId,
      quantity,
      variations
    }),
  
  removeFromCart: (userId: string | undefined, sessionId: string | undefined, productId: string, variations?: any[]) =>
    apiRequest.post('/api/cart', {
      action: 'remove',
      userId,
      sessionId,
      productId,
      variations
    }),
  
  clearCart: (userId: string | undefined, sessionId: string | undefined) =>
    apiRequest.post('/api/cart', {
      action: 'clear',
      userId,
      sessionId
    })
};

// Tax Configuration API - consume POS system store settings
export const taxAPI = {
  getTaxConfiguration: () => apiRequest.get('/api/store'),
};

// Customer Authentication API - consume POS system endpoints
export const authAPI = {
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await api.post('/api/customers/auth/login', {
      email,
      password,
      rememberMe
    });
    return response;
  },

  signup: async (customerData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: any;
    dateOfBirth?: string;
  }) => {
    const response = await api.post('/api/customers/auth/signup', customerData);
    return response;
  },

  logout: () => {
    localStorage.removeItem('user');
    return Promise.resolve({ success: true });
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!authAPI.getCurrentUser();
  }
};

// Wishlist API - consume POS system endpoints
export const wishlistAPI = {
  getWishlist: (userId?: string, sessionId?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);
    return apiRequest.get(`/api/wishlist?${params.toString()}`);
  },
  
  addToWishlist: (userId: string | undefined, sessionId: string | undefined, productId: string) => {
    const formData = new FormData();
    formData.append('_method', 'POST');
    if (userId) formData.append('userId', userId);
    if (sessionId) formData.append('sessionId', sessionId);
    formData.append('productId', productId);
    
    return apiRequest.post('/api/wishlist', formData);
  },
  
  removeFromWishlist: (userId: string | undefined, sessionId: string | undefined, productId: string) => {
    const formData = new FormData();
    formData.append('_method', 'DELETE');
    if (userId) formData.append('userId', userId);
    if (sessionId) formData.append('sessionId', sessionId);
    formData.append('productId', productId);
    
    return apiRequest.post('/api/wishlist', formData);
  },
  
  toggleWishlistItem: (userId: string | undefined, sessionId: string | undefined, productId: string) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (userId) formData.append('userId', userId);
    if (sessionId) formData.append('sessionId', sessionId);
    formData.append('productId', productId);
    
    return apiRequest.post('/api/wishlist', formData);
  }
};

// Type definitions based on POS models
export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string | Category;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitOfMeasure: string;
  variations?: Array<{
    id: string;
    name: string;
    value: string;
    additionalCost: number;
  }>;
  images?: string[];
  isActive: boolean;
  taxable: boolean;
  taxRate: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'seller' | 'manager' | 'cashier' | 'inventory';
  avatar?: string;
  loyaltyPoints?: number;
  totalPurchases?: number;
  totalSpent?: number;
  isActive: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

// Helper function to get category name
export const getCategoryName = (categoryId: string | Category, categories?: Category[]): string => {
  if (typeof categoryId === 'string') {
    if (categories) {
      const category = categories.find(cat => cat._id === categoryId);
      return category?.name || categoryId;
    }
    return categoryId;
  }
  return categoryId?.name || 'Unknown Category';
};

// Add Cart interfaces
export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  variations?: Array<{
    name: string;
    value: string;
    additionalCost: number;
  }>;
}

export interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

// Add Wishlist interfaces
export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: string;
}

export interface Wishlist {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: WishlistItem[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// Order related interfaces
export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variations?: Array<{
    name: string;
    value: string;
    additionalCost: number;
  }>;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface PaymentInfo {
  method: 'card' | 'mobile_money' | 'bank_transfer' | 'cash' | 'other';
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway?: string;
  transactionId?: string;
}

export interface StatusHistory {
  status: string;
  timestamp: string;
  notes?: string;
  updatedBy: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId?: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  statusHistory: StatusHistory[];
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express' | 'overnight' | 'pickup';
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  paymentInfo: PaymentInfo;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'ecommerce' | 'pos' | 'phone' | 'email';
  notes?: string;
  internalNotes?: string;
  assignedTo?: string;
  packedBy?: string;
  shippedBy?: string;
  orderDate: string;
  confirmedAt?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequest {
  _id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    reason: string;
    condition: 'new' | 'used' | 'damaged' | 'defective';
  }>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  refundAmount: number;
  refundMethod: 'original_payment' | 'store_credit' | 'cash';
  notes?: string;
  internalNotes?: string;
  requestDate: string;
  processedAt?: string;
  completedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to generate session ID for guest users
export const generateSessionId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get or create session ID
export const getSessionId = (): string => {
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('cart_session_id', sessionId);
    }
    console.log('🔑 Using sessionId:', sessionId);
    return sessionId;
  }
  // This should not happen with client-side only usage
  return generateSessionId();
}; 