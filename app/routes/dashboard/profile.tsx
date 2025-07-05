import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Avatar,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Camera,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Check,
} from "lucide-react";
import { toast } from "~/components/toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
}

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_account';
  name: string;
  last4?: string;
  expiryDate?: string;
  cardType?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modals
  const { isOpen: isAddressModalOpen, onOpen: onAddressModalOpen, onClose: onAddressModalClose } = useDisclosure();
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onClose: onPasswordModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bio: ''
  });
  
  const [addressForm, setAddressForm] = useState({
    type: 'shipping' as 'shipping' | 'billing',
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    isDefault: false
  });
  
  const [paymentForm, setPaymentForm] = useState({
    type: 'card' as 'card' | 'mobile_money' | 'bank_account',
    name: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: '',
    bankName: '',
    accountNumber: '',
    isDefault: false
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // In a real app, this would be an API call
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const userProfile: UserProfile = {
          id: parsedUser.id || "1",
          name: parsedUser.name || "John Doe",
          email: parsedUser.email || "john@example.com",
          phone: parsedUser.phone || "+1234567890",
          avatar: parsedUser.avatar,
          joinDate: parsedUser.joinDate || "2024-01-15",
          dateOfBirth: parsedUser.dateOfBirth || "1990-01-01",
          gender: parsedUser.gender || "male",
          bio: parsedUser.bio || "Love shopping for the latest tech gadgets!"
        };
        setUser(userProfile);
        setProfileForm({
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          dateOfBirth: userProfile.dateOfBirth || '',
          gender: userProfile.gender || '',
          bio: userProfile.bio || ''
        });
      }

      // Mock addresses
      setAddresses([
        {
          id: "1",
          type: "shipping",
          name: "John Doe",
          street: "123 Main St, Apt 4B",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "United States",
          phone: "+1234567890",
          isDefault: true
        },
        {
          id: "2",
          type: "billing",
          name: "John Doe",
          street: "456 Oak Ave",
          city: "Brooklyn",
          state: "NY",
          zipCode: "11201",
          country: "United States",
          phone: "+1234567890",
          isDefault: false
        }
      ]);

      // Mock payment methods
      setPaymentMethods([
        {
          id: "1",
          type: "card",
          name: "Visa ending in 1234",
          last4: "1234",
          expiryDate: "12/25",
          cardType: "Visa",
          isDefault: true
        },
        {
          id: "2",
          type: "mobile_money",
          name: "MTN Mobile Money",
          phoneNumber: "+233123456789",
          isDefault: false
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load profile data");
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // In a real app, this would be an API call
      const updatedUser = { ...user, ...profileForm };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser as UserProfile);
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingAddress) {
        // Update existing address
        setAddresses(addresses.map(addr => 
          addr.id === editingAddress.id 
            ? { ...addr, ...addressForm }
            : addr
        ));
        toast.success("Address updated successfully!");
      } else {
        // Add new address
        const newAddress: Address = {
          id: Date.now().toString(),
          ...addressForm
        };
        setAddresses([...addresses, newAddress]);
        toast.success("Address added successfully!");
      }
      
      onAddressModalClose();
      setAddressForm({
        type: 'shipping',
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
        isDefault: false
      });
      setEditingAddress(null);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingPayment) {
        // Update existing payment method
        setPaymentMethods(paymentMethods.map(pm => 
          pm.id === editingPayment.id 
            ? { ...pm, name: paymentForm.name, isDefault: paymentForm.isDefault }
            : pm
        ));
        toast.success("Payment method updated successfully!");
      } else {
        // Add new payment method
        let newPaymentMethod: PaymentMethod;
        
        if (paymentForm.type === 'card') {
          newPaymentMethod = {
            id: Date.now().toString(),
            type: 'card',
            name: `${paymentForm.name} ending in ${paymentForm.cardNumber.slice(-4)}`,
            last4: paymentForm.cardNumber.slice(-4),
            expiryDate: paymentForm.expiryDate,
            cardType: paymentForm.name,
            isDefault: paymentForm.isDefault
          };
        } else if (paymentForm.type === 'mobile_money') {
          newPaymentMethod = {
            id: Date.now().toString(),
            type: 'mobile_money',
            name: `Mobile Money - ${paymentForm.phoneNumber}`,
            phoneNumber: paymentForm.phoneNumber,
            isDefault: paymentForm.isDefault
          };
        } else {
          newPaymentMethod = {
            id: Date.now().toString(),
            type: 'bank_account',
            name: `${paymentForm.bankName} - ${paymentForm.accountNumber.slice(-4)}`,
            bankName: paymentForm.bankName,
            accountNumber: paymentForm.accountNumber,
            isDefault: paymentForm.isDefault
          };
        }
        
        setPaymentMethods([...paymentMethods, newPaymentMethod]);
        toast.success("Payment method added successfully!");
      }
      
      onPaymentModalClose();
      setPaymentForm({
        type: 'card',
        name: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        phoneNumber: '',
        bankName: '',
        accountNumber: '',
        isDefault: false
      });
      setEditingPayment(null);
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    setSaving(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Password updated successfully!");
      onPasswordModalClose();
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    toast.success("Address deleted successfully!");
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
    toast.success("Payment method deleted successfully!");
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault
    });
    onAddressModalOpen();
  };

  const handleEditPaymentMethod = (payment: PaymentMethod) => {
    setEditingPayment(payment);
    setPaymentForm({
      type: payment.type,
      name: payment.name,
      cardNumber: '',
      expiryDate: payment.expiryDate || '',
      cvv: '',
      phoneNumber: payment.phoneNumber || '',
      bankName: payment.bankName || '',
      accountNumber: '',
      isDefault: payment.isDefault
    });
    onPaymentModalOpen();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUser(prev => prev ? { ...prev, avatar: result } : null);
        // In a real app, you would upload the file to a server
        toast.success("Avatar updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardBody className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={user?.avatar}
                  name={user?.name}
                  size="lg"
                  className="w-20 h-20"
                  showFallback
                />
                <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Member since {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <div className="w-full">
          <Tabs 
            aria-label="Profile sections" 
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tab key="profile" title="Profile Information">
              <Card>
                <CardBody className="p-6">
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Full Name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        startContent={<User size={16} />}
                        isRequired
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        startContent={<Mail size={16} />}
                        isRequired
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        startContent={<Phone size={16} />}
                      />
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                      />
                      <Select
                        label="Gender"
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                      >
                        <SelectItem key="male" value="male">Male</SelectItem>
                        <SelectItem key="female" value="female">Female</SelectItem>
                        <SelectItem key="other" value="other">Other</SelectItem>
                        <SelectItem key="prefer_not_to_say" value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </Select>
                    </div>
                    
                    <Textarea
                      label="Bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    
                    <div className="flex justify-end gap-3">
                      <Button
                        color="primary"
                        type="submit"
                        isLoading={saving}
                        startContent={<Save size={16} />}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            </Tab>

            <Tab key="addresses" title="Addresses">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Saved Addresses</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage your shipping and billing addresses
                    </p>
                  </div>
                  <Button
                    color="primary"
                    startContent={<Plus size={16} />}
                    onPress={onAddressModalOpen}
                  >
                    Add Address
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Chip
                              size="sm"
                              color={address.type === 'shipping' ? 'primary' : 'secondary'}
                              variant="flat"
                            >
                              {address.type === 'shipping' ? 'Shipping' : 'Billing'}
                            </Chip>
                            {address.isDefault && (
                              <Chip size="sm" color="success" variant="flat">
                                Default
                              </Chip>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {address.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {address.street}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {address.country}
                          </p>
                          {address.phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {address.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleEditAddress(address)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            color="danger"
                            onPress={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </Tab>

            <Tab key="payments" title="Payment Methods">
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Payment Methods</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage your saved payment methods
                    </p>
                  </div>
                  <Button
                    color="primary"
                    startContent={<Plus size={16} />}
                    onPress={onPaymentModalOpen}
                  >
                    Add Payment Method
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  {paymentMethods.map((payment) => (
                    <div key={payment.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {payment.name}
                              </p>
                              {payment.isDefault && (
                                <Chip size="sm" color="success" variant="flat">
                                  Default
                                </Chip>
                              )}
                            </div>
                            {payment.expiryDate && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Expires {payment.expiryDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleEditPaymentMethod(payment)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            color="danger"
                            onPress={() => handleDeletePaymentMethod(payment.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </Tab>

            <Tab key="security" title="Security">
              <Card>
                <CardHeader>
                  <div>
                    <h3 className="text-lg font-semibold">Security Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage your account security
                    </p>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Password
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last changed 3 months ago
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="flat"
                      onPress={onPasswordModalOpen}
                    >
                      Change Password
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trash2 size={20} className="text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Delete Account
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Permanently delete your account and all data
                        </p>
                      </div>
                    </div>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={onDeleteModalOpen}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>

        {/* Address Modal */}
        <Modal isOpen={isAddressModalOpen} onClose={onAddressModalClose} size="2xl">
          <ModalContent>
            <form onSubmit={handleAddressSubmit}>
              <ModalHeader>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Address Type"
                    value={addressForm.type}
                    onChange={(e) => setAddressForm({...addressForm, type: e.target.value as 'shipping' | 'billing'})}
                  >
                    <SelectItem key="shipping" value="shipping">Shipping Address</SelectItem>
                    <SelectItem key="billing" value="billing">Billing Address</SelectItem>
                  </Select>
                  
                  <Input
                    label="Full Name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                    isRequired
                  />
                  
                  <Input
                    label="Street Address"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                    isRequired
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      isRequired
                    />
                    <Input
                      label="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      isRequired
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="ZIP Code"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                      isRequired
                    />
                    <Input
                      label="Country"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                      isRequired
                    />
                  </div>
                  
                  <Input
                    label="Phone Number"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onAddressModalClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={saving}
                  startContent={<Save size={16} />}
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Payment Method Modal */}
        <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="2xl">
          <ModalContent>
            <form onSubmit={handlePaymentSubmit}>
              <ModalHeader>
                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Payment Type"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value as any})}
                  >
                    <SelectItem key="card" value="card">Credit/Debit Card</SelectItem>
                    <SelectItem key="mobile_money" value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem key="bank_account" value="bank_account">Bank Account</SelectItem>
                  </Select>
                  
                  {paymentForm.type === 'card' && (
                    <>
                      <Input
                        label="Card Holder Name"
                        value={paymentForm.name}
                        onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})}
                        isRequired
                      />
                      <Input
                        label="Card Number"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                        placeholder="1234 5678 9012 3456"
                        isRequired
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          value={paymentForm.expiryDate}
                          onChange={(e) => setPaymentForm({...paymentForm, expiryDate: e.target.value})}
                          placeholder="MM/YY"
                          isRequired
                        />
                        <Input
                          label="CVV"
                          value={paymentForm.cvv}
                          onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})}
                          placeholder="123"
                          isRequired
                        />
                      </div>
                    </>
                  )}
                  
                  {paymentForm.type === 'mobile_money' && (
                    <Input
                      label="Phone Number"
                      value={paymentForm.phoneNumber}
                      onChange={(e) => setPaymentForm({...paymentForm, phoneNumber: e.target.value})}
                      placeholder="+233123456789"
                      isRequired
                    />
                  )}
                  
                  {paymentForm.type === 'bank_account' && (
                    <>
                      <Input
                        label="Bank Name"
                        value={paymentForm.bankName}
                        onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                        isRequired
                      />
                      <Input
                        label="Account Number"
                        value={paymentForm.accountNumber}
                        onChange={(e) => setPaymentForm({...paymentForm, accountNumber: e.target.value})}
                        isRequired
                      />
                    </>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onPaymentModalClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={saving}
                  startContent={<Save size={16} />}
                >
                  {editingPayment ? 'Update Payment Method' : 'Add Payment Method'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Password Modal */}
        <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose}>
          <ModalContent>
            <form onSubmit={handlePasswordUpdate}>
              <ModalHeader>Change Password</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    isRequired
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    isRequired
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    isRequired
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onPasswordModalClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={saving}
                  startContent={<Save size={16} />}
                >
                  Update Password
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Delete Account Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
          <ModalContent>
            <ModalHeader>Delete Account</ModalHeader>
            <ModalBody>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete your account? This action cannot be undone.
                All your data, including orders, wishlist, and profile information will be permanently removed.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteModalClose}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={() => {
                  // In a real app, this would be an API call
                  toast.error("Account deletion is not implemented in this demo");
                  onDeleteModalClose();
                }}
              >
                Delete Account
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
} 