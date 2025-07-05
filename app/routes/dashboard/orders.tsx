import { Link } from "react-router";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  Chip,
} from "@heroui/react";
import {
  Package,
  Search,
  Eye,
  RotateCcw,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { ordersAPI, authAPI } from "~/utils/api";
import type { Order, APIResponse } from "~/utils/api";
import DataTable from "~/components/DataTable";
import type { Column } from "~/components/DataTable";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const user = authAPI.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const params: any = {
        customerId: user.id || user._id,
        page: 1,
        limit: 50,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (dateRange !== "all") {
        const now = new Date();
        let dateFrom = new Date();
        
        switch (dateRange) {
          case "week":
            dateFrom.setDate(now.getDate() - 7);
            break;
          case "month":
            dateFrom.setMonth(now.getMonth() - 1);
            break;
          case "year":
            dateFrom.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        params.dateFrom = dateFrom.toISOString().split('T')[0];
        params.dateTo = now.toISOString().split('T')[0];
      }

      const response = await ordersAPI.getAll(params) as APIResponse<{ orders: Order[] }>;
      
      if (response.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, dateRange, searchQuery]);

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

  const handleViewOrder = (order: Order) => {
    navigate(`/dashboard/order-tracking?order=${order.orderNumber}`);
  };

  const handleReorder = (orderId: string) => {
    // In a real app, this would add items to cart
    console.log("Reordering:", orderId);
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      title: 'Order Number',
      sortable: true,
      searchable: true,
      render: (value: string, order: Order) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {value}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(order.orderDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'customerInfo',
      title: 'Customer',
      searchable: true,
      render: (value: any, order: Order) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {value.firstName} {value.lastName}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value.email}
          </span>
        </div>
      ),
    },
    {
      key: 'items',
      title: 'Items',
      render: (value: any[], order: Order) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {value.length} item{value.length > 1 ? 's' : ''}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {value.slice(0, 2).map(item => item.name).join(', ')}
            {value.length > 2 && ` +${value.length - 2} more`}
          </span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      title: 'Total',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <span className="font-medium text-gray-900 dark:text-white">
          ${value.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      align: 'center',
      render: (value: string) => (
        <Chip
          color={getStatusColor(value)}
          variant="flat"
          startContent={getStatusIcon(value)}
          size="sm"
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Chip>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      align: 'center',
      render: (value: any, order: Order) => (
        <div className="flex gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => handleViewOrder(order)}
          >
            <Eye size={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => handleReorder(order._id)}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage all your orders
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search size={16} />}
                className="md:col-span-2"
              />
              <Select
                label="Status"
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
                <SelectItem key="processing">Processing</SelectItem>
                <SelectItem key="shipped">Shipped</SelectItem>
                <SelectItem key="delivered">Delivered</SelectItem>
                <SelectItem key="cancelled">Cancelled</SelectItem>
              </Select>
              <Select
                label="Date Range"
                selectedKeys={dateRange ? [dateRange] : []}
                onSelectionChange={(keys) => setDateRange(Array.from(keys)[0] as string)}
              >
                <SelectItem key="all">All Time</SelectItem>
                <SelectItem key="week">Last Week</SelectItem>
                <SelectItem key="month">Last Month</SelectItem>
                <SelectItem key="year">Last Year</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Orders Table */}
        <DataTable
          data={orders}
          columns={columns}
          loading={loading}
          pageSize={20}
          searchPlaceholder="Search orders..."
          emptyText="No orders found"
          showSearch={false}
          onRowClick={(order) => handleViewOrder(order)}
        />

      </div>
    </div>
  );
} 