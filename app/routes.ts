import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    // Public routes
    route("/login", "routes/login.tsx"),
    
    // Protected routes with layout
    layout("routes/_layout.tsx", [
       
        route("/dashboard", "routes/dashboard/index.tsx"),
        route("/users", "routes/users.tsx")
    ]),
    
    // API routes
    route("/api/users", "routes/api.users.tsx"),
    route("/api/auth/login", "routes/api.auth.login.tsx"),
    route("/api/auth/logout", "routes/api.auth.logout.tsx")
] satisfies RouteConfig;
