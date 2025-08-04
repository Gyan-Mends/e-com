import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

// Declare Paystack global
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => {
        openIframe: () => void;
      };
    };
  }
}
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select,
  SelectItem,
  Divider,
  Chip,
  Checkbox,
  RadioGroup,
  Radio,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner
} from "@heroui/react";
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle,
  Truck,
  Calendar,
  Hash,
  X
} from "lucide-react";
import { 
  cartAPI,
  taxAPI,
  type Cart,
  type CartItem,
  type APIResponse,
  formatPrice,
  getSessionId 
} from "../utils/api";
import { config, getApiUrl } from "../utils/config";
import { useAuditLogger } from "../hooks/useAuditLogger";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logCartAction, logAuditEvent } = useAuditLogger();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [taxConfig, setTaxConfig] = useState<{
    enabled: boolean;
    rate: number;
    type: 'percentage' | 'fixed';
    name: string;
  }>({
    enabled: false,
    rate: 0,
    type: 'percentage',
    name: 'Tax'
  });
  
  // Load cart data and check authentication
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      try {
        // Check if user is authenticated
        const userData = localStorage.getItem("user");
        if (!userData) {
          // Redirect to login if not authenticated
          navigate('/login?redirect=checkout');
          return;
        }

        const user = JSON.parse(userData);
        
        if (mounted) {
          // Pre-fill customer info from user data
          setCustomerInfo({
            firstName: user.firstName || user.name?.split(' ')[0] || '',
            lastName: user.lastName || user.name?.split(' ')[1] || '',
            email: user.email || '',
            phone: user.phone || '',
          });
        }

        const sessionId = getSessionId();
        console.log('🛒 Loading cart for checkout with sessionId:', sessionId);
        
        // Load cart and tax configuration in parallel with better error handling
        const [cartResponse, taxResponse] = await Promise.allSettled([
          cartAPI.getCart(undefined, sessionId).catch(error => {
            console.error('❌ Cart API error:', error);
            return { success: false, data: null, message: error.message || 'Failed to load cart' };
          }),
          taxAPI.getTaxConfiguration().catch(error => {
            console.error('❌ Tax API error:', error);
            return { success: false, data: null, message: error.message || 'Failed to load tax configuration' };
          })
        ]);
        
        // Handle cart response
        if (cartResponse.status === 'fulfilled') {
          const response = cartResponse.value as any;
          console.log('🛒 Checkout cart response:', response);
          
          if (response?.success && response.data) {
            if (response.data.items && response.data.items.length > 0) {
              if (mounted) {
                setCart(response.data);
                
                // Log checkout started
                logCartAction('checkout_started', {
                  itemCount: response.data.totalItems || 0,
                  total: response.data.totalAmount || 0,
                  items: response.data.items?.map((item: any) => ({
                    productId: item.product._id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.price
                  })) || [],
                  customerEmail: user.email,
                  customerId: user._id || user.id
                });
              }
            } else {
              // Redirect to cart if empty
              console.log('🛒 Cart is empty, redirecting to cart page');
              navigate('/cart');
              return;
            }
          } else {
            // Redirect to cart if no cart found
            console.log('🛒 No cart found, redirecting to cart page');
            navigate('/cart');
            return;
          }
        } else {
          console.error('❌ Error loading cart:', cartResponse.reason);
          // Instead of redirecting, show error and allow retry
          if (mounted) {
            setCart(null);
            setError('Failed to load cart data. Please try again.');
            // Don't redirect, let the user see the error
          }
        }
        
        // Handle tax configuration response
        if (taxResponse.status === 'fulfilled' && mounted) {
          const response = taxResponse.value as any;
          console.log('💰 Tax configuration response:', response);
          
          if (response?.success && response.data?.taxSettings) {
            const taxSettings = response.data.taxSettings;
            setTaxConfig({
              enabled: taxSettings.rate > 0,
              rate: taxSettings.rate,
              type: taxSettings.type || 'percentage',
              name: taxSettings.name || 'Tax'
            });
          } else {
            // Use default tax configuration
            console.log('💰 Using default tax configuration');
            setTaxConfig({
              enabled: true,
              rate: 0.08, // Default 8% tax
              type: 'percentage',
              name: 'Tax'
            });
          }
        } else if (mounted) {
          console.error('❌ Error loading tax configuration:', taxResponse.status === 'rejected' ? taxResponse.reason : 'Unknown error');
          // Use default tax configuration on error
          setTaxConfig({
            enabled: true,
            rate: 0.08, // Default 8% tax
            type: 'percentage',
            name: 'Tax'
          });
        }
        
      } catch (error) {
        console.error('❌ Error in checkout initialization:', error);
        // Don't redirect on error, let the user see the error
        if (mounted) {
          setCart(null);
          setError('Failed to initialize checkout. Please try again.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, [navigate, logCartAction, retryCount]);
  
  // Retry function
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
  };
  
  // Form state
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  
  const [billingAddress, setBillingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [paymentReference, setPaymentReference] = useState<string>('');
  
  // Calculate totals
  const subtotal = cart?.totalAmount || 0;
  const shippingCost = shippingMethod === 'express' ? 15.99 : subtotal > 50 ? 0 : 9.99;
  
  // Calculate tax based on POS system configuration
  const calculateTax = () => {
    if (!taxConfig.enabled) return 0;
    
    if (taxConfig.type === 'fixed') {
      return taxConfig.rate;
    } else {
      return subtotal * taxConfig.rate;
    }
  };
  
  const tax = calculateTax();
  const total = subtotal + shippingCost + tax;

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Only remove if it exists
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle form submission
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Verify transaction with POS backend
  const verifyTransaction = async (reference: string): Promise<boolean> => {
    try {
      console.log('🔍 Verifying transaction with POS backend:', reference);
      
      // Call POS backend API for verification
      const apiUrl = getApiUrl(config.endpoints.paystack);
      console.log('Making API call to:', apiUrl);
      
      const sessionId = getSessionId();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'verify', 
          reference,
          sessionId // Include sessionId for cart clearing
        })
      });

      if (!response.ok) {
        throw new Error(`Backend verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Backend verification result:', result);
      
      if (result.success && result.verified) {
        console.log('✅ Transaction verified successfully:', result.data);
        return true;
      } else {
        console.log('❌ Transaction verification failed:', result.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error verifying transaction:', error);
      return false;
    }
  };

  // Process Paystack Payment
  const processPayment = () => {
    return new Promise<{ success: boolean; reference?: string }>((resolve) => {
      // Prevent multiple simultaneous payment attempts
      if (paymentStatus === 'processing') {
        console.log('⚠️ Payment already in progress, ignoring duplicate request');
        resolve({ success: false });
        return;
      }
      
      setPaymentStatus('processing');
      
      // Set a timeout to prevent infinite loading
      const paymentTimeout = setTimeout(() => {
        console.log('⏰ Payment timeout reached');
        setPaymentStatus('failed');
        resolve({ success: false });
      }, 300000); // 5 minutes timeout
      
      // Log payment attempt
      logAuditEvent({
        action: 'payment_attempted',
        resource: 'checkout',
        details: {
          amount: total,
          currency: 'GHS',
          paymentMethod: 'paystack',
          customerEmail: customerInfo.email,
          itemCount: cart?.totalItems || 0,
          shippingMethod,
          taxEnabled: taxConfig.enabled,
          taxAmount: tax
        },
        severity: 'high',
        status: 'info',
        source: 'web'
      });
      
      // Check if Paystack is loaded
      if (!window.PaystackPop) {
        console.error('❌ Paystack not loaded');
        setPaymentStatus('failed');
        clearTimeout(paymentTimeout);
        
        // Log payment failure
        logAuditEvent({
          action: 'payment_failed',
          resource: 'checkout',
          details: {
            error: 'Paystack not loaded',
            amount: total,
            paymentMethod: 'paystack'
          },
          severity: 'high',
          status: 'error',
          source: 'web'
        });
        
        resolve({ success: false });
        return;
      }

      // Generate unique transaction reference
      const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('💳 Initiating payment with reference:', transactionRef);

      const handler = window.PaystackPop.setup({
        key: config.PAYSTACK_PUBLIC_KEY, // Paystack public key from config
        email: customerInfo.email,
        amount: Math.round(total * 100), // Amount in pesewas (GHS * 100)
        currency: 'GHS', // Ghanaian Cedi
        ref: transactionRef,
        channels: ['mobile_money', 'card', 'bank', 'ussd', 'qr', 'bank_transfer'], // Prioritize mobile money for Ghana
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: `${customerInfo.firstName} ${customerInfo.lastName}`
            },
            {
              display_name: "Phone Number",
              variable_name: "customer_phone", 
              value: customerInfo.phone
            },
            {
              display_name: "Shipping Address",
              variable_name: "shipping_address",
              value: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`
            }
          ],
          // Customer data for POS system
          customer: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          // Shipping data for POS system
          shipping: {
            fullName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country,
            phone: customerInfo.phone
          },
          order_items: cart?.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            unit_price: item.price / item.quantity,
            total_price: item.price
          })),
          cart_id: cart?._id || 'guest_cart',
          shipping_method: shippingMethod,
          order_total: total
        },
        callback: function(response: any) {
          clearTimeout(paymentTimeout);
          console.log('✅ Payment successful! Response:', response);
          console.log('📋 Transaction Reference:', response.reference);
          
          setPaymentStatus('success');
          setPaymentReference(response.reference);
          
          // Log successful payment
          logAuditEvent({
            action: 'payment_successful',
            resource: 'checkout',
            details: {
              transactionReference: response.reference,
              amount: total,
              currency: 'GHS',
              paymentMethod: 'paystack',
              customerEmail: customerInfo.email,
              itemCount: cart?.totalItems || 0,
              shippingMethod,
              taxAmount: tax
            },
            severity: 'high',
            status: 'success',
            source: 'web'
          });
          
          // Verify transaction (in production, this should be done on your backend)
          verifyTransaction(response.reference)
            .then((verified: boolean) => {
              if (verified) {
                resolve({ success: true, reference: response.reference });
              } else {
                console.error('❌ Transaction verification failed');
                setPaymentStatus('failed');
                
                // Log verification failure
                logAuditEvent({
                  action: 'payment_verification_failed',
                  resource: 'checkout',
                  details: {
                    transactionReference: response.reference,
                    amount: total,
                    paymentMethod: 'paystack'
                  },
                  severity: 'high',
                  status: 'error',
                  source: 'web'
                });
                
                resolve({ success: false });
              }
            })
            .catch((error: any) => {
              console.error('❌ Error verifying transaction:', error);
              setPaymentStatus('failed');
              
              // Log verification error
              logAuditEvent({
                action: 'payment_verification_error',
                resource: 'checkout',
                details: {
                  transactionReference: response.reference,
                  error: error.message,
                  amount: total,
                  paymentMethod: 'paystack'
                },
                severity: 'high',
                status: 'error',
                source: 'web'
              });
              
              resolve({ success: false });
            });
        },
        onClose: function() {
          clearTimeout(paymentTimeout);
          console.log('❌ Payment window closed by user');
          setPaymentStatus('pending'); // Reset to pending, not failed
          
          // Log payment abandoned
          logAuditEvent({
            action: 'payment_abandoned',
            resource: 'checkout',
            details: {
              amount: total,
              paymentMethod: 'paystack',
              customerEmail: customerInfo.email,
              itemCount: cart?.totalItems || 0
            },
            severity: 'medium',
            status: 'warning',
            source: 'web'
          });
          
          resolve({ success: false });
        }
      });
      
      // Open the payment popup
      handler.openIframe();
    });
  };

  // Process order (only after successful payment)
  const handlePlaceOrder = async () => {
    if (paymentStatus !== 'success') {
      // Process payment first
      setIsProcessing(true);
      const paymentResult = await processPayment();
      setIsProcessing(false);
      
      if (!paymentResult.success) {
        // Log checkout abandoned
        logCartAction('checkout_abandoned', {
          itemCount: cart?.totalItems || 0,
          total: cart?.totalAmount || 0,
          reason: 'payment_failed',
          customerEmail: customerInfo.email
        });
        return; // Don't proceed if payment failed
      }
    }
    
    setIsProcessing(true);
    
    try {
      // Create order with payment reference
      const newOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📦 Creating order:', {
        orderId: newOrderId,
        paymentReference,
        customer: customerInfo,
        shipping: shippingAddress,
        items: cart?.items,
        total: total
      });
      
      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOrderId(newOrderId);
      setOrderPlaced(true);
      
      // Log successful order completion
      logCartAction('checkout_completed', {
        orderId: newOrderId,
        paymentReference,
        itemCount: cart?.totalItems || 0,
        total: cart?.totalAmount || 0,
        customerEmail: customerInfo.email,
        shippingMethod,
        taxAmount: tax,
        items: cart?.items?.map((item: any) => ({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price
        })) || []
      });
      
      // Clear the cart after successful order
      const sessionId = getSessionId();
      await cartAPI.clearCart(undefined, sessionId);
      
      onOpen();
    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      // Log order creation error
      logAuditEvent({
        action: 'order_creation_failed',
        resource: 'checkout',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          paymentReference,
          customerEmail: customerInfo.email,
          itemCount: cart?.totalItems || 0,
          total: cart?.totalAmount || 0
        },
        severity: 'high',
        status: 'error',
        source: 'web'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate current step
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone;
      case 2:
        return shippingAddress.address && shippingAddress.city && shippingAddress.state;
      case 3:
        return true; // Review step is always valid
      case 4:
        return true; // Paystack validation will be handled during payment
      default:
        return true;
    }
  };

  // Generate product illustration
  const getProductIllustration = (product: any) => {
    const productName = product.name.toLowerCase();
    
    if (productName.includes('headphone') || productName.includes('earphone')) {
      return (
        <div className="w-12 h-12 mx-auto relative">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full relative">
            <div className="absolute inset-1 bg-gray-800 rounded-full"></div>
          </div>
        </div>
      );
    } else if (productName.includes('laptop') || productName.includes('computer')) {
      return (
        <div className="w-12 h-12 mx-auto relative">
          <div className="w-10 h-6 bg-gray-300 rounded-t-lg border border-gray-400">
            <div className="w-full h-4 bg-gradient-to-br from-blue-400 to-green-400 rounded-t-md m-0.5"></div>
          </div>
          <div className="w-12 h-1 bg-gray-400 rounded-b-2xl -mt-0.5"></div>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 mx-auto relative">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded"></div>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen customed-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen customed-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <X size={64} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Failed to Load Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button color="primary" onPress={handleRetry}>
              Try Again
            </Button>
            <Link to="/cart">
              <Button variant="flat">
                Back to Cart
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen customed-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Items in Cart
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add some items to your cart before checking out.
          </p>
          <Link to="/products">
            <Button color="primary">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen customed-dark-bg">
      {/* Header */}
      <div className="customed-dark-bg ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Checkout
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Complete your purchase
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="customed-dark-bg ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-8">
            {[
              { number: 1, title: 'Customer Info', icon: User },
              { number: 2, title: 'Shipping', icon: Truck },
              { number: 3, title: 'Review', icon: CheckCircle },
              { number: 4, title: 'Payment', icon: CreditCard },
            ].map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-[#18181c] text-gray-400 shadow-sm'
                }`}>
                  <step.icon size={20} />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-primary' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-[#18181c]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody className="p-6">
                {/* Step 1: Customer Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                      <User size={24} className="text-primary" />
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Customer Information
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        placeholder="Enter your first name"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        required
                      />
                      <Input
                        label="Last Name"
                        placeholder="Enter your last name"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      startContent={<Mail size={18} />}
                      required
                    />
                    
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      startContent={<Phone size={18} />}
                      required
                    />
                  </div>
                )}

                {/* Step 2: Shipping Address */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Truck size={24} className="text-primary" />
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Shipping Information
                      </h2>
                    </div>
                    
                    <Input
                      label="Street Address"
                      placeholder="Enter your address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                      startContent={<MapPin size={18} />}
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        required
                      />
                      <Input
                        label="State"
                        placeholder="State"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
                      <RadioGroup
                        value={shippingMethod}
                        onValueChange={setShippingMethod}
                      >
                        <Radio value="standard">
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <p className="font-medium">Standard Shipping</p>
                              <p className="text-sm text-gray-500">5-7 business days</p>
                            </div>
                            <span className="font-medium">
                              {subtotal > 50 ? 'Free' : '$9.99'}
                            </span>
                          </div>
                        </Radio>
                        <Radio value="express">
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <p className="font-medium">Express Shipping</p>
                              <p className="text-sm text-gray-500">2-3 business days</p>
                            </div>
                            <span className="font-medium">$15.99</span>
                          </div>
                        </Radio>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 3: Order Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle size={24} className="text-primary" />
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Review Your Order
                      </h2>
                    </div>
                    
                    {/* Order Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Order Items</h3>
                      {cart.items.map((item) => (
                        <div key={item.product._id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-shrink-0">
                            {getProductIllustration(item.product)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Divider />
                    
                    {/* Customer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Customer Information</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {customerInfo.firstName} {customerInfo.lastName}<br />
                          {customerInfo.email}<br />
                          {customerInfo.phone}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Shipping Address</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {shippingAddress.address}<br />
                          {shippingAddress.city}, {shippingAddress.state}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment Information */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                      <CreditCard size={24} className="text-primary" />
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Payment Information
                      </h2>
                    </div>
                    
                    {/* Paystack Payment Method */}
                    <div className="p-6  rounded-lg ">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <CreditCard className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Secure Payment with Paystack
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pay with card, mobile money (MoMo), bank transfer, or USSD
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment Methods Available */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <CreditCard className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Cards</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <Phone className="w-6 h-6 mx-auto text-green-600 mb-1" />
                          <p className="text-xs font-medium text-green-700 dark:text-green-300">Mobile Money</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <MapPin className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                          <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Bank Transfer</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <Hash className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                          <p className="text-xs font-medium text-orange-700 dark:text-orange-300">USSD</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>256-bit SSL encryption</span>
                        <CheckCircle size={16} className="text-green-500 ml-4" />
                        <span>PCI DSS compliant</span>
                      </div>
                      
                      {/* Test Mode Notice */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Test Mode Active</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                          This is a test transaction. Use the following Paystack test details:
                        </p>
                        <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                          <p><strong>Mobile Money:</strong> 0551234987 (Official Paystack Test Number)</p>
                          <p><strong>Test Card:</strong> 4084084084084081</p>
                          <p><strong>Expiry:</strong> 12/30 | <strong>CVV:</strong> 408</p>
                          <p><strong>Bank Transfer:</strong> Use any test bank account</p>
                          <p><strong>USSD:</strong> Follow prompts with test PIN</p>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          💡 Paystack uses pre-configured test numbers for each country/payment method
                        </p>
                      </div>
                      
                      {paymentStatus === 'failed' && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-red-600 dark:text-red-400 text-sm">
                            Payment failed. Please try again or contact support.
                          </p>
                        </div>
                      )}
                      
                      {paymentStatus === 'processing' && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <p className="text-blue-600 dark:text-blue-400 text-sm">
                              Processing payment... Please complete the transaction in the popup window.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {paymentStatus === 'success' && paymentReference && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <div>
                              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                                Payment Successful!
                              </p>
                              <p className="text-green-600 dark:text-green-400 text-xs">
                                Reference: {paymentReference}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">Billing Address</h3>
                      <Checkbox
                        isSelected={sameAsShipping}
                        onValueChange={setSameAsShipping}
                      >
                        Same as shipping address
                      </Checkbox>
                      
                      {!sameAsShipping && (
                        <div className="space-y-4 mt-4">
                          <Input
                            label="Billing Address"
                            placeholder="Enter billing address"
                            value={billingAddress.address}
                            onChange={(e) => setBillingAddress({...billingAddress, address: e.target.value})}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="City"
                              placeholder="City"
                              value={billingAddress.city}
                              onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                            />
                            <Input
                              label="State"
                              placeholder="State"
                              value={billingAddress.state}
                              onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  {currentStep > 1 && (
                    <Button
                      variant="flat"
                      onPress={handlePrevious}
                      startContent={<ArrowLeft size={18} />}
                    >
                      Previous
                    </Button>
                  )}
                  
                  <div className="ml-auto">
                    {currentStep === 3 ? (
                      <Button
                        color="primary"
                        onPress={handleNext}
                        disabled={!isStepValid(currentStep)}
                      >
                        Proceed to Payment
                      </Button>
                    ) : currentStep === 4 ? (
                      <div className="flex gap-3">
                        <Button
                          color="primary"
                          onPress={async () => {
                            const paymentResult = await processPayment();
                            if (paymentResult.success) {
                              handlePlaceOrder();
                            }
                          }}
                          isLoading={paymentStatus === 'processing'}
                          disabled={paymentStatus === 'success'}
                          startContent={<CreditCard size={18} />}
                        >
                          {paymentStatus === 'processing' ? 'Processing Payment...' : 
                           paymentStatus === 'success' ? 'Payment Complete' : 'Pay Now'}
                        </Button>
                        {paymentStatus === 'success' && (
                          <Button
                            color="success"
                            size="lg"
                            onPress={handlePlaceOrder}
                            isLoading={isProcessing}
                            startContent={<CheckCircle size={20} />}
                          >
                            {isProcessing ? 'Creating Order...' : 'Confirm Order'}
                          </Button>
                        )}
                      </div>
                    ) : currentStep < 4 ? (
                      <Button
                        color="primary"
                        onPress={handleNext}
                        disabled={!isStepValid(currentStep)}
                      >
                        Next Step
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal ({cart.totalItems} items)
                    </span>
                    <span className="font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="font-medium">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                  
                  {taxConfig.enabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {taxConfig.name} 
                        {taxConfig.type === 'percentage' && ` (${(taxConfig.rate * 100).toFixed(1)}%)`}
                      </span>
                      <span className="font-medium">
                        {formatPrice(tax)}
                      </span>
                    </div>
                  )}
                  
                  <Divider />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      Estimated delivery: {
                        shippingMethod === 'express' 
                          ? '2-3 business days'
                          : '5-7 business days'
                      }
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        isDismissable={false}
        hideCloseButton
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CheckCircle size={24} className="text-green-500" />
              <span>Order Confirmed!</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-semibold mb-2">Thank you for your order!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your order has been successfully placed and is being processed.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
                <p className="text-lg font-mono font-semibold">{orderId}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You will receive an email confirmation shortly with your order details and tracking information.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Link to="/">
              <Button color="primary" onPress={onClose}>
                Continue Shopping
              </Button>
            </Link>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CheckoutPage;