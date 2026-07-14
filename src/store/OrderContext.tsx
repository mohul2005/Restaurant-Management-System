import { createContext, useContext, useReducer, useState, useEffect, useCallback, type Dispatch, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  table_code: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  total: number;
  status: "pending_approval" | "approved" | "awaiting_payment" | "paid" | "preparing" | "ready";
  upi_handle: string;
  created_at: string;
  updated_at: string;
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: { menuItemId: string; name: string; price: number; image: string } }
  | { type: "REMOVE_ITEM"; payload: { menuItemId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { menuItemId: string; quantity: number } }
  | { type: "CLEAR_CART" };

interface CartState {
  cart: CartItem[];
  currentTableCode: string;
}

function loadCartState(): CartState {
  try {
    const stored = localStorage.getItem("restaurant_cart");
    if (stored) return JSON.parse(stored);
  } catch { /* noop */ }
  return { cart: [], currentTableCode: "" };
}

function saveCartState(state: CartState) {
  try {
    localStorage.setItem("restaurant_cart", JSON.stringify(state));
  } catch { /* noop */ }
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  let newState: CartState;

  switch (action.type) {
    case "ADD_ITEM": {
      const existingIdx = state.cart.findIndex((i) => i.menuItemId === action.payload.menuItemId);
      let newCart: CartItem[];
      if (existingIdx >= 0) {
        newCart = state.cart.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [
          ...state.cart,
          {
            menuItemId: action.payload.menuItemId,
            name: action.payload.name,
            price: action.payload.price,
            quantity: 1,
            image: action.payload.image,
          },
        ];
      }
      newState = { ...state, cart: newCart };
      break;
    }
    case "REMOVE_ITEM":
      newState = { ...state, cart: state.cart.filter((i) => i.menuItemId !== action.payload.menuItemId) };
      break;
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        newState = { ...state, cart: state.cart.filter((i) => i.menuItemId !== action.payload.menuItemId) };
      } else {
        newState = {
          ...state,
          cart: state.cart.map((i) =>
            i.menuItemId === action.payload.menuItemId ? { ...i, quantity: action.payload.quantity } : i
          ),
        };
      }
      break;
    }
    case "CLEAR_CART":
      newState = { ...state, cart: [] };
      break;
    default:
      return state;
  }

  saveCartState(newState);
  return newState;
}

export const initialCartState = loadCartState();

interface OrderContextType {
  state: CartState;
  dispatch: Dispatch<CartAction>;
  placeOrder: (tableCode: string) => Promise<string | null>;
  getOrder: (orderId: string) => Promise<Order | null>;
  subscribeToOrder: (orderId: string, onUpdate: (order: Order) => void) => () => void;
  subscribeToTableOrders: (tableCode: string, onUpdate: (orders: Order[]) => void) => () => void;
  subscribeToAllOrders: (onUpdate: (orders: Order[]) => void) => () => void;
}

const OrderCtx = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const placeOrder = useCallback(async (tableCode: string): Promise<string | null> => {
    const items = state.cart.map(({ menuItemId, name, price, quantity, image }) => ({
      menuItemId,
      name,
      price,
      quantity,
      image,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const serviceCharge = Math.round(subtotal * 0.05);
    const total = subtotal + tax + serviceCharge;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        table_code: tableCode,
        items: JSON.parse(JSON.stringify(items)),
        subtotal,
        tax,
        service_charge: serviceCharge,
        total,
        status: "pending_approval",
        upi_handle: "",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to place order:", error);
      return null;
    }

    dispatch({ type: "CLEAR_CART" });
    return data.id;
  }, [state.cart, dispatch]);

  const getOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Order;
  }, []);

  const subscribeToOrder = useCallback((orderId: string, onUpdate: (order: Order) => void): (() => void) => {
    // Fetch immediately so the consumer gets data right away
    getOrder(orderId).then((initialOrder) => {
      if (initialOrder) onUpdate(initialOrder);
    });

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onUpdate(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getOrder]);

  const subscribeToTableOrders = useCallback((tableCode: string, onUpdate: (orders: Order[]) => void): (() => void) => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("table_code", tableCode)
        .order("created_at", { ascending: false });
      if (data) onUpdate(data as Order[]);
    };

    fetchOrders();

    const channel = supabase
      .channel(`table-${tableCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_code=eq.${tableCode}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const subscribeToAllOrders = useCallback((onUpdate: (orders: Order[]) => void): (() => void) => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) onUpdate(data as Order[]);
    };

    fetchOrders();

    const channel = supabase
      .channel("all-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <OrderCtx.Provider value={{ state, dispatch, placeOrder, getOrder, subscribeToOrder, subscribeToTableOrders, subscribeToAllOrders }}>
      {children}
    </OrderCtx.Provider>
  );
}

export function useOrder(): OrderContextType {
  const ctx = useContext(OrderCtx);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}