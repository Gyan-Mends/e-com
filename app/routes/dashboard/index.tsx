import { Outlet } from "react-router";
import type { Route } from "../+types/home";

export function meta({}: Route.MetaArgs) {
        return [
        { title: "New React Router App" },
      { name: "description", content: "Welcome to React Router!" },
    ];
  }

const Dashboard = () => {
    return (
        <div>
            <Outlet />
        </div>
    )
}

export default Dashboard;