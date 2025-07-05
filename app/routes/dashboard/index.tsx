import { Link } from "react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Avatar,
  Divider,
  Chip,
  Progress,
  Tabs,
  Tab,
  Image,
} from "@heroui/react";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Heart,
  ShoppingCart,
  CreditCard,
  MapPin,
  User,
  Settings,
  RotateCcw,
  Wallet,
  Calendar,
  DollarSign,
  Star,
  ArrowRight,
  Eye,
  RefreshCw,
  Plus,
} from "lucide-react";
import { ordersAPI, cartAPI, wishlistAPI, authAPI } from "~/utils/api";
import type { Order, APIResponse, WishlistItem, CartItem } from "~/utils/api";

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export default function Dashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data and dashboard stats
    const loadDashboardData = async () => {
      try {
        // Get current user
        const currentUser = authAPI.getCurrentUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Set user data
        setUser({
          id: currentUser.id || currentUser._id,
          name: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`,
          email: currentUser.email,
          phone: currentUser.phone || '',
          avatar: currentUser.avatar,
          joinDate: currentUser.createdAt || new Date().toISOString(),
          totalOrders: currentUser.totalPurchases || 0,
          totalSpent: currentUser.totalSpent || 0,
          loyaltyPoints: currentUser.loyaltyPoints || 0,
          membershipLevel: currentUser.loyaltyPoints > 1000 ? 'Gold' : currentUser.loyaltyPoints > 500 ? 'Silver' : 'Bronze'
        });

        // Load recent orders
        const ordersResponse = await ordersAPI.getByCustomer(currentUser.id || currentUser._id, { 
          limit: 5, 
          page: 1 
        }) as APIResponse<{ orders: Order[] }>;
        
        if (ordersResponse.success) {
          setRecentOrders(ordersResponse.data.orders || []);
        }

        // Load wishlist
        const wishlistResponse = await wishlistAPI.getWishlist(currentUser.id || currentUser._id) as APIResponse<{ items: WishlistItem[] }>;
        if (wishlistResponse.success) {
          setWishlistItems(wishlistResponse.data.items || []);
        }

        // Load cart
        const cartResponse = await cartAPI.getCart(currentUser.id || currentUser._id) as APIResponse<{ items: CartItem[] }>;
        if (cartResponse.success) {
          setCartItems(cartResponse.data.items || []);
        }

        // Mock wallet balance - in a real app, this would come from an API
        setWalletBalance(125.50);

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'primary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'processing': return <Package size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Bronze': return 'warning';
      case 'Silver': return 'default';
      case 'Gold': return 'warning';
      case 'Platinum': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening with your account
              </p>
            </div>
            
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.totalOrders || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${user?.totalSpent?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          
          
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package size={20} />
                    Recent Orders
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your latest purchases
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/orders"
                  variant="light"
                  endContent={<ArrowRight size={16} />}
                >
                  View All
                </Button>
              </CardHeader>
              <Divider />
              <CardBody>
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {order.orderNumber}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip
                              color={getStatusColor(order.status)}
                              variant="flat"
                              startContent={getStatusIcon(order.status)}
                              size="sm"
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Chip>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.productId} className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <Package size={16} className="text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No orders yet
                    </p>
                    <Button
                      as={Link}
                      to="/"
                      color="primary"
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Wishlist Preview */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Heart size={20} />
                    Wishlist
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {wishlistItems.length} items saved
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/wishlist"
                  variant="light"
                  endContent={<ArrowRight size={16} />}
                >
                  View All
                </Button>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.slice(0, 3).map((item) => (
                    <div key={item._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                        <Package size={24} className="text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${item.product.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Chip
                            size="sm"
                            color={item.product.stockQuantity > 0 ? 'success' : 'danger'}
                            variant="flat"
                          >
                            {item.product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </Chip>
                          <Button size="sm" variant="light" className="text-primary">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-3">
                <Button
                  as={Link}
                  to="/order-tracking"
                  variant="flat"
                  className="w-full justify-start"
                  startContent={<Truck size={16} />}
                >
                  Track an Order
                </Button>
                <Button
                  as={Link}
                  to="/returns"
                  variant="flat"
                  className="w-full justify-start"
                  startContent={<RotateCcw size={16} />}
                >
                  Returns & Refunds
                </Button>
                <Button
                  as={Link}
                  to="/profile"
                  variant="flat"
                  className="w-full justify-start"
                  startContent={<User size={16} />}
                >
                  Edit Profile
                </Button>
              </CardBody>
            </Card>

            {/* Shopping Cart */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Your Cart
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {cartItems.length} items
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/cart"
                  variant="light"
                  endContent={<ArrowRight size={16} />}
                >
                  View Cart
                </Button>
              </CardHeader>
              <Divider />
              <CardBody>
                {cartItems.length > 0 ? (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.product._id} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity} • ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button
                      as={Link}
                      to="/checkout"
                      color="primary"
                      className="w-full mt-4"
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Your cart is empty
                    </p>
                    <Button
                      as={Link}
                      to="/"
                      color="primary"
                      variant="flat"
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Account Info</h3>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user?.avatar}
                    name={user?.name}
                    size="md"
                    showFallback
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Member since
                    </span>
                    <span className="text-sm font-medium">
                      {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total orders
                    </span>
                    <span className="text-sm font-medium">
                      {user?.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Loyalty points
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {user?.loyaltyPoints || 0} pts
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 