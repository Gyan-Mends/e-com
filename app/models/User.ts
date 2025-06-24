import mongoose from '../mongoose.server';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'seller';
  isActive: boolean;
  permissions: string[];
  avatar?: string; // URL to uploaded image
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  phone?: string;
  address?: string;
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['admin', 'seller'],
    default: 'seller',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String,
    enum: [
      // Dashboard permissions
      'view_dashboard',
      'view_analytics',
      
      // Sales permissions
      'create_sale',
      'view_sales',
      'refund_sale',
      'apply_discount',
      
      // Product permissions
      'create_product',
      'view_products',
      'edit_product',
      'delete_product',
      'manage_inventory',
      
      // Customer permissions
      'create_customer',
      'view_customers',
      'edit_customer',
      'delete_customer',
      
      // User permissions
      'create_user',
      'view_users',
      'edit_user',
      'delete_user',
      
      // Reports permissions
      'view_reports',
      'export_reports',
      
      // Settings permissions
      'manage_settings',
      'backup_data'
    ]
  }],
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    if (this.role === 'admin') {
      // Admin gets all permissions
      this.permissions = [
        'view_dashboard', 'view_analytics',
        'create_sale', 'view_sales', 'refund_sale', 'apply_discount',
        'create_product', 'view_products', 'edit_product', 'delete_product', 'manage_inventory',
        'create_customer', 'view_customers', 'edit_customer', 'delete_customer',
        'create_user', 'view_users', 'edit_user', 'delete_user',
        'view_reports', 'export_reports',
        'manage_settings', 'backup_data'
      ];
    } else {
      // Seller gets limited permissions
      this.permissions = [
        'view_dashboard',
        'create_sale', 'view_sales', 'apply_discount',
        'view_products',
        'create_customer', 'view_customers', 'edit_customer'
      ];
    }
  }
  next();
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User; 