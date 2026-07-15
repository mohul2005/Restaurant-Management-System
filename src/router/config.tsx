import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/home/page";
import MenuPage from "@/pages/customer/menu/page";
import CartPage from "@/pages/customer/cart/page";
import OrderStatusPage from "@/pages/customer/order-status/page";
import ManagerLoginPage from "@/pages/manager/login/page";
import ManagerDashboardPage from "@/pages/manager/dashboard/page";
import KitchenLoginPage from "@/pages/kitchen/login/page";
import KitchenDashboardPage from "@/pages/kitchen/dashboard/page";
import DiningHistoryPage from "@/pages/customer/dining-history/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/menu/:tableCode",
    element: <MenuPage />,
  },
  {
    path: "/cart/:tableCode",
    element: <CartPage />,
  },
  {
    path: "/order-status/:tableCode/:orderId",
    element: <OrderStatusPage />,
  },
  {
    path: "/manager/login",
    element: <ManagerLoginPage />,
  },
  {
    path: "/manager/dashboard",
    element: <ManagerDashboardPage />,
  },
  {
    path: "/kitchen/login",
    element: <KitchenLoginPage />,
  },
  {
    path: "/kitchen/dashboard",
    element: <KitchenDashboardPage />,
  },
  {
    path: "/dining-history",
    element: <DiningHistoryPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;