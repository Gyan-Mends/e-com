import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  Divider,
  Card,
  CardBody,
} from "@heroui/react";
import {
  LayoutDashboard,
  User,
  Package,
  Truck,
  Wallet,
  RotateCcw,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ShoppingCart,
  Heart,
  Home,
  Moon,
  Sun,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if not authenticated
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const sidebarItems: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
   
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: Package,
      badge: 2, // Mock badge for pending orders
    },
    {
      name: "Order Tracking",
      href: "/dashboard/order-tracking",
      icon: Truck,
    },
   
    {
      name: "Returns",
      href: "/dashboard/returns",
      icon: RotateCcw,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">Bestway</span>
          </Link>
          <Button
            isIconOnly
            variant="light"
            onPress={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={20} />
          </Button>
        </div>

       

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                ${isActive(item.href)
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }
              `}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <Badge
                  content={item.badge}
                  color="danger"
                  size="sm"
                  className="ml-auto"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Button
              as={Link}
              to="/"
              variant="flat"
              startContent={<Home size={16} />}
              className="w-full justify-start"
            >
              Back to Store
            </Button>
            <Button
              as={Link}
              to="/cart"
              variant="flat"
              startContent={<ShoppingCart size={16} />}
              className="w-full justify-start"
            >
              Shopping Cart
            </Button>
            <Button
              as={Link}
              to="/wishlist"
              variant="flat"
              startContent={<Heart size={16} />}
              className="w-full justify-start"
            >
              Wishlist
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile Menu Button */}
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu size={20} />
            </Button>

            {/* Page Title */}
            <div className="flex-1 lg:ml-0 ml-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {location.pathname === "/dashboard" ? "Dashboard" :
                 location.pathname === "/dashboard/profile" ? "Profile" :
                 location.pathname === "/dashboard/orders" ? "Orders" :
                 location.pathname.startsWith("/dashboard/order-tracking") ? "Order Tracking" :
                 location.pathname === "/dashboard/wallet" ? "Wallet" :
                 location.pathname === "/dashboard/returns" ? "Returns & Refunds" :
                 location.pathname === "/dashboard/settings" ? "Settings" :
                 "Dashboard"}
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                isIconOnly
                variant="light"
                onPress={toggleTheme}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </Button>

              {/* Notifications */}
              <Button
                isIconOnly
                variant="light"
                className="relative"
              >
                <Bell size={20} />
                <Badge
                  content=""
                  color="danger"
                  size="sm"
                  className="absolute -top-1 -right-1"
                />
              </Button>

              {/* User Menu */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    as="button"
                    className="transition-transform"
                    size="sm"
                    name={user?.name || user?.email}
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
                  <DropdownItem key="profile" startContent={<User size={16} />}>
                    My Profile
                  </DropdownItem>
                  <DropdownItem key="settings" startContent={<Settings size={16} />}>
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
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
} 