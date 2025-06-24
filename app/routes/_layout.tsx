import { Outlet, Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import {
  Button,
  Switch,
  Tooltip,
  Divider,
} from "@heroui/react";
import {
  Menu,
  X,
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemDark);
    
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const navigationItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", active: location.pathname === "/dashboard" },
    { icon: ShoppingCart, label: "Sales", href: "/sales", active: location.pathname === "/sales" },
    { icon: Package, label: "Inventory", href: "/inventory", active: location.pathname === "/inventory" },
    { icon: Users, label: "Customers", href: "/customers", active: location.pathname === "/customers" },
    { icon: Users, label: "Users", href: "/users", active: location.pathname === "/users" },
    { icon: BarChart3, label: "Reports", href: "/reports", active: location.pathname === "/reports" },
    { icon: Settings, label: "Settings", href: "/settings", active: location.pathname === "/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "w-16" : "w-64"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {isSidebarCollapsed ? (
            // Collapsed: Show only logo centered
            <div className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            </div>
          ) : (
            // Expanded: Show logo + title
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                POS System
              </span>
            </div>
          )}
          
          {/* Mobile Close Button */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Desktop Collapse/Expand Button */}
          <Tooltip content={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="hidden lg:flex"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </Tooltip>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationItems.map((item, index) => {
            const IconComponent = item.icon;
            const navButton = (
              <Link key={index} to={item.href} className="block">
                <Button
                  variant={item.active ? "solid" : "light"}
                  color={item.active ? "primary" : "default"}
                  className={`
                    w-full h-12
                    ${isSidebarCollapsed 
                      ? "justify-center px-0 min-w-0" 
                      : "justify-start px-4"
                    }
                    ${item.active ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : ""}
                  `}
                  startContent={!isSidebarCollapsed ? <IconComponent className="w-5 h-5 mr-3" /> : undefined}
                >
                  {isSidebarCollapsed ? (
                    <IconComponent className="w-5 h-5" />
                  ) : (
                    <span className="text-left flex-1">{item.label}</span>
                  )}
                </Button>
              </Link>
            );

            return isSidebarCollapsed ? (
              <Tooltip key={index} content={item.label} placement="right">
                {navButton}
              </Tooltip>
            ) : (
              navButton
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}
      `}>
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>

            {/* Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-4 lg:ml-0">
                Point of Sale System
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Tooltip content={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <Button
                  isIconOnly
                  variant="light"
                  onClick={toggleTheme}
                  size="sm"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              </Tooltip>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back!
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
      <Outlet />
        </main>
      </div>
    </div>
  );
}