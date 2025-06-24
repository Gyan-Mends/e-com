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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-6">
         
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Sign in to your Point of Sale account
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl ring-1 ring-black/5 dark:ring-white/10 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="pb-6 pt-8 px-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sign In
              </h3>
            </div>
          </CardHeader>
          <CardBody className="pt-0 px-8 pb-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="space-y-2">
                <CustomInput
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                  error={errors.email}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2 ">
                <CustomInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                  error={errors.password}
                  required
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between pt-2">
                <Checkbox
                  isSelected={formData.rememberMe}
                  onValueChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: checked }))}
                  size="sm"
                  classNames={{
                    label: "text-sm text-gray-600 dark:text-gray-400"
                  }}
                >
                  Keep me signed in
                </Checkbox>
                
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mt-4">
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  isLoading={isLoading}
                  startContent={!isLoading && <LogIn className="w-5 h-5" />}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
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