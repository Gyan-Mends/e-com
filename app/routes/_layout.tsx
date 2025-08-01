import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Input,
  Badge,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  Home,
  Package,
  Tag,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Settings,
  History,
  Moon,
  Sun,
  Wallet,
} from "lucide-react";
import { cartAPI, wishlistAPI } from "~/utils/api";
import { getSessionId } from "~/utils/api";
import { useAuditLogger } from "~/hooks/useAuditLogger";

export default function Layout() {
  // Check for user authentication
  const [user, setUser] = useState<any>(null);
  
  // Audit logging
  const { logUserAction } = useAuditLogger();
  
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState(0);
  const [wishlistItems, setWishlistItems] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  // Load cart and wishlist counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const sessionId = getSessionId();
        
        // Load cart count
        const cartResponse = await cartAPI.getCart(undefined, sessionId) as any;
        if (cartResponse?.success && cartResponse.data) {
          setCartItems(cartResponse.data.totalItems || 0);
        }
        
        // Load wishlist count
        const wishlistResponse = await wishlistAPI.getWishlist(undefined, sessionId) as any;
        if (wishlistResponse?.success && wishlistResponse.data) {
          setWishlistItems(wishlistResponse.data.length || 0);
        }
      } catch (error) {
        console.error('Error loading counts:', error);
      }
    };

    loadCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    
    return () => clearInterval(interval);
  }, [location.pathname]); // Reload counts when navigating

  // Dark mode toggle effect - default to dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Default to dark mode if no saved theme or theme is dark
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
      if (!savedTheme) {
        localStorage.setItem("theme", "dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      // Log logout event before clearing data
      await logUserAction('logout', {
        userId: user?._id || user?.id,
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('sessionStartTime') || '0')
      });
    } catch (error) {
      console.error('Failed to log logout event:', error);
    }

    // Clear user data and navigate to login
    localStorage.removeItem("user");
    sessionStorage.clear();
    setUser(null);
    navigate("/login");
  };

  const navigationItems: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
  }> = [
    // Navigation items can be added here if needed
    // Example: { name: "Home", href: "/", icon: Home }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col  font-sans">
      {/* Header */}
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className=""
        maxWidth="full"
      >
        {/* Brand */}
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
          <NavbarBrand>
            <Link
              to="/"
              className="font-bold text-2xl text-primary font-heading"
            >
              Bestway
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden sm:flex gap-8" justify="center">
          {navigationItems.map((item) => (
            <NavbarItem key={item.name}>
              <Link
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        {/* Right Side Actions */}
        <NavbarContent justify="end">
          {/* Search */}
          <NavbarItem className="hidden md:flex">
            <form onSubmit={handleSearch} className="flex">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search size={18} />}
                className="w-64"
                radius="lg"
              />
            </form>
          </NavbarItem>

          {/* Theme Toggle */}
          <NavbarItem>
            <Button
              isIconOnly
              variant="light"
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300 hover:text-primary"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </NavbarItem>

          {/* Wishlist */}
          <NavbarItem>
            <Badge content={wishlistItems} color="danger" showOutline={false} isInvisible={wishlistItems === 0}>
              <Button
                as={Link}
                to="/wishlist"
                isIconOnly
                variant="light"
                className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
              >
                <Heart size={20} />
              </Button>
            </Badge>
          </NavbarItem>

          {/* Shopping Cart */}
          <NavbarItem>
            <Badge content={cartItems} color="primary" showOutline={false} isInvisible={cartItems === 0}>
              <Button
                as={Link}
                to="/cart"
                isIconOnly
                variant="light"
                className="text-gray-600 dark:text-gray-300 hover:text-primary"
              >
                <ShoppingCart size={20} />
              </Button>
            </Badge>
          </NavbarItem>

          {/* User Menu */}
          <NavbarItem>
            {user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    as="button"
                    className="transition-transform"
                    size="sm"
                    name={user.name || user.email}
                    showFallback
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Profile Actions"
                  variant="flat"
                  onAction={(key) => {
                    if (key === "logout") {
                      handleLogout();
                    } else {
                      navigate(`/${key}`);
                    }
                  }}
                >
                  <DropdownItem key="dashboard" startContent={<User size={16} />}>
                    Dashboard
                  </DropdownItem>
                  <DropdownItem key="profile" startContent={<User size={16} />}>
                    My Profile
                  </DropdownItem>
                  <DropdownItem
                    key="orders"
                    startContent={<History size={16} />}
                  >
                    Order History
                  </DropdownItem>
                  <DropdownItem
                    key="order-tracking"
                    startContent={<Package size={16} />}
                  >
                    Track Orders
                  </DropdownItem>
                  <DropdownItem
                    key="wallet"
                    startContent={<Wallet size={16} />}
                  >
                    Wallet
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    startContent={<Settings size={16} />}
                  >
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    startContent={<LogOut size={16} />}
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <div className="flex gap-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="ghost"
                  size="sm"
                  className="font-medium"
                >
                  Sign In
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  color="primary"
                  size="sm"
                  className="font-medium"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </NavbarItem>
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu>
          {/* Mobile Search */}
          <NavbarMenuItem>
            <form onSubmit={handleSearch} className="w-full mb-4">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search size={18} />}
                radius="lg"
              />
            </form>
          </NavbarMenuItem>

          {/* Mobile Navigation Items */}
          {navigationItems.map((item) => (
            <NavbarMenuItem key={item.name}>
              <Link
                to={item.href}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}

          <Divider className="my-4 bg-gray-200 dark:bg-white/20" />

          {/* Mobile User Actions */}
          {user ? (
            <>
              <NavbarMenuItem>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  Dashboard
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  My Profile
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  to="/orders"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <History size={20} />
                  Order History
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  to="/order-tracking"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package size={20} />
                  Track Orders
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  to="/wallet"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Wallet size={20} />
                  Wallet
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <LogOut size={20} />
                  Log Out
                </button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem>
                <Link
                  to="/login"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  Sign In
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Link
                  to="/signup"
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-primary dark:text-primary hover:bg-primary/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  Sign Up
                </Link>
              </NavbarMenuItem>
            </>
          )}
        </NavbarMenu>
      </Navbar>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white border-t border-gray-800 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand & Description */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 font-heading">ShopHub</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Your one-stop destination for quality products at great prices.
                Shop with confidence and enjoy fast, reliable delivery.
              </p>
              <div className="flex space-x-4">
                <Button
                  as="a"
                  href="mailto:support@shophub.com"
                  variant="light"
                  startContent={<Mail size={16} />}
                  className="text-gray-300 hover:text-white"
                >
                  support@shophub.com
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4 font-heading">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/about"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shipping"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link
                    to="/returns"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Returns
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="text-lg font-semibold mb-4 font-heading">
                Customer Service
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/faq"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Support Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Divider className="my-8 bg-gray-700 dark:bg-white/20" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 ShopHub. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">
                Powered by POS System
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
