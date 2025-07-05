import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    // Public routes (outside layout)
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),
    
    // E-commerce routes with main layout
    layout("routes/_layout.tsx", [
        route("/", "routes/home.tsx"),
        route("products/:id", "routes/products.$id.tsx"),
        route("cart", "routes/cart.tsx"),
        route("wishlist", "routes/wishlist.tsx"),
        route("checkout", "routes/checkout.tsx"),
        
        // route("categories", "routes/categories.tsx"),
        // route("contact", "routes/contact.tsx"),
        // route("search", "routes/search.tsx"),
    ]),
    
    // Dashboard routes with dashboard layout
    layout("routes/dashboard/_layout.tsx", [
        route("dashboard", "routes/dashboard/index.tsx"),
        route("dashboard/profile", "routes/dashboard/profile.tsx"),
        route("dashboard/orders", "routes/dashboard/orders.tsx"),
        route("dashboard/settings", "routes/dashboard/settings.tsx"),
        route("dashboard/order-tracking", "routes/dashboard/order-tracking.tsx"),
        route("dashboard/returns", "routes/dashboard/returns.tsx"),
        route("dashboard/wallet", "routes/dashboard/wallet.tsx"),
    ]),
] satisfies RouteConfig;
