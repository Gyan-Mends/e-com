import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';

interface AuditLogData {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'warning' | 'error' | 'info';
  source?: 'web' | 'mobile' | 'api';
  metadata?: any;
}

export const useAuditLogger = () => {
  const location = useLocation();

  // Get user data from localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get current user for audit logging:', error);
      return null;
    }
  }, []);

  // Get client information
  const getClientInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || null,
      sessionId: sessionStorage.getItem('sessionId') || 
                 `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }, []);

  // Main logging function
  const logAuditEvent = useCallback(async (data: AuditLogData) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        console.warn('No user found for audit logging - skipping');
        return;
      }

      console.log('🔍 E-Commerce: Attempting to log audit event:', data.action, data.resource);

      const clientInfo = getClientInfo();
      
      // Ensure session ID is stored
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', clientInfo.sessionId);
      }

      // Get user name from various possible fields
      const getUserName = (user: any) => {
        if (user.firstName && user.lastName) {
          return `${user.firstName} ${user.lastName}`;
        } else if (user.name) {
          return user.name;
        } else if (user.firstName) {
          return user.firstName;
        } else if (user.lastName) {
          return user.lastName;
        } else {
          return 'Unknown User';
        }
      };

      const userName = getUserName(user);

      const auditData = {
        userId: user._id || user.id,
        userName: userName,
        userEmail: user.email || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: {
          ...data.details,
          ...clientInfo,
          platform: 'e-commerce',
          userName: userName,
          userEmail: user.email || null
        },
        severity: data.severity || 'low',
        status: data.status || 'success',
        source: data.source || 'web',
        sessionId: clientInfo.sessionId,
        metadata: {
          ...data.metadata,
          browser: navigator.userAgent,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: 'e-commerce',
          userName: userName,
          userEmail: user.email || null
        }
      };

      console.log('📤 E-Commerce: Sending audit data:', auditData);

      // Send to POS audit API (shared audit system)
      const POS_API_URL = import.meta.env.VITE_POS_API_URL || 'http://localhost:5177';
      const response = await fetch(`${POS_API_URL}/api/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-user-id': user._id || user.id,
          'x-user-role': user.role || 'customer',
          'x-user-name': userName
        },
        body: JSON.stringify(auditData)
      });

      if (!response.ok) {
        throw new Error(`Audit API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success === false) {
        console.error('❌ E-Commerce: Audit API returned error:', result.message);
        throw new Error(result.message);
      }
      
      console.log('✅ E-Commerce: Audit log created successfully:', result);
    } catch (error) {
      console.error('❌ E-Commerce: Failed to log audit event:', error);
      console.error('❌ Action attempted:', data.action, 'Resource:', data.resource);
      // Don't throw error to avoid breaking user experience
    }
  }, [getCurrentUser, getClientInfo]);

  // Log page navigation
  const logPageNavigation = useCallback((pathname: string, search?: string) => {
    const pageNames: Record<string, string> = {
      '/': 'E-Commerce Home - Product Browsing',
      '/home': 'E-Commerce Home - Product Browsing',
      '/products': 'Product Catalog - Browse All Products',
      '/cart': 'Shopping Cart - Review Items',
      '/checkout': 'Checkout Process - Complete Purchase',
      '/wishlist': 'Wishlist - Saved Items',
      '/login': 'Login Page - User Authentication',
      '/signup': 'Registration - Create Account',
      '/dashboard': 'Customer Dashboard - Account Overview',
      '/dashboard/orders': 'Order History - Past Purchases',
      '/dashboard/profile': 'User Profile - Personal Information',
      '/dashboard/settings': 'Account Settings - Preferences',
      '/dashboard/wallet': 'Digital Wallet - Payment Methods',
      '/dashboard/returns': 'Returns & Refunds - Order Management',
      '/dashboard/order-tracking': 'Order Tracking - Shipment Status'
    };

    // Get more descriptive page name
    let pageName = pageNames[pathname];
    
    // Handle dynamic routes
    if (!pageName) {
      if (pathname.startsWith('/products/')) {
        pageName = 'Product Details - Individual Product View';
      } else if (pathname.startsWith('/category/')) {
        pageName = 'Category Page - Product Filtering';
      } else if (pathname.startsWith('/search/')) {
        pageName = 'Search Results - Product Search';
      } else {
        // Fallback: clean up pathname
        pageName = pathname
          .replace('/', '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Page';
      }
    }

    // Get previous page name for context
    const referrerPath = document.referrer ? new URL(document.referrer).pathname : null;
    const previousPageName = referrerPath ? pageNames[referrerPath] || referrerPath : 'Direct Access';
    
    // Get user information for audit logging
    const user = getCurrentUser();
    const userName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || 'Guest User') : 'Guest User';
    
    logAuditEvent({
      action: 'page_visited',
      resource: 'navigation',
      resourceId: pathname,
      details: {
        pageName,
        pathname,
        fullUrl: window.location.href,
        search: search || window.location.search,
        previousPage: document.referrer,
        previousPageName,
        navigationTime: new Date().toISOString(),
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('sessionStartTime') || '0'),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        userName: userName,
        userEmail: user?.email || null
      },
      severity: 'low',
      status: 'info',
      source: 'web'
    });
  }, [logAuditEvent, getCurrentUser]);

  // Log product actions
  const logProductAction = useCallback((action: string, productId?: string, details?: any) => {
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      currentPage: window.location.pathname,
      actionDescription: getProductActionDescription(action, details)
    };

    logAuditEvent({
      action,
      resource: 'product',
      resourceId: productId,
      details: enhancedDetails,
      severity: action.includes('purchase') ? 'high' : 'medium',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Helper function to get product action descriptions
  const getProductActionDescription = (action: string, details?: any) => {
    const user = getCurrentUser();
    const userName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || 'User') : 'User';
    
    switch (action) {
      case 'product_viewed':
        return `${userName} viewed product "${details?.productName || 'Unknown Product'}" (Price: ${details?.price || 'N/A'})`;
      case 'product_added_to_cart':
        return `${userName} added "${details?.productName || 'Unknown Product'}" to cart (Qty: ${details?.quantity || 1}, Price: ${details?.price || 'N/A'})`;
      case 'product_removed_from_cart':
        return `${userName} removed "${details?.productName || 'Unknown Product'}" from cart`;
      case 'product_added_to_wishlist':
        return `${userName} added "${details?.productName || 'Unknown Product'}" to wishlist`;
      case 'product_removed_from_wishlist':
        return `${userName} removed "${details?.productName || 'Unknown Product'}" from wishlist`;
      case 'product_purchased':
        return `${userName} purchased "${details?.productName || 'Unknown Product'}" (Qty: ${details?.quantity || 1}, Total: ${details?.total || 'N/A'})`;
      default:
        return `${userName} performed product action: ${action}`;
    }
  };

  // Log cart actions
  const logCartAction = useCallback((action: string, details?: any) => {
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      actionDescription: getCartActionDescription(action, details)
    };

    logAuditEvent({
      action,
      resource: 'cart',
      details: enhancedDetails,
      severity: 'medium',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Helper function to get cart action descriptions
  const getCartActionDescription = (action: string, details?: any) => {
    const user = getCurrentUser();
    const userName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || 'User') : 'User';
    
    switch (action) {
      case 'cart_viewed':
        return `${userName} viewed shopping cart (${details?.itemCount || 0} items, Total: ${details?.total || 'N/A'})`;
      case 'cart_updated':
        return `${userName} updated cart item quantities`;
      case 'cart_cleared':
        return `${userName} cleared shopping cart (${details?.itemCount || 0} items, Total: ${details?.total || 'N/A'})`;
      case 'checkout_started':
        return `${userName} started checkout process (${details?.itemCount || 0} items, Total: ${details?.total || 'N/A'})`;
      case 'checkout_completed':
        return `${userName} completed purchase - Order #${details?.orderNumber || 'Unknown'} (Total: ${details?.total || 'N/A'})`;
      case 'checkout_abandoned':
        return `${userName} abandoned checkout (${details?.itemCount || 0} items, Total: ${details?.total || 'N/A'})`;
      default:
        return `${userName} performed cart action: ${action}`;
    }
  };

  // Log user actions
  const logUserAction = useCallback((action: string, details?: any) => {
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      currentPage: window.location.pathname,
      actionDescription: getUserActionDescription(action, details)
    };

    logAuditEvent({
      action,
      resource: 'user',
      details: enhancedDetails,
      severity: action.includes('login') || action.includes('register') ? 'medium' : 'low',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Helper function to get user action descriptions
  const getUserActionDescription = (action: string, details?: any) => {
    const user = getCurrentUser();
    const userName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || 'User') : 'User';
    
    switch (action) {
      case 'user_registered':
        return `${userName} registered (Email: ${details?.email || 'Unknown'})`;
      case 'login':
        return `${userName} logged in successfully (Method: ${details?.loginMethod || 'Email'})`;
      case 'logout':
        return `${userName} logged out (Session duration: ${Math.round((details?.sessionDuration || 0) / 1000)}s)`;
      case 'profile_updated':
        return `${userName} updated their profile information`;
      case 'password_changed':
        return `${userName} changed their password`;
      case 'address_added':
        return `${userName} added new shipping address`;
      case 'payment_method_added':
        return `${userName} added new payment method`;
      default:
        return `${userName} performed action: ${action}`;
    }
  };

  // Track page navigation changes
  useEffect(() => {
    console.log('🧭 E-Commerce: Page navigation detected:', location.pathname, location.search);
    
    // Small delay to ensure the page has loaded
    const timer = setTimeout(() => {
      logPageNavigation(location.pathname, location.search);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, logPageNavigation]);

  // Store session start time (for session duration tracking)
  useEffect(() => {
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
  }, []);

  return {
    logAuditEvent,
    logPageNavigation,
    logProductAction,
    logCartAction,
    logUserAction
  };
};

// Utility hook for automatic audit logging on component mount
export const usePageAudit = (pageName?: string, additionalData?: any) => {
  const location = useLocation();
  const { logPageNavigation } = useAuditLogger();

  useEffect(() => {
    if (pageName) {
      logPageNavigation(location.pathname, location.search);
    }
  }, [location, pageName, logPageNavigation]);
};

export default useAuditLogger;