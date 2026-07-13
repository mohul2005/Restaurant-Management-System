import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import type { Order } from "@/store/OrderContext";

const STATUS_CONFIG: Record<Order["status"], { label: string; color: string; bg: string; icon: string }> = {
  pending_approval: {
    label: "Waiting for Approval",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    icon: "ri-time-line",
  },
  approved: {
    label: "Approved",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    icon: "ri-check-double-line",
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    icon: "ri-bank-card-line",
  },
  paid: {
    label: "Paid",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    icon: "ri-check-line",
  },
  preparing: {
    label: "Preparing",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    icon: "ri-fire-line",
  },
  ready: {
    label: "Ready to Serve",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    icon: "ri-restaurant-line",
  },
};

const STATUS_STEPS: Order["status"][] = [
  "pending_approval",
  "approved",
  "awaiting_payment",
  "paid",
  "preparing",
  "ready",
];

export default function OrderStatusPage() {
  const { tableCode, orderId } = useParams<{ tableCode: string; orderId: string }>();
  const { subscribeToOrder } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    setLoading(true);

    const unsubscribe = subscribeToOrder(orderId, (updatedOrder) => {
      if (!cancelled) {
        setOrder(updatedOrder);
        setLoading(false);
        setError(null);
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled && !order) {
        setLoading(false);
        setError("Order not found. It may have been removed.");
      }
    }, 8000);

    return () => {
      cancelled = true;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [orderId, subscribeToOrder]);

  if (!tableCode || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-foreground-600">Invalid order link.</p>
          <Link to="/" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-foreground-500">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
            <i className="ri-error-warning-line text-2xl text-foreground-400"></i>
          </div>
          <p className="text-foreground-600 text-sm">{error || "Order not found."}</p>
          <Link to="/" className="text-primary-500 text-sm mt-3 inline-block font-medium hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const config = STATUS_CONFIG[order.status];

  return (
    <div className="min-h-screen bg-background-50 pb-8">
      <header className="sticky top-0 z-30 bg-background-50 border-b border-background-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={`/menu/${tableCode}`} className="text-foreground-500 hover:text-foreground-700">
            <i className="ri-arrow-left-line text-lg"></i>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground-900">
              Order Status
            </h1>
            <p className="text-xs text-foreground-500">
              Table {tableCode} &middot; #{order.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto">
        {/* Current Status Banner */}
        <div className={`rounded-xl border p-4 mb-6 ${config.bg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-background-50 flex items-center justify-center">
              <i className={`${config.icon} text-lg ${config.color}`}></i>
            </div>
            <div>
              <p className="text-xs text-foreground-500 uppercase tracking-wide font-medium">Current Status</p>
              <p className={`text-base font-semibold ${config.color}`}>{config.label}</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-3">Progress</h3>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, idx) => {
              const stepConfig = STATUS_CONFIG[step];
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isPending = idx > currentStepIdx;

              return (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : isCurrent
                          ? "border-primary-500 bg-primary-50"
                          : "border-background-300 bg-background-50"
                      }`}
                    >
                      {isCompleted ? (
                        <i className="ri-check-line text-xs text-background-50"></i>
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-background-300" />
                      )}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${
                          isCompleted ? "bg-green-500" : "bg-background-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-4 ${isPending ? "opacity-40" : ""}`}>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-foreground-500"
                          : isCurrent
                          ? "text-foreground-900"
                          : "text-foreground-400"
                      }`}
                    >
                      {stepConfig.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-xl border border-background-200 bg-background-50 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-background-100">
            <h3 className="text-sm font-semibold text-foreground-900">Order Summary</h3>
          </div>
          <div className="divide-y divide-background-100">
            {order.items.map((item: { menuItemId: string; name: string; quantity: number; price: number }, i: number) => (
              <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-sm text-foreground-700">
                  {item.name} <span className="text-foreground-400">x{item.quantity}</span>
                </span>
                <span className="text-sm font-medium text-foreground-900">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-background-50 space-y-1.5">
            <div className="flex justify-between text-xs text-foreground-500">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-foreground-500">
              <span>GST (5%)</span>
              <span>₹{order.tax}</span>
            </div>
            <div className="flex justify-between text-xs text-foreground-500">
              <span>Service Charge (5%)</span>
              <span>₹{order.service_charge}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-foreground-900 pt-1 border-t border-background-100">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* UPI Payment Section */}
        {(order.status === "awaiting_payment") && order.upi_handle && (
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-bank-card-line text-green-600 text-lg"></i>
              <h3 className="text-sm font-semibold text-green-800">Pay via UPI</h3>
            </div>
            <div className="bg-background-50 rounded-lg p-4 text-center border border-green-200">
              <p className="text-xs text-foreground-500 mb-2">UPI Handle</p>
              <p className="text-lg font-bold text-foreground-900 tracking-wide font-mono">
                {order.upi_handle}
              </p>
              <p className="text-xs text-foreground-500 mt-2">Amount: ₹{order.total}</p>
            </div>
            <p className="text-xs text-foreground-500 mt-3 text-center">
              Open any UPI app and send ₹{order.total} to the handle above. Your order will update automatically once the manager confirms payment.
            </p>
          </div>
        )}

        {/* Awaiting payment without UPI handle yet */}
        {(order.status === "awaiting_payment" || order.status === "approved") && !order.upi_handle && (
          <div className="rounded-xl border border-background-200 bg-background-50 p-5 mb-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-background-100 flex items-center justify-center">
              <i className="ri-time-line text-xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-600 font-medium">Waiting for payment details</p>
            <p className="text-xs text-foreground-400 mt-1">
              The manager will upload the UPI handle for this order shortly.
            </p>
          </div>
        )}

        {/* Order meta */}
        <div className="text-center text-xs text-foreground-400">
          <p>Order placed at {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="mt-1">
            <Link to={`/menu/${tableCode}`} className="text-primary-500 hover:underline font-medium">
              Order more items
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}