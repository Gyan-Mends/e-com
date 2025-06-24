import { useState, useEffect, useCallback } from "react";
import { Button, Select, SelectItem, Chip, Avatar } from "@heroui/react";
import { Plus, Edit, Trash2, Shield, User, Upload, X } from "lucide-react";
import DataTable, { type Column } from "../components/DataTable";
import Drawer from "../components/Drawer";
import CustomInput from "../components/CustomInput";
import ConfirmModal from "../components/confirmModal";
import axios from "axios";
import { successToast, errorToast } from "../components/toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller';
  isActive: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "seller" as "admin" | "seller",
    phone: "",
    address: "",
    avatar: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      errorToast('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search functionality
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase()) ||
      user.role.toLowerCase().includes(term.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users]);

  // Update filtered users when users change
  useEffect(() => {
    handleSearch(searchTerm);
  }, [users, searchTerm, handleSearch]);

  const columns: Column<User>[] = [
    {
      key: "name",
      title: "Name", 
      sortable: true,
      searchable: true,
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            src={record.avatar}
            name={record.name}
            size="md"
            className="w-10 h-10"
            showFallback
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      key: "role",
      title: "Role",
      sortable: true,
      render: (value) => (
        <Chip
          startContent={value === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
          color={value === 'admin' ? 'warning' : 'primary'}
          size="sm"
          variant="flat"
        >
          {value === 'admin' ? 'Administrator' : 'Seller'}
        </Chip>
      )
    },
    {
      key: "isActive", 
      title: "Status",
      sortable: true,
      render: (value) => (
        <Chip
          color={value ? 'success' : 'danger'}
          size="sm"
          variant="flat"
        >
          {value ? 'Active' : 'Inactive'}
        </Chip>
      )
    },
    {
      key: "phone",
      title: "Phone",
      render: (value) => value || "-"
    },
    {
      key: "createdAt",
      title: "Created",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: "lastLogin",
      title: "Last Login",
      render: (value) => value ? new Date(value).toLocaleString() : "Never"
    },
    {
      key: "actions",
      title: "Actions",
      width: "120px",
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="primary"
            onPress={() => handleEdit(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={() => handleDeleteClick(record)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleCreate = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "seller",
      phone: "",
      address: "",
      avatar: ""
    });
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      avatar: user.avatar || ""
    });
    setErrors({});
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!isEditing && !formData.password.trim()) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        ...(isEditing && selectedUser ? { id: selectedUser._id } : {})
      };

      let response;
      if (isEditing) {
        response = await axios.put('/api/users', payload);
      } else {
        response = await axios.post('/api/users', payload);
      }

      if (response.data.success) {
        // Refresh users list
        await fetchUsers();
        setIsDrawerOpen(false);
        
        // Show success toast
        if (isEditing) {
          successToast('User updated successfully!');
        } else {
          successToast('User created successfully!');
        }
      } else {
        setErrors({ general: response.data.error || 'An error occurred' });
        errorToast(response.data.error || 'Failed to save user');
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      const errorMessage = error.response?.data?.error || 'Failed to save user';
      setErrors({ general: errorMessage });
      errorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.delete('/api/users', {
        data: { id: selectedUser._id }
      });

      if (response.data.success) {
        setUsers(prev => prev.filter(u => u._id !== selectedUser._id));
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        successToast('User deleted successfully!');
      } else {
        console.error('Failed to delete user:', response.data.error);
        errorToast(response.data.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      errorToast(errorMessage);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file' }));
        errorToast('Please select a valid image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 2MB' }));
        errorToast('Image size must be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: base64 }));
        setErrors(prev => ({ ...prev, avatar: '' }));
        successToast('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage system users and their permissions
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleCreate}
        >
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredUsers.length}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Filtered Users' : 'Total Users'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredUsers.filter(u => u.role === 'admin').length}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Administrators</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredUsers.filter(u => u.isActive).length}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Active Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <CustomInput
          placeholder="Search users by name, email, role, or phone..."
          value={searchTerm}
          onChange={(value) => handleSearch(value)}
          className="max-w-md"
        />
      </div>

      {/* Users Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search users..."
        emptyText={searchTerm ? "No users found matching your search" : "No users found"}
        showSearch={false}
      />

      {/* Add/Edit User Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? "Edit User" : "Add New User"}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Profile Picture
            </label>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar
                  src={formData.avatar}
                  name={formData.name || "User"}
                  size="lg"
                  className="w-24 h-24 ring-4 ring-white dark:ring-gray-700 shadow-lg"
                  showFallback
                />
                {formData.avatar && (
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="solid"
                    className="absolute -top-2 -right-2 min-w-6 h-6 rounded-full"
                    onPress={removeImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              <div className="text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="bordered"
                  size="sm"
                  startContent={<Upload className="w-4 h-4" />}
                  onPress={() => document.getElementById('avatar-upload')?.click()}
                  className="mb-2"
                >
                  {formData.avatar ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF (max 2MB)
                </p>
                {errors.avatar && (
                  <p className="text-sm text-red-500 mt-1">{errors.avatar}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <CustomInput
                label="Full Name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                error={errors.name}
                required
              />

              <CustomInput
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                error={errors.email}
                required
              />

              <CustomInput
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              />
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Account Settings
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <CustomInput
                label={isEditing ? "New Password (leave empty to keep current)" : "Password"}
                type="password"
                placeholder="Enter password (minimum 6 characters)"
                value={formData.password}
                onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                error={errors.password}
                required={!isEditing}
              />

              <div className="space-y-2">
                <Select
                  label="Role"
                  placeholder="Select user role"
                  selectedKeys={[formData.role]}
                  onSelectionChange={(keys) => {
                    const role = Array.from(keys)[0] as "admin" | "seller";
                    setFormData(prev => ({ ...prev, role }));
                  }}
                  variant="bordered"
                  classNames={{
                    label: "font-nunito text-sm !text-black dark:!text-white",
                    trigger: "border border-black/20 dark:border-white/20 bg-white dark:bg-gray-800"
                  }}
                >
                  <SelectItem key="seller" textValue="Seller">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Seller</span>
                    </div>
                  </SelectItem>
                  <SelectItem key="admin" textValue="Administrator">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Administrator</span>
                    </div>
                  </SelectItem>
                </Select>
                <p className="text-xs text-gray-500">
                  {formData.role === 'admin' 
                    ? 'Full access to all system features and settings' 
                    : 'Limited access to sales and customer management'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Additional Information
            </h3>
            
            <CustomInput
              label="Address"
              type="textarea"
              placeholder="Enter full address"
              value={formData.address}
              onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
              rows={3}
            />
          </div>

          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="light"
              onPress={() => setIsDrawerOpen(false)}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              startContent={isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {isEditing ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={() => setIsDeleteModalOpen(false)}
        header="Delete User"
        content={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
      >
        <div className="flex space-x-3">
          <Button
            variant="light"
            onPress={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
          >
            Delete User
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
} 