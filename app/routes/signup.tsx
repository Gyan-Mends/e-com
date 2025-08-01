import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  Checkbox,
  Select,
  SelectItem,
} from "@heroui/react";
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, UserPlus, Phone } from "lucide-react";
import { successToast, errorToast } from "../components/toast";
import { useAuditLogger } from "../hooks/useAuditLogger";

// API function to create customer account
const signupAPI = async (customerData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: any;
  dateOfBirth?: string;
}) => {
  const response = await fetch('http://localhost:5173/api/customers/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Signup failed');
  }
  
  return data;
};



export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { logUserAction, logAuditEvent } = useAuditLogger();
  
  const redirectTo = searchParams.get('redirect') || '/';
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Log form validation failure
      logAuditEvent({
        action: 'signup_form_validation_failed',
        resource: 'user_registration',
        details: {
          errors: Object.keys(errors),
          formData: {
            hasFirstName: !!formData.firstName.trim(),
            hasLastName: !!formData.lastName.trim(),
            hasEmail: !!formData.email,
            hasPassword: !!formData.password,
            hasConfirmPassword: !!formData.confirmPassword,
            passwordLength: formData.password.length,
            passwordsMatch: formData.password === formData.confirmPassword,
            agreedToTerms: agreeToTerms,
            emailFormat: /\S+@\S+\.\S+/.test(formData.email)
          }
        },
        severity: 'medium',
        status: 'warning',
        source: 'web'
      });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    // Log signup attempt
    logAuditEvent({
      action: 'signup_attempted',
      resource: 'user_registration',
      details: {
        email: formData.email.trim().toLowerCase(),
        hasPhone: !!formData.phone.trim(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      severity: 'medium',
      status: 'info',
      source: 'web'
    });
    
    try {
      // Create customer account
      const signupResponse = await signupAPI({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });
      
      if (signupResponse.success) {
        // Log successful registration
        logUserAction('user_registered', {
          email: formData.email.trim().toLowerCase(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          hasPhone: !!formData.phone.trim(),
          registrationMethod: 'email',
          success: true,
          responseData: {
            customerId: signupResponse.customer?._id || signupResponse.customer?.id,
            message: signupResponse.message
          }
        });
        
        // Show success message and redirect to login
        successToast("Account created successfully! Please login to continue.");
        setTimeout(() => {
          navigate(`/login?redirect=${redirectTo}`);
        }, 2000);
      } else {
        // Log failed registration
        logAuditEvent({
          action: 'signup_failed',
          resource: 'user_registration',
          details: {
            email: formData.email.trim().toLowerCase(),
            error: signupResponse.message || 'Unknown error',
            responseData: signupResponse
          },
          severity: 'medium',
          status: 'error',
          source: 'web'
        });
        
        errorToast(signupResponse.message || "Signup failed");
      }
      
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Log registration error
      logAuditEvent({
        action: 'signup_error',
        resource: 'user_registration',
        details: {
          email: formData.email.trim().toLowerCase(),
          error: error.message || 'Unknown error',
          errorType: error.name || 'Error',
          stack: error.stack
        },
        severity: 'high',
        status: 'error',
        source: 'web'
      });
      
      if (error.message.includes('already exists')) {
        errorToast("An account with this email already exists");
      } else if (error.message.includes('400')) {
        errorToast("Please check your information and try again");
      } else {
        errorToast(error.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center customed-dark-bg p-4">
      
      {/* Background Pattern */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.05),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent)]"></div>
       */}
      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            as={Link}
            to="/login"
            variant="light"
            startContent={<ArrowLeft size={20} />}
            className="text-gray-600 dark:text-gray-400"
          >
            Back to Login
          </Button>
        </div>

        {/* Signup Card */}
        <div className=" customed-dark-bg">
          <div className="flex flex-col gap-4 pt-8 pb-4">
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Join ShopHub and start your journey
              </p>
            </div>
          </div>

          <div className="gap-5 px-8 pb-8">
            <form onSubmit={handleSignup} className="space-y-5 flex flex-col gap-2">

              {/* Name Fields */}
                <Input
                  type="text"
                  label="First Name"
                  placeholder="John"
                  labelPlacement="outside"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  startContent={<User className="text-gray-400" size={18} />}
                  variant="bordered"
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName}
                  isDisabled={isLoading}
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300 font-medium",
                    input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                  }}
                />
                <Input
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  labelPlacement="outside"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  startContent={<User className="text-gray-400" size={18} />}
                  variant="bordered"
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName}
                  isDisabled={isLoading}
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300 font-medium",
                    input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                  }}
                />
              

              {/* Email Field */}
              <Input
                type="email"
                label="Email Address"
                placeholder="john@example.com"
                labelPlacement="outside"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                startContent={<Mail className="text-gray-400" size={20} />}
                variant="bordered"
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                isDisabled={isLoading}
                classNames={{
                  label: "text-gray-700 dark:text-gray-300 font-medium",
                  input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                }}
              />

              {/* Phone Field */}
              <Input
                type="tel"
                label="Phone Number (Optional)"
                placeholder="+1 (555) 123-4567"
                labelPlacement="outside"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                startContent={<Phone className="text-gray-400" size={20} />}
                variant="bordered"
                isDisabled={isLoading}
                classNames={{
                  label: "text-gray-700 dark:text-gray-300 font-medium",
                  input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                }}
              />



              {/* Password Field */}
              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Create a strong password (min 6 characters)"
                labelPlacement="outside"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                startContent={<Lock className="text-gray-400" size={20} />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
                variant="bordered"
                isInvalid={!!errors.password}
                errorMessage={errors.password}
                isDisabled={isLoading}
                classNames={{
                  label: "text-gray-700 dark:text-gray-300 font-medium",
                  input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                }}
              />

              {/* Confirm Password Field */}
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                placeholder="Confirm your password"
                labelPlacement="outside"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                startContent={<Lock className="text-gray-400" size={20} />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
                variant="bordered"
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword}
                isDisabled={isLoading}
                classNames={{
                  label: "text-gray-700 dark:text-gray-300 font-medium",
                  input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  inputWrapper: "border border-1 border-gray-300 dark:border-gray-600"
                }}
              />

              {/* Terms Agreement */}
              <div className="space-y-2">
                <Checkbox
                  isSelected={agreeToTerms}
                  onValueChange={setAgreeToTerms}
                  size="sm"
                  className={errors.terms ? "text-red-600" : ""}
                  isDisabled={isLoading}
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{" "}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Privacy Policy
                    </Link>
                  </span>
                </Checkbox>
                {errors.terms && (
                  <p className="text-red-600 dark:text-red-400 text-xs ml-6">{errors.terms}</p>
                )}
              </div>

              {/* Signup Button */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full bg-primary hover:bg-primary/80"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

           
          </div>
        </div>

       
      </div>
    </div>
  );
} 