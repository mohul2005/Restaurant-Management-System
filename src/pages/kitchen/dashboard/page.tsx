import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";
import { useOrder } from "@/store/OrderProvider";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/store/OrderContext";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "New Order", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" },
  preparing: { label: "Preparing", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" },
  ready: { label: "Ready", color: "text-primary-700", bg: "bg-primary-50 border-primary-200" },
};

function elapsedTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export default function KitchenDashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscribeToAllOrders } = useOrder();
  const navigate = useNavigate();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/kitchen/login", { replace: true });
      return;
    }

    if (!user) return;

    const unsubscribe = subscribeToAllOrders((updatedOrders) => {
      setAllOrders(updatedOrders);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, authLoading, navigate, subscribeToAllOrders]);

  const activeOrders = allOrders.filter(
    (o) => o.status === "paid" || o.status === "preparing"
  );
  const readyOrders = allOrders.filter((o) => o.status === "ready");

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: string) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    if (error) console.error("Failed to update order:", error);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/kitchen/login", { replace: true });
  };

  if (authLoading || (loading && !activeOrders.length && !readyOrders.length)) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-foreground-500">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background-50">
      {/* Header */}
      <header className="bg-background-950 border-b border-background-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <i className="ri-fire-line text-base text-background-50"></i>
            </div>
            <div>
              <h1 className="font-heading text-base font-semibold text-background-50 whitespace-nowrap">
                Kitchen Display
              </h1>
              <p className="text-xs text-background-400 hidden sm:block">Order queue</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              <span className="text-background-400 hidden sm:inline">Live</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-background-400 hover:text-background-200 px-3 py-1.5 rounded-lg border border-background-700 hover:bg-background-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-center">
            <p className="text-2xl font-bold text-primary-700">{activeOrders.filter((o) => o.status === "paid").length}</p>
            <p className="text-xs text-foreground-500 font-medium mt-0.5">New</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-center">
            <p className="text-2xl font-bold text-primary-700">{activeOrders.filter((o) => o.status === "preparing").length}</p>
            <p className="text-xs text-foreground-500 font-medium mt-0.5">Preparing</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-center">
            <p className="text-2xl font-bold text-primary-700">{readyOrders.length}</p>
            <p className="text-xs text-foreground-500 font-medium mt-0.5">Ready</p>
          </div>
        </div>

        {activeOrders.length === 0 && readyOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
              <i className="ri-restaurant-line text-2xl text-foreground-300"></i>
            </div>
            <p className="text-foreground-500 text-sm font-medium">No orders in queue</p>
            <p className="text-xs text-foreground-400 mt-1">Paid orders will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Active Queue */}
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground-600 uppercase tracking-wide mb-3">
                  Active Orders ({activeOrders.length})
                </h2>
                <div className="grid gap-3">
                  {activeOrders.map((order) => {
                    const statusCfg = STATUS_MAP[order.status] || STATUS_MAP.paid;
                    const isNew = order.status === "paid";

                    return (
                      <div
                        key={order.id}
                        className={`bg-background-50 border rounded-xl overflow-hidden transition-all ${
                          isNew ? "border-primary-300 ring-1 ring-primary-200" : "border-background-200"
                        }`}
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isNew ? "bg-primary-100" : "bg-primary-100"
                              }`}>
                                <span className="text-sm font-bold text-foreground-700">{order.table_code}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground-900">
                                  Table {order.table_code}
                                </p>
                                <p className="text-xs text-foreground-400">{elapsedTime(order.created_at)}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusCfg.bg} ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>

                          {/* Items */}
                          <div className="mb-3">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm py-0.5">
                                <span className="text-foreground-700">
                                  {item.quantity}x {item.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Order note */}
                          <div className="text-xs text-foreground-400 mb-3">
                            #{order.id.slice(0, 8)} &middot; Total: ₹{order.total}
                          </div>

                          {/* Action Button */}
                          {isNew ? (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "preparing")}
                              disabled={actionLoading[order.id]}
                              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                            >
                              {actionLoading[order.id] ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin"></span>
                                  Starting...
                                </span>
                              ) : (
                                "Start Preparing"
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "ready")}
                              disabled={actionLoading[order.id]}
                              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                            >
                              {actionLoading[order.id] ? "Updating..." : "Mark as Ready to Serve"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ready Orders */}
            {readyOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground-600 uppercase tracking-wide mb-3">
                  Ready to Serve ({readyOrders.length})
                </h2>
                <div className="grid gap-3">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <i className="ri-check-line text-lg text-primary-600"></i>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground-900">
                              Table {order.table_code}
                            </p>
                            <p className="text-xs text-foreground-500">
                              {order.items.map((i) => i.name).join(", ")}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-foreground-400">{elapsedTime(order.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}