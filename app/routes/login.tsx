import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Checkbox } from "@heroui/react";
import { Eye, EyeOff, Lock, Mail, LogIn } from "lucide-react";
import { useNavigate } from "react-router";
import axios from "axios";
import CustomInput from "../components/CustomInput";
import { successToast, errorToast } from "../components/toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', formData);
      
      if (response.data.success) {
        successToast('Login successful! Welcome back.');
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setErrors({ general: response.data.error || 'Login failed' });
        errorToast(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || 'Network error. Please try again.';
      setErrors({ general: errorMessage });
      errorToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">POS</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your Point of Sale account
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sign In
              </h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <CustomInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                error={errors.email}
                required
                startContent={<Mail className="w-4 h-4 text-gray-400" />}
              />

              {/* Password Input */}
              <div className="relative">
                <CustomInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                  error={errors.password}
                  required
                  startContent={<Lock className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <Checkbox
                  isSelected={formData.rememberMe}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: checked }))}
                  size="sm"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Keep me signed in
                  </span>
                </Checkbox>
                
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  onClick={() => {
                    // TODO: Implement forgot password
                    errorToast('Forgot password feature coming soon!');
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                startContent={!isLoading && <LogIn className="w-4 h-4" />}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              onClick={() => {
                // TODO: Implement registration or contact admin
                errorToast('Please contact your administrator to create an account.');
              }}
            >
              Contact Administrator
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 