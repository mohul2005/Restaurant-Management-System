import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/home/page";
import MenuPage from "@/pages/customer/menu/page";
import CartPage from "@/pages/customer/cart/page";
import OrderStatusPage from "@/pages/customer/order-status/page";

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
    path: "*",
    element: <NotFound />,
  },
];

export default routes;