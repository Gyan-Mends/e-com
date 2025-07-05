import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Input,
  Divider,
  Chip,
  Image,
  Progress,
} from "@heroui/react";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MapPin,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";
import { errorToast, successToast } from "~/components/toast";
import { ordersAPI } from "~/utils/api";
import type { Order } from "~/utils/api";

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

// Extended order interface with tracking events
interface OrderWithTracking extends Order {
  trackingEvents: TrackingEvent[];
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderWithTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingQuery, setTrackingQuery] = useState("");
  const [searchType, setSearchType] = useState<'order' | 'tracking' | 'email'>('order');

  useEffect(() => {
    const orderNumber = searchParams.get('order');
    if (orderNumber) {
      setTrackingQuery(orderNumber);
      loadOrderTracking(orderNumber);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const loadOrderTracking = async (query: string) => {
    setLoading(true);
    try {
      let response: any;
      if (query.startsWith('ORD-')) {
        // Get by order number - use search
        response = await ordersAPI.getAll({ search: query, limit: 1 });
      } else {
        // Get by order ID
        response = await ordersAPI.getById(query);
      }
      
      if (response.success && response.data) {
        let orderData;
        // Handle different response structures
        if (Array.isArray(response.data.orders) && response.data.orders.length > 0) {
          // Response from getAll search
          orderData = response.data.orders[0];
        } else if (response.data.order) {
          // Response from getById
          orderData = response.data.order;
        } else {
          // Direct order data
          orderData = response.data;
        }
        
        if (orderData) {
          try {
            // Add tracking events based on order status
            const orderWithEvents: OrderWithTracking = {
              ...orderData,
              trackingEvents: generateTrackingEvents(orderData)
            };
            
            setOrder(orderWithEvents);
          } catch (eventError) {
            console.error("Error generating tracking events:", eventError);
            // Still show the order without tracking events
            const orderWithEvents: OrderWithTracking = {
              ...orderData,
              trackingEvents: []
            };
            setOrder(orderWithEvents);
          }
        } else {
          errorToast("Order not found");
        }
      } else {
        errorToast("Order not found");
      }
    } catch (error) {
      console.error("Error loading order tracking:", error);
      errorToast("Failed to load order tracking information");
    } finally {
      setLoading(false);
    }
  };

  const generateTrackingEvents = (order: Order): TrackingEvent[] => {
    const events: TrackingEvent[] = [];
    
    // Handle invalid or missing order date
    let baseDate: Date;
    
    if (order.orderDate) {
      baseDate = new Date(order.orderDate);
      // Check if the date is valid
      if (isNaN(baseDate.getTime())) {
        baseDate = new Date(); // Fallback to current date
      }
    } else {
      baseDate = new Date(); // Fallback to current date
    }
    
    // Always add order placed event
    events.push({
      id: "1",
      status: "Order Placed",
      description: "Your order has been placed and is being processed",
      timestamp: baseDate.toISOString()
    });

    // Add events based on current status
    if (!order.status) {
      return events;
    }
    
    if (order.status === 'pending') {
      try {
        events.push({
          id: "2",
          status: "Payment Pending",
          description: "Waiting for payment confirmation",
          timestamp: new Date(baseDate.getTime() + 30 * 60 * 1000).toISOString()
        });
      } catch (dateError) {
        console.error("Error creating pending event timestamp:", dateError);
      }
    }

    if (['processing', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
      try {
        events.push({
          id: "2",
          status: "Order Confirmed",
          description: "Payment confirmed and order is being prepared",
          timestamp: new Date(baseDate.getTime() + 30 * 60 * 1000).toISOString()
        });
        
        events.push({
          id: "3",
          status: "Processing",
          description: "Items are being picked and packed",
          timestamp: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          location: "Warehouse"
        });
      } catch (dateError) {
        console.error("Error creating processing event timestamps:", dateError);
      }
    }

    if (['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
      try {
        events.push({
          id: "4",
          status: "Shipped",
          description: "Package has been shipped and is on its way",
          timestamp: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          location: "Shipping Facility"
        });
        
        events.push({
          id: "5",
          status: "In Transit",
          description: "Package is in transit to destination",
          timestamp: new Date(baseDate.getTime() + 30 * 60 * 60 * 1000).toISOString(),
          location: "Transit Hub"
        });
      } catch (dateError) {
        console.error("Error creating shipped event timestamps:", dateError);
      }
    }

    if (order.status === 'out_for_delivery') {
      try {
        events.push({
          id: "6",
          status: "Out for Delivery",
          description: "Package is out for delivery",
          timestamp: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          location: "Local Delivery Hub"
        });
      } catch (dateError) {
        console.error("Error creating out for delivery event timestamp:", dateError);
      }
    }

    if (order.status === 'delivered') {
      try {
        events.push({
          id: "7",
          status: "Delivered",
          description: "Package has been delivered successfully",
          timestamp: new Date(baseDate.getTime() + 72 * 60 * 60 * 1000).toISOString(),
          location: "Delivery Address"
        });
      } catch (dateError) {
        console.error("Error creating delivered event timestamp:", dateError);
      }
    }

    if (order.status === 'cancelled') {
      try {
        events.push({
          id: "2",
          status: "Cancelled",
          description: "Order has been cancelled",
          timestamp: new Date(baseDate.getTime() + 60 * 60 * 1000).toISOString()
        });
      } catch (dateError) {
        console.error("Error creating cancelled event timestamp:", dateError);
      }
    }

    return events;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingQuery.trim()) {
      loadOrderTracking(trackingQuery.trim());
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed':
      case 'processing': return 'primary';
      case 'packed':
      case 'shipped': 
      case 'in transit':
      case 'out_for_delivery': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled':
      case 'refunded': return 'danger';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Package size={16} />;
    
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={16} />;
      case 'confirmed':
      case 'processing': return <Package size={16} />;
      case 'packed':
      case 'shipped': 
      case 'in transit':
      case 'out_for_delivery': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled':
      case 'refunded': return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const getProgressValue = (status: string | undefined) => {
    if (!status) return 0;
    
    switch (status.toLowerCase()) {
      case 'pending': return 10;
      case 'confirmed': return 20;
      case 'processing': return 30;
      case 'packed': return 40;
      case 'shipped': return 60;
      case 'in transit': return 80;
      case 'out_for_delivery': return 90;
      case 'delivered': return 100;
      case 'cancelled':
      case 'refunded': return 0;
      default: return 0;
    }
  };

  const copyTrackingNumber = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      successToast("Tracking number copied to clipboard!");
    }
  };

  const openCourierTracking = () => {
    if (order?.trackingNumber) {
      // In a real app, this would open the courier's tracking page
      window.open(`https://www.dhl.com/tracking?trackingNumber=${order.trackingNumber}`, '_blank');
    }
  };

  const isEventCompleted = (eventStatus: string, orderStatus: string): boolean => {
    const statusOrder = [
      'Order Placed',
      'Payment Pending', 
      'Order Confirmed',
      'Processing',
      'Shipped',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ];

    const orderStatusMapping = {
      'pending': ['Order Placed', 'Payment Pending'],
      'confirmed': ['Order Placed', 'Order Confirmed'],
      'processing': ['Order Placed', 'Order Confirmed', 'Processing'],
      'packed': ['Order Placed', 'Order Confirmed', 'Processing'],
      'shipped': ['Order Placed', 'Order Confirmed', 'Processing', 'Shipped'],
      'out_for_delivery': ['Order Placed', 'Order Confirmed', 'Processing', 'Shipped', 'In Transit', 'Out for Delivery'],
      'delivered': ['Order Placed', 'Order Confirmed', 'Processing', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'],
      'cancelled': ['Order Placed', 'Cancelled'],
      'refunded': ['Order Placed', 'Cancelled']
    };

    const completedStatuses = orderStatusMapping[orderStatus as keyof typeof orderStatusMapping] || ['Order Placed'];
    return completedStatuses.includes(eventStatus);
  };

  const getEventColor = (eventStatus: string, orderStatus: string): string => {
    if (isEventCompleted(eventStatus, orderStatus)) {
      return 'bg-primary';
    }
    return 'bg-gray-300 dark:bg-gray-600';
  };

  const isCurrentEvent = (eventStatus: string, orderStatus: string, events: TrackingEvent[]): boolean => {
    const completedEvents = events.filter(event => isEventCompleted(event.status, orderStatus));
    if (completedEvents.length === 0) return false;
    
    // The current event is the last completed event
    const lastCompleted = completedEvents[completedEvents.length - 1];
    return lastCompleted.status === eventStatus;
  };

  const getEventStyle = (eventStatus: string, orderStatus: string, events: TrackingEvent[]): string => {
    const baseColor = getEventColor(eventStatus, orderStatus);
    const isCurrent = isCurrentEvent(eventStatus, orderStatus, events);
    
    if (isCurrent && isEventCompleted(eventStatus, orderStatus)) {
      return `rounded-full ${baseColor} ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900 w-5 h-5`;
    }
    
    return `rounded-full ${baseColor} w-4 h-4`;
  };

  const getConnectorColor = (currentIndex: number, orderStatus: string, events: TrackingEvent[]): string => {
    // If current event and next event are both completed, make connector active
    if (currentIndex < events.length - 1) {
      const currentCompleted = isEventCompleted(events[currentIndex].status, orderStatus);
      const nextCompleted = isEventCompleted(events[currentIndex + 1].status, orderStatus);
      if (currentCompleted && nextCompleted) {
        return 'bg-primary';
      }
    }
    return 'bg-gray-200 dark:bg-gray-600';
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your order status and delivery information
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold">Track Your Order</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter order number, tracking number, or email"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  startContent={<Search size={16} />}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  color="primary"
                  isLoading={loading}
                  disabled={!trackingQuery.trim()}
                >
                  Track Order
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can track using order number (ORD-XXXXXXXX-XXXX), tracking number, or email address
              </p>
            </form>
          </CardBody>
        </Card>

        {/* Order Details */}
        {order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardBody className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {order.orderNumber || 'Unknown Order'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Placed on {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Unknown Date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Chip
                      color={getStatusColor(order.status)}
                      variant="flat"
                      startContent={getStatusIcon(order.status)}
                      size="lg"
                    >
                      {order.status ? order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                    </Chip>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Order Progress</span>
                    <span>{getProgressValue(order.status || 'pending')}%</span>
                  </div>
                  <Progress
                    value={getProgressValue(order.status || 'pending')}
                    color={getStatusColor(order.status || 'pending') as any}
                    size="lg"
                  />
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Tracking Information
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<Copy size={16} />}
                          onPress={copyTrackingNumber}
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<ExternalLink size={16} />}
                          onPress={openCourierTracking}
                        >
                          Track
                        </Button>
                      </div>
                    </div>
                    <p className="text-blue-600 dark:text-blue-300 font-mono text-sm">
                      {order.trackingNumber}
                    </p>
                    {order.estimatedDelivery && (
                      <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                        Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Timeline and Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck size={20} />
                    Tracking Timeline
                  </h3>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                  <div className="space-y-4">
                    {order.trackingEvents.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={getEventStyle(event.status, order.status || 'pending', order.trackingEvents)} />
                          {index < order.trackingEvents.length - 1 && (
                            <div className={`w-px h-8 mt-2 ${getConnectorColor(index, order.status || 'pending', order.trackingEvents)}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {event.status}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {event.description}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                              <MapPin size={12} />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Order Details */}
              <div className="space-y-6">
                {/* Items */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package size={20} />
                      Order Items
                    </h3>
                  </CardHeader>
                  <Divider />
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      {order.items && order.items.length > 0 ? order.items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.sku && `SKU: ${item.sku} • `}
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      )) : (
                        <div className="text-center py-4">
                          <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">No items found</p>
                        </div>
                      )}
                    </div>
                    <Divider className="my-4" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </CardBody>
                </Card>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin size={20} />
                        Shipping Address
                      </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="p-6">
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.shippingAddress.fullName}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {order.shippingAddress.address}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {order.shippingAddress.country}
                        </p>
                        {order.shippingAddress.phone && (
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Phone size={14} />
                            {order.shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Contact Support */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Need Help?</h3>
                  </CardHeader>
                  <Divider />
                  <CardBody className="p-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      If you have questions about your order, we're here to help.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="flat"
                        startContent={<Mail size={16} />}
                        className="flex-1"
                      >
                        Email Support
                      </Button>
                      <Button
                        variant="flat"
                        startContent={<Phone size={16} />}
                        className="flex-1"
                      >
                        Call Support
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <Card>
              <CardBody className="text-center py-12">
                <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Enter tracking information
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the search form above to track your order
                </p>
              </CardBody>
            </Card>
          )
        )}
      </div>
    </div>
  );
} 