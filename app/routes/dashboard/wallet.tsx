import { useState, useEffect } from "react";
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
} from "@heroui/react";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

export default function Wallet() {
  const [balance, setBalance] = useState(125.50);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      // Mock transactions
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "credit",
          amount: 50.00,
          description: "Added funds via credit card",
          date: "2025-01-03",
          status: "completed",
          reference: "TOP-001"
        },
        {
          id: "2",
          type: "debit",
          amount: 24.50,
          description: "Purchase - Order #ORD-20250103-0001",
          date: "2025-01-02",
          status: "completed",
          reference: "ORD-20250103-0001"
        },
        {
          id: "3",
          type: "refund",
          amount: 99.99,
          description: "Refund - Order #ORD-20241225-0004",
          date: "2024-12-28",
          status: "completed",
          reference: "REF-001"
        }
      ];
      
      setTransactions(mockTransactions);
      setLoading(false);
    } catch (error) {
      console.error("Error loading wallet data:", error);
      setLoading(false);
    }
  };

  const handleAddFunds = () => {
    // In a real app, this would process payment
    const amount = parseFloat(addFundsAmount);
    if (amount > 0) {
      setBalance(prev => prev + amount);
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: "credit",
        amount,
        description: "Added funds via credit card",
        date: new Date().toISOString().split('T')[0],
        status: "completed",
        reference: `TOP-${Date.now()}`
      };
      setTransactions(prev => [newTransaction, ...prev]);
      setAddFundsAmount("");
      onClose();
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit': return <ArrowDownLeft className="text-green-500" size={20} />;
      case 'debit': return <ArrowUpRight className="text-red-500" size={20} />;
      case 'refund': return <RefreshCw className="text-blue-500" size={20} />;
      default: return <DollarSign size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit': return 'text-green-600 dark:text-green-400';
      case 'debit': return 'text-red-600 dark:text-red-400';
      case 'refund': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

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
            Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your wallet balance and transaction history
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8">
          <CardBody className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <WalletIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Available Balance
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${balance.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                color="primary"
                size="lg"
                startContent={<Plus size={20} />}
                onPress={onOpen}
              >
                Add Funds
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your recent wallet activities
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="p-6">
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <WalletIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No transactions yet
                  </p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                          {transaction.reference && ` • ${transaction.reference}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'debit' ? '-' : '+'}{transaction.amount.toFixed(2)}
                      </p>
                      <Chip
                        size="sm"
                        color={transaction.status === 'completed' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {transaction.status}
                      </Chip>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Add Funds Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Add Funds to Wallet</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Amount"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  placeholder="0.00"
                  startContent={<DollarSign size={16} />}
                />
                <Select label="Payment Method">
                  <SelectItem key="card">Credit/Debit Card</SelectItem>
                  <SelectItem key="bank">Bank Transfer</SelectItem>
                  <SelectItem key="mobile">Mobile Money</SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleAddFunds}
                disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0}
              >
                Add Funds
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
} 