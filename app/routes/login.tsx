import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  Checkbox,
} from "@heroui/react";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, UserPlus, LogIn } from "lucide-react";
import { successToast, errorToast } from "../components/toast";

// API function to login
const loginAPI = async (email: string, password: string, rememberMe: boolean = false) => {
  const response = await fetch('http://localhost:5173/api/customers/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      rememberMe
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  
  return data;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const redirectTo = searchParams.get('redirect') || 'home';

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await loginAPI(formData.email, formData.password, formData.rememberMe);
      
      if (response.success) {
        // Store customer session
        localStorage.setItem("user", JSON.stringify({
          ...response.data.customer,
          type: 'customer',
          loginTime: new Date().toISOString(),
        }));
        
        successToast("Login successful! Welcome back.");
        // Redirect to intended page
        navigate(`/${redirectTo}`);
      } else {
        errorToast(response.message || "Login failed");
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message.includes('401')) {
        errorToast("Invalid email or password");
      } else if (error.message.includes('400')) {
        errorToast("Please check your email and password");
      } else {
        errorToast(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: "customer@shophub.com",
      password: "customer123",
      rememberMe: false,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center customed-dark-bg p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            as={Link}
            to="/"
            variant="light"
            startContent={<ArrowLeft size={20} />}
            className="text-gray-600 dark:text-gray-400"
          >
            Back to Home
          </Button>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 customed-dark-bg">
          <CardHeader className="pb-0 pt-6 px-6 flex-col items-center">
            <div className="flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">
              Sign in to your account
            </p>
          </CardHeader>
          
          <CardBody className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-4">

              <div>
                <Input
                  variant="bordered"
                  type="email"
                  label="Email Address"
                  labelPlacement="outside"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                  startContent={<Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                  isDisabled={isLoading}
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300 font-medium",
                    input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                  }}
                />
              </div>

              <div>
                <Input
                  variant="bordered"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  labelPlacement="outside"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  startContent={<Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  }
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  isDisabled={isLoading}
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300 font-medium",
                    input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <Checkbox
                  isSelected={formData.rememberMe}
                  onValueChange={(checked) => handleInputChange('rememberMe', checked)}
                  size="sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </Checkbox>
              </div>

              <Button
                type="submit"
                color="primary"
                size="md"
                className="w-full font-semibold"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Divider className="my-6" />

            
          </CardBody>

          <div className="text-center pb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
} 