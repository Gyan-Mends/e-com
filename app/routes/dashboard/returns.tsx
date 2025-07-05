import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Divider,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Image,

} from "@heroui/react";
import {
  RotateCcw,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Upload,
  FileText,
  AlertCircle,
} from "lucide-react";
import { errorToast, successToast } from "~/components/toast";
import { ordersAPI, authAPI } from "~/utils/api";
import type { ReturnRequest, APIResponse } from "~/utils/api";
import DataTable from "~/components/DataTable";
import type { Column } from "~/components/DataTable";

export default function Returns() {
  const [searchParams] = useSearchParams();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnForm, setReturnForm] = useState({
    orderNumber: '',
    reason: '',
    description: '',
    items: [] as string[]
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadReturns();
    const orderNumber = searchParams.get('order');
    if (orderNumber) {
      setReturnForm(prev => ({ ...prev, orderNumber }));
      onOpen();
    }
  }, [searchParams]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const user = authAPI.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const response = await ordersAPI.getReturnRequests({
        customerId: user.id || user._id,
        page: 1,
        limit: 50,
      }) as APIResponse<{ returns: ReturnRequest[] }>;
      
      if (response.success) {
        setReturns(response.data.returns || []);
      }
    } catch (error) {
      console.error("Error loading returns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReturn = async () => {
    try {
      const returnData = {
        orderNumber: returnForm.orderNumber,
        reason: returnForm.reason,
        notes: returnForm.description,
        items: returnForm.items
      };

      const response = await ordersAPI.createReturnRequest(returnData) as APIResponse<ReturnRequest>;
      
      if (response.success) {
        setReturns(prev => [response.data, ...prev]);
        setReturnForm({ orderNumber: '', reason: '', description: '', items: [] });
        onClose();
        successToast("Return request submitted successfully!");
      } else {
        errorToast("Failed to submit return request");
      }
    } catch (error) {
      console.error("Error submitting return:", error);
      errorToast("Failed to submit return request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'completed': return <Package size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'orderNumber',
      title: 'Order Number',
      sortable: true,
      searchable: true,
      render: (value: string, returnRequest: ReturnRequest) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {value}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Request #{returnRequest._id.slice(-6)}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      searchable: true,
      render: (value: string) => (
        <span className="text-gray-900 dark:text-white">
          {value}
        </span>
      ),
    },
    {
      key: 'items',
      title: 'Items',
      render: (value: any[], returnRequest: ReturnRequest) => (
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
      key: 'refundAmount',
      title: 'Refund Amount',
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
      key: 'requestDate',
      title: 'Request Date',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-900 dark:text-white">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Returns & Refunds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your return requests and refunds
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onOpen}>
            <CardBody className="p-6 text-center">
              <RotateCcw className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Request Return
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new return request
              </p>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Return Policy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View our return policy
              </p>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Get Help
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Contact customer support
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Return Requests */}
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Your Return Requests</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track the status of your return requests
              </p>
            </div>
            <Button
              color="primary"
              startContent={<RotateCcw size={16} />}
              onPress={onOpen}
            >
              New Return
            </Button>
          </CardHeader>
        </Card>

        <DataTable
          data={returns}
          columns={columns}
          loading={loading}
          pageSize={15}
          searchPlaceholder="Search return requests..."
          emptyText="No return requests found"
        />

        {/* Return Request Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <ModalHeader>Request Return</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Order Number"
                  value={returnForm.orderNumber}
                  onChange={(e) => setReturnForm({...returnForm, orderNumber: e.target.value})}
                  placeholder="ORD-XXXXXXXX-XXXX"
                  isRequired
                />
                
                <Select
                  label="Reason for Return"
                  selectedKeys={returnForm.reason ? [returnForm.reason] : []}
                  onSelectionChange={(keys) => setReturnForm({...returnForm, reason: Array.from(keys)[0] as string})}
                  isRequired
                >
                  <SelectItem key="defective">Defective product</SelectItem>
                  <SelectItem key="wrong_item">Wrong item received</SelectItem>
                  <SelectItem key="size_fit">Size/fit issues</SelectItem>
                  <SelectItem key="changed_mind">Changed mind</SelectItem>
                  <SelectItem key="damaged">Damaged during shipping</SelectItem>
                  <SelectItem key="other">Other</SelectItem>
                </Select>
                
                <Textarea
                  label="Description"
                  value={returnForm.description}
                  onChange={(e) => setReturnForm({...returnForm, description: e.target.value})}
                  placeholder="Please provide additional details about your return request..."
                  rows={4}
                />
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Return Policy
                  </h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• Items must be returned within 30 days of purchase</li>
                    <li>• Items must be in original condition with packaging</li>
                    <li>• Refunds will be processed within 5-7 business days</li>
                    <li>• Return shipping costs may apply</li>
                  </ul>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmitReturn}
                disabled={!returnForm.orderNumber || !returnForm.reason}
              >
                Submit Return Request
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
} 