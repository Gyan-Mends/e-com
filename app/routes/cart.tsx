import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Badge,
  Divider,
  Chip,
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
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Heart,
  Tag
} from "lucide-react";
import { 
  cartAPI,
  wishlistAPI,
  taxAPI,
  type Cart,
  type CartItem,
  type APIResponse,
  formatPrice,
  getCategoryName,
  getSessionId 
} from "../utils/api";

const CartPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState<Set<string>>(new Set());
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isMovingToWishlist, setIsMovingToWishlist] = useState<Set<string>>(new Set());
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

  // Load cart data on component mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoading(true);
        const sessionId = getSessionId();
        console.log('🛒 Loading cart with sessionId:', sessionId);
        
        const cartResponse = await cartAPI.getCart(undefined, sessionId) as any;
        console.log('🛒 Cart API response:', cartResponse);
        
        if (cartResponse && cartResponse.success && cartResponse.data) {
          setCart(cartResponse.data);
          console.log('🛒 Cart loaded successfully:', cartResponse.data);
        } else {
          console.log('🛒 No cart found or empty cart');
          setCart(null);
        }
      } catch (error) {
        console.error('❌ Error loading cart:', error);
        setCart(null);
      } finally {
        setIsLoading(false);
      }
    };

    const loadTaxConfiguration = async () => {
      try {
        console.log('💰 Loading tax configuration from POS system (Cart)');
        const response = await taxAPI.getTaxConfiguration() as any;
        console.log('💰 Tax configuration response (Cart):', response);
        
        if (response?.success && response.data?.taxSettings) {
          const taxSettings = response.data.taxSettings;
          setTaxConfig({
            enabled: taxSettings.rate > 0,
            rate: taxSettings.rate,
            type: taxSettings.type || 'percentage',
            name: taxSettings.name || 'Tax'
          });
        }
      } catch (error) {
        console.error('❌ Error loading tax configuration:', error);
        // Use default tax configuration on error
        setTaxConfig({
          enabled: false,
          rate: 0,
          type: 'percentage',
          name: 'Tax'
        });
      }
    };

    loadCart();
    loadTaxConfiguration();
  }, []);

  // Calculate totals
  const subtotal = cart?.totalAmount || 0;
  const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  
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
  const total = subtotal + shipping + tax;

  // Update cart item quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(prev => new Set(prev).add(productId));
    try {
      const sessionId = getSessionId();
      const response = await cartAPI.updateCartItem(
        undefined, 
        sessionId, 
        productId, 
        newQuantity
      ) as any;
      
      if (response && response.success) {
        setCart(response.data);
        setMessage('Cart updated successfully');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Failed to update cart');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      setMessage('Error updating cart');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    setIsRemoving(prev => new Set(prev).add(productId));
    try {
      const sessionId = getSessionId();
      console.log('🗑️ Removing item:', productId, 'with sessionId:', sessionId);
      
      const response = await cartAPI.removeFromCart(
        undefined, 
        sessionId, 
        productId
      ) as any;
      
      console.log('🗑️ Remove item response:', response);
      
      if (response && response.success) {
        console.log('🗑️ Updated cart data:', response.data);
        setCart(response.data);
        setMessage('Item removed from cart');
        setTimeout(() => setMessage(''), 2000);
      } else {
        console.log('🗑️ Remove failed:', response);
        setMessage('Failed to remove item');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      setMessage('Error removing item');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsRemoving(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setIsClearingCart(true);
    try {
      const sessionId = getSessionId();
      const response = await cartAPI.clearCart(undefined, sessionId) as any;
      
      if (response && response.success) {
        setCart(null);
        setMessage('Cart cleared successfully');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Failed to clear cart');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setMessage('Error clearing cart');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsClearingCart(false);
      onClose();
    }
  };

  // Move item to wishlist
  const moveToWishlist = async (item: CartItem) => {
    setIsMovingToWishlist(prev => new Set(prev).add(item.product._id));
    try {
      const sessionId = getSessionId();
      
      // Add to wishlist
      const wishlistResponse = await wishlistAPI.addToWishlist(
        undefined, 
        sessionId, 
        item.product._id
      ) as any;
      
      if (wishlistResponse && wishlistResponse.success) {
        // Remove from cart
        await removeFromCart(item.product._id);
        setMessage(`${item.product.name} moved to wishlist`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to move to wishlist');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error moving to wishlist:', error);
      setMessage('Error moving to wishlist');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsMovingToWishlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.product._id);
        return newSet;
      });
    }
  };

  // Generate product illustration based on category/name
  const getProductIllustration = (product: any) => {
    const productName = product.name.toLowerCase();
    
    if (productName.includes('headphone') || productName.includes('earphone')) {
      return (
        <div className="w-16 h-16 mx-auto relative">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full relative">
            <div className="absolute inset-2 bg-gray-800 rounded-full"></div>
            <div className="absolute top-1 left-1 w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="absolute top-1 right-1 w-3 h-3 bg-purple-400 rounded-full"></div>
          </div>
        </div>
      );
    } else if (productName.includes('laptop') || productName.includes('computer')) {
      return (
        <div className="w-16 h-16 mx-auto relative">
          <div className="w-14 h-8 bg-gray-300 rounded-t-lg border-2 border-gray-400">
            <div className="w-full h-6 bg-gradient-to-br from-blue-400 to-green-400 rounded-t-md m-1"></div>
          </div>
          <div className="w-16 h-1 bg-gray-400 rounded-b-2xl"></div>
        </div>
      );
    } else {
      return (
        <div className="w-16 h-16 mx-auto relative">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-lg"></div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen customed-dark-bg">
      {/* Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
             
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Shopping Cart
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {cart?.totalItems || 0} items in your cart
                </p>
              </div>
            </div>
            
            {cart && cart.items.length > 0 && (
              <Button
                color="danger"
                variant="flat"
                onPress={onOpen}
                isLoading={isClearingCart}
                startContent={<Trash2 size={18} />}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading your cart...</p>
          </div>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <ShoppingCart size={96} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add some products to your cart to get started!
            </p>
            <Link to="/">
              <Button color="primary" size="lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart!.items.map((item) => (
                <Card key={item.product._id} className="hover:shadow-md transition-shadow">
                  <CardBody className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20  rounded-lg flex items-center justify-center">
                        <img
                            src={item.product.images && item.product.images.length > 0 
                              ? item.product.images[0] 
                              : `https://demo.phlox.pro/shop-digital/wp-content/uploads/sites/127/2019/09/Laptop.png`}
                            alt={item.product.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.product.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(item.price)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatPrice(item.product.price)} each
                            </div>
                          </div>
                        </div>

                        {/* Stock Status */}
                        {item.product.stockQuantity > 0 ? (
                          <Chip color="success" variant="flat" size="sm">
                            In Stock ({item.product.stockQuantity} available)
                          </Chip>
                        ) : (
                          <Chip color="danger" variant="flat" size="sm">
                            Out of Stock
                          </Chip>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              isIconOnly
                              onPress={() => updateQuantity(item.product._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating.has(item.product._id)}
                            >
                              <Minus size={14} />
                            </Button>
                            <Input
                              size="sm"
                              value={item.quantity.toString()}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value) || 1;
                                if (newQuantity !== item.quantity) {
                                  updateQuantity(item.product._id, newQuantity);
                                }
                              }}
                              className="w-20 text-center"
                              min="1"
                              max={item.product.stockQuantity.toString()}
                            />
                            <Button
                              size="sm"
                              variant="flat"
                              isIconOnly
                              onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity || isUpdating.has(item.product._id)}
                            >
                              <Plus size={14} />
                            </Button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => moveToWishlist(item)}
                              isLoading={isMovingToWishlist.has(item.product._id)}
                              startContent={<Heart size={14} />}
                            >
                              Move to Wishlist
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => removeFromCart(item.product._id)}
                              isLoading={isRemoving.has(item.product._id)}
                              isIconOnly
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardBody className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Order Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal ({cart!.totalItems} items)
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
                        {shipping === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          formatPrice(shipping)
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

                  {/* Shipping Info */}
                  {shipping > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        <Tag size={16} className="inline mr-1" />
                        Add {formatPrice(50 - subtotal)} more for free shipping!
                      </p>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Link to="/checkout">
                    <Button
                      color="primary"
                      size="lg"
                      className="w-full mt-6"
                      disabled={cart!.items.some(item => item.product.stockQuantity === 0)}
                    >
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <div className="mt-4 text-center">
                    <Link to="/" className="text-sm text-primary hover:underline">
                      Continue Shopping
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Clear Cart
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to clear your entire cart? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={clearCart} isLoading={isClearingCart}>
              Clear Cart
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CartPage;