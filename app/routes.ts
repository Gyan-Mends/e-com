import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        route("/dashboard", "routes/dashboard/index.tsx"),
        route("/users", "routes/users.tsx")
    ]),
    route("/api/users", "routes/api.users.tsx")
] satisfies RouteConfig;
